var request = require('request');
var Q = require('q');
var configAPI = require('../config/kairos_api').account;
var gallery = require('../config/kairos_api').gallery;

module.exports.enroll = function(img, subject_id, callback){
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
      if(body.Errors){
        var status = 'failure';
        var error = true;
      }
      else if(body.images[0].transaction.status == "success"){
        var status = 'success';
        var appearance = body.images[0].attributes;
        callback(status, appearance);
      }
    }
    else{
      console.log(error);
    }
  });
};

module.exports.recognize = function(img, callback){
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
        var error = true;
      }
      else if(body.images[0].transaction.status == "success"){
        var status = 'success';
        var id = body.images[0].transaction.subject_id;
        console.log(id, body.images[0].transaction.confidence);
      }
      else if(body.images[0].transaction.status == "failure"){
        var status = 'failure';
        var id = body.images[0].transaction.subject_id;
      }
      callback(error, status, id);
    }
    else{
      console.log(error);
    }
  });
};

module.exports.detect = function(img, callback){
  var options = {
    method: 'POST',
    uri: 'https://api.kairos.com/detect',
    headers: {
      'Content-Type':'application/json',
      'app_id': configAPI.app_id ,
      'app_key': configAPI.app_key
    },
    body: {
      "image": img
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data=JSON.stringify(body);
      console.log(data);
      if(body.images[0].status == "Complete"){
        if(body.images[0].faces.length > 1 ){
          var status = 'failure';
          var error = 'too many faces'
        }
        else{
          var status = 'success';
          var age = body.images[0].faces[0].attributes.age;
          if(body.images[0].faces[0].attributes.glasses == 'None') var glasses = false;
          else var glasses = true;
        }
      }
      else{
        var status = 'failure';
        var error = 'no face found';
      }
      callback(error, status, age, glasses);
    }
    else{
      console.log(error);
    }
  });
};
