
var conf = {
    web: {
        host: "0.0.0.0",
        port: "3002",
        method: "session",
        views: {},
        static: {}
    },
    database: {
        api: 'mongodb',
        host: '127.0.0.1',
        port: '27107',
        schema: 'elearning',
        auth: false,
        username: 'harman71',
        password: 'harman71',
        url: "mongodb://harman71:harman71@cluster0-shard-00-00.zmwil.mongodb.net:27017,cluster0-shard-00-01.zmwil.mongodb.net:27017,cluster0-shard-00-02.zmwil.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-mybwgy-shard-0&authSource=admin&retryWrites=true&w=majority"
        // url:'mongodb://127.0.0.1:27017/elearning'

    },
    aws_S3:{
        "accessKeyId":"AKIAWYNYXL235CQVD4O7",
        "secretAccessKey":"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",
        "region": 'us-west-2'   // "region": 'us-west-2'
    },
    baseEnv : {
        environment : 'development'
    },
    timeZone:{
        "withoutDayLightSaving":4*60*60*1000,
        "withDayLightSaving":5*60*60*1000,
        "isDayLightSaving":false
    },
    sessionEnv: {
        
    }

};

module.exports = conf;
