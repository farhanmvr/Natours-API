const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
   const message = `Invalid ${err.path}: ${err.value}`;
   return new AppError(message, 400);
};

const handleDuplicateFieldDB = (err) => {
   const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
   const message = `Duplicat field value: ${value}. Please use another value`;

   return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
   // loop through object
   const errors = Object.values(err.errors).map((el) => el.message);
   const message = `Invalid input data. ${errors.join('. ')}`;
   return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token, Please login again', 401);
const handleJWTExpiredError = () => new AppError('Token has expired, Please login again', 401);

// Dev Error
const sendErrorDev = (err, res) => {
   res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
   });
};

// Prod Error
const sendErrorProd = (err, res) => {
   if (err.isOperational) {
      // Operational, trusted error : send message to cliend
      res.status(err.statusCode).json({
         status: err.status,
         message: err.message,
      });
   } else {
      // Progamming or other unknown error: don't leak error details
      // 1) Log error
      console.error('ERROR', err);

      // 2) Send genetic message
      res.status(500).json({
         status: 'error',
         message: 'Something went wrong',
      });
   }
};

module.exports = (err, req, res, next) => {
   err.statusCode = err.statusCode || 500;
   err.status = err.status || 'error';

   if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, res);
   } else if (process.env.NODE_ENV === 'production') {
      let error = { ...err };

      if (err.name === 'CastError') error = handleCastErrorDB(err); // invalid id
      if (err.code === 11000) error = handleDuplicateFieldDB(err); // duplicate name
      if (err.name === 'ValidationError') error = handleValidationErrorDB(err); // Mongoose validation error
      if (err.name === 'JsonWebTokenError') error = handleJWTError(); // Invalid Token
      if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

      sendErrorProd(error, res);
   }
};
