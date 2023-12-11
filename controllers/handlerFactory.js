const catchAsyncErr = require('./../utils/catchAsyncErr');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

// 161. Building Handler Factory Functions: Delete
exports.deleteOne = Model =>
  catchAsyncErr(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`No document found with this ID.`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

// 162. Factory Functions: Update and Create
exports.updateOne = Model =>
  catchAsyncErr(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`No document found with this ID.`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// 162. Factory Functions: Update and Create
exports.createOne = Model =>
  catchAsyncErr(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// 163. Factory Functions: Reading
exports.getOne = (Model, populateOption) =>
  catchAsyncErr(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOption) query = query.populate(populateOption);
    const doc = await query;

    if (!doc) {
      return next(new AppError(`No document found with that ID.`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

// 163. Factory Functions: Reading
exports.getAll = Model =>
  catchAsyncErr(async (req, res, next) => {
    //
    // To allow for nested GET reviews on tour (HACK)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const doc = await features.query;
    // const doc = await features.query.explain();

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
