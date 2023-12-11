/* eslint-disable arrow-body-style */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsyncErr = require('./../utils/catchAsyncErr');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // 142. Sending JWT via Cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Remove the password form output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// 126. Creating New Users
exports.signup = catchAsyncErr(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
    active: req.body.active,
  });

  // 207. Email Templates with Pug: Welcome Emails
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();

  // 129. Signing up Users (Only when user signup)
  createSendToken(newUser, 201, res);
  /* const token = signToken(newUser._id);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  }); */
});

// 130. Logging in Users
exports.login = catchAsyncErr(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email && password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400));
  }

  // 2) Check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);

  // if (!user || !correct) {
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  // 3) If everything ok, then send Token to client
  createSendToken(user, 200, res);
  /* const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  }); */
});

// 192. Logging out Users
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

// 131. Protecting Tour Routes - Part 1
// 132. Protecting Tour Routes - Part 2
exports.protect = catchAsyncErr(async (req, res, next) => {
  // 1)Getting token and check if its their
  // So a common practice is to send a token using an http header with the request.
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    // console.log(token);

    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  // 2)Verification of token
  // In this step, we verify if someone manipulated the data or also if the token has already expired.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3)Check if user still exists
  // what if the user has been deleted in the meantime? So the token will still exist, but if the user is no longer existent, well then we actually don't want to log him in, right? Or even worse, what if the user has actually changed his password after the token has been issued? Well, that should also not work, right? For example, imagine that someone stole the JSON web token from a user. But then, in order to protect against that, the user changes his password. And so, of course, that old token that was issued before the password change should no longer be valid. So it should not be accepted to access protected routes.

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401,
      ),
    );
  }

  // 4)Check if user changed password after the token was issued
  // So step number four, check if user has recently changed their password. So basically, after the token was issued. And to implement this test, we will actually create another instance method. So basically, a method that is going to be available on all the documents. So documents are instances of a model. All right? And we do this because it's quite a lot of code that we need for this verification. And so, actually, this code belongs to the User model and not really to the controller.
  // We can call this instance method on a User document
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again'),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  res.locals.user = freshUser; //Putting freshUser on res.locals object with name user & pug templates gets access to this res.locals object
  next();
});

// 190. Logging in Users with Our API - Part 2
// Only for rendered pages, so their'll be no errors
exports.isLoggedIn = async (req, res, next) => {
  // If their is a cookie than only we execute this code else pass to next middleware
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser; //Putting curentUser on res.locals object with name user & pug templates gets access to this res.locals object
      return next();
    } catch (err) {
      // THERE IS NO LOGGED IN USER
      return next();
    }
  }
  next();
};

// 134. Authorization: User Roles and Permissions
exports.restrictTo = (...roles) => {
  //...roles is rest parameter which takes array on indefinite arguments
  return (req, res, next) => {
    // roles ['admin', 'leag-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403),
      );
    }

    next();
  };
};

// 135. Password Reset Functionality: Reset Token
exports.forgotPassword = catchAsyncErr(async (req, res, next) => {
  // 1)Get user based on POSTed email address
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address.', 404));
  }

  // 2)Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3)Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`;

    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token, (valid for 10 minutes.)',
    //   message,
    // });

    // 208. Sending Password Reset Emails
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token send to email.',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error with sending the email. Try again later!',
        500,
      ),
    );
  }
});

// 137. Password Reset Functionality: Setting New Password
exports.resetPassword = catchAsyncErr(async (req, res, next) => {
  // 1)Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2)If token has not expired, and their is user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3)Update changePasswordAt property for the user
  // 4)Log the user in, send JWT
  createSendToken(user, 200, res);
  /* const token = signToken(user.id);
  res.status(200).json({
    status: 'success',
    token,
  }); */
});

// 138. Updating the Current User: Password
exports.updatePassword = catchAsyncErr(async (req, res, next) => {
  // 1)Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2)Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3)If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4)Log user In, send JWT
  createSendToken(user, 200, res);
});
