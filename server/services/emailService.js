const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer transporter based on environment variables
 * Expected variables: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an OTP code to a user's email
 * @param {string} to 
 * @param {string} name 
 * @param {string} otp 
 * @param {string} purpose - 'signup' or 'login'
 */
const sendOTPEmail = async (to, name, otp, purpose = 'signup') => {
  const transporter = createTransporter();
  
  const isSignup = purpose === 'signup';
  const subject = isSignup 
    ? '✨ TaskMaster: Verify your email address' 
    : '🛡️ TaskMaster: Your login verification code';
  
  const title = isSignup ? 'Welcome to TaskMaster!' : 'Security Verification';
  const actionText = isSignup 
    ? 'To complete your registration, please use the following verification code:' 
    : 'A login attempt was made using your credentials. Please enter the following code to continue:';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1a2238; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #7c5cff, #9e85ff); padding: 32px; text-align: center; color: white; }
        .content { padding: 40px; text-align: center; background: #ffffff; }
        .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
        .otp-box { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 32px 0; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #7c5cff; border: 2px dashed #cbd5e1; }
        .welcome { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
        .description { font-size: 16px; line-height: 1.6; color: #475569; }
        .warning { font-size: 13px; color: #94a3b8; margin-top: 32px; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 28px;">TaskMaster</h1>
        </div>
        <div class="content">
          <div class="welcome">${title}</div>
          <p class="description">Hi ${name},</p>
          <p class="description">${actionText}</p>
          
          <div class="otp-box">${otp}</div>
          
          <p class="description">This code is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
          
          <div class="warning">
            Note: For your security, never share this code with anyone. TaskMaster support will never ask for your OTP.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} TaskMaster. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"TaskMaster" <no-reply@taskmaster.app>',
    to,
    subject,
    html,
  });
};

module.exports = {
  sendOTPEmail,
};
