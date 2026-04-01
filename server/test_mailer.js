const nodemailer = require('nodemailer');

try {
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: undefined,
      pass: undefined,
    },
  });
  console.log("No error from createTransport");
} catch (e) {
  console.log("Error from createTransport:", e.message);
}
