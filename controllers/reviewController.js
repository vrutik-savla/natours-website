const Review = require('./../models/reviewModel');
// const catchAsyncErr = require('./../utils/catchAsyncErr');
const factory = require('./handlerFactory');

// 155. Creating and Getting Reviews
exports.getAllReviews = factory.getAll(Review);
/*exports.getAllReviews = catchAsyncErr(async (req, res, next) => {
  // 160. Adding a Nested GET Endpoint
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
}); */

// 155. Creating and Getting Reviews
exports.setTourUserIds = (req, res, next) => {
  // 158. Implementing Simple Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.createReview = factory.createOne(Review);
/* exports.createReview = catchAsyncErr(async (req, res, next) => {
  // 158. Implementing Simple Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const newReview = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
}); */

exports.getReview = factory.getOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
