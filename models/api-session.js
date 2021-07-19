var ApiService = require("../services/service.js");
const request = require('request');
const moment = require("moment")

class ApiSession {
    constructor(app) {
        this.app = app;
        this.apiServiceInstance = new ApiService(app);
    }
    getTeachers(req, callback) {
        var self = this;
        let reqObject = req.body,
            responseObject = {},
            errorResponseObj = {};
        let query = {};

        if (reqObject) {
            query = {
                curriculumCode: reqObject.curriculumCode,
                subject: reqObject.subject,
            };
        }
        query['role'] = { $in: ["teacher", "TEACHER"] };

        let criteria = {
            condition: query,
        };
        let userTableName = "users";

        self.apiServiceInstance.findDataAll(
            userTableName,
            criteria,
            function (err, data) {
                if (data.length) {
                    responseObject["status"] = true;
                    responseObject["data"] = data;
                    callback(null, responseObject);
                } else {
                    errorResponseObj['status'] = false;
                    errorResponseObj['message'] = "Teachers are not available!";
                    callback(err, errorResponseObj);
                }
            }
        );
    }

    msSyncTeacher(req, callback) {
        let responseObject = {},
            errorResponseObj = {};

        const requestParams = {
            grant_type: 'client_credentials',
            client_id: process.env.MS_CLIENT_ID,
            client_secret: process.env.MS_CLIENT_SECRET,
            scope: process.env.MS_SCOPE
        };
        const url = 'https://login.microsoftonline.com/' + process.env.MS_TENENT + '/oauth2/v2.0/token';
    
        request.post({url: url, form: requestParams}, function (err, httpResponse, body) {
            // console.log('body -----', body)
            if(err){
                console.error(err)
                callback(err, errorResponseObj)
            }
            const parsedBody = JSON.parse(body);
            request.get('https://graph.microsoft.com/v1.0/users', {
                auth: {
                    bearer: parsedBody.access_token
                }
            }, function (err, response, body) {
                if(err) {
                    errorResponseObj['status'] = false;
                    errorResponseObj['message'] = "sync teacher not working check configuration or network";
                    callback(err, errorResponseObj);
                } 
                const parsedBody = JSON.parse(body);
    
                // console.log('parsedBody.value ----',parsedBody.value)
                const msData = parsedBody.value
                let msTeacherID = msData.find( item => {
                    return item.userPrincipalName === req.email
                })
                responseObject["status"] = true;
                responseObject["data"] = msTeacherID;
                callback(null, responseObject);
            });
        });
    }

    getDataEvent(event) {
        const students = event.studentEmails.map((email) =>{
            return {
                "emailAddress": {
                    "address": email,
                    "name": ""
                },
                "type": "required"
            }
    
        })
        const dataEvent = {
            "subject": event.title,
            "body": {
                "contentType": "HTML",
                "content": event.desc,
            },
            "start": {
                "dateTime": moment(event.start).toISOString(),
                "timeZone": "GMT"
            },
            "end": {
                "dateTime": moment(event.end).toISOString(),
                "timeZone": "GMT"
            },
            "location":{
                "displayName":"Learning online"
            },
            "attendees": students,
            "allowNewTimeProposals": false,
            "isOnlineMeeting": true,
            "onlineMeetingProvider": "teamsForBusiness"
        }
        return dataEvent        
    }

    createEventUrl(msTeacherId, event, callback) {
        let self = this,
            errorResponseObj = {},
            responseObject = {};
        const dataEvent = self.getDataEvent(event)
        const requestParams = {
            grant_type: 'client_credentials',
            client_id: process.env.MS_CLIENT_ID,
            client_secret: process.env.MS_CLIENT_SECRET,
            scope: process.env.MS_SCOPE
        };
        const url = 'https://login.microsoftonline.com/' + process.env.MS_TENENT + '/oauth2/v2.0/token';
    
        request.post({url: url, form: requestParams}, function (err, httpResponse, body) {
            const parsedBody = JSON.parse(body);
    
            const options = {
                url : 'https://graph.microsoft.com/v1.0/users/'+msTeacherId+'/events',
                method: 'POST',
                json: dataEvent,
                auth: {
                    bearer: parsedBody.access_token,
                }
            };
    
            request(options, function (error, response, body) {
                // Ms.updateLinkJoinClassTeacher(event,body.onlineMeeting.joinUrl,callback)
                const condition = {'_id': event._id};
                const update = { link: body.onlineMeeting.joinUrl };
                self.apiServiceInstance.updateDocument(
                    condition,
                    update,
                    "session",
                    function (err, data) {
                        if (data.length) {
                            responseObject["status"] = true;
                            responseObject["data"] = data;
                            callback(null, responseObject);
                        } else {
                            errorResponseObj['status'] = false;
                            errorResponseObj['message'] = "Link not generated for this session";
                            callback(err, errorResponseObj);
                        }
                    }
                );
            });
        });
    }

}
module.exports = ApiSession;


