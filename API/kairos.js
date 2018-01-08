var request = require('request');
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
        var error = true;
        var status = body.Errors.Message;
      }
      else if(body.images[0].transaction.status == "success"){
        var status = 'success';
        var appearance = body.images[0].attributes;
        var error = false;
      }
      callback(error, status, appearance);
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
        var status = 'No face found';
      }
      else if(body.images[0].transaction.status == "success"){
        if(body.images.length > 1) {
          var error = true;
          var status = 'Too many faces';
        }
        else{
          var status = 'success';
          var id = body.images[0].transaction.subject_id;
          console.log(id, body.images[0].transaction.confidence);
        }
        var error = false;
      }
      else if(body.images[0].transaction.status == "failure"){
        var status = 'failure';
        var error = false;
      }
      callback(error, status, id);
    }
    else{
      console.log(error);
    }
  });
};

module.exports.recognizeMultiple = function(img, callback){
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
      "gallery_name": gallery,
      "minHeadScale": ".03"
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
      else if(body.images){
        var results = body.images;
        var error = false;
      }
      callback(error, results);
    }
    else{
      callback(error);
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
          var error = false;
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

module.exports.recognize_avatar = function(img, callback){
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
      "gallery_name": gallery,
      "minHeadScale": ".1"
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data=JSON.stringify(body);
      console.log(data);
      if(body.Errors){
        var error = true;
        var status = 'No face found';
      }
      else if(body.images[0].transaction.status == "success"){
        if(body.images.length > 1) {
          var error = true;
          var status = 'Too many faces';
        }
        else{
          var status = 'success';
          var id = body.images[0].transaction.subject_id;
          console.log(id, body.images[0].transaction.confidence);
        }
        var error = false;
      }
      else if(body.images[0].transaction.status == "failure"){
        var status = 'failure';
        var error = false;
      }
      callback(error, status, id);
    }
    else{
      console.log(error);
    }
  });
};

module.exports.detectEmotions = function(imgPath, callback){
  var options = {
    method: 'POST',
    uri: "https://api.kairos.com/v2/media",
    headers: {
      'Content-Type':'application/json',
      'app_id': 'd51a3b79' ,
      'app_key': 'd3e1ea1b184b1dfab3b423597416507b'
    },
    qs: {
      'source' : "http://120.126.15.20"+imgPath+'.jpg'
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data=JSON.stringify(body);
      console.log(data);
      var error;
      if(body.frames[0].people.length > 1) error = 'too many faces';
      else{
        if(body.frames[0].people[0]) var results = body.frames[0].people[0].emotions;
        else error = 'no face found';
      }
      callback(error, results);
    }
    else{
      console.log(error);
    }
  });
};

module.exports.removeUser = function(id){
  var options = {
    method: 'POST',
    uri: 'https://api.kairos.com/gallery/remove_subject',
    headers: {
      'Content-Type':'application/json',
      'app_id': configAPI.app_id ,
      'app_key': configAPI.app_key
    },
    body: {
      "subject_id": id,
      "gallery_name": gallery
    },
    json: true
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var data=JSON.stringify(body);
      console.log(data);
      if(body.Errors)
        var error = true;
      else if(body.status == "Complete")
        error = false;
    }
    else{
      console.log(error);
    }
  });
}
