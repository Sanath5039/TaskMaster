const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { generateOTP, hashOTP } = require('./services/otpService');

async function test() {
  await mongoose.connect('mongodb+srv://sanath_user:sanath_user@cluster0.rmbqtfx.mongodb.net/taskmaster?retryWrites=true&w=majority');
  console.log("Connected to DB");

  const email = 'sanathkumar017@gmail.com';
  
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log("User not found!");
      process.exit(0);
    }
    
    console.log("User found, testing matchPassword...");
    await user.matchPassword('Test1234!'); // doesn't matter if it fails match

    console.log("Testing saving OTP fields...");
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    user.otpHash = hashedOtp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60000);
    user.otpPurpose = 'login';
    user.otpAttempts = 0;
    
    await user.save();
    console.log("Save successful!");
  } catch (error) {
    console.error("Error during login logic:", error.message, error.stack);
  }
  process.exit(0);
}

test();
