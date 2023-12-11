const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');

// 154. Modelling Reviews: Parent Referencing
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty.'],
    },
    rating: {
      type: Number,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Query Middleware
// 170. Preventing Duplicate Reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// 156. Populating Reviews
reviewSchema.pre(/^find/, function (next) {
  /* this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  }); */

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// 168. Calculating Average Rating on Tours - Part 1
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    // this points to current Model
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.post('save', function (next) {
  // this points to document that is currently being saved
  //this.constructor; //currentDoc.modelWhoCreatedThatDoc
  this.constructor.calcAverageRatings(this.tour);

  // next(); POST Middleware doesn't get access to next()
});

// 169. Calculating Average Rating on Tours - Part 2
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Goal is to get access to the current review document, but here, the this keyword is the current query. Now, how are we going to go around this? Well, we can basically execute a query, and then that will give us the document that's currently being processed. So in order to do that, we can use findOne. And that's it. So then all we need to do is await this query and then save it somewhere.
  this.currReview = await this.findOne();
  // console.log(this.currReview);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); Does not work here, query has already executed
  await this.currReview.constructor.calcAverageRatings(this.currReview.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

// POST /tour/24589hew322/reviews
// GET /tour/24589hew322/reviews
// GET /tour/24589hew322/reviews/38924jdw728
