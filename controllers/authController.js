const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');

/////////////////////////////////////////////////////////////////////////////////

const signToken = (id) => {
   return jwt.sign({ id: id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
   });
};

const createSendToken = (user, statusCode, res) => {
   const token = signToken(user._id);
   const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
      httpOnly: true,
   };

   if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // secure means only over https
   // send JWT via cokkie
   res.cookie('jwt', token, cookieOptions);

   res.status(statusCode).json({
      status: 'success',
      token,
      data: {
         _id: user._id,
         name: user.name,
         email: user.email,
      },
   });
};

/////////////////////////////////////////////////////////////////////////////////

exports.signup = catchAsync(async (req, res, next) => {
   const newUser = await User.create(req.body);

   // Send welcome email
   // const url = `${req.protocol}://localhost:5000/me`;
   const url = `${req.protocol}://${req.get('host')}/me`;
   console.log(url);
   await new Email(newUser, url).sendWelcome();

   // Create jwt and send
   createSendToken(newUser, 201, res); // 201 for created
});

exports.login = catchAsync(async (req, res, next) => {
   const { email, password } = req.body;

   // 1) Check if email and password exist
   if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
   }

   // 2) Check if user exists & password is correct
   const user = await User.findOne({ email }).select('+password');
   // +password is tell explicitely that that we need password which is default won't get from DB since we assigned select to false in userModel

   if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401)); // 401 -> Unauthorized
   }

   // 3) If everything is ok, send token to client
   createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
   // Override the exact cookie without token with same
   res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
   });
   res.status(200).json({ status: 'success' });
};

// Only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
   if (req.cookies.jwt) {
      try {
         // 1) Verify token
         const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

         // 2) Check if user still exists
         const currentUser = await User.findById(decoded.id);
         if (!currentUser) return next();

         // 3) Check if user change password after jwt was issued
         if (currentUser.changePasswordAfter(decoded.iat)) {
            return next();
         }

         // There is a logged in user
         res.locals.user = currentUser;
      } catch (err) {
         return next();
      }
   }
   next();
};

exports.protect = catchAsync(async (req, res, next) => {
   // 1) Getting token and check of it's there
   let token;
   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
   } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
   }
   if (!token) {
      return next(new AppError('You are not logged in, Please login', 401));
   }

   // 2) Varification token
   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

   // 3) Check if user still exists
   const currentUser = await User.findById(decoded.id);
   if (!currentUser)
      return next(new AppError('The user belonging to this token does no longer exist', 401));

   // 4) Check if user change password after jwt was issued
   if (currentUser.changePasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password, Please login again', 401));
   }

   // GRANT ACCESS TO PROTECTED ROUTE
   req.user = currentUser;
   res.locals.user = currentUser;
   next();
});

exports.restrictTo = (...roles) => {
   return catchAsync(async (req, res, next) => {
      // roles is an array, here ['admin','lead-guide']
      if (!roles.includes(req.user.role)) {
         return next(new AppError('You do not have permission to perform this action', 403)); // 403 -> Forbidden
      }
      next();
   });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
   // 1) Get user based on POSTed email
   const user = await User.findOne({ email: req.body.email });
   if (!user) return next(new AppError('No user with this email', 404));

   // 2) Generate the random reset token
   const resetToken = user.createPasswordResetToken();
   await user.save({ validateBeforeSave: false }); // save modified data

   try {
      // 3) Send it to user's email
      const resetURL = `${req.protocol}://${req.get(
         'host'
      )}/api/v1/users/resetPassword/${resetToken}`;

      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
         status: 'success',
         message: 'Token sent to email',
      });
   } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email, try again later', 500));
   }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
   // 1) Get user based on the token
   // encryp the token and compare with the encrypted in the db
   const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
   const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
   });

   // 2) If token hasn't expired, and there is user, set the new password
   if (!user) return next(new AppError('Token is invalid or expired', 400));
   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;

   user.passwordResetToken = undefined;
   user.passwordResetExpires = undefined;

   await user.save(); // don't use update

   // 3) Update changedPasswordAt property for the user

   // 4) Log the user in, send JWT
   createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
   // 1) Get user from collection
   const user = await User.findById(req.user._id).select('+password');

   // 2) Check if POSTed current password is correct
   if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
      return next(new AppError('Current password is wrong', 401));
   }

   // 3) If so, update password
   user.password = req.body.password;
   user.passwordConfirm = req.body.passwordConfirm;

   await user.save();

   // 4) Log user in, send JWT
   createSendToken(user, 200, res);
});

/////////////////////////////////////////////////////////////////////////////////
