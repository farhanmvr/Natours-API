const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const factory = require('../controllers/handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
   // 1) Get the currently booked tour
   const tour = await Tour.findById(req.params.tourId);

   if (!tour) return next(new AppError('Invalid tour id', 400));

   // 2) Create checkout session
   const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${
         req.user._id
      }&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      line_items: [
         {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            amount: tour.price * 100,
            currency: 'usd',
            quantity: 1,
         },
      ],
   });

   // 3) Create session as response
   res.status(200).json({
      status: 'success',
      session,
   });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
   // This is only temperary, bcz it's unsave: everyone can make bookings without paying
   const { tour, user, price } = req.query;
   if (!tour && !user && !price) return next();
   await Booking.create({ tour, user, price });

   res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
