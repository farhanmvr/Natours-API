const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
   // 1) Get tour data from collection
   const tours = await Tour.find();

   // 2) Build template
   // 3) Render that template using tour data form step 1
   res.status(200).render('overview', {
      title: 'All Tours',
      tours,
   });
});

exports.getTour = catchAsync(async (req, res, next) => {
   // 1) Get the data, for the requested tour (including reviews and)
   const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
   });
   if (!tour) {
      return next(new AppError('There is no tour with that name', 404));
   }
   // 2) Build themplate
   // 3) Render template using data from step 1
   res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour,
   });
});

exports.getLoginForm = (req, res) => {
   res.status(200).render('login', {
      title: 'Log into your account',
   });
};

exports.getProfile = (req, res) => {
   res.status(200).render('account', {
      title: 'Your account',
   });
};

exports.getMyTours = catchAsync(async (req, res) => {
   // using manual populate just for a rasam
   // 1) Find all bookings
   const bookings = await Booking.find({ user: req.user._id });

   // 2) Find tours with returned IDs
   const tourIDs = bookings.map((el) => el.tour._id);
   console.log(tourIDs);
   const tours = await Tour.find({ _id: { $in: tourIDs } }); // select all tours in toursIDs array

   res.status(200).render('overview', {
      title: 'My Tours',
      tours,
   });
});

exports.updateUserData = catchAsync(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user.id,
      {
         name: req.body.name,
         email: req.body.email,
      },
      {
         new: true,
         runValidators: true,
      }
   );

   res.status(200).redirect('/me');
});
