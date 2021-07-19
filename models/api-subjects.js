var ApiService = require("../services/service.js");
var ObjectId = require("mongodb").ObjectId;

class courseJobs {
    constructor(app) {
        this.app = app;
        this.apiServiceInstance = new ApiService(app);
    }
    // addSubject
    addSubject(req, callback) {
        console.log('addSubject action', req.body);
        var self = this;
        var errorResponseObj = {
            status: false,
        };
        var responseObject = {};
        var reqBody = req.body;
        var subjectTableName = "subject";
        self.apiServiceInstance.insert(
            reqBody,
            subjectTableName,
            function (err, data) {
                if (data.insertedCount > 0) {
                    responseObject["status"] = true;
                    responseObject["message"] = 'Subject inserted successfully';
                    callback(null, responseObject);
                } else {
                    errorResponseObj['message'] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }
    // subjectsList
    subjectsList(req, callback) {
        var self = this;
        var reqObject = req.body;
        var responseObject = {};
        var errorResponseObj = {
            status: false,
        };

        const curriculum = reqObject.curriculumCode;
        let query = {};

        if (curriculum)
            query = {
                curriculumCode: curriculum,
            };
        var criteria = {
            condition: query,
        };
        var subjectTableName = "subject";

        self.apiServiceInstance.findDataAll(
            subjectTableName,
            criteria,
            function (err, data) {
                if (data.length) {
                    responseObject["status"] = true;
                    responseObject["data"] = data;
                    callback(null, responseObject);
                } else {
                    errorResponseObj['message'] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }
    // getSubjectById
    getSubjectById(req, callback) {
        var self = this;
        var reqObj = req.body;
        var errorResponseObj = {
            status: false
        };
        var responseObject = {};
        var tableName = "subject";
        var condition = {
            _id: ObjectId(reqObj.subjectId),
        };

        self.apiServiceInstance.find(
            condition,
            {},
            tableName,
            function (err, data) {
                if (data.length > 0) {
                    responseObject["status"] = true;
                    responseObject["data"] = data;
                    callback(null, responseObject);
                } else {
                    errorResponseObj["Message"] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }
    // updateSubject
    updateSubject(req, callback) {
        var self = this;
        var responseObject = {},
            errorResponseObj = {},
            reqBody = req.body,
            tableName = "subject";
        var condition = {
            _id: ObjectId(reqBody.subjectId),
        };
        self.apiServiceInstance.updateDocument(
            condition,
            reqBody,
            tableName,
            function (err, data) {
                if (data) {
                    responseObject["status"] = true;
                    responseObject["message"] = "Subject updated successfully!";
                    callback(null, responseObject);
                } else {
                    errorResponseObj['status'] = false;
                    errorResponseObj['Message'] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }
}
module.exports = courseJobs;





