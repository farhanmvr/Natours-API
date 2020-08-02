const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
   {
      review: {
         type: String,
         required: true,
         trim: true,
         min: [10, 'Too short'],
      },
      rating: {
         type: Number,
         required: true,
         min: [1, 'Rating must be above 1.0'],
         max: [5, 'Rating must be below 5.0'],
      },
      createdAt: {
         type: Date,
         default: Date.now(),
      },
      tour: {
         type: mongoose.Schema.ObjectId,
         ref: 'Tour',
         required: [true, 'Review must belong to a tour'],
      },
      user: {
         type: mongoose.Schema.ObjectId,
         ref: 'User',
         required: [true, 'Review must belong to a user'],
      },
   },
   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// To prevent duplicate review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
   // this.populate({
   //    path: 'user',
   //    select: 'name photo',
   // }).populate({
   //    path: 'tour',
   //    select: 'name',
   // });
   this.populate({
      path: 'user',
      select: 'name photo',
   });
   next();
});

// Static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
   // use aggregation pipeline
   // this refers to current model
   const stats = await this.aggregate([
      {
         $match: { tour: tourId },
      },
      {
         $group: {
            _id: '$tour',
            nRating: { $sum: 1 },
            avgRating: { $avg: '$rating' },
         },
      },
   ]);

   // Save to db
   if (stats.length > 0) {
      // to avoid the error when we delete all review, check stats.length
      await Tour.findByIdAndUpdate(tourId, {
         ratingsAverage: stats[0].avgRating,
         ratingsQuantity: stats[0].nRating,
      });
   } else {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsAverage: 4.5,
         ratingsQuantity: 0,
      });
   }
};

reviewSchema.post('save', function (next) {
   // this points to current review
   // Review.calcAverageRatings won't available so use this.constructor.calcAverageRatings
   // this.constructor refers to model (ie Review)
   this.constructor.calcAverageRatings(this.tour);
});

// to change stats for update and delete
// ie findByIdAndUpdate and findByIdAndDelete // findOneAndUpdate is similar to findByIdAndUpdate
// we have only query middleware for that we can't have direct access to doc, so below is the hack
reviewSchema.pre(/^findOneAnd/, async function (next) {
   // we cannot use post bcz in post we don't get the query
   // here this is current query
   this.r = await this.findOne(); // execute the query which gives the doc and save to variable/property
   next();
});
reviewSchema.post(/^findOneAnd/, async function () {
   // this.r = await this.findOne(); // does't work bcz the query is already executed
   await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
