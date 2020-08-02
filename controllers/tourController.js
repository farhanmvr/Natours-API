const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

// Route handlers
exports.aliasTopTours = (req, res, next) => {
   // To get top 5 tours
   req.query.limit = '5';
   req.query.sort = '-ratingsAverage,price';
   req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
   next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
//    const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//    const tours = await features.query;

//    // SEND RESPONSE
//    res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//          tours,
//       },
//    });
// });

exports.getAllTours = factory.getAll(Tour);

// exports.getTour = catchAsync(async (req, res, next) => {
//    // const tour = await Tour.findById(req.params.id).populate('guides'); // if you don't want to exclude any fields
//    // const tour = await Tour.findById(req.params.id).populate({
//    //    path: 'guides',
//    //    select: '-__v -passwordChangedAt', // exclude fields
//    // });

//    ////////////////////////////////////////////

//    const tour = await Tour.findById(req.params.id).populate('reviews'); // populate will run since we added in query middleware in tourModel

//    if (!tour) {
//       return next(new AppError('invalid id', 404));
//    }
//    res.status(200).json({
//       status: 'success',
//       data: {
//          tour,
//       },
//    });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.createTour = catchAsync(async (req, res, next) => {
//    const newTour = await Tour.create(req.body);
//    res.status(201).json({
//       status: 'success',
//       data: {
//          tour: newTour,
//       },
//    });
// });

exports.createTour = factory.createOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//    });
//    if (!tour) {
//       return next(new AppError('invalid id', 404));
//    }
//    res.status(200).json({
//       status: 'success',
//       data: {
//          tour,
//       },
//    });
// });

exports.updateTour = factory.updateOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//    const tour = await Tour.findByIdAndDelete(req.params.id);
//    if (!tour) {
//       return next(new AppError('invalid id', 404));
//    }
//    res.status(204).json({
//       status: 'success',
//       data: null,
//    });
// });

exports.deleteTour = factory.deleteOne(Tour); // Handler factory function

// Aggregation pipelines
exports.getTourStats = catchAsync(async (req, res, next) => {
   const stats = await Tour.aggregate([
      {
         $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
         $group: {
            _id: { $toUpper: '$difficulty' },
            numTours: { $sum: 1 },
            numRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
         },
      },
      {
         $sort: { avgPrice: 1 }, // 1 for ascending
      },
      // {
      //    $match: { _id: { $ne: 'EASY' } },
      // },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         stats,
      },
   });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
   const year = req.params.year * 1;

   const plan = await Tour.aggregate([
      {
         $unwind: '$startDates',
      },
      {
         $match: {
            startDates: {
               $gte: new Date(`${year}-01-01`),
               $lte: new Date(`${year}-12-31`),
            },
         },
      },
      {
         $group: {
            _id: { $month: '$startDates' },
            numToursStarts: { $sum: 1 },
            tours: { $push: '$name' },
         },
      },
      {
         $addFields: { month: '$_id' },
      },
      {
         $project: {
            _id: 0, // 0 to hide 1 to show
         },
      },
      {
         $sort: { numToursStarts: -1 },
      },
      // {
      //    $limit: 6,
      // },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         plan,
      },
   });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
   const { distance, latlng, unit } = req.params;
   const [lat, lng] = latlng.split(',');

   const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // radius of earth = 3963.2mi, 6378.1km

   if (!lat || !lng)
      return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));

   const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
   });

   res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
         data: tours,
      },
   });
});

exports.getDistances = catchAsync(async (req, res, next) => {
   const { latlng, unit } = req.params;
   const [lat, lng] = latlng.split(',');

   const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

   if (!lat || !lng)
      return next(new AppError('Please provide latitude and longitude in the format lat,lng', 400));

   const distances = await Tour.aggregate([
      // only one stage in geospacial aggregation
      {
         $geoNear: {
            near: {
               type: 'Point',
               coordinates: [lng * 1, lat * 1],
            },
            distanceField: 'distance',
            distanceMultiplier: multiplier,
         },
      },
      {
         $project: {
            distance: 1,
            name: 1,
         },
      },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         data: distances,
      },
   });
});
