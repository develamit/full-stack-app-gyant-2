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
