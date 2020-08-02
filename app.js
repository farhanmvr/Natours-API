const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tour_routes');
const userRouter = require('./routes/user_routes');
const reviewRouter = require('./routes/review_routes');

const app = express();

/////////////////////////////////////////////////////////////////////////////////

// GLOBAL MIDDLEWARES
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

// Serving static files
app.use(express.static(`${__dirname}/public`)); //Serve static files

// app.use((req, res, next) => {
//    console.log('new request...');
//    next();
// });

// Test Middleware
app.use((req, res, next) => {
   req.requestTime = new Date().toISOString();
   next();
});

/////////////////////////////////////////////////////////////////////////////////

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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
