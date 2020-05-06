## ReadMe Document:
Author: Amit Bhaduri

This project is a full stack application using HTML5, jQuery, node, MongoDB.
This document will cover on how to install, upload data to DB, and use this code base
to see the complete full-stack application in motion

### Pre-requisites:
**This code is known to work with:**
  1. node version v12.16.2
  2. npm version 6.14.4
  3. python version 3.8.2
  4. MongoDB version v4.2.6
  5. Chrome browser

**After cloning the repo do the following**
  1. npm install
  2. cd Assignment
  3. python uploadData.py (This will create the DB, upload the data to respective collections)
  4. If you run into errors , then install any missing python libraries and re-run the script. Perhaps 'bcrypt' module may not be installed for you.
  5. cd ..
  6. In a separate terminal, start mongod process
  7. In the current terminal, start node server
  ```
      > mongod --dbpath=<path/to/your/data/db> &
      > npm start

  ```
  8. Open localhost:8080 on your Chrome Browser
  9. **Use the "Sign Up" link to create an user (Example: userId: admin, password: admin2020)**

### Main Web Pages
  1. Login or Sign Up page
  2. Case and Condition page

### DB Collections:
  1. When the data is uploaded it creates the DB 'healthrecord' and 3 collections - "cases", "conditions", and "sequence"
  2. When the user is created from the Sign Up page the 4th collection - "user" is created
  ```
  Collection cases fields:
       caseId         : timestamp (this will embed an increasing sequence number to make it unique. This is also the creation time of the case)
       seq            : sequence number
       fileName       : reference to the file path
       caseDesc       : description of the case
       code           : Reference to the condition selected (default = -1)
       lastModified   : timestamp (captures when this case was last marked with a condition)
  ```

  ```
  Collection conditions fields:
       condId         : timestamp (this will embed an increasing sequence number to make it unique. This is also the creation time of the condition)
       code           : code word of the condition (first field of "conditions.csv" file from where the data is uploaded)
       desc           : description of the condition (second field of "conditions.csv" file)
       lastModified   : timestamp (captures when this condition was last modified in "conditions.csv" file)
  ```

  ```
  Collection sequence fields:
       id             : timestamp (this will embed an increasing sequence number to make it unique. This is also the creation time of the sequence)
       seq            : ever increasing sequence number, which tracks each case. Any new case uploaded will get the next increasing sequence number.
       lastModified   : timestamp (captures when this condition was last modified in "conditions.csv" file)
  ```

  ```
  Collection user fields:
       userId         : unique user name
       passwd         : encrypted password (uses bcrypt and salt)
       createdOn      : timestamp (when the user is first created)
       lastUpdatedOn  : timestamp (field which can be used in the future, if the password is modified. Defaults to the createdOn timestamp)
  ```

### Notable Features:
  1. Uploader script in 'Assigment/upload.py' can bulk upload the cases, and conditions from a file. It can also detect any incremental change in the case description of existing cases or any change in the conditions. It then selectively updates the changes in the respective collections in the DB.

  2. jQuery stores state using localStorage

  3. Sign Up can be done from the front end. Also validates - if the userId exists or not.

  4. Login from front end. Also validates for - invalid user, incorrect password

  5. Passwords are stored encrypted using bcrypt and salt.

  6. Next button is disabled when all the cases are visited so that it cannot be pressed any more.

  7. When a case is assigned a condition, the code of the condition is stored in the "cases" collection for the corresponding case sequence. Later, when the case is revisited, it will get the persisted condition and show the corresponding condition as selected. The user can always edit the condition and assign a new code to the case

  8. The case also displays the following on the "footer" section:
  ```
    - Unique caseId
    - Created on date and time Or Last modified date and time. All times are reported in PDT
    - Case sequence number 
  ```
