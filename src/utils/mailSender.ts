import { AppError } from './appError';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.APP_GMAIL,
    pass: process.env.APP_PASSWORD_GMAIL,
  },
});

export default async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Send mail with defined transport object
    await transporter.sendMail({
      from: 'NexaRide' + process.env.APP_GMAIL,
      to: to,
      subject: subject,
      text: 'This is a plain text message',
      html: html,
    });

    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
