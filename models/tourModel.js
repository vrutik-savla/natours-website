const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel'); Lec-151
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    //1st Argu: Schema Definition
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less or equal than 40 characters.',
      ],
      minlength: [
        10,
        'A tour name must have more or equal than 10 characters.',
      ],
      // validate: [validator.isAlpha, 'Tour name must only contain characters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult.',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be below 5.0'],
      set: val => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current document on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below the regular price.',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    // 150. Modelling Locations (Geospatial Data)
    startLocation: {
      //This object that we specified here is actually, this time, not for the schema type option as we have it, for example, up there, which is for the schema type options, remember tha. But now, this object here is actually we call an embedded object And so inside this object we can specify a couple of properties. All right, and in order for this object to be recognize as geospatial JSON, we need the type and the coordinates properties.
      // GeoJSON
      type: {
        type: String,
        default: 'Point', //'Polygons', 'Lines'
        enum: ['Point'],
      },
      coordinates: [Number], //Array of coordinates, so that basically means that we expect an array of number and this array, as the name says, is the coordinate of the point with the longitude first and only second the latitude. And it's a bit counterintuitive because usually it works the OTHER WAY AROUND. But in GeoJSON, that's just how it works.
      address: String,
      description: String,
    },
    locations: [
      //Embedded document: We always need to use this array. And so by specifying basically an array of objects this will then create brand new document inside of the parent document which is, in this case, the tour.
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
    // guides: Array, Lec-151
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    //2nd Argu: Object for options
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 167. Improving Read Performance with Indexes
// tourSchema.index({ price: 1 }); //Single Field Indexing
tourSchema.index({ price: 1, ratingsAverage: -1 }); //Compound Indexing
tourSchema.index({ slug: 1 });

tourSchema.index({ startLocation: '2dsphere' });

// 104. Virtual Properties
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// 157. Virtual Populate: Tours and Reviews
tourSchema.virtual('reviews', {
  //1st Name of field, 2nd Object of options
  ref: 'Review', //Referenceing model name
  foreignField: 'tour', //Foreign field, this is the name of the field in the other model, i.e in the Review model, wwhere the reference to the current model is stored & i.e, in this case, the Tour field. So, let's take look at that. And so, again, in our review model, we have a field called 'Tour.' And so this is where the ID of the tour is being stored. And so that's why here, in this foreign field, we specify that name of that field in order to connect these two models.
  localField: '_id', //We need to do the same for the current model. So, we need to say where that ID is actually stored here in this current Tour model. So, local field. And that is, the ID. So, _id, okay? And so, again, this _ID, which is how it's called in the local model, is called 'Tour' in the foreign model. So, in the Review model. Okay? And so again, this is how we connect these two models together.
});

// 105. DOCUMENT MIDDLEWARE: Runs only before .save() and .create()
tourSchema.pre('save', function (next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});
/* tourSchema.pre('save', function (next) {
  console.log('Will save document... ');
  next();
});
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
}); */

// 151. Modelling Tour Guides: Embedding
/* tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);

  next();
}); */

// 106. QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// 153. Populating Tour Guides
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

// 106. Query Middleware
/* tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds.`);
  // console.log(docs);
  next();
}); */

// 107. Aggregation Middleware
tourSchema.pre('aggregate', function (next) {
  // The idea is simply to check if the pipeline's object is not empty and if '$geoNear' key is there.
  // Hide secret tours if geoNear is used

  if (!(this.pipeline().length > 0 && '$geoNear' in this.pipeline()[0])) {
    this.pipeline().unshift({
      $match: { secretTour: { $ne: true } },
    });
    // console.log(this);
    // console.log(this.pipeline());
  }

  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
