/*

// query insert backup  

var collection = db.collection("query");
var insertObj = {
    'chatID': result.value.seq,
    'curriculum': reqObject['curriculum'],
    'subject' : reqObject['subject'],
    'topic' : reqObject['topic'],
    'sender_id': "student01",
    'createdDate': reqObject['createdDate'],
    'resolved': reqObject['resolved'],
    'status': 0
}
collection.insert(insertObj, {
        $push: {
            "messages": reqObject['messages'] 
        }
    }, function(err, res) {
        if(res.nInserted){
            responseObject['status'] = true;
            responseObject['message'] = "Query inserted successfully";
            callback(null, responseObject);
        }
        else{
            console.log('quert')
            callback(null, errorResponseObj)
        }
    }
)

*/