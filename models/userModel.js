const crypto = require('crypto');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [3, 'name should be more than 3 characters'],
      maxlength: [30, 'name is too long'],
   },
   email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
   },
   photo: {
      type: String,
      default: 'default.jpg',
   },
   role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
   },
   password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must have atleast 8 charecters'],
      select: false,
   },
   passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
         validator: function (el) {
            return el === this.password; // this only work on create and save
         },
         message: 'Password did not match',
      },
   },
   passwordChangedAt: Date,
   passwordResetToken: String,
   passwordResetExpires: Date,
   active: {
      type: Boolean,
      default: true,
      select: false,
   },
});

// userSchema.pre('save', async function (next) {
//    // Check if password field is modified
//    if (!this.isModified('password')) return next();

//    // Hash the password with cost of 12
//    this.password = await bcrypt.hash(this.password, 12);
//    // Delete passwordConfirm field
//    this.passwordConfirm = undefined;
//    next();
// });

userSchema.pre('save', function (next) {
   if (!this.isModified('password') || this.isNew) return next();

   this.passwordChangedAt = Date.now() - 1000; // 1000 ms added to fix small delay bug
   next();
});

userSchema.pre(/^find/, function (next) {
   // this points to current query
   this.find({ active: { $ne: false } });
   next();
});

// Instance method - method available on all documents of a certain collection
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
   return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
   if (this.passwordChangedAt) {
      const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimeStamp;
   }
   return false; // false means not changed
};

userSchema.methods.createPasswordResetToken = function () {
   const resetToken = crypto.randomBytes(32).toString('hex'); // this for user

   this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // encryped version in db
   this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min

   return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
