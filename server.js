var conf = require('./conf.js');
var app = require('./app.js');
const aws = require('aws-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// const jwt = require('_helpers/jwt');
// const errorHandler = require('_helpers/error-handler');


// const Ms = require('./jobs/ms')
// const CronJob = require('cron').CronJob;
// console.log('Before job instantiation');
// const job = new CronJob('*/30 * * * *', function() {
//     Ms.getMsUsers();
// });

// console.log('After job instantiation');
// job.start();
// console.log('is job running? ', job.running);

// console.log("Init admin user")
// Ms.initAdminUser().then()

// console.log("Get teacher form ms in the first time")
// Ms.getMsUsers()



// app.get('/*', (req,res) => {
//   res.sendFile(path.join(__dirname, 'build','index.html'));
// });


var WebRoutes = require("./routes/ui-routes.js");
var webRoutes = new WebRoutes(app);
webRoutes.init();

//connect to MongoDB
var MongoClient = require('mongodb').MongoClient;
var url = conf.database.url;
console.log("url", url);

MongoClient.connect(url, function (err, db) {
  if (db) {
    // console.log('database available ', db, '----', db.s.databaseName)
    app.db = db;
  }
  else {
    console.log("error in connecting MongoDB", err)
  }
});

var S3Data = conf.aws_S3
aws.config.update(
  {
    "accessKeyId": S3Data.accessKeyId,
    "secretAccessKey": S3Data.secretAccessKey,
    "region": S3Data.region
  });

var s3 = new aws.S3();

app.s3 = s3;

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, function () {
  console.log('Server listening on port ' + port);
});


