var ApiService = require("../services/service.js");
var ActionService = require("../models/api-actions");
var ObjectId = require("mongodb").ObjectId;
var _ = require("underscore");
var async = require("async");

class teacherJobs {
    constructor(app) {
        this.app = app;
        this.apiServiceInstance = new ApiService(app);
        this.aptActionInstance = new ActionService(app)
    }

    fetchAssignments(req, callback) {
        console.log('entered into fetchAssignements models');
        let self = this;
        let reqBody = req.body;
        let responseObject = {};
        let errorResponseObj = {
            status: false,
            message: 'not available to fetch the assignments'
        };

        let testTable = "test",
            userTableName = "users";
        let condition = {
            userID : reqBody.userID
        };
        
        self.apiServiceInstance.find(
            condition,
            {},
            userTableName,
            function (err, data) {
                if (data.length > 0) {
                    // var curriculum = _.pluck(courseResult, "curriculum");
                    let curriculumCode = data[0].curriculumCode;
                    let subject = data[0].subject;

                    let criteria = {},
                        condition = {};
                    condition = {
                        curriculumCode: curriculumCode,
                        subject: subject,
                        correctionMode : { $in: ["manual", "Manual"] } ,
                        status: 1, // after student written status updated with 1 those tests need to display to the teacher
                        // startdate: { $lte: currentDate },
                        // enddate: { $gte: currentDate }
                    };

                    if (reqBody["limit"]) {
                        criteria["limit"] = reqBody["limit"];
                    }
                    criteria["condition"] = condition;
                    // have to write aggregate function to fetch unique testID and userID based on teacher curriculum code from pending collection.

                    self.apiServiceInstance.findDataAll(
                        testTable,
                        criteria,
                        function (err, testResult) {
                          if (testResult) {
                            // db.transaction.aggregate([{ "$match" : {"curriculumCode" : "JNTUH-BTECH-ECE-2021"} },  {"$group" : {"_id":{testID: "$testID", userID: "$userID"}} } ])
                            
                            //   const unique = [...new Set(testResult.map(item => item.userID))]
                            responseObject["status"] = true;
                            responseObject["data"] = testResult;
                            callback(null, responseObject);
                          } else {
                            errorResponseObj['message'] = 'Tests are not available!'
                            callback(err, errorResponseObj);
                          }
                        }
                    );
                } else {
                    errorResponseObj["message"] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }

    fetchAssignmentsById(req, callback) {
        console.log('Entered into fetchAssignmentsById models')
        let self = this;
        let reqBody = req.body;
        let responseObject = {};
        let errorResponseObj = {
            status: false,
            message: 'not available to fetch the assignments'
        };

        let testTable = "test";
        
        let criteria = {},
        condition = {
        curriculumCode: reqBody.curriculumCode,
        testID: reqBody.testID,
        //   startdate: { $lte: currentDate },
        //   enddate: { $gte: currentDate },
        };

        criteria["condition"] = condition;

        self.apiServiceInstance.findDataAll(
            testTable,
            criteria,
            function (err, queryResults) {
                if (queryResults) {
                    responseObject["status"] = true;
                    responseObject["data"] = queryResults;
                    callback(null, responseObject);
                } else {
                    console.log("Error at assignment list by assignmentID", err);
                    callback(err, errorResponseObj);
                }
            }
        );
    }

    getPendingQuestions(req, callback) {
        console.log('Entered into getPendingQuestions models');
        let self = this;
        let reqBody = req.body;
        let responseObject = {};
        let errorResponseObj = {
            status: false,
            message: 'there is no pending questions fo this test'
        };

        let pendingTable = "pending";

        var query = {
            testID : reqBody.testID
         };
     
         var criteria = {
             condition : query
         };
         // based on testID have to get the user
         self.apiServiceInstance.findDataAll(pendingTable, criteria, function (error, quesResult){
            if(quesResult.length > 0){
                responseObject['status'] = true;
                responseObject['data'] = quesResult;
                callback(null,responseObject);
            }
            else{
                errorResponseObj["error"] = error;
                callback(error,errorResponseObj);
            }
         })
    }

    testSubmitByTeacher(req, callback) {
        console.log('Entered into testSubmitByTeacher models');
        let self = this;
        let reqBody = req.body;
        let responseObject = {};
        let errorResponseObj = {
            status: false,
            message: 'Not able to insert the student assessment data'
        };
        var transactionData = reqBody.transaction;
        var resultData = reqBody.result;
        var userDetail = reqBody.globalInfo;

        let transactionTable = "transaction";
        async.forEachSeries(transactionData, function (singleTransaction, forEachCbk) {
            self.apiServiceInstance.insert(singleTransaction, transactionTable, function (err, data) {
                if(data){
                    forEachCbk(null, singleTransaction)
                }
            });
        }, function (data){
            self.aptActionInstance.resultSave(resultData, function(err, result){
                if(result.status) {
                    let query = {
                        testID: userDetail.testID,
                        userID: userDetail.userID
                    };
                    self.apiServiceInstance.removeDocument(
                        "pending",
                        query,
                        function (err, templateData) {
                          if (templateData) {
                            responseObject["status"] = true;
                            responseObject["data"] = " Assessment deleted Successfully";
                            callback(err, responseObject);
                          } else {
                            callback(null, errorResponseObj);
                          }
                        }
                      );
                  }
                  else {
                    console.log('Insert problem for result', err)
                    errorResponseObject['message'] = 'Assessment result inserting problem'
                    callback(null, errorResponseObject)
                  }
            })
           
        })

    }


}

module.exports = teacherJobs;