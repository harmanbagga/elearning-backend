
var _ = require("underscore");

var conf = {};


var ENV =

"development";
// "stage";
//"production";


var envconf = require("./conf/conf-" + ENV + ".js");

conf = _.extend(envconf);

module.exports = conf;

