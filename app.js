var express=require('express');
var app=express();
var port = process.env.port || 8000;

var cookieParser = require('cookie-parser');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var path=require('path');
var bodyParser=require('body-parser');
var expressValidator = require('express-validator');
var passport = require('passport');
require('./config/passport')(passport);
var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');

var configDB = require('./config/database.js');
mongoose.connect(configDB.url,function(err){
	if(err) console.log(err);
	else console.log('Connected to mongodb!');
});

mongoose.Promise = require('bluebird');

var db = mongoose.connection;
autoIncrement.initialize(db);

connections=[];

var server=require('http').createServer(app).listen(port);
var io=require('socket.io').listen(server);
require('./sockets')(io);
console.log('Server running on port : ' + port );

var routes = require('./routes/index');
var faceDetect = require('./routes/faceDetect');
var api = require('./routes/api');
//var imageFile = require('./routes/imageFile');
var activity = require('./routes/activity');
var hueLight = require('./routes/hueLight');
var videos = require('./routes/videos');
var photos = require('./routes/photos');
var admin = require('./routes/admin');
var strokeTest = require('./routes/strokeTest');
var magicMirror = require('./routes/magicMirror');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({secret: 'anystringoftext',
				 saveUninitialized: true,
				 resave: true,
				 store: new MongoStore({ mongooseConnection: mongoose.connection,
				 							ttl: 2 * 24 * 60 * 60 })
			 }));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

app.use(flash()); // use connect-flash for flash messages stored in session

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg')[0];
  res.locals.error_msg = req.flash('error_msg')[0];
  res.locals.error = req.flash('error')[0];
  res.locals.user = req.user || null;
	res.locals.role = null;
	if(req.user){
		res.locals.role = req.user.role;
		//console.log(req.user.role);
	}
  next();
});

app.use('/', routes);
app.use('/faceDetect', faceDetect);
app.use('/api', api);
//app.use('/photoAlbum', imageFile);
app.use('/activities', activity);
app.use('/photos', photos);
app.use('/videos', videos);
app.use('/strokeTest', strokeTest);
app.use('/admin', admin);
app.use('/hueLight', hueLight);
app.use('/magicMirror', magicMirror);
