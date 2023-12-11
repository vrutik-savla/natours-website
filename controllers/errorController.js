// GLOBAL ERROR HANDLING MIDDLEWARE..........
const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = err => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = err => {
  //To loop over err.errors object...
  const errors = Object.values(err.errors).map(field => field.message);

  const message = `Invalid input data: ${errors.join(' ')}`;
  return new AppError(message, 400);
};

// 132. Protecting Tour Routes - Part 2
const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please login again.', 401);

// 118. Errors During Development vs Production
// 193. Rendering Error Pages
const sendErrDevelopment = (err, req, res) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // b) RENDERED WEBSITE
  console.error('💥 ERROR: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};
const sendErrProduction = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // a) Operational, trusted error: send message to client.
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // b) Programming or other unknown error: don't leak error detail.
    // 1)Log error
    // eslint-disable-next-line no-console
    console.error('💥 ERROR: ', err);
    // 2)Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // a) Operational, trusted error: send message to client.
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // b) Programming or other unknown error: don't leak error detail.
  // 1)Log error
  // eslint-disable-next-line no-console
  console.error('💥 ERROR: ', err);
  // 2)Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

// 114. Implementing a Global Error Handling Middleware
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDevelopment(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // 119. Handling Invalid Database IDs
    // let error = { ...err }; This will just copy err in error
    let error = Object.create(err); //This will copy err + err.prototype (all prototypes) in error (Prefer this...)

    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // 120. Handling Duplicate Database Fields
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // 121. Handling Mongoose Validation Errors
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    // 132. Protecting Tour Routes - Part 2
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrProduction(error, req, res);
  }
};
