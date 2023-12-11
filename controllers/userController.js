const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsyncErr = require('./../utils/catchAsyncErr');
const factory = require('./handlerFactory');

// 200. Configuring Multer
// 199. Image Uploads Using Multer: Users
/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // user-83472983829180u2u18328913.jpeg
    const extension = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
  },
}); */
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  // In this func, goal is to test if the uploaded file is an image. (Here, you can test forany file, e.g: csv, json, html, js, etc)
  if (file.mimetype.startsWith('image')) {
    // image/jpeg // image/png // image/bitmap ...
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};
// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadUserPhoto = upload.single('photo');

// 202. Resizing Images
exports.resizeUserPhoto = catchAsyncErr(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  // console.log(newObj);
  return newObj;
};

// 61. Implementing the "Users" Routes
// 130. Logging in Users
exports.getAllUsers = factory.getAll(User);
/* exports.getAllUsers = catchAsyncErr(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
}); */

// 164. Adding a /me Endpoint
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// 139. Updating the Current User: Data
exports.updateMe = catchAsyncErr(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  // 1)Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2) Filtered out unwanted fields names which are not allowed to be updated
  // req.body.role: 'admin' NOT ALLOWED
  const filteredBody = filterObj(req.body, 'name', 'email');
  // 201. Saving Image Name to Database
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, //returns new updated object instead of old one in updatedUser
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// 140. Deleting the Current User
exports.deleteMe = catchAsyncErr(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup instead.',
  });
};

exports.getUser = factory.getOne(User);

// Do NOT update Passwords with this!
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);
