/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require('nodemailer');
// const sendinBlueTransport = require('nodemailer-sendinblue-transport');
const pug = require('pug');
const { convert } = require('html-to-text');

// 206. Building a Complex Email Handler
// idea: new Email(user, url).sendWelcome();
// idea: new Email(user, url).sendResetPassword();
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Vrutik Savla <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Brevo-SendInBlue (sendgrid)
      // 209. Using Sendgrid for "Real" Emails
      return nodemailer.createTransport({
        // service: 'SendinBlue',
        host: process.env.SENDINBLUE_HOST,
        port: process.env.SENDINBLUE_PORT,
        // secure: false,
        auth: {
          user: process.env.SENDINBLUE_USERNAME,
          pass: process.env.SENDINBLUE_PASSWORD,
        },
      });
    }

    // 1)Create a transporter
    return nodemailer.createTransport({
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send actual email
  async send(template, subject) {
    // 1)Render HTML based on pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    // 3)Actually send the email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  // 208. Sending Password Reset Emails
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes',
    );
  }
};

// 136. Sending Emails with Nodemailer
/*
const sendEmail = async options => {
  // 1)Create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // logger: true,
    secure: false,
    // Activate in gmail "less secure app" option
  });

  // 2)Define the email options
  const mailOptions = {
    from: 'Vrutik Savla <vrutiksavla2003@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // 3)Actually send the email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
*/
