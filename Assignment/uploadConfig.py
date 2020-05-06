# GLOBAL CONFIG VARIABLES
# SEQUENCE
SEQ = 1

# Mongo related:
DBNAME = 'healthrecord'
HOST   = 'localhost'
PORT   = '27017'
CONDITION_FILE = 'conditions.csv'
CASES_DIR = 'cases'
SEQUENCE_START = 0

# LOG: FOR FUTURE
#LOG_DIR = 'logs'
#LOG_FILE = "logs/mongoUpload.log"


# Timezone
import pytz
TZ = pytz.timezone('US/Pacific')
