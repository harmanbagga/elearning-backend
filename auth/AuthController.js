const express = require('express')

// import express from "express";
const router = express.Router();
const bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({ extended : true }));
router.use(bodyParser.json());

const ApiActions = require('../models/api-actions.js')
const VerifyToken = require('../auth/VerifyToken.js')
//to add jwt and encrypting the passwords
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
// import config from "../config.json";
const fs = require('fs')

const config = (fs.readFileSync('config.json')).toString()

router.post('/register', function (req, res) {
    console.log('Entered into register API');
    const hashPassword = bcrypt.hashSync(req.body.password, 8)
    delete req.body['password']
    req.body['password'] = hashPassword

    const ApiActionsInstance = new ApiActions();
    ApiActionsInstance.register(req.body, function (err, user) {
        if(err) return res.status(500).send('Not able to create the user CONT')
        
        //create the token
        let token = jwt.sign({id:user._id}, config.tokenSecretKey, {
            expiresIn: 86400 //expires in 24 hrs [86400 sec]
        })
        res.status(200).send({message: 'User created successfully', auth: true, token: token})
    })
})
/*
router.post('/login', function(req, res) {
    const reqBody = req.body;
    console.log('reqBody --', reqBody);
    userModel.findOne({email : reqBody.email})
        .then(
            (user) => {
                console.log('user ---', user);
                if(!user) {
                    return res.status(401).json({
                        error : new Error('User not found!')
                    });
                }
                var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
                if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });

                // if user is found and password is valid
                // create a token
                var token = jwt.sign({ id: user._id }, config.tokenSecretKey, {
                    expiresIn: 86400 // expires in 24 hours
                });
                res.status(200).send({ auth: true, token: token });
            }
        )
        .catch(error => {
            res.status(500).json({
                error: error
            })
        })
})

router.get('/me', VerifyToken, function (req, res, next) {
    
    // jwt.verify(token, config.tokenSecretKey, function(err, decoded){
    //     if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        // res.status(200).send(decoded);
        userModel.findById(decoded.id, 
            { password: 0 }, // projection
            function (err, user) {
              if (err) return res.status(500).send("There was a problem finding the user.");
              if (!user) return res.status(404).send("No user found.");
                
            //   res.status(200).send(user); // Comment this out!
              next(user); // add this line
        });
    // })
})

// adding a middleware function for /me
router.use(function(user, req, res, next){
    res.status(200).send(user)
})

router.get('/logout', function(err, res){
    res.status(200).send({auth: false, token: null })
})
*/
module.exports = router
// export default router