var ApiService = require("../services/service.js");
var ApiSession = require("../models/api-session");
var _ = require("underscore");
var async = require("async");
var ObjectId = require("mongodb").ObjectId;
var moment = require("moment");
var generator = require('generate-password');
const { sendSessionInvite } = require('../emails/sendgrid')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const config = (fs.readFileSync('config.json')).toString()
// console.log('config in actions', config);
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('752039833235-5m8c0h49oarc5auh156vhhoqlt86og3a.apps.googleusercontent.com');

class ApiActions {
  constructor(app) {
    this.app = app;
    this.apiServiceInstance = new ApiService(app);
    this.apiSessionInstance = new ApiSession(app);
  }
  register(req, callback) {
    var self = this;
    var reqObj = req.body;

    var errorResponseObj = {
      status: false,
      message: "User not able to register due to request",
    };
    var responseObject = {},
      userTableName = "users",
      counterTableName = "counter",
      curriculumUserTable = "curriculumuser",
      condition = {
        condition: { _id: "user" },
        sortOrder: [["_id", "asc"]],
        updateData: { $inc: { seq: 1 } },
        newUp: { new: true, upsert: true },
      };

    self.apiServiceInstance.findAndModifyDocument(
      condition,
      counterTableName,
      function (err, result) {
        if (result) {
          console.log('check')
          console.log(result)
          reqObj["role"] = reqObj.role ? reqObj.password : "student";
          const hashPassword = bcrypt.hashSync(req.body.password, 8)
          delete req.body['password']
          req.body['password'] = hashPassword
          reqObj['isActivate'] = false
          // reqObj["password"] = reqObj.password ? reqObj.password : generator.generate({
          //   length: 10,
          //   numbers: true
          // });
          reqObj["userID"] = result.value.seq;
          self.apiServiceInstance.insert(
            reqObj,
            userTableName,
            function (err, userResults) {
              if (userResults.insertedCount > 0) {
                var insertObj = {
                  userID: result.value.seq,
                  curriculumCode: reqObj.curriculumCode,
                  curriculum: reqObj.curriculum,
                };
                self.apiServiceInstance.insert(
                  insertObj,
                  curriculumUserTable,
                  function (err, curriculumUser) {
                    if (curriculumUser.insertedCount > 0) {
                      responseObject["status"] = true;
                      responseObject["message"] =
                        "Student registered successfully";
                      callback(null, responseObject);
                    } else {
                      console.log('err 1 is:', err);
                      callback(err, errorResponseObj);
                    }
                  }
                );
              } else {
                console.log('err 2 is:', err);
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          console.log('err 3 is:', err);
          callback(err, errorResponseObj);
        }
      }
    );
  }

  googleLog(req, callback) {
    var self = this;
    var reqObj = req.body;
    var responseObject = {};
    const { tokenId, id, email } = reqObj
    console.log('google-' + email)

    var errorResponseObj = {
      status: false,
      token: null,
      message: "Inavlid google login",
    };
    // var criteria = {
    //   condition: query,
    //   sortOrder: [["_id", "desc"]],
    //   limit: 1
    // };
    // var userTableName = "users";
    client.verifyIdToken({ idToken: tokenId, audience: '752039833235-5m8c0h49oarc5auh156vhhoqlt86og3a.apps.googleusercontent.com' }).then(response => {
      console.log(response.payload)
      const { email_verified } = response.payload
      if (email_verified) {
        var queryemail = {
          email: reqObj.email,
        }
        var userTableName = "users";

        self.apiServiceInstance.findOne(queryemail, userTableName, function (err, result) {
          responseObject["message"] = "Login successfully!";
          responseObject["status"] = true;
          if (result) {
            responseObject["valid"] = true;
            callback(null, responseObject)

          } else {
            responseObject["valid"] = false;
            callback(null, responseObject)
          }


        })

      } else {
        callback(null, errorResponseObj)
      }

    }).catch(err => {
      console.log("err");
      console.log(err);
    })

  }
  login(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      token: null,
      message: "Not able to login"
    };
    var responseObject = {};

    if (!_.isEmpty(reqObj.email) && !_.isEmpty(reqObj.password)) {
      var query = {
        email: reqObj.email,
        // password: reqObj.password,
      };
      var criteria = {
        condition: query,
        sortOrder: [["_id", "desc"]],
        limit: 1
      };
      var userTableName = "users";

      self.apiServiceInstance.findDataAll(
        userTableName,
        criteria,
        function (err, userResults) {
          if (userResults.length > 0) {
            const [{ _id, userID, email, role, password }] = userResults;
            if (role === 'student') {
              var curriculumUserTable = "curriculumuser",
                query = { userID: userID };

              var passwordIsValid = bcrypt.compareSync(reqObj.password, password);
              if (!passwordIsValid) return callback(null, errorResponseObj);
              // var token = jwt.sign({ id: _id }, 'TestApp123', {
              //     expiresIn: 86400 // expires in 24 hours
              // });

              // For limit we can make the condition to disply the previous used curriculum data
              var criteria = {
                condition: query,
                sortOrder: [["_id", "desc"]],
                projection: {
                  _id: 0,
                  curriculumCode: 1,
                  curriculum: 1
                },
                limit: 1,
              };
              self.apiServiceInstance.findDataAll(curriculumUserTable, criteria, function (err, curriculumArray) {
                if (curriculumArray.length > 0) {
                  // var uniqueCurriculum = curriculumArray.map(({curriculumCode, curriculum}) => ({[curriculumCode] : curriculum}))
                  let finalData = [];
                  for (var j = 0; j < userResults.length; j++) {
                    finalData = {
                      "userID": userResults[j].userID,
                      "email": userResults[j].email,
                      "curriculum": userResults[j].curriculum,
                      "curriculumCode": userResults[j].curriculumCode,
                      "role": userResults[j].role,
                      "userCurriculum": curriculumArray
                    };
                  }
                  var token = jwt.sign({ id: _id, ...finalData }, 'TestApp123', {
                    expiresIn: 86400 // expires in 24 hours
                  });

                  responseObject["status"] = true;
                  responseObject["message"] = "Login successfully!";
                  responseObject["token"] = token;
                  responseObject["loginModule"] = 'student';
                  callback(null, responseObject);
                }
                else {
                  console.log('finding availble curriculums in curriculumUser collection at login API', err);
                  callback(null, errorResponseObj);
                }
              });
            } else if (role === 'teacher' || role === "TEACHER") {
              const [{ curriculumCode, subject }] = userResults;
              const data = {
                userID: userID,
                email: email,
                role: role,
                curriculumCode: curriculumCode,
                subject: subject
              }
              var token = jwt.sign({ id: _id, ...data }, 'TestApp123', {
                expiresIn: 86400 // expires in 24 hours
              });
              responseObject = {
                status: true,
                message: 'Login successfully!',
                token: token,
                loginModule: 'teacher'
              };
              callback(null, responseObject);
            }
            else {
              const data = {
                userID: userID,
                email: email,
                role: role
              }
              var token = jwt.sign({ id: _id, ...data }, 'TestApp123', {
                expiresIn: 86400 // expires in 24 hours
              });
              responseObject = {
                status: true,
                message: 'Login successfully!',
                token: token,
                loginModule: 'admin'
              };
              callback(null, responseObject);
            }
          } else {
            console.log('user not available', err);
            callback(err, errorResponseObj);
          }
        }
      );
    } else {
      console.log("Enter username and password properly", err);
      callback(null, errorResponseObj);
    }
  }

  //findgmail

  checkgmail(req, callback) {
    var self = this;
    var reqObj = req.body;
    var responseObject = {};
    const { email } = reqObj

    var errorResponseObj = {
      status: false,
      token: null,
      message: "Inavlid google login",
    };
    var query = {
      email: reqObj.email,
      // password: reqObj.password,
    };
    var criteria = {
      condition: query,
      sortOrder: [["_id", "desc"]],
    };
    var userTableName = "users";
    self.apiServiceInstance.findOne(query, userTableName, function (err, result) {
      console.log('result')
      console.log(result)
      callback(null, 'success')

    })
  }
  //getInactiveId

  getInactiveId(req, callback){
    var self = this;
    var reqObj = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      token: null,
      message: "Inavlid google login",
    };
    var query = {
      isActivate: false,
      // password: reqObj.password,
    };
    var tablename ='users'
    var criteria={
      condition: query,
    }
    self.apiServiceInstance.findDataAll(tablename, criteria, function (err, userArray){
      console.log(userArray.length)
      if (userArray.length>0){
        responseObject['userDetail'] = userArray
        responseObject['status']= true,
        callback(null,responseObject)
      }else{
        responseObject['userDeail']="No New Users"
        callback(null, 'succc')
      }
       

    })
  }


  // createCurriculum
  createCurriculum(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var reqObj = req.body;
    var curriculumTableName = "curriculum";

    self.apiServiceInstance.insert(
      reqObj,
      curriculumTableName,
      function (err, curriculumResults) {
        if (curriculumResults.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = curriculumResults;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //updateCurriculum
  updateCurriculum(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var updateDocument = req.body.updateData;
    var curriculumTableName = "curriculum";
    var condition = {
      _id: ObjectId(reqObj.condition._id),
    };
    self.apiServiceInstance.updateDocument(
      condition,
      updateDocument,
      curriculumTableName,
      function (err, curriculumResults) {
        if (curriculumResults.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = curriculumResults;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getCurriculum - for view and update based on _id
  getCurriculum(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var curriculumTableName = "curriculum";
    var condition = {
      _id: ObjectId(reqObj._id),
    };

    self.apiServiceInstance.find(
      condition,
      {},
      curriculumTableName,
      function (err, curriculumSingleData) {
        if (curriculumSingleData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = curriculumSingleData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;

          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getAllCurriculum for Admin panel
  getAllCurriculum(req, callback) {
    var self = this;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var curriculumTableName = "curriculum";
    var criteria = {
      condition: {},
      projection: {
        curriculum: 1,
        curriculumCode: 1,
        startDate: 1,
        endDate: 1,
        effectiveDate: 1,
        labSession: 1,
        marksMode: 1
      }
    };

    self.apiServiceInstance.findDataAll(
      curriculumTableName,
      criteria,
      function (err, curriculumAllData) {
        if (curriculumAllData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = curriculumAllData;
          callback(null, responseObject);
        } else {
          console.log('Curriculum data not listed at getAllCurriculum. Due to -', err);
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getSubjectsByCur for Admin panel
  getSubjectsByCur(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var curriculumTableName = "course";

    let query = {
      curriculumCode: reqObj.curriculumCode
    };

    var criteria = {
      condition: query,
      projection: { subject: 1, startDate: 1, endDate: 1, credits: 1 },
      sortOrder: { _id: 1 }
    };

    self.apiServiceInstance.findDataAll(
      curriculumTableName,
      criteria,
      function (err, subjectsAllData) {
        let dataArr = subjectsAllData.map(item => [item.subject, item]);
        let mapArr = new Map(dataArr);
        const uniqueArray = [...mapArr.values()];
        if (subjectsAllData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = uniqueArray;
          callback(null, responseObject);
        } else {
          console.log('Curriculum data not listed at getAllCurriculum. Due to -', err);
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getSubjectsForCourse - In Admin course module fetching subjects based on course to add topic & chapters
  getSubjectsForCourse(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      message: "Subjects are not available for this curriculum",
    };
    var responseObject = {};
    var curriculumTableName = "subject";

    let query = {
      curriculumCode: reqObj.curriculumCode
    };
    var criteria = {
      condition: query,
      sortOrder: { _id: 1 },
      projection: { userID: 0, _id: 0, curriculumCode: 0, subjectId: 0 }
    };

    self.apiServiceInstance.findDataAll(
      curriculumTableName,
      criteria,
      function (err, data) {
        if (data) {
          responseObject["status"] = true;
          responseObject["data"] = data;
          callback(null, responseObject);
        } else {
          console.log('Subjects data not listed. Due to -', err);
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getSubjectsByCur for Admin panel
  getTopicByCurSub(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    let responseObject = {};
    const courseTableName = "course";

    let query = {};
    if (reqObj.curriculumCode && reqObj.subject) {
      query = {
        curriculumCode: reqObj.curriculumCode,
        subject: reqObj.subject,
      };
    } else if (reqObj.condition == "all") {
      query = {};
    } else {
      query = {
        curriculumCode: reqObj.curriculumCode,
        subject: reqObj.subject ? reqObj.subject : "",
      };
    }

    var criteria = {
      condition: query,
      projection: { topic: 1 },
      sortOrder: { _id: 1 }
    };

    self.apiServiceInstance.find(criteria.condition, criteria.projection, courseTableName, function (err, topicData) {
      if (topicData.length > 0) {
        responseObject['status'] = true;
        responseObject['data'] = topicData;
        callback(null, responseObject);
      } else {
        console.log('Topic data not listed at getTopicByCurSub. Due to -', err);
        errorResponseObj['error'] = err;
        callback(err, errorResponseObj);
      }
    });
  }
  // getAllChapters for Admin panel
  getAllChapters(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    let responseObject = {};
    const courseTableName = "course";

    let query = {};

    query = {
      curriculumCode: reqObj.curriculumCode,
      subject: reqObj.subject,
      topic: reqObj.topic
    };
    var criteria = {
      condition: query,
      projection: { chapters: 1 }
    };

    self.apiServiceInstance.findDataAll(courseTableName, criteria, function (err, chaptersData) {
      if (chaptersData.length > 0) {
        let [{ chapters }] = chaptersData;
        responseObject['status'] = true;
        responseObject['data'] = chapters;
        callback(null, responseObject);
      } else {
        console.log('chapters data not listed at getAllChapters. Due to -', err);
        errorResponseObj['error'] = err;
        callback(err, errorResponseObj);
      }
    });
  }
  //curriculum full details
  getCurriculumDetails(req, callback) {
    var self = this;
    var reqObj = req.body;
    var condition = {};
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var courseTableName = "course";

    var condition = "",
      reqData = "",
      message = "";

    if (reqObj.curriculumCode && !reqObj.subject) {
      condition = { curriculumCode: reqObj.curriculumCode };
      reqData = "subject";
      message = "Subjects are not availble for selected curriculum";
    } else if (reqObj.curriculumCode && reqObj.subject && !reqObj.topic) {
      condition = {
        curriculumCode: reqObj.curriculumCode,
        subject: reqObj.subject,
      };
      reqData = "topic";
      message = "Topics are not availble for selected curriculum and subject";
    } else if (reqObj.curriculumCode && reqObj.subject && reqObj.topic) {
      condition = {
        curriculumCode: reqObj.curriculumCode,
        subject: reqObj.subject,
        topic: reqObj.topic,
      };
      (reqData = "chapters"),
        (message =
          "Subjects are not availble for selected curriculum, subject and topic");
    } else {
      callback(null, errorResponseObj);
    }
    self.apiServiceInstance.findDistictData(
      reqData,
      condition,
      courseTableName,
      function (err, resData) {
        if (resData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = resData;
          callback(null, responseObject);
        } else {
          errorResponseObj["message"] = message;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  // createCourse
  createCourse(req, callback) {
    var self = this;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var reqBody = req.body;
    var courseTableName = "course";
    self.apiServiceInstance.insert(
      reqBody,
      courseTableName,
      function (err, courseResults) {
        if (courseResults.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = courseResults;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  // updateCourse
  updateCourse(req, callback) {
    var self = this;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var reqBody = req.body;
    var courseTableName = "course";
    var updateDocument = reqBody.updateData;

    var condition = {
      _id: ObjectId(reqBody.condition["_id"]),
    };

    self.apiServiceInstance.updateDocument(
      condition,
      updateDocument,
      courseTableName,
      function (err, courseResults) {
        if (courseResults.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = courseResults;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getCourse - for view and update based on _id
  getCourse(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var courseTableName = "course";
    var condition = {};
    if (reqObj.curriculumCode && reqObj.subject) {
      condition = {
        curriculumCode: reqObj.curriculumCode,
        subject: reqObj.subject
      }
    } else {
      condition = {
        _id: ObjectId(reqObj._id),
      };
    }

    self.apiServiceInstance.find(
      condition,
      {},
      courseTableName,
      function (err, courseSingleData) {
        if (courseSingleData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = courseSingleData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  //getAllCourse
  getAllCourse(req, callback) {
    var self = this;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var responseObject = {};
    var courseTableName = "course";

    self.apiServiceInstance.findDataAll(
      courseTableName,
      {},
      function (err, courseAllData) {
        if (courseAllData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = courseAllData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  getCurriculumSubject(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var criteria;
    if (reqObject.curriculum || reqObject.subject) {
      if (reqObject.curriculum && reqObject.subject == "") {
        criteria = {
          curriculum: reqObject.curriculum,
        };
      } else if (reqObject.curriculum == "" && reqObject.subject) {
        criteria = {
          subject: reqObject.subject,
        };
      } else {
        criteria = {
          curriculum: reqObject.curriculum,
          subject: reqObject.subject,
        };
      }
    } else {
      criteria = {};
    }
    var curriculumAndSubject = [];
    var data = [];

    var courseTableName = "course";
    self.apiServiceInstance.find(
      criteria,
      {},
      courseTableName,
      function (err, courseResult) {
        if (courseResult.length > 0) {
          var curriculum = _.pluck(courseResult, "curriculum");
          var allSubject = _.pluck(courseResult, "subject");

          var uniqueCurriculum = _.uniq(curriculum).sort(function (a, b) {
            return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
          });
          var uniqueSubject = _.uniq(allSubject).sort(function (a, b) {
            return a - b;
          });

          var finalCurriculum = [];
          async.forEachSeries(
            uniqueCurriculum,
            function (singleCurriculum, forEachCb) {
              finalCurriculum.push(singleCurriculum);

              var criteria = {
                condition: {
                  curriculum: singleCurriculum,
                },
                projection: {
                  subject: 1,
                },
              };

              self.apiServiceInstance.findDataAll(
                courseTableName,
                criteria,
                function (err, courseResult1) {
                  if (courseResult1.length > 0) {
                    var subject = [];
                    for (var j = 0; j < courseResult1.length; j++) {
                      subject.push(courseResult1[j].subject);
                    }
                    var subjectforcurriculum = _.uniq(subject).sort(function (
                      a,
                      b
                    ) {
                      return a - b;
                    });
                  }
                  curriculumAndSubject.push({
                    curriculum: singleCurriculum,
                    subject: subjectforcurriculum,
                  });
                  forEachCb(null, singleCurriculum);
                }
              );
            },
            function (result1) {
              data.push({
                curriculum: finalCurriculum,
                curriculumandsubject: curriculumAndSubject,
                allSubject: uniqueSubject,
              });
              responseObject["data"] = data;
              responseObject["status"] = true;
              responseObject["message"] = "curriculum and subjects are listed";
              callback(null, responseObject);
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  getTopic(req, callback) {
    var self = this;
    var reqObj = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      message: "Error in fetching topics based on curriculum and subject",
      data: {},
    };
    var query = {};

    if (reqObj.param == "all") {
      query = {};
    } else {
      query = {
        curriculum: reqObj.curriculum,
        subject: reqObj.subject,
      };
    }

    for (var i in query) {
      if (query[i] === null || query[i] === undefined || query[i] === "") {
        delete query[i];
      }
    }
    var criteria = {
      condition: query,
      projection: { topic: 1, chapters: 1 },
      sortOrder: { _id: 1 },
    };

    var courseTableName = "course";
    self.apiServiceInstance.findDataAll(
      courseTableName,
      criteria,
      function (err, topicData) {
        if (topicData.length > 0) {
          var topic = _.pluck(topicData, "topic");
          var uniquetopic = _.uniq(topic);
          var finaltopic = [];
          var finalData = [];
          var checkTopic = [];
          async.forEachSeries(
            uniquetopic,
            function (singleObj, forEachCbk) {
              var object1 = _.where(topicData, { topic: singleObj });
              var chapter = object1[0]["chapters"];
              var allchapters = chapter.map((e) => {
                return e.chapter;
              });

              if (chapter[0] !== "" && chapter[0] !== undefined) {
                finaltopic.push(singleObj);
                checkTopic.push({
                  topic: singleObj,
                  chapters: _.uniq(allchapters),
                });
              }
              forEachCbk(null, singleObj);
            },
            function (result1) {
              finalData.push({
                topic: finaltopic,
                chapters: checkTopic,
              });
              responseObject["status"] = true;
              responseObject["data"] = finalData;
              responseObject["message"] =
                "Topic and chapters are listed based on curriculum and subject";
              callback(null, responseObject);
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  // addQuestion
  addQuestion(req, callback) {
    var self = this;
    var s3 = self.app.s3;
    var reqObj = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      statuscode: 204,
      message: "Question not able to insert due to request!",
    };

    //    Validating the Question Insert Request Object Before insert
    if (_.isEmpty(reqObj.curriculumCode) ||
      _.isEmpty(reqObj.subject) ||
      _.isEmpty(reqObj.topic) ||
      _.isEmpty(reqObj.chapter)) {
      callback(null, responseObject);
      return;
    }

    var counterTableName = "counter";

    var query = { _id: "question" };
    var criteria = {
      condition: query,
      projection: {},
    };

    self.apiServiceInstance.findDataAll(
      counterTableName,
      criteria,
      function (err, counterResult) {
        if (counterResult) {
          var condition = {
            _id: "question",
          };
          var updateData = {
            seq: parseInt(counterResult[0].seq) + 1,
          };
          self.apiServiceInstance.updateDocument(
            condition,
            updateData,
            counterTableName,
            function (err, updateCounter) {
              if (updateCounter) {
                self.apiServiceInstance.findDataAll(
                  counterTableName,
                  criteria,
                  function (err, counterResult2) {
                    if (counterResult2) {
                      var serial;
                      if (JSON.stringify(counterResult2[0].seq).length == 1) {
                        serial = "QMS000".concat(
                          JSON.parse(counterResult2[0].seq)
                        );
                      } else if (JSON.stringify(counterResult2[0].seq).length == 2) {
                        serial = "QMS00".concat(
                          JSON.parse(counterResult2[0].seq)
                        );
                      } else if (JSON.stringify(counterResult2[0].seq).length == 3) {
                        serial = "QMS0".concat(JSON.parse(counterResult2[0].seq));
                      } else {
                        serial = "QMS".concat(JSON.parse(counterResult2[0].seq));
                      }

                      var questionTableName = "question";

                      var criteria = {
                        questionID: serial,
                        createdBy: reqObj.createdBy ? reqObj.createdBy : "UID00001",
                        createDate: reqObj.createDate ? reqObj.createDate : new Date().getTime(),
                        curriculum: reqObj.curriculum,
                        curriculumCode: reqObj.curriculumCode,
                        subject: reqObj.subject,
                        topic: reqObj.topic,
                        chapter: reqObj.chapter,
                        question: reqObj.question,
                        answer1: reqObj.answer1 || "",
                        answer2: reqObj.answer2 || "",
                        answer3: reqObj.answer3 || "",
                        correctanswer: reqObj.correctanswer || "",
                        questionType: reqObj.questionType,
                        questionmarks: reqObj.questionmarks
                      };

                      self.apiServiceInstance.insert(
                        criteria,
                        questionTableName,
                        function (err, questionResult) {
                          if (questionResult) {
                            responseObject["status"] = true;
                            responseObject["message"] =
                              "Question inserted Successfullly";
                            callback(null, responseObject);
                          } else {
                            errorResponseObj['error'] = err;
                            callback(err, errorResponseObj);
                          }
                        }
                      );
                    } else {
                      errorResponseObj['error'] = err;
                      callback(err, errorResponseObj);
                    }
                  }
                );
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  updateQuestion(req, callback) {
    var self = this;
    var s3 = self.app.s3;
    var reqObj = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
      message: "Question not able to update due to question request!",
    };

    //    Validating the Question Insert Request Object Before insert
    if (_.isEmpty(reqObj.curriculumCode) ||
      _.isEmpty(reqObj.subject) ||
      _.isEmpty(reqObj.topic) ||
      _.isEmpty(reqObj.chapter)) {
      callback(null, errorResponseObj);
      return;
    }

    //Validate Answers tag
    if (_.isEmpty(reqObj.answer1) ||
      _.isEmpty(reqObj.answer2) ||
      _.isEmpty(reqObj.answer3) ||
      _.isEmpty(reqObj.correctanswer)) {
      callback(null, errorResponseObj);
      return;
    }

    var questionTableName = "question";

    var updateData = {
      curriculum: reqObj.curriculum,
      curriculumCode: reqObj.curriculumCode,
      subject: reqObj.subject,
      topic: reqObj.topic,
      chapter: reqObj.chapter,
      question: reqObj.question,
      answer1: reqObj.answer1 || "",
      answer2: reqObj.answer2 || "",
      answer3: reqObj.answer3 || "",
      correctanswer: reqObj.correctanswer,
      questionType: reqObj.questionType,
      role: reqObj.role || "",
      updateDate: reqObj.updateDate || "",
      updatedBy: reqObj.updatedBy || "",
      questionmarks: reqObj.questionmarks
    };
    var query = {
      questionID: reqObj.questionID,
    };
    self.apiServiceInstance.findOne(
      query,
      questionTableName,
      function (err, questionData) {
        if (questionData) {
          self.apiServiceInstance.updateDocument(
            query,
            updateData,
            questionTableName,
            function (err, result) {
              if (result) {
                responseObject["status"] = true;
                responseObject["data"] = "Question updated successfully";
                callback(null, responseObject);
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  getQuestion(req, callback) {
    // console.log('conditionObject --', req)
    var self = this;
    var conditionObject = req.body.query;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      message: "Question not listed successfully",
    };
    var query = {},
      criteria = {};
    // if (conditionObject["role"] == "Admin") {
    if (conditionObject.questionID) {
      query["questionID"] = conditionObject.questionID;
      query["questionType"] = { $in: ["text", "multi"] };
      criteria['limit'] = 1;
    } else if (conditionObject.curriculumCode) {
      query = {
        curriculumCode: conditionObject.curriculumCode,
        subject: conditionObject.subject,
        topic: conditionObject.topic || "",
        chapter: conditionObject.chapter || "",
      };
    }
    // }
    criteria['condition'] = query;

    // var mylimit = parseInt(req.body.limit);
    // req.body.limit ? criteria['skip'] = mylimit : null
    var tableName = "question";
    self.apiServiceInstance.findDataAll(
      tableName,
      criteria,
      function (err, questionData) {
        // console.log('questionData', questionData);
        if (questionData.length) {
          responseObject["status"] = true;
          responseObject["data"] = questionData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  createTemplate(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      statuscode: 204,
      data: {},
      message: "Template not able to create",
    };
    var counterTableName = "counter";
    var condition = {
      condition: { _id: "template" },
      sortOrder: [["_id", "asc"]],
      updateData: { $inc: { seq: 1 } },
      newUp: { new: true, upsert: true },
    };

    self.apiServiceInstance.findAndModifyDocument(
      condition,
      counterTableName,
      function (err, result) {
        if (result) {
          var templateCount = result.value.seq;
          var criteria = {
            templateID: "TMP" + templateCount,
            templateName: reqObject.templateName,
            templateType: reqObject.templateType,
            curriculum: reqObject.curriculum,
            curriculumCode: reqObject.curriculumCode,
            subject: reqObject.subject,
          };
          var templateTablename = "template";
          self.apiServiceInstance.insert(
            criteria,
            templateTablename,
            function (err, templateResult) {
              if (templateResult) {
                var questions = reqObject.questions;
                var questionCriteria = {
                  templateID: "TMP" + templateCount,
                  questions: questions,
                };
                var templatequestionsTablename = "templatequestions";
                self.apiServiceInstance.insert(
                  questionCriteria,
                  templatequestionsTablename,
                  function (err, templatequestionsResult) {
                    if (templatequestionsResult) {
                      responseObject["status"] = true;
                      responseObject["message"] = "Template created successfully";
                      responseObject["templatedata"] = templateResult;
                      responseObject["templateQuestionsdata"] = templatequestionsResult;
                      callback(null, responseObject);
                    } else {
                      errorResponseObj['error'] = err;
                      callback(err, errorResponseObj);
                    }
                  }
                );
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  updateTemplate(req, callback) {
    var reqObject = req.body;
    var self = this;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
    };

    var templateQuery = {
      templateID: reqObject.templateID,
    };

    var templateCriteria = {
      condition: templateQuery,
    };

    var templateTable = "template";
    var templateQuestionsTable = "templatequestions";

    self.apiServiceInstance.findDataAll(
      templateTable,
      templateCriteria,
      function (err, data) {
        if (data.length) {
          var updateData = {
            templateName: reqObject.templateName,
            curriculum: reqObject.curriculum || "",
            curriculumCode: reqObject.curriculumCode || "",
            subject: reqObject.subject || "",
            templateType: reqObject.templateType || "",
            templateID: reqObject.templateID || "",
            updateDate: reqObject.updateDate || "",
            updatedBy: reqObject.updatedBy || "",
          };
          var query = { templateID: reqObject.templateID };
          self.apiServiceInstance.updateDocument(
            query,
            updateData,
            templateTable,
            function (err, templateResult) {
              if (templateResult) {
                var questionsUpdateData = {
                  templateID: reqObject.templateID,
                  questions: reqObject.questions,
                };

                self.apiServiceInstance.updateDocument(
                  query,
                  questionsUpdateData,
                  templateQuestionsTable,
                  function (err, result) {
                    if (result) {
                      responseObject["status"] = true;
                      responseObject["data"] = "Template is updated successfully";
                      callback(null, responseObject);
                    } else {
                      errorResponseObj['error'] = err;
                      callback(null, errorResponseObj);
                    }
                  }
                );
              } else {
                errorResponseObj['error'] = err;
                callback(null, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(null, errorResponseObj);
        }
      }
    );
  }
  getTemplateList(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
      message: "Templates not able to list!",
    };
    var templateIDs = [];
    var template = [];
    var uniqTemplate = [];
    var finalTemplate = [];
    var query = {};
    if (reqObject.curriculumCode)
      query = {
        curriculumCode: reqObject.curriculumCode,
        subject: reqObject.subject,
      };
    var templateName = reqObject.templateName;
    if (templateName) {
      query["templateName"] = { $regex: templateName, $options: "i" };
    }
    // if (reqObject.param == 'TestsetUP') {
    //     query['templateType']='public';
    // }
    var criteria = {
      condition: query,
    };
    var tableName = "template";
    self.apiServiceInstance.findDataAll(
      tableName,
      criteria,
      function (err, templateData) {
        if (templateData.length) {
          for (var i = 0; i < templateData.length; i++) {
            templateIDs.push(templateData[i].templateID);
          }
          async.forEachSeries(
            templateIDs,
            function (singleObj, forEachCbk) {
              var query1 = {
                templateID: singleObj,
              };
              var criteria1 = {
                condition: query1,
                projection: {
                  questions: 1,
                },
              };
              var tableName = "templatequestions";
              self.apiServiceInstance.findDataAll(
                tableName,
                criteria1,
                function (err, result) {
                  if (result.length > 0) {
                    var questions = result[0].questions;
                    var questionQuery = {
                      questionID: { $in: questions },
                    };
                    var questionCriteria = {
                      condition: questionQuery,
                    };
                    var questionTableName = "question";
                    self.apiServiceInstance.findDataAll(
                      questionTableName,
                      questionCriteria,
                      function (err, questionResult) {
                        if (questionResult.length > 0) {
                          template.push(singleObj);
                        }
                        var templateQuery = {
                          templateID: { $in: template },
                        };
                        var templateCriteria = {
                          condition: templateQuery,
                        };
                        var tableName = "template";

                        self.apiServiceInstance.findDataAll(
                          tableName,
                          templateCriteria,
                          function (err, templateResult) {
                            if (templateResult.length > 0) {
                              uniqTemplate = _.uniq(templateResult);
                              finalTemplate = [];
                              finalTemplate.push(uniqTemplate);
                            }
                            forEachCbk(null, singleObj);
                          }
                        );
                      }
                    );
                  } else {
                    errorResponseObj['error'] = err;
                    callback(err, errorResponseObj);
                  }
                }
              );
            },
            function (result1) {
              responseObject["status"] = true;
              responseObject["data"] = _.flatten(finalTemplate);
              callback(null, responseObject);
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  getTemplateQuestions(req, callback) {
    var reqObject = req.body;
    var self = this;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var query = {
      templateID: reqObject.templateID,
    };
    var criteria = {
      condition: query,
    };
    var finalQuestionArray = [];
    var templateTablename = "template";
    var tableName = "templatequestions";
    self.apiServiceInstance.findDataAll(
      templateTablename,
      criteria,
      function (err, templateResult) {
        if (templateResult.length) {
          self.apiServiceInstance.findDataAll(
            tableName,
            criteria,
            function (err, templateQuestionData) {
              if (templateQuestionData) {
                var questions = templateQuestionData[0].questions;
                async.forEachSeries(
                  questions,
                  function (singleObj, forEachCbk) {
                    var tableName = "question";
                    var questionCriteria = {
                      questionID: singleObj,
                    };
                    self.apiServiceInstance.findOne(
                      questionCriteria,
                      tableName,
                      function (err, testFindResult) {
                        if (testFindResult) {
                          finalQuestionArray.push(testFindResult);
                          forEachCbk(null, singleObj);
                        } else {
                          forEachCbk(null, singleObj);
                        }
                      }
                    );
                  },
                  function (result1) {
                    responseObject["status"] = true;
                    responseObject["count"] = finalQuestionArray.length;
                    responseObject["totalData"] = finalQuestionArray;
                    responseObject["templateData"] = templateResult;
                    callback(null, responseObject);
                  }
                );
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  createAssessment(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
      message: "Not able to create a Assessment due to request body issue.",
    };
    var counterTableName = "counter";
    var condition = {
      condition: { _id: "test" },
      sortOrder: [["_id", "asc"]],
      updateData: { $inc: { seq: 1 } },
      newUp: { new: true, upsert: true },
    };

    self.apiServiceInstance.findAndModifyDocument(
      condition,
      counterTableName,
      function (err, result) {
        if (result) {

          var testCount = result.value.seq
          var testTablename = "test";
          var criteria = {
            testID: "TP" + testCount,
            type: reqObject.type,
            curriculum: reqObject.curriculum,
            curriculumCode: reqObject.curriculumCode,
            subject: reqObject.subject,
            assessmentName: reqObject.assessmentName,
            maxQuestions: reqObject.maxQuestions,
            maxWeightage: reqObject.maxWeightage,
            startdate: reqObject.startdate,
            enddate: reqObject.enddate,
            labSession: reqObject.labSession,
            status: 0,
            correctionMode: reqObject.correctionMode,
            createdBy: reqObject.createdBy ? reqObject.createdBy : "UID00001",
            createDate: reqObject.createDate ? reqObject.createDate : new Date().getTime()
          };
          self.apiServiceInstance.insert(
            criteria,
            testTablename,
            function (err, testResult) {
              if (testResult) {
                var question_ids = reqObject.question_ids;
                var criteria2 = {
                  testID: "TP" + testCount,
                  questions: question_ids,
                };
                var testquestionTablename = "testquestion";
                self.apiServiceInstance.insert(
                  criteria2,
                  testquestionTablename,
                  function (err, testquestionResult) {
                    if (testquestionResult) {
                      responseObject["status"] = true;
                      responseObject["testdata"] = testResult;
                      responseObject["testQuestiondata"] = testquestionResult;
                      callback(null, responseObject);
                    } else {
                      errorResponseObj['error'] = err;
                      callback(err, errorResponseObj);
                    }
                  }
                );
              } else {
                errorResponseObj['error'] = err;
                callback(errr, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  getAssessmentsList(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      data: {},
    };

    var curriculum = reqObject.curriculumCode;
    var subject = reqObject.subject;
    var query = {};

    if (curriculum && subject) {
      query = {
        curriculum: curriculum || "",
        subject: subject || "",
      };
    }

    var assessmentName = reqObject.assessmentName;
    if (assessmentName) {
      query["assessmentName"] = { $regex: assessmentName, $options: "i" };
    }

    var criteria = {
      condition: query,
    };
    var tableName = "test";
    self.apiServiceInstance.findDataAll(
      tableName,
      criteria,
      function (err, templateData) {
        if (templateData.length) {
          responseObject["status"] = true;
          responseObject["data"] = templateData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(null, errorResponseObj);
        }
      }
    );
  }
  deleteAssessment(req, callback) {
    var self = this;
    var responseObject = {};
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
    };
    var condition = {
      testID: reqObject.testID,
    };
    var templateTablename = "test";
    var templateQuestionTablename = "testquestion";

    self.apiServiceInstance.removeDocument(
      templateQuestionTablename,
      condition,
      function (err, data) {
        if (data) {
          self.apiServiceInstance.removeDocument(
            templateTablename,
            condition,
            function (err, templateData) {
              if (templateData) {
                responseObject["status"] = true;
                responseObject["data"] = " Assessment deleted Successfully";
                callback(null, responseObject);
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  // createrole
  createRole(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      message: "Not able to create new role"
    };
    var responseObject = {};
    var roleTableName = "role";

    self.apiServiceInstance.findDataAll(roleTableName, {}, function (err, rolesData) {
      let array = Array()
      rolesData.forEach(singleRole => {
        let roleFromList = singleRole.roleName ? singleRole.roleName : singleRole.role
        if ((roleFromList).toLowerCase() === (reqObj.roleName).toLowerCase()) {
          array.push("existed")
        }
      })
      if (array.length === 0) {
        reqObj['roleName'] = reqObj['roleName'] ? (reqObj['roleName']).toLowerCase() : reqObj['roleName']
        self.apiServiceInstance.insert(reqObj, roleTableName, function (err, roleData) {
          if (roleData) {
            responseObject["status"] = true;
            responseObject["data"] = roleData;
            callback(null, responseObject);
          } else {
            errorResponseObj['error'] = err;
            callback(err, errorResponseObj);
          }
        })
      }
      else {
        errorResponseObj['message'] = 'This role is already existed!';
        callback(err, errorResponseObj);
      }
    })
  }
  // createStaff
  createStaff(req, callback) {
    var self = this;
    var reqObj = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
      message: "not able to create the staff.",
    };
    var responseObject = {};
    var userTableName = "users";
    var counterTableName = "counter";
    var criteria = {
      condition: { _id: "user" },
      sortOrder: [["_id", "asc"]],
      updateData: { $inc: { seq: 1 } },
      newUp: { new: true, upsert: true },
    };

    self.apiServiceInstance.findAndModifyDocument(
      criteria,
      counterTableName,
      function (err, result) {
        if (result) {
          var userCount = result.value.seq;
          reqObj["userID"] = userCount;
          reqObj["password"] = reqObj.password ? reqObj.password : generator.generate({
            length: 10,
            numbers: true
          });
          self.apiServiceInstance.insert(
            reqObj,
            userTableName,
            function (err, staffResults) {
              if (staffResults) {
                responseObject["status"] = true;
                responseObject["data"] = staffResults;
                responseObject["message"] = "Staff created successfully!";
                callback(null, responseObject);
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        }
      }
    );
  }
  getStaffList(req, callback) {
    var self = this;
    var conditionObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      statuscode: 204,
      data: {},
      message: "not able to list the staff!",
    };

    var query = {};
    if (!!conditionObject) {
      query = conditionObject;
    }
    var criteria = {
      condition: query,
    };
    var tableName = "users";
    self.apiServiceInstance.findDataAll(
      tableName,
      criteria,
      function (err, staffData) {
        if (staffData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = staffData;
          responseObject["message"] = "Staff listed successfully";
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(null, errorResponseObj);
        }
      }
    );
  }
  getRolesList(req, callback) {
    var self = this;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      statuscode: 204,
      data: {},
      message: "not able to list the roles!",
    };

    var query = {};
    var criteria = {
      condition: query,
    };
    var tableName = "role";
    self.apiServiceInstance.findDataAll(
      tableName,
      criteria,
      function (err, rolesList) {
        if (rolesList.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = rolesList;
          responseObject["message"] = "Roles listed successfully";
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  updateStaff(req, callback) {
    var reqObject = req.body;
    var self = this;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      message: "not able to update staff data",
    },
      query = {};

    if (!!reqObject.userID) {
      query['userID'] = reqObject.userID;
    }
    if (!!reqObject.email) {
      query['email'] = reqObject.email;
    }
    var criteria = {
      condition: query,
    };
    var table = "users";
    self.apiServiceInstance.findDataAll(table, criteria, function (err, data) {
      if (data) {
        var updateData = reqObject;
        // var query = { userID: reqObject.userID };
        delete updateData['email'];
        delete updateData['userID'];
        self.apiServiceInstance.updateDocument(
          query,
          updateData,
          table,
          function (err, updateUser) {
            if (updateUser) {
              responseObject["status"] = true;
              responseObject["message"] = "User is updated successfully";
              callback(null, responseObject);
            } else {
              errorResponseObj['error'] = err;
              callback(err, errorResponseObj);
            }
          }
        );
      } else {
        errorResponseObj['error'] = err;
        callback(err, errorResponseObj);
      }
    });
  }
  /* Querises Module API-actions start*/
  /*
      status-0: query raised
      status-1: query not resolved yet
      status-2: query resolved
  */
  getAllQueries(req, callback) {
    var self = this;
    var reqObj = req.body;

    var errorResponseObj = {
      status: false,
      data: {},
      message: "not able to list the queries data",
    };
    var responseObject = {},
      queryTable = "query";

    var criteria = {
      condition: {
        sender_id: reqObj.userID,
        curriculumCode: reqObj.curriculumCode,
        status: reqObj.status ? reqObj.status : { $in: [0, 1, 2] },
      }
    };
    if (reqObj["limit"]) {
      criteria["limit"] = reqObj["limit"];
    }
    self.apiServiceInstance.findDataAll(
      queryTable,
      criteria,
      function (err, queriesData) {
        if (queriesData) {
          responseObject["status"] = true;
          responseObject["data"] = queriesData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  queryInsert(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
      message: "not able to insert query data",
    };
    var responseObject = {},
      queryTable = "query",
      counterTableName = "counter",
      criteria = {
        condition: { _id: "query" },
        sortOrder: [["_id", "asc"]],
        updateData: { $inc: { seq: 1 } },
        newUp: { new: true, upsert: true },
      };

    self.apiServiceInstance.findAndModifyDocument(
      criteria,
      counterTableName,
      function (err, result) {
        if (result) {
          reqObject["chatID"] = result.value.seq;
          reqObject["status"] = 0;
          self.apiServiceInstance.insert(
            reqObject,
            queryTable,
            function (err, data) {
              if (data.insertedCount > 0) {
                responseObject["status"] = true;
                responseObject["message"] = "Query inserted!";
                callback(null, responseObject);
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObj);
              }
            }
          );
        } else {
          console.log("Error at query insert counter table", err);
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  queryUpdate(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
      message: "not able to update query data",
    };
    var responseObject = {},
      queryTable = "query";

    var condition = {
      chatID: reqObject.chatID,
    };
    self.apiServiceInstance.updateDocument(
      condition,
      reqObject,
      queryTable,
      function (err, queryResults) {
        if (queryResults) {
          responseObject["status"] = true;
          responseObject["message"] = "Query updated successfully";
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  /* Querises Module API-actions end*/
  /*  Help Tutor Module actions start */
  /**
   *
   * @status {0 - PENDING} student (or) Admin created the session. record will be based on role can differntiate
   * @status {1 - ACCEPTED} 'for the ' requested session teacher acceted and teacher details will be save in acceptedTeacher
   * @status {2 - COMPLETED} session is completed
   *
   */
  getAllSessions(req, callback) {
    var self = this;
    var reqObj = req.body;

    var errorResponseObj = {
      status: false,
      message: "not able to list the sessions data",
    };
    var responseObject = {},
      queryTable = "session";

    var criteria = {},
      query = {};
    let condition = {};

    // condition=all defines: if anyone raise the session those also need to list 
    //     for the rest of curriculum users       
    // $or: [ { 'requestedTeacher.email':reqObj.email, status: 'PENDING' },
    if (reqObj['role'] === 'teacher' || reqObj['role'] === 'TEACHER') {
      condition = {
        $or: [{ 'requestedTeacher.email': reqObj.email },
        { 'acceptedTeacher.email': reqObj.email, status: 'ACCEPTED' }],
        'rejectedTeacher.email': { $nin: [reqObj.email] }
      },
        criteria['condition'] = condition;

    }

    if (reqObj['role'] === 'student' || reqObj['role'] === 'STUDENT') {
      if (reqObj['condition'] === 'all') {
        condition['curriculumCode'] = reqObj.curriculumCode;
      } else {
        condition = {
          // createdBy : reqObj.userID,
          curriculumCode: reqObj.curriculumCode,
          studentEmails: { $in: [reqObj.email] },
          status: { $in: ['ACCEPTED', 'PENDING'] }
        };
        criteria['condition'] = condition;
      }
    }

    if (reqObj["limit"]) {
      criteria["limit"] = reqObj["limit"];
    }
    // console.log('criteria ----', JSON.stringify(criteria));
    self.apiServiceInstance.findDataAll(
      queryTable,
      criteria,
      function (err, sessionsData) {
        if (sessionsData) {
          responseObject["status"] = true;
          responseObject["message"] = "Sessions are listed";
          responseObject["data"] = sessionsData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  syncStudents(studentEmails) {
    var self = this;
    studentEmails.forEach(item => {
      let criteria = {
        query: {
          'email': item,
          'role': { $in: ["student", "STUDENT"] }
        },
        upsert: true
      };
      console.log('criteria---', criteria);
      const tableName = "users";
      self.apiServiceInstance.find(criteria, {}, tableName, function (err, doc) {
        if (err) {
          console.log("Not sync student:", item);
          console.log(err);
        }
        console.log("sync:", item);
      });
    });
  }
  sessionInsert(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      message: "not able to insert session data",
    };

    var responseObject = {},
      sessionTable = "session",
      counterTableName = "counter",
      criteria = {
        condition: { _id: "session" },
        sortOrder: [["_id", "asc"]],
        updateData: { $inc: { seq: 1 } },
        newUp: { new: true, upsert: true },
      };

    self.apiServiceInstance.findAndModifyDocument(
      criteria,
      counterTableName,
      async function (err, result) {
        if (result) {
          reqObject["sessionID"] = result.value.seq;
          reqObject["status"] = "PENDING";

          let query = {
            'curriculumCode': reqObject.curriculumCode,
            'role': "student"
          },
            projection = { curriculumCode: 1, userID: 1, email: 1, mobile: 1 };
          const tableName = "users";
          self.apiServiceInstance.find(query, projection, tableName, function (err, doc) {
            if (err) {
              console.log(err);
            } else {
              reqObject['student'] = doc;
              reqObject['studentEmails'] = _.pluck(doc, "email");
              self.apiServiceInstance.insert(reqObject, sessionTable, function (err, data) {
                if (data.insertedCount > 0) {
                  //1 sync students
                  // self.syncStudents(reqObject.student.studentEmails)
                  //2 send email invite to teachers
                  let teacherEmails = [];
                  let name = "all";

                  const teachers = reqObject.requestedTeacher;

                  teachers.forEach((teacher) => {
                    //check user is belong user from ms
                    teacherEmails.push(teacher.email);
                  });

                  if (teachers.length === 1) {
                    name = teachers[0].firstName;
                  }
                  const subject = "TEACHER EMAIL INVITATION";

                  let body = "  <!DOCTYPE html>\n" +
                    "  <html>\n" +
                    "  <head>\n" +
                    "  <title>Page Title</title>\n" +
                    "  </head>\n" +
                    "  <body>\n" +
                    "\n" +
                    "  <p>Dear {{NAME}},</p>\n" +
                    "  <p>You have invited to this session: <b>{{TITLE}}</b></p>\n" +
                    "  <p>\n" +
                    "      Time:<br />\n" +
                    "   - Date: {{DATE}}<br/>\n" +
                    "   - Time: {{TIME}}\n" +
                    "\n" +
                    "   </p>\n" +
                    "   <p>Please click to this link <a href='{{LINK}}'>link</a> to accept!\n" +
                    "\n" +
                    "  </body>\n" +
                    "  </html>\n";
                  body = body.replace("{{NAME}}", name);
                  body = body.replace("{{TITLE}}", reqObject.title);
                  body = body.replace("{{LINK}}", process.env.FE_HOST + "/calendars?ses_id=" + reqObject._id.toString());
                  body = body.replace("{{DATE}}", moment(reqObject.start).format("DD/MM/YYYY"));
                  body = body.replace("{{TIME}}", moment(reqObject.start).format("HH:mm") + "(UTC) - " + moment(reqObject.end).format("HH:mm") + "(UTC)");

                  if (teacherEmails.length) {
                    sendSessionInvite(teacherEmails, subject, body);
                  }
                  responseObject["statusCode"] = 201;
                  responseObject["status"] = true;
                  responseObject["message"] = "Session inserted!";
                  callback(null, responseObject);
                } else {
                  console.log('error in insert query');
                  callback(err, errorResponseObj);
                }
              }
              );
            }
          });
        } else {
          console.log("Error at session insert counter table", err);
          callback(err, errorResponseObj);
        }
      }
    );
  }
  sessionUpdate(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      message: "not able to update session data",
    };
    var responseObject = {},
      sessionTable = "session";

    var condition = {
      sessionID: reqObject.sessionID,
    };

    // sync the teacher
    // syncTeachers and update the ID in teachers collection and pass the id for create the link
    if ((reqObject.role === 'teacher' || reqObject.role === 'TEACHER') && (reqObject.status === 'ACCEPTED')) {
      self.apiSessionInstance.msSyncTeacher(reqObject, function (err, teacherResult) {
        if (teacherResult.data) {
          let request = {
            body: {
              'email': reqObject.email,
              'id': teacherResult.data.id
            }
          };
          self.updateStaff(request, function (err, data) {
            if (data.status) {
              delete reqObject['email'];
              delete reqObject['id'];
              self.apiServiceInstance.updateDocument(
                condition,
                reqObject,
                sessionTable,
                function (err, queryResults) {
                  if (queryResults) {
                    self.getSessionByID(req, function (err, result) {
                      if (result.data.length) {
                        self.apiSessionInstance.createEventUrl(request.body.id, result.data[0], function (err, result) {
                          if (result) {
                            responseObject['status'] = true;
                            responseObject['message'] = "Session link created";
                            callback(null, responseObject);
                          } else {
                            console.log(" Link not generated and updated for this session");
                            errorResponseObj['error'] = err;
                            callback(err, errorResponseObj);
                          }
                        });
                      }
                      else {
                        console.log('event not listed from session collection');
                        errorResponseObj['error'] = err;
                        callback(err, errorResponseObj);
                      }
                    });
                  } else {
                    console.log('sesison data not updated properly ');
                    errorResponseObj['error'] = err;
                    callback(err, errorResponseObj);
                  }
                });
            }
            else {
              console.log('ms sync teacher id not updated in users collection for teacher');
              errorResponseObj['error'] = err;
              callback(err, errorResponseObj);
            }
          });
        }
        else {
          console.log('Teacher is not available in under the organization');
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      });
    }
    else if (reqObject.role === 'teacher' && reqObject.status === 'REJECTED') {
      delete reqObject['email'];
      delete reqObject['id'];
      self.apiServiceInstance.updateDocument(
        condition,
        reqObject,
        sessionTable,
        function (err, result) {
          if (result) {
            responseObject['status'] = true;
            responseObject['message'] = "Session Updated successfully";
            callback(null, responseObject);
          } else {
            console.log("Not able to update the session");
            errorResponseObj['error'] = err;
            callback(err, errorResponseObj);
          }
        }
      );
    }
    else {
      console.log('This teacher does not have permission to update session');
      callback(null, errorResponseObj);
    }
  }
  getSessionByID(req, callback) {
    var self = this;
    var reqObj = req.body;

    var errorResponseObj = {
      status: false,
      message: "Session is not existed ",
    };
    var responseObject = {},
      queryTable = "session";

    var criteria = {},
      query = {};

    const condition = reqObj['condition'] ? reqObj['condition'] : '';

    if (condition === 'all') {
      query = {
        curriculumCode: reqObj.curriculumCode,
        sessionID: reqObj.sessionID,
      };
    } else {
      query = {
        // sender_id: reqObj.userID,
        curriculumCode: reqObj.curriculumCode,
        sessionID: reqObj.sessionID,
      };
    }
    criteria['condition'] = query;
    self.apiServiceInstance.findDataAll(
      queryTable,
      criteria,
      function (err, sessionsData) {
        if (sessionsData) {
          responseObject["status"] = true;
          responseObject["message"] = "Session listed successfully";
          responseObject["data"] = sessionsData;
          callback(null, responseObject);
        } else {
          console.log("Error at session list by sessionID", err);
          callback(err, errorResponseObj);
        }
      }
    );
  }
  /*  Help Tutor Module routes end*/
  // getAssessments
  getAssignments(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
      message: "not able to query test data",
    };
    var responseObject = {},
      testTable = "test";

    var date = new Date();
    var currentDate = moment(date).format();

    let criteria = {},
      condition = {};

    if (reqObject['condition'] === 'all') {
      condition = {
        curriculumCode: reqObject.curriculumCode
      };
    } else {
      condition = {
        curriculumCode: reqObject.curriculumCode,
        startdate: { $lte: currentDate },
        enddate: { $gte: currentDate }
      };
    }
    if (reqObject["limit"]) {
      criteria["limit"] = reqObject["limit"];
    }

    if (reqObject["labSession"]) {
      condition["labSession"] = reqObject.labSession;
    }
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
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  getAssignmentByID(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      message: "not able to query test data",
    };
    var responseObject = {},
      testTable = "test";

    var date = new Date();
    var currentDate = moment(date).format();

    var criteria = {},
      condition = {
        curriculumCode: reqObject.curriculumCode,
        testID: reqObject.testID,
        // startdate: { $lte: currentDate },
        // enddate: { $gte: currentDate },
      };

    if (reqObject["labSession"]) {
      condition["labSession"] = reqObject.labSession;
    }
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
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }
  /* Based on subject get the subject Info, credits, start and end dates of subject*/
  getSubjectinfo(req, callback) {
    var self = this;
    var reqObject = req.body;
    var errorResponseObj = {
      status: false,
      data: {},
      message: "not able to query test data",
    };
    var responseObject = {},
      courseTable = "subject";

    var criteria = {},
      condition = {
        curriculumCode: reqObject.curriculumCode,
        subject: reqObject.subject
      };

    criteria["condition"] = condition;

    self.apiServiceInstance.findDataAll(
      courseTable,
      criteria,
      function (err, queryResults) {
        if (queryResults) {
          responseObject["status"] = true;
          responseObject["data"] = queryResults;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(err, errorResponseObj);
        }
      }
    );
  }

  getTestQuesList(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      message: 'Not able to fetch test questions'
    };

    var testTableName = "test";
    var testQuesTableName = "testquestion";

    var query = {
      testID: reqObject.testID
    };

    var criteria = {
      condition: query
    };

    self.apiServiceInstance.findDataAll(testTableName, criteria, function (error, testResult) {
      if (testResult.length > 0) {
        self.apiServiceInstance.findOne(query, testQuesTableName, function (error, testQuesResult) {
          if (testQuesResult) {
            var testQuestions = testQuesResult.questions;
            var query = {};
            query['$or'] = [];
            for (var i = 0; i < testQuestions.length; i++) {
              query['$or'].push({ questionID: testQuestions[i].questionID });
            }
            var quesTableName = "question";
            self.apiServiceInstance.find(query, {}, quesTableName, function (error, quesResult) {
              if (quesResult) {
                responseObject['status'] = true;
                responseObject['data'] = quesResult;
                callback(null, responseObject);
              } else {
                errorResponseObj['error'] = error;
                callback(error, errorResponseObj);
              }
            })
          } else {
            errorResponseObj['error'] = error;
            callback(error, errorResponseObj);
          }
        })
      } else {
        errorResponseObj['error'] = error;
        callback(error, errorResponseObj);
      }
    })
  }

  testSubmit(req, callback) {
    var self = this;
    var s3 = self.app.s3;
    var reqObject = req.body;
    var responseObject = {};
    // var files = [];
    // var k = 0;
    // console.log('reqObject ----', reqObject)
    var userDetail = reqObject.globalInfo;
    var transactionData = reqObject.transaction;
    var errorResponseObject = {
      status: false,
      message: 'Not able to insert the assessment data'
    };
    var userQuery = {
      userID: userDetail.userID
    };
    var userCriteria = {
      condition: userQuery
    };
    var userTableName = 'users';
    self.apiServiceInstance.findDataAll(userTableName, userCriteria, function (err, userResult) {
      if (userResult.length) {
        var query = {
          testID: userDetail.testID
        };
        var criteria = {
          condition: query
        };

        var testTableName = 'test';
        var testquestionTableName = 'testquestion';
        self.apiServiceInstance.findDataAll(testTableName, criteria, function (err, testResult) {
          if (testResult.length) {
            self.apiServiceInstance.findOne(query, testquestionTableName, function (err, testQuestionResult) {
              if (testQuestionResult) {
                async.forEachSeries(transactionData, function (singleTransaction, forEachCbk) {
                  singleTransaction['testID'] = userDetail.testID;
                  singleTransaction['curriculumCode'] = userDetail.curriculumCode;
                  singleTransaction['subject'] = userDetail.subject;
                  singleTransaction['responsedate'] = singleTransaction.responsedate;
                  singleTransaction['response'] = singleTransaction.response;
                  singleTransaction['valid'] = singleTransaction.valid;
                  singleTransaction['userID'] = userDetail.userID;
                  singleTransaction['questionID'] = singleTransaction.questionID;
                  singleTransaction['correctionMode'] = testResult[0].correctionMode;
                  var questionquery = {
                    questionID: singleTransaction.questionID
                  };
                  var questionCriteria = {
                    condition: questionquery
                  };
                  var questionTableName = 'question';
                  self.apiServiceInstance.findDataAll(questionTableName, questionCriteria, function (err, questionresult) {
                    if (questionresult.length > 0) {
                      singleTransaction['curriculum'] = questionresult[0].curriculum,
                        singleTransaction['topic'] = questionresult[0].topic,
                        singleTransaction['chapter'] = questionresult[0].chapter,
                        singleTransaction['question'] = questionresult[0].question,
                        singleTransaction['answer1'] = questionresult[0].answer1,
                        singleTransaction['answer2'] = questionresult[0].answer2,
                        singleTransaction['answer3'] = questionresult[0].answer3,
                        singleTransaction['correctanswer'] = questionresult[0].correctanswer,
                        singleTransaction['questionType'] = questionresult[0].questionType,
                        singleTransaction['createdBy'] = questionresult[0].createdBy,
                        singleTransaction['questionmarks'] = questionresult[0].questionmarks
                    }
                    if ((singleTransaction['questionType'] === 'multi' || singleTransaction['questionType'] === 'Multi')) {
                      if (singleTransaction['valid'] === true) {
                        singleTransaction['acheivedMarks'] = questionresult[0].questionmarks
                      }
                      else if (singleTransaction['valid'] === false) {
                        singleTransaction['acheivedMarks'] = 0
                      }
                    }
                    else {
                      singleTransaction['acheivedMarks'] = null
                    }
                    let insertTable = ''
                    if (testResult[0].correctionMode === 'manual' || testResult[0].correctionMode === "Manual") {
                      insertTable = "pending";
                    }
                    else {
                      insertTable = "transaction";
                    }

                    self.apiServiceInstance.insert(singleTransaction, insertTable, function (err, result) {
                      if (result) {
                        // let condition = {testID : userDetail.testID}
                        // let updateDocument = {status: 1}
                        // self.apiServiceInstance.updateDocument(condition, updateDocument, testTableName, function (err, response) {
                        //   if(response) {
                        forEachCbk(null, singleTransaction);
                        //   }
                        // })
                      }
                    });
                  });
                }, function (result1) {
                  /**
                   * status= 0 - test not completed even single student.
                   * status = 1 - means student completed the test.
                   */
                  let condition = { testID: userDetail.testID }
                  let updateDocument = { status: 1 }
                  self.apiServiceInstance.updateDocument(condition, updateDocument, "test", function (err, response) {
                    if (response) {
                      if (testResult[0].correctionMode === 'manual' || testResult[0].correctionMode === "Manual") {
                        responseObject['status'] = true;
                        responseObject['data'] = "Assignment completed successfully";
                        callback(null, responseObject)
                      }
                      else {
                        self.resultSave(reqObject.result, function (err, result) {
                          if (result.status) {
                            responseObject['status'] = true;
                            responseObject['data'] = "Assignment results stored successfully";
                            callback(null, responseObject)
                          }
                          else {
                            console.log('Insert problem for result', err);
                            errorResponseObj['error'] = err;
                            callback(err, errorResponseObject)
                          }
                        })
                      }
                    }
                    else {
                      console.log('Test status not updated properly', err);
                      errorResponseObj['error'] = err;
                      callback(err, errorResponseObject)
                    }
                    // callback(null, true)
                  });
                });
              } else {
                errorResponseObj['error'] = err;
                callback(err, errorResponseObject)
              }
            });
          } else {
            errorResponseObj['error'] = err;
            callback(err, errorResponseObject)
          }
        });
      } else {
        errorResponseObj['error'] = err;
        callback(err, errorResponseObject)
      }
    });
  }

  resultSave(req, callback) {
    var self = this;
    var responseObject = {};
    var errorResponseObject = {
      status: false,
      data: {}
    };

    var resultTableName = 'result';
    var insertData = req;
    self.apiServiceInstance.insert(insertData, resultTableName, function (err, resultData) {
      if (resultData) {
        responseObject['status'] = true;
        responseObject['data'] = "Data Inserted Successfully";
        callback(null, responseObject)
      } else {
        console.log('Inserting results data has a problem', err);
        errorResponseObj['error'] = err;
        callback(err, errorResponseObject)
      }
    });
  }

  getResult(req, callback) {
    var self = this;
    var reqObject = req.body;
    var responseObject = {};
    var errorResponseObject = {
      status: false,
      data: {}
    };
    var condition = {
      userID: reqObject.userID,
      testID: reqObject.testID
    };

    let resultTableName = 'result'
    self.apiServiceInstance.find(
      condition,
      {},
      resultTableName,
      function (err, result) {
        if (result.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = result;
          callback(null, responseObject);
        } else {
          console.log('Fetching result data has a problem', err);
          errorResponseObject['error'] = err;
          callback(err, errorResponseObject);
        }
      }
    );
  }

  getStudentById(req, callback) {
    var self = this;
    let { studentId, roleName } = req.params;
    var responseObject = {};
    var errorResponseObj = {
      status: false,
      message: "not able to list the staff!",
    };

    var query = {};
    if (!!studentId) {
      let role = roleName.toLowerCase()
      query = { "userID": +studentId, "role": role };
    }
    var criteria = {
      condition: query,
      projection: {
        _id: 0,
        password: 0
      },
    };
    var tableName = "users";
    self.apiServiceInstance.findDataAll(
      tableName,
      criteria,
      function (err, staffData) {
        if (staffData.length > 0) {
          responseObject["status"] = true;
          responseObject["data"] = staffData;
          callback(null, responseObject);
        } else {
          errorResponseObj['error'] = err;
          callback(null, errorResponseObj);
        }
      }
    );
  }

}

module.exports = ApiActions;
















































