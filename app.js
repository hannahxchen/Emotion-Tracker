var express=require('express');
var app = express();
//var ports = [8000, 8087, 8081];
var ports = [8000];

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
var moment = require('moment');
var User = require('./models/user').User;
var Task = require('./models/task').Task;

var configDB = require('./config/database.js');
mongoose.connect(configDB.url, { useMongoClient: true }, function(err){
	if(err) console.log(err);
	else console.log('Connected to mongodb!');
});

mongoose.Promise = require('bluebird');

var db = mongoose.connection;
autoIncrement.initialize(db);

connections=[];

ports.forEach(function(port){
	var server = require('http').createServer(app).listen(port);
	var io = require('socket.io').listen(server);
	require('./sockets')(io);
	console.log('Server running on port : ' + port);
});

var routes = require('./routes/index');
var api = require('./routes/api');
var activity = require('./routes/activity');
var hueLight = require('./routes/hueLight');
var photos = require('./routes/photos');
var admin = require('./routes/admin');
var admin_tasks = require('./routes/admin_tasks');
var getCSV = require('./routes/admin_csv');
var admin_albums = require('./routes/admin_photos');
var raspi = require('./routes/raspi');
var manageUsers = require('./routes/admin_users');
var manageActivities = require('./routes/admin_activity');
var strokeTest = require('./routes/strokeTest');
var magicMirror = require('./routes/magicMirror');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

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
	res.locals.img_error = req.flash('img_error')[0];
  res.locals.error_msg = req.flash('error_msg')[0];
  res.locals.errors = req.flash('errors');
  res.locals.user = req.user || null;
	res.locals.role = null;
	res.locals.moment = moment;
	if(req.user){
		res.locals.role = req.user.role;
		User.findOne({userID: req.user.userID}).populate('profile_picture').exec(function(err, doc){
			if(err) console.log(err);
			else res.locals.profilePath = doc.profile_picture.path;
			next();
		});
	}
	else next();

});

app.use('/', routes);
app.use('/api', api);
//app.use('/photoAlbum', imageFile);
app.use('/activity', activity);
app.use('/photos', photos);
app.use('/strokeTest', strokeTest);
app.use('/admin', admin);
app.use('/admin/tasks', admin_tasks);
app.use('/admin/raspi', raspi);
app.use('/admin/getCSV', getCSV);
app.use('/admin/manageUsers', manageUsers);
app.use('/admin/manageActivities', manageActivities);
app.use('/admin/album', admin_albums);
app.use('/hueLight', hueLight);
app.use('/magicMirror', magicMirror);
