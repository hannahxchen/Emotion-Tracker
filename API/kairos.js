var request = require('request');
var configAPI = require('../config/kairos_api');

module.exports.enroll = function(img, subject_id, gallery, callback){
  var options = {
    method: 'POST',
    uri: 'https://api.kairos.com/enroll',
    headers: {
      'Content-Type':'application/json',
      'app_id': configAPI.app_id ,
      'app_key': configAPI.app_key
    },
    body: {
      "image": img,
      "subject_id": subject_id,
      "gallery_name": gallery
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data=JSON.stringify(body);
      console.log(data);
      if(body.Errors) module.exports.error = body.Errors;
      else if(body.images[0].transaction.status == "success"){
        module.exports.attributes = body.images[0].attributes;
        if(callback) callback();
      }
    }
    else{
      console.log(error);
    }
  });
};

module.exports.recognize = function(img, gallery, callback){
  var options = {
    method: 'POST',
    uri: 'https://api.kairos.com/recognize',
    headers: {
      'Content-Type':'application/json',
      'app_id': configAPI.app_id ,
      'app_key': configAPI.app_key
    },
    body: {
      "image": img,
      "gallery_name": gallery
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data=JSON.stringify(body);
      console.log(data);
      if(body.Errors){
        module.exports.error = body.Errors;
        if(callback) callback();
      }
      else if(body.images[0].transaction.status == "success"){
        module.exports.status = body.images[0].transaction.status;
        module.exports.id = body.images[0].transaction.subject_id;
        console.log(body.images[0].transaction.subject_id, body.images[0].transaction.confidence);
        if(callback) callback();
      }
      else if(body.images[0].transaction.status == "failure"){
        module.exports.status = body.images[0].transaction.status;
        if(callback) callback();
      }
    }
    else{
      console.log(error);
    }
  });
};
