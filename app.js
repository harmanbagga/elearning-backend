const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const profile = require( './routes/api/profile' );
const path = require('path');
const AuthController = require('./auth/AuthController.js')

const app = express();

app.use(express.json())
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cors());

app.use(function(req, res, next) {
    console.log('req.url', req.url);
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});

app.use('/api/auth', AuthController)

app.use( '/profile', profile );
app.use( '/api/profile', profile );
app.options('*', cors());

// app.use(express.static(path.join(__dirname, 'build')))

module.exports = app
