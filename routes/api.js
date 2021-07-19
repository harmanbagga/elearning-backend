//Dependencies
var express = require('express');
var router = express.Router();
// var controller = require('../controller/maincontroller.js');


//routes
router.get('/', function(req, res) {
    res.send('Api Working');
});

// router.route('/login')
//     .post(controller.login);
// router.route('/register')
//     .post(controller.register);

//return router
module.exports = router;
