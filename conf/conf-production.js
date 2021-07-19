
var conf = {
    web : {
        host : '0.0.0.0',
        port : '3002',
        method : 'session',
        views : {},
        static : {}
    },
    database : {
        api : 'mongodb',
        host : '10.0.2.184',
        port : '27017',
        schema : 'neoHome',
        auth : false,
        username : '',
        password : '',
        url:'mongodb://10.0.2.184:27017/neoHome'
    },
    aws_S3:{
        "accessKeyId":"AKIAJ5TIGHSQYMMRALNQ",
        "secretAccessKey":"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",
        "region": 'us-east-1'
    },
    baseUrl : {
        frontBaseUrl : "https://home.rubriksoft.com"
    },
    baseEnv : {
        environment : 'production'
    },
    timeZone:{
        "withoutDayLightSaving":4*60*60*1000,
        "withDayLightSaving":5*60*60*1000,
        "isDayLightSaving":false
    }

};

module.exports = conf;
