import csv
from pymongo import MongoClient
from pprint import pprint
import json
from datetime import datetime
import math
import os
import glob
import bcrypt
from uploadConfig import *

#import logging


class accessDB:
    def __init__(self):
        self.dbName = DBNAME
        self.host = HOST
        self.port = PORT
        self.sequence_start = SEQUENCE_START
        self.seq = SEQ
        print('seq init: {}'.format(self.seq))
        self.logger = None
        self.conditionFile = CONDITION_FILE
        self.client = MongoClient('mongodb://' + self.host + ':' + str(self.port) + '/')
        self.db = self.client[self.dbName]
        self.condColl = self.db['conditions']
        self.caseColl = self.db['cases']
        self.userColl = self.db['user']
        self.seqColl  = self.db['sequence']
        self.condList = []


    #-------------------------------------------------------------
    # function to create necessary directories
    # log file is not used now. Will be used in production
    #-------------------------------------------------------------
    def checkAndCreateDirs(self):
        if not os.path.isdir(LOG_DIR):
            print('log dir: {} does not exist. Creating it'.format(LOG_DIR))
            os.mkdir(LOG_DIR)
        else:
            print('log dir: {} exists'.format(LOG_DIR))

        if not os.path.isfile(LOG_FILE):
            print('log file: {} does not exist. Creating it'.format(LOG_FILE))
            # Creates a new empty file
            with open(LOG_FILE, 'w') as fp:
                pass
        else:
            print('log file: {} exists'.format(LOG_FILE))

        #logging.basicConfig(filename=LOG_FILE, filemode='a', level=logging.DEBUG)
        #self.logger = logging.getLogger(__name__)


    #-------------------------------------------------------------
    # function to read conditions from file and capture in a list []
    #-------------------------------------------------------------
    def readConditionsFromFile(self):
        with open(self.conditionFile) as csvfile:
            rd = csv.reader(csvfile, delimiter='\t')
            next(rd) # skip the header line

            # Using a timestamp and sequence number to make the 'id' unique
            sequence_num = self.sequence_start * 0.000001 # in microseconds

            for row in rd:
                d = {}
                #print('{} : {}'.format(row[0], row[1]))
                timeL = str(datetime.utcnow().timestamp()).split('.')
                timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
                curTime = float(timeL[0]) + float(timeL[1])
                d['condId'] = curTime
                d['code']   = row[0]
                d['desc']   = row[1]
                d['lastModified'] = curTime
                self.condList.append(d)

                sequence_num += 0.000001
                #sequence_num = float(format(sequence_num, '.6f'))
                #print('sequence_num = {}'.format(sequence_num))

        #for item in self.condList:
            #print('{}'.format(item))

    #-------------------------------------------------------------
    # function to find and upload conditions in MongoDB
    # If the record is already present, then the function has
    # the capability of updating the record if the description has changed
    #-------------------------------------------------------------
    def findAndUploadConditions(self):
        print('Find and upload conditions. Either insert or update...')
        collist = self.db.list_collection_names()
        print('collist: {}'.format(collist))
        if not collist or 'conditions' not in collist:
            print('Collections not found. Writing all condition records at once...')
            try:
                ret = self.condColl.insert_many(self.condList)
            except:
                print('Failed to insert_many records')
                exit(0)

        elif 'conditions' in collist:
            print('Mongo collection: conditions exists. Check each condition and then enter')
            for item in self.condList:
                queryStr = {"code" : item['code']}
                ret = None
                try:
                    ret = self.condColl.find_one(queryStr)
                    #if ret: print('RET: {} {} {}'.format(ret['condId'], ret['code'], ret['desc']))
                except:
                    print('find error: {}'.format(queryStr))
                    exit(0)

                # Insert the record if the code is not found
                if not ret:
                    print('Insert this record: {}'.format(item))
                    try:
                        ret = self.condColl.insert_one(item)
                    except:
                        print('Failed to insert records: {}'.format(item))
                        exit(0)

                # or Update the record if the description has changed
                elif ret['desc'] != item['desc']:
                    print('Update this record: {}'.format(item))
                    sequence_num = self.sequence_start * 0.000001 # in microseconds
                    timeL = str(datetime.utcnow().timestamp()).split('.')
                    timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
                    modTime = float(timeL[0]) + float(timeL[1])

                    query = { "code": ret['code'] }
                    newvalues = { "$set": { "desc": item['desc'], "lastModified":  modTime} }
                    try:
                        ret = self.condColl.update_one(query, newvalues)
                    except:
                        print('Failed to update record: {}'.format(item))
                        exit(0)



    #-------------------------------------------------------------
    # function to read and insert or update cases in MongoDB
    #-------------------------------------------------------------
    def readCases(self):
        print('Read each case from file and then insert or update...')
        fileList = glob.glob(CASES_DIR+"/*.txt")
        print('fileList: {}'.format(fileList))

        sequence_num = self.sequence_start * 0.000001 # in microseconds
        for fileName in fileList:
            with open (fileName, "r") as f:
                data = f.read()
                #print('data: {}'.format(data))

                # Insert or update records
                queryStr = {"fileName" : fileName}
                ret  = None
                ret2 = None
                try:
                    ret = self.caseColl.find_one(queryStr)
                    #if ret: print('RET: {} {} {}'.format(ret['condId'], ret['code'], ret['desc']))
                except:
                    print('find error: {}'.format(queryStr))
                    exit(0)


                # Insert the record if not found
                if not ret:
                    print('Insert the record from file: {}'.format(fileName))
                    timeL = str(datetime.utcnow().timestamp()).split('.')
                    timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
                    curTime = float(timeL[0]) + float(timeL[1])
                    d = {}
                    d['caseId']   = curTime
                    d['seq']      = self.seq
                    d['fileName'] = fileName
                    d['caseDesc'] = data
                    d['code']   = '-1' # relates to the condition
                    d['lastModified']  = curTime
                    try:
                        ret2 = self.caseColl.insert_one(d)
                    except:
                        print('Failed to insert case from file: {}'.format(fileName))
                        exit(0)

                    sequence_num += 0.000001

                elif ret['caseDesc'] != data:
                    print('Update the case desc from file: {}'.format(fileName))
                    sequence_num = self.sequence_start * 0.000001 # in microseconds
                    timeL = str(datetime.utcnow().timestamp()).split('.')
                    timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
                    modTime = float(timeL[0]) + float(timeL[1])

                    query = { "fileName": ret['fileName'] }
                    newvalues = { "$set": { "caseDesc": data, "lastModified":  modTime} }
                    try:
                        ret3 = self.caseColl.update_one(query, newvalues)
                    except:
                        print('Failed to update case from file: {}'.format(fileName))
                        exit(0)

                # Update the seq if insert is successful
                if ret2:
                    print('Update seq')
                    newseq = self.seq + 1
                    self.updateSequence(newseq)

    #-------------------------------------------------
    # function to create an admin user in MongoDB
    #-------------------------------------------------
    def createUser(self):
        print('Create an user admin if it does not exist')
        # Insert or update records
        queryStr = {"userId" : USERID}
        ret = None
        sequence_num = self.sequence_start * 0.000001 # in microseconds
        try:
            ret = self.userColl.find_one(queryStr)
            #if ret: print('RET: {} {} {}'.format(ret['condId'], ret['code'], ret['desc']))
        except:
            print('find error: {}'.format(queryStr))
            exit(0)

        # Insert the user record if not found
        if not ret:
            print('Insert the user record')
            salt = bcrypt.gensalt()
            passwd = bytes(PASSWD, 'utf-8')
            hashed = bcrypt.hashpw(passwd, salt)

            timeL = str(datetime.utcnow().timestamp()).split('.')
            timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
            curTime = float(timeL[0]) + float(timeL[1])
            d = {}
            d['id']       = curTime
            d['userId']   = USERID
            d['passwd']   = hashed
            d['lastModified']  = curTime
            try:
                ret = self.userColl.insert_one(d)
            except:
                print('Failed to insert user record')
                exit(0)


    #-------------------------------------------------
    # function to create a sequence in MongoDB
    #-------------------------------------------------
    def createSequence(self):
        print('Create a sequence if it does not exist. seq: {}'.format(self.seq))
        # Insert or update records
        queryStr = {"seq" : self.seq}
        ret = None
        sequence_num = self.sequence_start * 0.000001 # in microseconds
        try:
            ret = self.seqColl.find_one(queryStr)
            #if ret: print('RET: {} {} {}'.format(ret['condId'], ret['code'], ret['desc']))
        except:
            print('find error: {}'.format(queryStr))
            exit(0)

        # Insert the sequence record if not found
        if not ret:
            print('Insert the sequence record')

            timeL = str(datetime.utcnow().timestamp()).split('.')
            timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
            curTime = float(timeL[0]) + float(timeL[1])
            d = {}
            d['id']       = curTime
            d['seq']      = self.seq
            try:
                ret = self.seqColl.insert_one(d)
            except:
                print('Failed to insert sequence')
                exit(0)

        else:
            self.seq = ret['seq']
            print('last seq: {}'.format(self.seq))




    #-------------------------------------------------
    # function to update sequence  n MongoDB
    #-------------------------------------------------
    def updateSequence(self, seq):
        print('Update sequence id to: {}'.format(self.seq))
        # Insert or update records
        queryStr = {"seq" : self.seq}
        ret = None
        sequence_num = self.sequence_start * 0.000001 # in microseconds
        try:
            ret = self.seqColl.find_one(queryStr)
            #if ret: print('RET: {} {} {}'.format(ret['condId'], ret['code'], ret['desc']))
        except:
            print('find error: {}'.format(queryStr))
            exit(0)

        # Update the sequence if found
        if not ret:
            print('Failed to update sequence. Please check')
            exit(0)

        else:
            ret2 = None
            print('Update the seq with : {}'.format(seq))
            sequence_num = self.sequence_start * 0.000001 # in microseconds
            timeL = str(datetime.utcnow().timestamp()).split('.')
            timeL[1] = str(float('0.' + timeL[1]) + sequence_num)
            modTime = float(timeL[0]) + float(timeL[1])

            query = { "seq": self.seq }
            newvalues = { "$set": { "seq": seq, "lastModified":  modTime} }
            try:
                ret2 = self.seqColl.update_one(query, newvalues)
            except:
                print('Failed to update case from file: {}'.format(fileName))
                exit(0)

            if not ret2:
                print('Failed to update seq. Something wrong')
                exit(0)
            else:
                self.seq = seq


#------------------------------------------------------
# main function
#------------------------------------------------------
if __name__ == '__main__':

    ad = accessDB()
    print('db: {} host: {} port: {}'.format(ad.dbName, ad.host, ad.port))

    # create log directory and log file - not used now.
    ad.checkAndCreateDirs()

    # create an admin user - create user from signup page
    #ad.createUser()

    # create a global sequence
    ad.createSequence()

    # read conditions from file
    ad.readConditionsFromFile()

    # upload conditions/update to DB
    ad.findAndUploadConditions()

    # read and upload cases to DB
    ad.readCases()
