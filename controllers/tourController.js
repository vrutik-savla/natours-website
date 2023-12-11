const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsyncErr = require('./../utils/catchAsyncErr');
const AppError = require('./../utils/appError');
// const APIFeatures = require('./../utils/apiFeatures');
const factory = require('./handlerFactory');

// 204. Uploading Multiple Images: Tours
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
// upload.single('image') req.file
// upload.array('images', 3) req.files
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// 205. Processing Multiple Images
exports.resizeTourImages = catchAsyncErr(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1)Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2)Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  // console.log(req.body);
  next();
});

// 52. Starting Our API: Handling GET Requests
/* const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),
); */

/* exports.checkID = (req, res, next, val) => {
  // console.log(`Tour id is ${val}.`);

  if (+req.params.id >= tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
}; */

/* exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price.',
    });
  } 
  next();
}; */

exports.aliasTopTours = (req, _, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// 163. Factory Functions: Reading
exports.getAllTours = factory.getAll(Tour);
/* exports.getAllTours = catchAsyncErr(async (req, res, next) => {
  // console.log(req.requestTime);
  //route handler
  // const tours = await Tour.find({
  //     duration: 5,
  //     difficulty: 'easy',
  //   });
  //   const query = await Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');

  // EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      // tours: tours,
      tours,
    },
  });
  // console.log(req.query, queryObj);
}); */

// 54. Responding to URL Parameters &&
// 153. Populating Tour Guides &&
// 163. Factory Functions: Reading
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
/* exports.getTour = catchAsyncErr(async (req, res, next) => {
  // console.log(req.params);
  // const id = +req.params.id;
  // const tour = tours.find(el => el.id === id);
  const tour = await Tour.findById(req.params.id).populate('reviews');
  // .populate({
  //   path: 'guides',
  //   select: '-__v -passwordChangedAt',
  // }); 
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError(`No tour found with that ID.`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
}); */

// 53. Handling POST Requests
exports.createTour = factory.createOne(Tour);
/* exports.createTour = catchAsyncErr(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });

   try {
    // const newTour = new Tour();
    // newTour.save();
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err,
    });
  } */

/* // console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;
  // eslint-disable-next-line prefer-object-spread
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    err => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    },
    ); 
}); */

// 55. Handling PATCH Requests
exports.updateTour = factory.updateOne(Tour);
/* exports.updateTour = catchAsyncErr(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError(`No tour found with that ID.`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
}); */

// 56. Handling DELETE Requests
exports.deleteTour = factory.deleteOne(Tour);
/* exports.deleteTour = catchAsyncErr(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`No tour found with that ID.`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
}); */

// 102. Aggregation Pipeline: Matching and Grouping
exports.getTourStats = catchAsyncErr(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // { $match: { _id: { $ne: 'EASY' } },  },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// 103. Aggregation Pipeline: Unwinding and Projectin…
exports.getMonthlyPlan = catchAsyncErr(async (req, res, next) => {
  const year = +req.params.year;

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
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// 171. Geospatial Queries: Finding Tours Within Radius
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsyncErr(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  // console.log(distance, lat, lng, unit);

  // Query
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

// 172. Geospatial Aggregation: Calculating Distances
// /distances/34.111745,-118.113491/unit/mi
exports.getDistances = catchAsyncErr(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point',
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
