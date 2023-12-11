const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsyncErr = require('./../utils/catchAsyncErr');
const factory = require('./handlerFactory');

// 211. Integrating Stripe into the Back-End
exports.getCheckoutSession = catchAsyncErr(async (req, res, next) => {
  // 1) GET the currentlt booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // 214. Creating New Bookings on Checkout Success
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,

    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // 3) Send session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// 214. Creating New Bookings on Checkout Success
// TEMPERORY (UNSECURE, everyone can make bookings without paying)
exports.createBookingCheckout = catchAsyncErr(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

// 216. Finishing the Bookings API
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
