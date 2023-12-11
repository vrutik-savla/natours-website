// 213. Modelling the Bookings
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // parent referencing
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  // parent referencing
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },
  //
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

// For populating Tour & User
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
