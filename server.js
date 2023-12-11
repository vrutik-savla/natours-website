const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 123. Catching Uncaught Exceptions
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  // console.log(err);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

// console.log(app.get('env '));
// console.log(process.env);

//DATABASE CONNECTION
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    // .connect(process.env.DATABASE_LOCAL, { //For local databse
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    //connection => {
    // console.log(connection);
    // console.log(connection.connections);
    console.log('DB connection is successfull!');
  });

//PORT
const port = process.env.port || 3000;
const server = app.listen(port, () => {
  // console.log(`App running on port ${port}...`);
});

// 122. Errors Outside Express: Unhandled Rejections
process.on('unhandledRejection', err => {
  console.log('UNHANDLER REJECTION! 💥 Shutting down...');
  // console.log(err);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
