//Users Route
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

// signup & login
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// paswords
router.post('/forgotPassword', authController.forgotPassword); //Receives email
router.patch('/resetPassword/:token', authController.resetPassword); //Receives token + new password

// PROTECT all routes By allowing only LOGGED IN users after this middleware...
router.use(authController.protect); // This will protect all router coming after this middleware, becoz middleware always runs in a sequence.

// user
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
router.delete('/deleteMe', userController.deleteMe);

// PROTECT all routes By ADMIN after this middleware...
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
