var request = require('request');
var configAPI = require('../config/azure_api').free;
var async = require('async');
var fs = require('fs');

module.exports.recognize = function recognize(img, callback){
  var options = {
    method: 'POST',
    uri: 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Ocp-Apim-Subscription-Key': configAPI.key,

    },
    body: fs.readFileSync(img)
  };

  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      var data = JSON.parse(body);
      var error;
      if(Object.keys(data).length === 0 ) {
        error = 'no face found';
        callback(error);
      }
      else{
        var faces = [];
        async.each(data, function(each, callback){
          var newFace = {position: each.faceRectangle, emotions: each.scores};
          faces.push(newFace);
          callback();
        }, function(err){
          if(err) console.log(err);
          else callback(error, faces);
        });
      }

    }
    else{
      callback(error);
    }
  });
};

makeblob = function (dataURL) {
  var BASE64_MARKER = ';base64,';
  if (dataURL.indexOf(BASE64_MARKER) == -1) {
    var parts = dataURL.split(',');
    var contentType = parts[0].split(':')[1];
    var raw = decodeURIComponent(parts[1]);
    return new Blob([raw], { type: contentType });
  }
  var parts = dataURL.split(BASE64_MARKER);
  var contentType = parts[0].split(':')[1];
  var raw = window.atob(parts[1]);
  var rawLength = raw.length;

  var uInt8Array = new Uint8Array(rawLength);

  for (var i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}
