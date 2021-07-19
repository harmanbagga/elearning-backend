const conn = require('mongoose')
const conf =  require('./../conf.js')
const options = {
    // user: process.env.MONGODB_USER,
    // pass: process.env.MONGODB_PASS,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000, // Give up initial connection after 10 seconds
    useCreateIndex:true
};
//mongodb://127.0.0.1:27017/elearning
const Conn = conn.createConnection("mongodb://harman71:harman71@cluster0-shard-00-00.zmwil.mongodb.net:27017,cluster0-shard-00-01.zmwil.mongodb.net:27017,cluster0-shard-00-02.zmwil.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-mybwgy-shard-0&authSource=admin&retryWrites=true&w=majority",options);

Conn.on('error', console.error.bind(console, 'connection db error:'));
Conn.once('open', function() {
    console.log("db connected")
});


module.exports = Conn
