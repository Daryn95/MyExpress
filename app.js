var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var nconf =require('nconf');
var winston =require('winston');
var nunjucks = require('nunjucks');

// define MongoClient
const MongoClient = require('mongodb').MongoClient;

var db;
//mongodb://starwars:starwars@ds011369.mlab.com:11369/star-wars-quotes
MongoClient.connect('mongodb://starwars:starwars@localhost/starwars', function(err, database)  {
    // ... start the server
    if (err) return console.log(err);
    db = database

});


var index = require('./routes/index');
var users = require('./routes/users');
var popular = require('./routes/popular');

var app = express();

nunjucks.configure('views', {    autoescape:true,    express:app });

winston.add(winston.transports.File,{"filename": "error.log", "level":"error"});

nconf.file("config.json");

nconf.defaults({
    "http": {
        "port": 3000
    },
    "logger": {
        "fileLevel": "error"
    }
});

winston.info("Initialised nconf");
winston.info('HTTP Configuration', nconf.get("http"));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');





// mongodb://<dbuser>:<dbpassword>@ds011369.mlab.com:11369/star-wars-quotes


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', function(req, res) {

    var cursor = db.collection('quotes').find();
    db.collection('quotes').find().toArray(function(err, results) {
        winston.info(results);
        console.log(results);
        res.render('index.html', {quotes: results});
        // send HTML file populated with quotes here
    })

});

app.post('/quotes', function(req, res) {
    winston.info(req.body);
    db.collection('quotes').save(req.body, function(err, result){
        if (err) return winston.error(err);

        winston.info('saved to database');
    res.redirect('/');
})
});

app.put('/quotes', function(req, res)  {
    db.collection('quotes')
        .findOneAndUpdate({name: 'Yoda'}, {
            $set: {
                name: req.body.name,
                quote: req.body.quote
            }
        }, {
            sort: {_id: -1},
            upsert: true
        }, function(err, result)  {
        if (err) return res.send(err);
        res.send(result);
})
});

app.delete('/quotes', function(req, res) {
    console.log(req.body.name);
    db.collection('quotes')
        .findOneAndDelete({name: req.body.name},
    function(err, result)  {
    if (err) return res.send(500, err);
        console.log('A darth vadar quote got deleted');
        res.send('A darth vadar quote got deleted');
})
});



app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/popular', popular);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
