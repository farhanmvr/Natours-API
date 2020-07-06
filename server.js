const dotenv = require('dotenv');
// Config env variables
dotenv.config({ path: './config.env' });

const app = require('./app');
// console.log(process.env);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
   console.log(`Server listening to PORT ${PORT}`);
});
