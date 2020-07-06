const express = require('express');
const morgan = require('morgan');

const tourRouter = require('./routes/tour_routes');
const userRouter = require('./routes/user_routes');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('dev')); //To show route details
}
app.use(express.json()); //To parse body
app.use(express.static(`${__dirname}/public`)); //Serve static files
app.use((req, res, next) => {
   console.log('new request...from middleware');
   next();
});
app.use((req, res, next) => {
   req.requestTime = new Date().toISOString();
   next();
});

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

module.exports = app;
