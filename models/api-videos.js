var ApiService = require("../services/service.js");

class videoJobs {
    constructor(app) {
        this.app = app;
        this.apiServiceInstance = new ApiService(app);
    }

    // videosList
    videosList(req, callback) {
        var self = this;
        var reqObject = req.body,
            responseObject = {},
            errorResponseObj = {};
        let query = {};

        const curriculum = reqObject.curriculumCode,
              subject = reqObject.subject,
              topic = reqObject.topic,
              chapter = reqObject.chapter;

        if (curriculum && subject) {
            query = {
                curriculumCode: curriculum,
                subject: subject,
                topic: topic || '',
                chapter: chapter || ''
            };
        }
        var criteria = {
            condition: query,
        };
        if(reqObject['limit']) {
            criteria['limit'] = reqObject.limit    
        }

        var tableName = "video";

        self.apiServiceInstance.findDataAll(
            tableName,
            criteria,
            function (err, data) {
                if (data.length) {
                    responseObject["status"] = true;
                    responseObject["data"] = data;
                    callback(null, responseObject);
                } else {
                    errorResponseObj['status'] = false;
                    errorResponseObj['message'] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }
    // submitVideo
    submitVideo(req, callback) {
        var self = this;
        var reqObject = req.body;
        var db = self.app.db;
        var responseObject = {};
        var errorResponseObj = {
            status: false,
            statuscode: 204,
            message: "Not able to create a session due to request body issue.",
        };
        var counterTableName = "counter";
        var condition = {
            condition: { _id: "video" },
            sortOrder: [["_id", "asc"]],
            updateData: { $inc: { seq: 1 } },
            newUp: { new: true, upsert: true },
        };

        self.apiServiceInstance.findAndModifyDocument(
            condition,
            counterTableName,
            function (err, result) {
                if (result) {
                    var testCount = result.value.seq;

                    var videoTablename = "video";
                    reqObject['videoID'] = "VID" + testCount,
                    reqObject['createdBy'] = reqObject.createdBy ? reqObject.createdBy : "UID00001",
                    reqObject['createDate'] = reqObject.createDate ? reqObject.createDate : new Date().getTime(),

                    self.apiServiceInstance.insert(
                        reqObject,
                        videoTablename,
                    function (err, videoResult) {
                        if (videoResult) {
                        var collection = db.collection("course");
                        collection.update({"curriculumCode": reqObject.curriculumCode, "subject" : reqObject.subject, 
                            "topic" : reqObject.topic,  "chapters" : {$elemMatch: {"chapter": reqObject.chapter }}  }, 
                            {$set: {'chapters.$.fileLocation':reqObject.fileLocation, 'chapters.$.fileName' : reqObject.fileName}}, function(err, res) {
                            if(res) {
                                responseObject["status"] = true;
                                responseObject["message"] = "Video uploaded successfully!";
                                callback(null, responseObject);             
                            }
                            else {
                                console.log('course collection not updated properly', err)
                                errorResponseObj['message'] = err;
                                callback(err, errorResponseObj);
                            }
                            })
                        } else {
                            console.log('video data not inserted properly in video collection', err)
                            errorResponseObj['message'] = err;
                            callback(err, errorResponseObj);
                        }
                    }
                    );
                } else {
                    console.log('counter collection does not have video seq param', err)
                    errorResponseObj['message'] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }
    // deleteVideo 
    deleteVideo (req, callback) {
        // console.log('s3 credentials', req.body)
        var self = this;
        var s3 = self.app.s3;
        var reqObject = req.body,
            errorResponseObj = {},
            responseObject = {};
           
        
        const s3BucketName = 'sessionuploadnew'
        const tableName = 'video'

        var condition = {
            videoID: reqObject.videoID,
        };
        // console.log('s3 data', s3);
        
        self.apiServiceInstance.removeDocument(
            tableName,
            condition,
            async (err, data) => {
                if (data) {
                    var params = {
                        Bucket: s3BucketName,
                        Key: reqObject.fileName
                        // Delete: {
                        //     Objects: [
                        //         {
                        //             Key: reqObject.fileName
                        //         }
                        //     ],
                        // }
                    }
                    // try{
                        await s3.headObject(params).promise()
                        console.log("File Found in S3")
                        try {
                            s3.deleteObject(params, function(err, data) {
                                if (err) {
                                    console.log(err, err.stack)
                                    errorResponseObj['message'] = err
                                    callback(null, errorResponseObj)
                                }
                                else {
                                    responseObject['status'] = true
                                    responseObject['data'] = data
                                    responseObject['message'] = "Successfully file deleted"
                                    callback(null, responseObject)
                                }
                            })
                        }
                        catch (err) {
                             console.log("ERROR in file Deleting : " + JSON.stringify(err))
                        }
                    // }
                    // catch (err) {
                    //     console.log("File not Found ERROR : " + err.code)
                    // }
                } else {
                    errorResponseObj['status'] = false;
                    errorResponseObj['message'] = err;
                    callback(err, errorResponseObj);
                }
            }
        );
    }

}

module.exports = videoJobs;
