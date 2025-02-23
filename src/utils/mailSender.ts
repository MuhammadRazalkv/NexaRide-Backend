
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'nexaridee@gmail.com', // Ensure this is set properly
    pass: 'cfwrevnvmmvxnoat', // Ensure this is set properly
  },
});

export default async function sendEmail(to : string, subject : string, html : string) {
  try {
    // Send mail with defined transport object
    await transporter.sendMail({
      from: process.env.APP_GMAIL, // Optional: add the sender's email
      to: to,
      subject: subject, // Subject line
      text: "This is a plain text message", // fallback if html doesn't work
      html: html
    });


    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


