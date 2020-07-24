const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tour_routes');
const userRouter = require('./routes/user_routes');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('dev')); //To show route details
}
app.use(express.json()); //To parse body
app.use(express.static(`${__dirname}/public`)); //Serve static files
// app.use((req, res, next) => {
//    console.log('new request...');
//    next();
// });
app.use((req, res, next) => {
   req.requestTime = new Date().toISOString();
   next();
});

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
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

// Error handling middleware
app.use(globalErrorHandler);

module.exports = app;
