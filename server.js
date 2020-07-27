const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Uncaught exception like accessing a variable which does't exist
process.on('uncaughtException', (err) => {
   console.log('UNCAUGHT EXCEPTION ----- server shutting down....');
   console.log(err.name, err.message);
   process.exit(1); // 0 for success 1 for uncalled exception
   // eg: console.log(x);
});

// Config env variables
dotenv.config({ path: './config.env' });

const app = require('./app');

// Connect to DB
mongoose
   .connect(process.env.DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
   })
   .then(() => {
      console.log('Connected to DB.....');
   });

// Set server PORT
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
   console.log(`Server listening to PORT ${PORT}`);
});

// Handle unhandled rejection like db connection
process.on('unhandledRejection', (err) => {
   console.log('UNHANDLED REJECTION ----- Shutting down....');
   console.log(err.name, err.message);
   server.close(() => {
      process.exit(1); // 0 for success 1 for uncalled exception
   });
});
