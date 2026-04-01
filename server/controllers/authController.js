const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateOTP, hashOTP, verifyOTP: verifyHashedOTP } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');

// Constants
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_VERIFY_ATTEMPTS = 5;

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

// @desc    Register a new user (with OTP)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ email }).select('+otpExpiresAt');
    
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.name = name;
      user.password = password; // Will be hashed via pre-save hook
      user.otpHash = hashedOtp;
      user.otpExpiresAt = expiresAt;
      user.otpPurpose = 'signup';
      user.otpAttempts = 0;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name,
        email,
        password,
        isVerified: false,
        otpHash: hashedOtp,
        otpExpiresAt: expiresAt,
        otpPurpose: 'signup',
        otpAttempts: 0
      });
    }

    // Send Email (Don't await to speed up response, though safer to handle failures)
    sendOTPEmail(email, name, otp, 'signup').catch(err => console.error('Email error:', err));

    res.status(200).json({
      message: 'OTP_SENT_SIGNUP',
      email: user.email,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user (send OTP)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user + include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Security: Use generic message
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If not verified, they must verify first (rare case if signup flow followed)
    if (!user.isVerified) {
       return res.status(403).json({ message: 'UNVERIFIED_ACCOUNT', email: user.email });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Credentials valid! Now generate and send OTP for 2FA
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    user.otpHash = hashedOtp;
    user.otpExpiresAt = expiresAt;
    user.otpPurpose = 'login';
    user.otpAttempts = 0;
    await user.save();

    sendOTPEmail(user.email, user.name, otp, 'login').catch(err => console.error('Email error:', err));

    res.json({
      message: 'OTP_SENT_LOGIN',
      email: user.email,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: `Server error during login: ${error.message}` });
  }
};

// @desc    Verify OTP for signup or login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  const { email, otp, purpose } = req.body;

  try {
    if (!email || !otp || !purpose) {
      return res.status(400).json({ message: 'Email, OTP and purpose are required' });
    }

    const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt +otpAttempts +otpPurpose');
    
    if (!user || user.otpPurpose !== purpose) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Check attempts limit
    if (user.otpAttempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(403).json({ message: 'Too many failed attempts. Please resend a new code.' });
    }

    // Check expiry
    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Verify code
    const isValid = await verifyHashedOTP(otp, user.otpHash);
    
    if (!isValid) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Success!
    if (purpose === 'signup') {
      user.isVerified = true;
    }
    
    // Clear OTP fields
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpPurpose = 'null';
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  const { email, purpose } = req.body;

  try {
    if (!email || !purpose) {
      return res.status(400).json({ message: 'Email and purpose are required' });
    }

    const user = await User.findOne({ email }).select('+otpExpiresAt');
    if (!user) {
      return res.status(200).json({ message: 'If this email exists, a new code has been sent.' });
    }

    // Cooldown check (if OTP still valid and sent recently)
    // We check if (expiry - now) > (expiry_duration - cooldown_duration)
    // simpler: allow resend only if enough time has passed from "last generated time"
    // Since we don't store "lastGeneratedAt", we use a simple check vs otpExpiresAt
    // If otpExpiresAt is more than 4 minutes in the future (meaning it was generated less than 60s ago)
    const timeUntilExpiry = user.otpExpiresAt - Date.now();
    const threshold = (OTP_EXPIRY_MINUTES * 60 - RESEND_COOLDOWN_SECONDS) * 1000;
    
    if (timeUntilExpiry > threshold) {
      return res.status(429).json({ message: `Please wait ${Math.ceil((timeUntilExpiry - threshold)/1000)}s before resending.` });
    }

    const otp = generateOTP();
    user.otpHash = await hashOTP(otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
    user.otpPurpose = purpose;
    user.otpAttempts = 0;
    await user.save();

    sendOTPEmail(user.email, user.name, otp, purpose).catch(err => console.error('Email error:', err));

    res.json({ message: 'OTP_RESENT' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ message: 'Server error during resend' });
  }
};

// @desc    Get logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.createdAt,
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe, verifyOTP, resendOTP };
