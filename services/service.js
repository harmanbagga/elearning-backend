/**
 * Created by Sairam on 11/11/2020.
 */

var Service = function (app) {
    this.app = app;

};
module.exports = Service;

Service.prototype.findDataAll = function (tableName, criteria, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);

    var condition = criteria.condition ? criteria.condition : {};
    var projection = criteria.projection ? criteria.projection : {};
    var sortOrder = criteria.sortOrder ? criteria.sortOrder : {};
    var limit = criteria.limit ? criteria.limit : 0;
    var skip = criteria.skip ? criteria.skip : 0;
    collection.find(condition, projection).sort(sortOrder).skip(skip).limit(limit).toArray(function (err, user) {
        if (user== null) {
            callback(err, false)
        }
        if (user) {
            callback(err, user)
        }
    });
};

Service.prototype.find = function (Condition,projection,tableName,callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);
    console.log("db."+ JSON.stringify(tableName) + ".find(" + JSON.stringify(Condition, projection) + ")")
    collection.find(Condition,projection).toArray(function (err, user) {
        if (user == null) {
            callback(err, false)
        }
        if (user) {
            callback(err, user)
        }
    });
};

Service.prototype.findOne = function (Condition,tableName,callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);
    collection.findOne(Condition, function (err, user) {
        console.log('user',user);
        if (user === null) {
            callback(err, false);
        }
        if (user) {
            callback(false, user);
        }
    });
};

// insert for single Document

Service.prototype.insert = function (Condition,tableName,callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);
    collection.insert(Condition, function (err, user) {
        if (user === null) {
            callback(err, false);
        }
        if (user) {
            callback(err, user);
        }
    });
};


// update single document

Service.prototype.updateDocument = function (condition, updateData, tablename, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tablename);
    // console.log("db."+ JSON.stringify(tablename) + ".update(" + JSON.stringify(condition), {$set : JSON.stringify(updateData)} + ")")
    collection.update(condition, {$set: updateData}, function (err, resp) {
        if (resp) {

            callback(err, true)
        }
        else {
            callback(err, false)
        }
    })
};

Service.prototype.updatefieldName = function (condition, updateData, tablename, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tablename);
    collection.update(condition, {$rename: updateData}, function (err, resp) {
        if (resp) {

            callback(err, true)
        }
        else {
            callback(err, false)
        }
    })
};
Service.prototype.removeStudents = function (condition, updateData, tablename, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tablename);
    collection.update(condition, {$unset: updateData}, function (err, resp) {
        if (resp) {

            callback(err, true)
        }
        else {
            callback(err, false)
        }
    })
};

// create new document

Service.prototype.insertOneData = function (input, tableName, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);

    collection.insert(input, function (err, resp) {
        if (resp) {
            callback(err, true);
        }
        else {
            callback(err, 'inserterror');
        }
    })
};


Service.prototype.couQuestion = function (condition,tableName,callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);

    // console.log('db.'+tableName+'.find('+JSON.stringify(condition)+').count()');

    collection.find(condition).count(function (err, count) {
        console.log(JSON.stringify(count));
        if(count){
            callback(err,count);
        }
        else{
            callback(err,'false');
        }
    });

};

Service.prototype.findAndModifyDocument = function (criteria,tableName,callback) {
    var self = this;
    var db = self.app.db;

    var condition = criteria.condition ? criteria.condition : {};
    var sortOrder = criteria.sortOrder ? criteria.sortOrder : [];
    var updateData = criteria.updateData ? criteria.updateData : {};
    var newUp = criteria.newUp ? criteria.newUp : {};

    var collection = db.collection(tableName);
    collection.findAndModify(condition,sortOrder,updateData,newUp, function (err, user) {
        if (user) {
            callback(null, user);
        }
        else{
            callback(err, null);
        }
    });
};


Service.prototype.updateMultipleDocument=function(condition,updateData,tablename,callback){
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tablename);

    //update table
    collection.update(condition,{$set:updateData},{multi:true},function(err,resp) {
        if(resp){
            callback(err,true)
        }
        else{
            callback(err,false)
        }
    })
};

/***********************GET DISTICT DATA*************************************/
Service.prototype.findDistictData = function (ConditionField, Condition, tableName, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);
    collection.distinct(ConditionField, Condition, function (err, user) {
        if (user == null) {
            callback(err, false)
        }
        if (user) {
            callback(err, user)
        }
    });
};

Service.prototype.removeDocument = function (tablename,condition, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tablename);
    collection.remove(condition, function (err, resp) {

        if (resp) {
            callback(err, resp);
        }
        else {
            callback(err, null);
        }
    });
};

Service.prototype.getLocations = function (Condition, tableName, callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);
    collection.find(Condition).toArray(function (err, resp) {
        if (resp == null) {
            callback(err, false);
        } else {
            callback(err, resp);
        }
    });
};

Service.prototype.insertUser = function (Condition,tableName,callback) {
    var self = this;
    var db = self.app.db;
    var collection = db.collection(tableName);
    collection.insert(Condition, function (err, user) {
        if (user === null) {
            callback(err, false);
        }
        if (user) {
            var userID=user.ops[0].userID;
            callback(err, userID);
        }
    });
};

