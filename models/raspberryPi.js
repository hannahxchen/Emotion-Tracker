var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var rpi_prefix = 'rpi_';
var sensor_prefix = 'data_';

var RaspberryPiSchema = mongoose.Schema({
  location: String
});

var SensorDataSchema = mongoose.Schema({
  raspberryPi_id: String,
  temperature: Number,
  humidity: Number,
  pm25: Number,
  co2: Number
});

autoIncrement.initialize(mongoose.connection);
RaspberryPiSchema.plugin(autoIncrement.plugin, { model: 'RaspberryPi', prefix: rpi_prefix, field: 'rpiID' });
SensorDataSchema.plugin(autoIncrement.plugin, { model: 'SensorData', prefix: sensor_prefix, field: 'sensorDataID' });

var RaspberryPi = module.exports.RaspberryPi = mongoose.model('RaspberryPi', RaspberryPiSchema);
var SensorData = module.exports.SensorData = mongoose.model('SensorData', SensorDataSchema);
