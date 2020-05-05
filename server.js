const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 1;
const CONNECTION_URL = 'mongodb://localhost:27017/';
const DATABASE_NAME = "healthrecord";
const PORT = 8080

const app = Express();
const router = Express.Router();
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
//app.use(Express.json())
let database, collectionCases, collectionConditions;

// Set EJS as templating engine
app.set('view engine', 'ejs');

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
              // TODO - use timestamp for 'id' and 'lastModified' field
              let insertStr = {"userId" : userId, "passwd": hash};
              console.log('hash: ', hash);
              collectionUser.insertOne(insertStr, (error, result) => {
                  if(error) {
                      return response.status(500).send(error);
                  }
                  console.log('user created successfully');
                  response.send(result);
              });

            });
          }
          else { // the user exists. Redirect him to the login page // TODO
            console.log('user: ', userId, ' exists. Please login');
            response.send(result);
          }
        }
    });
});

app.post("/api/login", (request, response) => {
    console.log('/api/login request body: ', request.body);
    const userId = request.body.userId;
    const plainPasswd = request.body.passwd;
    let queryStr = {"userId" : userId};
    //let projection = {"passwd" : 1};
    let queries = [
        collectionUser.findOne(queryStr),
        collectionCases.findOne({}),
        collectionConditions.find({}).toArray(),
      ];

      Promise.all(queries)
        .then(results => {
          if (!results[0]) {
            console.log("Error in user");
            return response.status(500).send(error);
          } else if (!results[1]) {
            console.log("Error in cases");
            return response.status(500).send(error);
          } else if (!results[2]) {
            console.log("Error in conditions");
            return response.status(500).send(error);
          }

          let userData       = results[0];
          let casesData      = results[1];
          let conditionsData = results[2];

          console.log('userData: ', userData);
          console.log('casesData: ', casesData);
          console.log('conditionsData: ', conditionsData);

          bcrypt.compare(plainPasswd, userData.passwd, function(err, res) {
            if(res) {
              console.log('passwd match');
              response.send({"cases" : casesData, "conditions" : conditionsData});
            }
          });

        })
        .catch(err => {
          console.log("Error in getting queries", err);
          return response.status(500).send(error);
      });

  });


// This does 2 mongoDB tasks:
//        1. Record the condition for the current case
//        2. Send the next case to FE
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
            //response.send({"cases" : null});
          } else if (!results[1]) {
            console.log("Cases not found during findOne operation");
            //response.send({"cases" : null});
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
          //response.send({"cases" : null});
          return response.status(500).send(err);
        });

});



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

app.use('/api', router);
app.use(Express.static('public'));
