const express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 1; // can be increased, at the expense of time
const CONNECTION_URL = 'mongodb://localhost:27017/';
const DATABASE_NAME = "healthrecord";
const PORT = process.env.PORT || 8080;

const app = express();
const router = express.Router();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
let database, collectionCases, collectionConditions;

// Set EJS as templating engine
app.set('view engine', 'ejs');

//-----------------------------------------------------------------------------------
// server listening on port 8080 of host 0.0.0.0, which will also work from localhost
//-----------------------------------------------------------------------------------
app.listen(PORT, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collectionUser = database.collection("user");
        collectionSequence = database.collection("sequence");
        collectionCases = database.collection("cases");
        collectionConditions = database.collection("conditions");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.get("/", (request, response) => {
    response.render('login');
});

//-----------------------------------------------------------------------------------
// api endpoint: /api/signup
// Function:
//    1. Check if the user exists
//    2. Creates the user and encrypts the passwd if the user does not exist
//    3. Returns either 'created' or 'exists' message
//-----------------------------------------------------------------------------------
app.post("/api/signup", (request, response) => {
    console.log('/api/signup request body: ', request.body);
    const userId = request.body.userId;
    const plainPasswd = request.body.passwd;
    let queryStr = {"userId" : userId};
    let projection = {"passwd" : 1};
    collectionUser.findOne(queryStr, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        else{
          console.log('user does not exist. Create the user', userId);
          if (!result) { // create the user, since record is not found
            bcrypt.hash(plainPasswd, saltRounds, function(err, hash) {
              // Store hash in your password DB.
              // use timestamp for 'createdOn' and 'lastUpdatedOn' field
              let createdOn = Date.now();
              let insertStr = {"userId" : userId, "passwd": hash, "createdOn":createdOn, "lastUpdatedOn":createdOn};
              console.log('hash: ', hash);
              collectionUser.insertOne(insertStr, (error, result) => {
                  if(error) {
                      return response.status(500).send(error);
                  }
                  console.log('user created successfully');
                  response.send('created');
              });

            });
          }
          else { // the user exists. Redirect him to the login page // TODO
            console.log('user: ', userId, ' exists. Please login');
            response.send('exists');
          }
        }
    });
});

//-----------------------------------------------------------------------------------
// api endpoint: /api/login
// Function:
//    1. Check if the user is valid - password comparison is done using bcrypt module
//    2. Finds the first entry in the DB cases collection
//    3. Finds the list of conditions from the DB
//    4. Sends back the response as {first case, [conditions]}
// Note: Since this api calls MongoDB multiple times, "promise" is used to avoid
//       callback hell
//-----------------------------------------------------------------------------------

app.post("/api/login", (request, response) => {
    console.log('/api/login request body: ', request.body);
    const userId = request.body.userId;
    const plainPasswd = request.body.passwd;
    let queryStr = {"userId" : userId};
    let queries = [
        collectionUser.findOne(queryStr),
        collectionCases.findOne({}),
        collectionConditions.find({}).toArray(),
      ];

      Promise.all(queries)
        .then(results => {
          if (!results[0]) {
            console.log("Error in querying user in DB");
          }
          if (!results[1]) {
            console.log("Error in querying cases in DB");
            return response.status(500).send(error);
          }
          if (!results[2]) {
            console.log("Error in querying conditions in DB");
            return response.status(500).send(error);
          }

          let userData       = results[0];
          let casesData      = results[1];
          let conditionsData = results[2];

          console.log('userData: ', userData);
          console.log('casesData: ', casesData);
          console.log('conditionsData: ', conditionsData);

          //---------------------------------------------------------------
          // validation checks - return appropriate message to FE
          //---------------------------------------------------------------
          if (!userData) {
            console.log('invalid user');
            response.send({"cases" : null, "conditions" : null, "message" : "invalid"});
          }
          if (!casesData) {
            console.log('cases not found');
            response.send({"cases" : null, "conditions" : null, "message" : "cases-not-found"});
          }
          if (!conditionsData) {
            console.log('conditions not found');
            response.send({"cases" : null, "conditions" : null, "message" : "conditions-not-found"});
          }

          //---------------------------------------------------------------
          // everything is valid at this point. Return first case and all conditions
          //---------------------------------------------------------------
          if (userData) {
            bcrypt.compare(plainPasswd, userData.passwd, function(err, res) {
              if(res) {
                console.log('passwd match');
                response.send({"cases" : casesData, "conditions" : conditionsData, "message" : "valid"});
              }
              else {
                console.log('passwd incorrect');
                response.send({"cases" : null, "conditions" : null, "message" : "passwd-incorrect"});
              }
            });
          }

        })
        .catch(err => {
          console.log("Error in getting queries", err);
          return response.status(500).send(err);
      });

  });



//-----------------------------------------------------------------------------------
// This does 2 mongoDB tasks:
//        1. Record the condition for the current case
//        2. Send the next case to FE
//-----------------------------------------------------------------------------------
app.post("/api/nextcase", (request, response) => {
    console.log('/api/nextcase request body: ', request.body);
    const curSeq = parseInt(request.body.curSeq, 10);
    const curCond = request.body.curCond;
    const nextSeq = curSeq + 1;
    let curQuery = {"seq" : curSeq};
    let newValues = { $set: {code: curCond} };
    let queryStr = {"seq" : nextSeq};
    console.log('curSeq: ', curSeq, 'curCond:', curCond, 'nextSeq: ', nextSeq);

    let queries = [
        collectionCases.updateOne(curQuery, newValues),
        collectionCases.findOne(queryStr)
      ];


      Promise.all(queries)
        .then(results => {
          if (!results[0]) {
            console.log("Update did not happen during updateOne operation");
          } else if (!results[1]) {
            console.log("Cases not found during findOne operation");
          }

          let updateResult       = results[0];
          let casesData          = results[1];
          console.log("casesData: ", casesData);

          if (casesData) {
            response.send({"cases" : casesData});
          } else {
            response.send({"cases" : null});
          }

        })
        .catch(err => {
          console.log("Error in updating and getting next case, error code: ", err);
          return response.status(500).send(err);
        });

});


/* DELETE LATER
app.get("/api/cases", (request, response) => {
    collectionCases.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});


app.get("/api/conditions", (request, response) => {
    collectionConditions.find({}).toArray((error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});
*/


app.use('/api', router);
app.use(express.static('public'));
