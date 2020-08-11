// const sharp = require('sharp');
const multer = require('multer');

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

// const multerStorage = multer.diskStorage({
//    destination: (req, file, cb) => {
//       cb(null, 'public/img/users');
//    },
//    filename: (req, file, cb) => {
//       // user-s6f46f4ds1d64sf44s-546153165.jpeg >>> photo name
//       const ext = file.mimetype.split('/')[1];
//       cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//    },
// });

const multerStorage = multer.memoryStorage(); // store in memory since we need to resize it before saving to fs

const multerFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image')) {
      cb(null, true);
   } else {
      cb(new AppError('Not an image, please upload image only', 400), false);
   }
};

// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
   storage: multerStorage,
   fileFilter: multerFilter,
});

// Route handlers

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
   if (!req.file) return next();

   req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

   // await sharp(req.file.buffer)
   //    .resize(500, 500)
   //    .toFormat('jpeg')
   //    .jpeg({ quality: 90 })
   //    .toFile(`public/img/users/${req.file.filename}`); ////////////////

   next();
});

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
   if (req.file) filteredBody.photo = req.file.filename;

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
            photo: updatedUser.photo,
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
