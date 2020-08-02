const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

// const User = require('./userModel');

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
         set: (val) => Math.round((val * 10) / 10), // to get eg: 4.6666 as 4.7 not 5
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
      startLocation: {
         // GeoJSON
         type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
         },
         coordinates: [Number], // expect array of numbers
         address: String,
         description: String,
      },
      locations: [
         {
            type: {
               type: String,
               default: 'Point',
               enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number,
         },
      ],
      // guides: Array, // for embedded
      guides: [
         {
            type: mongoose.Schema.ObjectId,
            ref: 'User', // don't even need to import User
         },
      ],
   },
   {
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// tourSchema.index({ price: 1}); // 1 for ascending order and -1 for descending order
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound indexing
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual props
tourSchema.virtual('durationWeeks').get(function () {
   return this.duration / 7;
   // To get this key word use normal function, don't use arrow function
});

// Virtual pupulate
tourSchema.virtual('reviews', {
   ref: 'Review',
   foreignField: 'tour',
   localField: '_id',
});

// Mongoose middleware
// 1)Document Middleware
// Document Middleware: runs before(for pre) .save() and .create() nb: not on .saveMany() or other
tourSchema.pre('save', function (next) {
   // 'this' is corrently proccessing document
   this.slug = slugify(this.name, { lower: true });
   next();
});

// For Embedding tour guides --- work only for creating new document
// So need to create same login middleware to update
// This is not doing because we are not using embedded for tour guides, we use referencing(This is just a demo)
// tourSchema.pre('save', async function (next) {
//    const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//    // since we are using await inside the function map will return array of promises
//    this.guides = await Promise.all(guidesPromises); // run all promises at a time

//    next();
// });

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
// for populating guides fields
tourSchema.pre(/^find/, function (next) {
   this.populate({
      path: 'guides',
      select: '-__v -passwordChangedAt', // exclude fields
   });

   next();
});

// tourSchema.post(/^find/, function (docs, next) {
//    console.log(`Query took ${Date.now() - this.start} milliseconds`);
//    console.log(docs);
//    next();
// });

// 3) Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//    // 'this' points current aggregation object
//    // To avoid secret tour
//    this.pipeline().unshift({
//       $match: { secretTour: { $ne: true } }, // Add another stage
//    }); // unshift to add at the begening of an array
//    next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
