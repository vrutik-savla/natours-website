const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const catchAsyncErr = require('./../utils/catchAsyncErr');

// 182. Building the Tour Overview - Part 1
exports.getOverview = catchAsyncErr(async (req, res, next) => {
  // 1) Get Tour data from collection
  const tours = await Tour.find();

  // 2) Build Template
  // 3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

// 184. Building the Tour Page - Part 1
exports.getTour = catchAsyncErr(async (req, res, next) => {
  // 1) Get the data, for the requested Tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  // 2) Build template
  // 3) Render template using data from 1)

  if (!tour) {
    return next(new AppError(`There is no tour with that name.`, 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

// 188. Building the Login Screen
exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

// 194. Building the User Account Page
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

// 215. Rendering a User's Booked Tours
exports.getMyTours = catchAsyncErr(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with bookings
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

// 195. Updating User Data
exports.updateUserData = catchAsyncErr(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true, //to get updated doc. as a result
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
  // console.log('UPDATING USER', req.body);
});
