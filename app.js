const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookeiParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tour_routes');
const userRouter = require('./routes/user_routes');
const reviewRouter = require('./routes/review_routes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

/////////////////////////////////////////////////////////////////////////////////

app.set('view engine', 'pug'); // no need to require
app.set('views', path.join(__dirname, 'views'));

/////////////////////////////////////////////////////////////////////////////////

// GLOBAL MIDDLEWARES

// Serving static files
// app.use(express.static(`${__dirname}/public`)); //Serve static files
app.use(express.static(path.join(__dirname, 'public'))); //Serve static files

// Set security HTTP headers
app.use(helmet()); // put it in first

// Development logging
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('dev')); //To show route details
}

// rate limiting from same IP
const limiter = rateLimit({
   max: 100,
   windowMs: 60 * 60 * 1000,
   message: 'Too many requests from this IP, Please try again in an hour',
   // This will allow only 100 request in 1 hour from a single IP
});
app.use('/api', limiter); // only effect url starts with /api

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // when body larger than 10kb, it won't be accepted
// To parse data from urlencoded form like form submission
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Parse data from cookie
app.use(cookeiParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss()); // clean malicious html code

// Prevent parameter pollution like duplicate qurey
app.use(
   hpp({
      whitelist: [
         'duration',
         'ratingsQuantity',
         'ratingsAverage',
         'maxGroupSize',
         'difficulty',
         'price',
      ], // list of query which allows
   })
);

// app.use((req, res, next) => {
//    // console.log(req.cookies);
//    // // Website you wish to allow to connect
//    // res.setHeader('Access-Control-Allow-Origin', '*');

//    // // Request methods you wish to allow
//    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//    // // Request headers you wish to allow
//    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

//    // // Set to true if you need the website to include cookies in the requests sent
//    // // to the API (e.g. in case you use sessions)
//    // res.setHeader('Access-Control-Allow-Credentials', true);

//    // Pass to next layer of middleware
//    next();
// });

app.use(compression());

// Test Middleware
app.use((req, res, next) => {
   req.requestTime = new Date().toISOString();
   next();
});

/////////////////////////////////////////////////////////////////////////////////

// Routes
app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handle error for unknown route
app.all('*', (req, res, next) => {
   // res.status(404).json({
   //    status: 'fail',
   //    message: `Can't find ${req.originalUrl} on this server!`,
   // });

   // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
   // err.status = 'fail';
   // err.statusCode = 404;

   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
   //whenever pass argument to next it automatically assumes it is an error
   //and skip all other middleware is stack and send error to global error handling middleware
});

/////////////////////////////////////////////////////////////////////////////////

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
