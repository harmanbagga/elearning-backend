var Action = require('../models/api-actions.js');
var subjectAction = require('../models/api-subjects.js');
var videoAction = require('../models/api-videos.js');
var Session = require('../models/api-session.js');
var Teacher = require('../models/api-teacher.js')
const { verifyToken } = require('../auth/VerifyToken.js')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const config = (fs.readFileSync('config.json')).toString()

var UIRoutes = function (app) {
    this.app = app;
    this.actionInstance = new Action(app);
    this.subjectAction = new subjectAction(app);
    this.videoAction = new videoAction(app);
    this.sessionInstance = new Session(app);
    this.teacherInstance = new Teacher(app)
};
module.exports = UIRoutes;


UIRoutes.prototype.init = function () {
    var self = this;
    var app = this.app;

    // register API 
    app.post('/register', function (req, res, next) {
        console.log("register API routes", new Date());
        self.actionInstance.register(req, function (err, loginResult) {
            if (err) return res.status(500).send('Not able to create the user ')
            res.json(loginResult);
        })
    });
    //GoogleLogin

    app.post('/googleLogin',function (req, res,next){
        console.log("register API routes", new Date())
        self.actionInstance.googleLog(req, function (err, loginResult){
            if (err) return res.status(500).send('Not able to google login')
            res.json(loginResult);
        })
    })

    //new users

    app.get('/getInactiveUser', verifyToken, function (req, res, next) {
        console.log("register API routes", new Date())
        self.actionInstance.getInactiveId(req, function (err, loginResult) {
            if (err) return res.status(500).send('Not able to google login')
            res.json(loginResult);
        })
    })


    // Single login
    app.post('/login', function (req, res) {
        console.log("login API routes", new Date());
        self.actionInstance.login(req, function (err, loginResult) {
            res.json(loginResult);
        })
    });

    // Get Question count list with Question Data in Library Module

    // app.post('/getQuestionCount', function (req, res) {
    //     console.log("ENTER INTO QUESTION COUNT");
    //     self.actionInstance.getQuestionCount(req, function (err, result) {
    //         res.json(result)
    //     });
    // });

    //Get the question
    app.post('/getQuestion', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO  GET QUESTION ");
        self.actionInstance.getQuestion(req, function (err, result) {
            res.json(result);
        });
    });

    // app.post('/getAssessmentQuestion', function (req, res) {
    //     console.log(new Date(), "ENTER INTO  GET ASSESSMENT QUESTION ");
    //     self.actionInstance.getAssessmentQuestion(req, function (err, result) {
    //         res.json(result);
    //     });
    // });

    app.post('/createAssessment', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO CREATE ASSESSMENT ");
        self.actionInstance.createAssessment(req, function (err, result) {
            res.json(result);
        });
    });


    // get the tests details for Agenda Page.
    // app.post('/getTestsList', function (req, res) {
    //     console.log(new Date(), "ENTER INTO GET TESTS LIST ");
    //     self.actionInstance.getTestsList(req, function (err, result) {
    //         res.json(result);
    //     });
    // });

    // get the tests questions in Agenda Page.
    app.post('/getTestQuesList', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO GET TEST QUESTIONS LIST ");
        self.actionInstance.getTestQuesList(req, function (err, result) {
            res.json(result);
        });
    });

    // app.post('/addNewUser', function (req, res) {
    //     console.log(new Date(), "ENTER INTO ADD NEW USER ");
    //     self.actionInstance.addNewUser(req, function (err, result) {
    //         res.json(result);
    //     });
    // });

    // app.post('/updateUserDetails', function (req, res) {
    //     console.log(new Date(), "ENTER INTO UPDATE USER DETAILS ");
    //     self.actionInstance.updateUserDetails(req, function (err, result) {
    //         res.json(result);
    //     });
    // });

    // app.post('/getUserList', function (req, res) {
    //     console.log(new Date(), "ENTER INTO GET USER LIST ");
    //     self.actionInstance.getUserList(req, function (err, result) {
    //         res.json(result);
    //     });
    // });

    // app.post('/getUserDetails', function (req, res) {
    //     console.log(new Date(), "ENTER INTO GET USER DETAILS ");
    //     self.actionInstance.getUserDetails(req, function (err, result) {
    //         res.json(result);
    //     });
    // });

    app.post('/testSubmit', function (req, res) {
        console.log(new Date(), "ENTER INTO TEST SUBMIT ");
        self.actionInstance.testSubmit(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/resultSave', function (req, res) {
        console.log(new Date(), "ENTER INTO RESULTS SAVE ");
        self.actionInstance.resultSave(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/getResult', function (req, res) {
        console.log(new Date(), "ENTER INTO GET RESULTS ");
        self.actionInstance.getResult(req, function (err, result) {
            res.json(result);
        });
    });

    // app.post('/changePassword', function(req, res) {
    //     console.log(new Date(), "ENTER INTO CHANGE PASSWORD ");
    //     self.actionInstance.changePassword(req, function(err, result) {
    //         res.json(result);
    //     })
    // });

    app.post('/createTemplate', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO CREATE TEMPLATE ");
        self.actionInstance.createTemplate(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/updateTemplate', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO UPDATE TEMPLATE ");
        self.actionInstance.updateTemplate(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/getTemplateList', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO GET TEMPLATE LIST ");
        self.actionInstance.getTemplateList(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/getTemplateQuestions', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO GET TEMPLATE QUESTIONS ");
        self.actionInstance.getTemplateQuestions(req, function (err, result) {
            res.json(result);
        })
    });

    // app.post('/deleteTemplate', verifyToken, function(req, res) {
    //     console.log(new Date(), "ENTER INTO DELETE TEMPLATE ");
    //     self.actionInstance.deleteTemplate(req, function(err, result) {
    //         res.json(result);
    //     })
    // });

    // app.post('/getAllQuestions', function(req, res) {
    //     console.log(new Date(), "ENTER INTO GET ALL QUESTIONS ");
    //     self.actionInstance.getAllQuestions(req, function(err, result) {
    //         res.json(result);
    //     })
    // });

    // app.post('/err', function (req, res) {
    //     console.log(new Date(), "ENTER INTO GET CREATOR LIST ");
    //     // res.redirect('/err.html');
    //     res.send('Error..!')
    // });

    app.post('/getCurriculum', verifyToken, function (req, res) {
        console.log("ENTER INTO GET CURRICULUM");
        self.actionInstance.getCurriculum(req, function (err, curriculumData) {
            res.json(curriculumData)
        });
    });

    // getAllCurriculum for admin panel
    app.get('/getAllCurriculum', function (req, res) {
        console.log("ENTER INTO GET All CURRICULUM");
        self.actionInstance.getAllCurriculum(req, function (err, curriculumAllData) {
            res.json(curriculumAllData)
        });
    });

    // getSubjectsByCurriculum for admin panel
    app.post('/getSubjectsByCur', verifyToken, function (req, res) {
        console.log("ENTER INTO GET subjects based on curriculum code");
        self.actionInstance.getSubjectsByCur(req, function (err, subjectsData) {
            res.json(subjectsData)
        });
    });

    // getSubjectsForCourse
    app.post('/getSubjectsForCourse', verifyToken, function (req, res) {
        console.log("ENTER INTO GET subjects based on curriculum code for course module");
        self.actionInstance.getSubjectsForCourse(req, function (err, subjectsData) {
            res.json(subjectsData)
        });
    });

    // getTopicByCurSub for admin panel
    app.post('/getTopicByCurSub', verifyToken, function (req, res) {
        console.log("ENTER INTO GET Topics based on curriculum code and subject");
        self.actionInstance.getTopicByCurSub(req, function (err, subjectsData) {
            res.json(subjectsData)
        });
    });

    // getAllChapters for admin panel
    app.post('/getAllChapters', verifyToken, function (req, res) {
        console.log("ENTER INTO GET all chapters based on curriculum code, subject and topic");
        self.actionInstance.getAllChapters(req, function (err, subjectsData) {
            res.json(subjectsData)
        });
    });

    // getCurriculumDetails
    app.post('/getCurriculumDetails', verifyToken, function (req, res) {
        console.log("ENTER INTO GET CURRICULUM DETAILS");
        self.actionInstance.getCurriculumDetails(req, function (err, curriculumFullData) {
            res.json(curriculumFullData)
        });
    });


    app.post('/createCurriculum', verifyToken, function (req, res) {
        console.log("ENTER INTO CREATE CURRICULUM");
        self.actionInstance.createCurriculum(req, function (err, curriculumData) {
            res.json(curriculumData)
        });
    });

    app.post('/updateCurriculum', verifyToken, function (req, res) {
        console.log("ENTER INTO UPDATE CURRICULUM");
        self.actionInstance.updateCurriculum(req, function (err, curriculumData) {
            res.json(curriculumData)
        });
    });

    // app.post('/updateCurriculum', function(req, res){
    //     console.log("ENTER INTO UPDATE CURRICULUM");
    //     self.actionInstance.updateCurriculum(req, function(err, addCourseData) {
    //         res.json(addCourseData)
    //     });
    // });

    app.post('/createCourse', verifyToken, function (req, res) {
        console.log("ENTER INTO CREATE COURSE");
        self.actionInstance.createCourse(req, function (err, result) {
            res.json(result)
        });
    });

    app.post('/updateCourse', verifyToken, function (req, res) {
        console.log("ENTER INTO UPDATE COURSE");
        self.actionInstance.updateCourse(req, function (err, result) {
            res.json(result)
        });
    });

    app.post('/getCourse', verifyToken, function (req, res) {
        console.log("ENTER INTO GET COURSE");
        self.actionInstance.getCourse(req, function (err, courseData) {
            res.json(courseData)
        });
    });

    //getAllCourse
    app.get('/getAllCourse', verifyToken, function (req, res) {
        console.log("ENTER INTO GET All COURSE");
        self.actionInstance.getAllCourse(req, function (err, courseAllData) {
            res.json(courseAllData)
        });
    });

    // get all subject and curriculum data based on curriculum
    app.post('/getCurriculumSubject', verifyToken, function (req, res) {
        console.log("ENTER INTO getCurriculumSubject routes", new Date());
        self.actionInstance.getCurriculumSubject(req, function (err, result) {
            res.json(result);
        });
    });

    // get strands based on course and grade from "course" collection.
    app.post('/getTopic', verifyToken, function (req, res) {
        console.log(" ENTER INTO GET TOPIC routes", new Date());
        self.actionInstance.getTopic(req, function (err, result) {
            res.send(result);
        });
    });

    //add question
    app.post('/addQuestion', verifyToken, function (req, res) {
        console.log('ENTER INTO ADD QUESTION', new Date());
        self.actionInstance.addQuestion(req, function (err, result) {
            res.json(result);
        });
    });

    //Get the question
    app.post('/getQuestion', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO  GET QUESTION ");
        self.actionInstance.getQuestion(req, function (err, result) {
            res.json(result);
        });
    });

    //update question
    app.post('/updateQuestion', verifyToken, function (req, res) {
        console.log('ENTER INTO ADD QUESTION routes', new Date());
        self.actionInstance.updateQuestion(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/createTemplate', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO CREATE TEMPLATE ");
        self.actionInstance.createTemplate(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/updateTemplate', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO UPDATE TEMPLATE ");
        self.actionInstance.updateTemplate(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/getTemplateList', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO GET TEMPLATE LIST ");
        self.actionInstance.getTemplateList(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/getTemplateQuestions', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO GET TEMPLATE QUESTIONS ");
        self.actionInstance.getTemplateQuestions(req, function (err, result) {
            res.json(result);
        })
    });

    app.post('/createAssessment', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO CREATE ASSESSMENT ");
        self.actionInstance.createAssessment(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/getAssessmentsList', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO getAssessmentsList ASSESSMENT ");
        self.actionInstance.getAssessmentsList(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/deleteAssessment', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO deleteAssessment ASSESSMENT ");
        self.actionInstance.deleteAssessment(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/createRole', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO createRole ASSESSMENT ");
        self.actionInstance.createRole(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/createStaff', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO createStaff ASSESSMENT ");
        self.actionInstance.createStaff(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/getStaffList', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO getStaffList ASSESSMENT ");
        self.actionInstance.getStaffList(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/updateStaff', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO updateStaff ASSESSMENT ");
        self.actionInstance.updateStaff(req, function (err, result) {
            res.json(result);
        });
    });


    app.get('/getStudentById/:studentId/:roleName', verifyToken, function (req, res) {
        console.log('Entered into getStudentById routes', new Date());
        self.actionInstance.getStudentById(req, function (err, data) {
            res.json(data);
        })
    })

    app.post('/getRolesList', verifyToken, function (req, res) {
        console.log(new Date(), "ENTER INTO getRolesList ASSESSMENT ");
        self.actionInstance.getRolesList(req, function (err, result) {
            res.json(result);
        });
    });

    /* Queries Module routes start */

    app.post('/getAllQueries', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO get all queries ");
        self.actionInstance.getAllQueries(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/queryInsert', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO queryInsert ");
        self.actionInstance.queryInsert(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/queryUpdate', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO queryUpdate ");
        self.actionInstance.queryUpdate(req, function (err, result) {
            res.json(result);
        });
    });

    /* Queries Module routes end */

    /*  Help Tutor Module routes start */

    app.post('/sessionInsert', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO sessionInsert ");
        self.actionInstance.sessionInsert(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/sessionUpdate', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO sessionUpdate ");
        self.actionInstance.sessionUpdate(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/getAllSessions', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO get all sessions ");
        self.actionInstance.getAllSessions(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/getSessionByID', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO get sessions By sessionID");
        self.actionInstance.getSessionByID(req, function (err, result) {
            res.json(result);
        });
    });

    /* Help Tutor Module routes end */

    // getAssignments to display in student dashboard
    app.post('/getAssignments', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO get all Assignments for this curriculum ");
        self.actionInstance.getAssignments(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/getAssignmentByID', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO get Assignments based on assignmentID ");
        self.actionInstance.getAssignmentByID(req, function (err, result) {
            res.json(result);
        });
    });

    // getSubjectinfo to display in existed subject details in course module
    app.post('/getSubjectinfo', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO get Subject Info for curriculum and subject ");
        self.actionInstance.getSubjectinfo(req, function (err, result) {
            res.json(result);
        });
    });

    // submitVideo 
    app.post('/submitVideo', verifyToken, function (req, res) {
        console.log(new Date(), "Enter INTO video insert with video imageName & url data ");
        self.videoAction.submitVideo(req, function (err, result) {
            res.json(result);
        });
    });

    app.post('/videosList', verifyToken, function (req, res) {
        console.log("Enter into videos list data");
        self.videoAction.videosList(req, function (err, result) {
            res.json(result)
        })
    })

    app.post('/deleteVideo', verifyToken, function (req, res) {
        console.log("Enter into Delete video data");
        self.videoAction.deleteVideo(req, function (err, result) {
            res.json(result)
        })
    })

    app.post('/addSubject', verifyToken, function (req, res) {
        console.log("ENTER INTO Add Subject");
        self.subjectAction.addSubject(req, function (err, result) {
            res.json(result)
        });
    });

    app.post('/subjectsList', verifyToken, function (req, res) {
        console.log("ENTER INTO subjects List");
        self.subjectAction.subjectsList(req, function (err, result) {
            res.json(result)
        });
    });

    app.post('/getSubjectById', verifyToken, function (req, res) {
        console.log("ENTER INTO get subject by id");
        self.subjectAction.getSubjectById(req, function (err, result) {
            res.json(result)
        });
    });

    app.post('/updateSubject', verifyToken, function (req, res) {
        console.log("ENTER INTO update subject List");
        self.subjectAction.updateSubject(req, function (err, result) {
            res.json(result)
        });
    });
    app.post('/teachers', verifyToken, function (req, res) {
        console.log("teachers routes for session", new Date());
        self.sessionInstance.getTeachers(req, function (err, data) {
            res.json(data);
        })
    });
    app.post('/getAssignmentsByTeacher', verifyToken, function (req, res) {
        console.log('Entered into getAssignmentsByTeacher routes', new Date());
        self.teacherInstance.fetchAssignments(req, function (err, data) {
            res.json(data);
        })
    })
    //fetchAssignments
    app.post('/fetchAssignments', verifyToken, function (req, res) {
        console.log('Entered into fetchAssignments routes', new Date());
        self.teacherInstance.fetchAssignments(req, function (err, data) {
            res.json(data);
        })
    })
    //fetchAssignmentsById
    app.post('/fetchAssignmentsById', verifyToken, function (req, res) {
        console.log('Entered into fetchAssignmentsById routes', new Date());
        self.teacherInstance.fetchAssignmentsById(req, function (err, data) {
            res.json(data);
        })
    })
    // getpendingQuestions
    app.post('/getPendingQuestions', verifyToken, function (req, res) {
        console.log('Entered into getPendingQuestions routes', new Date());
        self.teacherInstance.getPendingQuestions(req, function (err, data) {
            res.json(data);
        })
    })
    //testSubmitByTeacher
    app.post('/testSubmitByTeacher', verifyToken, function (req, res) {
        console.log('Entered into testSubmitByTeacher routes', new Date());
        self.teacherInstance.testSubmitByTeacher(req, function (err, data) {
            res.json(data);
        })
    })

};

