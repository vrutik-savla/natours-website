// 192. Logging out Users
// what we're gonna do instead is to create a very simple log out route that will simply send back a new cookie with the exact same name but without the token. And so that will then override the current cookie that we have in the browser with one that has the same name but no token. And so when that cookie is then sent along with the next request, then we will not be able to identify the user as being logged in. And so this will effectively then log out the user. And also were gonna give this cookie a very short expiration time. And so this will effectively be a little bit like deleting the cookie but with a very clever workaround like this

// exports.logout = (req, res) => {
//   res.cookie('jwt', 'loggedout', {
//     expires: new Date(Date.now() + 10 * 1000),
//     httpOnly: true,
//   });
//   res.status(200).json({
//     status: 'success',
//   });
// };

// router.get('/logout', authController.logout);

// export const logout = async () => {
//   try {
//     const result = await axios({
//       methor: 'GET',
//       url: '/api/v1/users/logout',
//     });

//     if (result.data.status === 'success') location.reload(true);
//   } catch (err) {
//     console.log(err.response);
//     showAlert('error', 'Error logging out! Try again.');
//   }
// };

if (process.env.NODE_ENV === 'production') {
      //sendinBlue
      return nodemailer.createTransport({
        service: 'SendinBlue',
        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });