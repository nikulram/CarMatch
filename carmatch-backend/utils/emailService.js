const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",      // Replace with your email
    pass: "your_app_password"          // Replace with Gmail App Password
  }
});

const sendVerificationEmail = async (to, token) => {
  const url = `http://localhost:3000/verify-email?token=${token}`;
  await transporter.sendMail({
    from: '"AutoMatch" <your_email@gmail.com>',
    to,
    subject: "Verify your email",
    html: `<h4>Welcome to AutoMatch!</h4>
           <p>Click the link to verify your email:</p>
           <a href="${url}">${url}</a>`
  });
};

module.exports = { sendVerificationEmail };
