import createError  from 'http-errors'
import express      from 'express'
import path         from 'path'
import cookieParser from 'cookie-parser'
import logger       from 'morgan'
import { fileURLToPath } from 'url'

import indexRouter   from './routes/index.js'
import itemsRouter   from './routes/items.js'
import receiveRouter from './routes/receive.js'
import shipRouter    from './routes/ship.js'
import unitsRouter   from './routes/units.js'
import categoriesRouter   from './routes/categories.js'
import transferRouter   from './routes/transfer.js'
import reportsRouter    from './routes/reports.js'


const app = express();


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

export default app;