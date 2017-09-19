var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var rpi_prefix = 'rpi_';
var sensor_prefix = 'sensor_';

var RaspberryPiSchema = mongoose.Schema({
  location: String,
  sensors: [Sensor.schema]
});

var SensorSchema = mongoose.Schema({
  variable: String
});

autoIncrement.initialize(mongoose.connection);
RaspberryPiSchema.plugin(autoIncrement.plugin, { model: 'RaspberryPi', prefix: rpi_prefix, field: 'rpiID' });
SensorSchema.plugin(autoIncrement.plugin, { model: 'Sensor', prefix: sensor_prefix, field: 'sensorID' });

var RaspberryPi = module.exports = mongoose.model('RaspberryPi', RaspberryPiSchema);
var Sensor = module.exports = mongoose.model('Sensor', SensorSchema);
