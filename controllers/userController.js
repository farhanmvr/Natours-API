const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
   const newObj = {};
   Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
   });
   return newObj;
};

// Route handlers

exports.getMe = (req, res, next) => {
   req.params.id = req.user.id; // to use getOne factory funtion
   next();
};

// exports.getAllUsers = catchAsync(async (req, res, next) => {
//    const users = await User.find();

//    // SEND RESPONSE
//    res.status(200).json({
//       status: 'success',
//       results: users.length,
//       data: {
//          users,
//       },
//    });
// });

exports.getAllUsers = factory.getAll(User);

exports.updateMe = catchAsync(async (req, res, next) => {
   // 1) Create error if user POSTs password data
   if (req.body.password || req.body.passwordConfirm)
      return next(
         new AppError('This route is not for password updates, Please use /updateMyPassword', 400) // 400 -> Bad request
      );

   // 2) Filtered out unwanted fields names that are not allowed to be updated
   const filteredBody = filterObj(req.body, 'name', 'email');

   // 3) Update user document
   const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
   });
   // Send Response
   res.status(200).json({
      status: 'success',
      data: {
         user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
         },
      },
   });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
   await User.findByIdAndUpdate(req.user._id, { active: false });

   res.status(204).json({
      status: 'success',
      data: null,
   });
});

exports.createUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'Please use signup instead',
   });
};
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); // Do not update passwords with this
exports.deleteUser = factory.deleteOne(User);
