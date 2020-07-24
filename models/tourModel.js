const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// Tour Schema
const tourSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: [true, 'A tour must have a name'],
         unique: true,
         trim: true,
         maxlength: [40, 'A tour name must have less or equal 40 characters'],
         minlength: [8, 'A tour name must have more or equal 8 characters'],
         // validate: [validator.isAlpha, 'name should contain only charecters'], ===> this will not allow space in name, so commenting this out
      },
      slug: String,
      duration: {
         type: Number,
         required: [true, 'A tour must have a duration'],
      },
      maxGroupSize: {
         type: Number,
         required: [true, 'A tour must have a group size'],
      },
      difficulty: {
         type: String,
         required: [true, 'A tour must have a difficulty'],
         enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium ,difficult',
         },
      },
      ratingsAverage: {
         type: Number,
         default: 4.5,
         min: [1, 'Rating must be above 1.0'],
         max: [5, 'Rating must be below 5.0'],
      },
      ratingsQuantity: {
         type: Number,
         default: 0,
      },
      price: {
         type: Number,
         required: [true, 'A tour must have a price'],
      },
      priceDiscount: {
         type: Number,
         // Custom validator
         validate: {
            validator: function (val) {
               // to get 'this' keyword use normal function not arrow function
               // this only points to current doc on NEW document creation not on update
               return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price',
         },
      },
      summary: {
         type: String,
         trim: true,
         required: [true, 'A tour must have a summary'],
      },
      description: {
         type: String,
         trim: true,
      },
      imageCover: {
         type: String,
         required: [true, 'A tour must have a cover image'],
      },
      images: [String],
      createdAt: {
         type: Date,
         default: Date.now(),
         select: false, // To permenantly hide from the users
      },
      startDates: [Date],
      secretTour: {
         type: Boolean,
         default: false,
      },
   },
   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Virtual props
tourSchema.virtual('durationWeeks').get(function () {
   return this.duration / 7;
   // To get this key word use normal function, don't use arrow function
});

// Mongoose middleware
// 1)Document Middleware
// Document Middleware: runs before(for pre) .save() and .create() nb: not on .saveMany() or other
tourSchema.pre('save', function (next) {
   // 'this' is corrently proccessing document
   this.slug = slugify(this.name, { lower: true });
   next();
});
// tourSchema.pre('save', function (next) {
//    console.log('will save document.....');
//    next();
// });

// // Post middleware
// tourSchema.post('save', function (doc, next) {
//    console.log(doc);
//    next();
// });

// 2) Query middleware
tourSchema.pre(/^find/, function (next) {
   // /^find/ means all queries starts with find(include .find() .findOne()
   // 'this' here is a query object
   this.find({
      secretTour: { $ne: true }, // To avoid secret tour
   });
   // this.start = Date.now();
   next();
});

// tourSchema.post(/^find/, function (docs, next) {
//    console.log(`Query took ${Date.now() - this.start} milliseconds`);
//    console.log(docs);
//    next();
// });

// 3) Aggregation middleware
tourSchema.pre('aggregate', function (next) {
   // 'this' points current aggregation object
   // To avoid secret tour
   this.pipeline().unshift({
      $match: { secretTour: { $ne: true } }, // Add another stage
   }); // unshift to add at the begening of an array
   next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
