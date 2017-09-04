var express = require('express');
var router = express.Router();
var hue = require("node-hue-api");
var HueApi = hue.HueApi;

router.get('/', function(req, res){
	res.render('hueAPI');
});

router.get('/searchIP', function(req, res){

	var displayBridges = function(bridge) {
		if(isEmptyObject(bridge)){
			timeout =2000;
			hue.upnpSearch(timeout).then(findBridges).done();
		}
		else{
			console.log("Hue Bridges Found: " + JSON.stringify(bridge));

			var host = bridge[0].ipaddress;

			console.log(host);

			res.json({hostIP: host});

		}
	};

	var findBridges = function(bridge){
		if(isEmptyObject(bridge)){
			res.json({hostIP: 'not found'});
		}
		else{
			console.log("Hue Bridges Found: " + JSON.stringify(bridge));

			var host = bridge[0].ipaddress;

			res.json({hostIP: host});
		}
	}

	// find bridge using a promise
	hue.nupnpSearch().then(displayBridges).done();

	function isEmptyObject(obj) {
		return !Object.keys(obj).length;
	}
});

//Finding the Lights Attached to the Bridge
router.post('/getLights', function(req, res){
	var lights = [];
	var displayResult = function(result) {
		console.log(JSON.stringify(result, null, 2));
		result.lights.forEach(function(element){
			lights.push({id: element.id, name: element.name});
		});
		res.json({lights: lights});
	};

	var host = req.body.host,
	username = req.body.username,
	api;

	api = new HueApi(host, username);

	api.lights()
	.then(displayResult)
	.done();
});

// Obtain all the defined groups in the Bridge
router.post('/getGroups', function(req, res){
	var groups = [];

	var displayResults = function(result) {
		console.log(JSON.stringify(result, null, 2));
		result.forEach(function(element){
			groups.push({id: element.id, name: element.name, lights: element.lights});
		});
		groups.shift();
		res.json({groups: groups});
	};

	var host = req.body.host,
	username = req.body.username,
	api = new HueApi(host, username);

	api.groups()
	.then(displayResults)
	.done();
});

router.post('/updateGroups', function(req, res){

});

module.exports = router;
