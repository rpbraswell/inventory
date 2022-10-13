var createError  = require('http-errors');
var express      = require('express');
var path         = require('path');
var cookieParser = require('cookie-parser');
var logger       = require('morgan');

var indexRouter   = require('./routes/index');
var itemsRouter   = require('./routes/items');
var receiveRouter = require('./routes/receive');
var shipRouter    = require('./routes/ship');
var unitsRouter   = require('./routes/units');
var categoriesRouter   = require('./routes/categories');
var transferRouter   = require('./routes/transfer');
var reportsRouter    = require('./routes/reports.js');


var app = express();


Item = require("./db/Item");
Receiving = require("./db/Receiving");
Shipping = require("./db/Shipping");


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',        indexRouter);
app.use('/items',   itemsRouter);
app.use('/receive', receiveRouter);
app.use('/ship',    shipRouter);
app.use('/units',    unitsRouter);
app.use('/categories',  categoriesRouter);
app.use('/transfer',    transferRouter);
app.use('/reports',     reportsRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  //res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
