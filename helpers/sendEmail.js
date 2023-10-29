import nodemailer from "nodemailer";
import "dotenv/config";

const { GMAIL_EMAIL, GMAIL_PASSWORD } = process.env;

const nodemailerConfig = {
  // host: "smtp.ukr.net",
  // port: 465,
  // secure: true,
  // auth: {
  //   user: UKR_NET_EMAIL,
  //   pass: UKR_NET_PASSWORD,
  // }

  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_PASSWORD,
  }
};

const transport = nodemailer.createTransport(nodemailerConfig);

// const data = {
//   to: "pigijiv623@weirby.com",
//   subject:"test subject",
//   html:"<h1>Test text</h1>",
// }


const sendEmail = (data) => {
  const email = { ...data, from: GMAIL_EMAIL };
  return transport.sendMail(email);
}

export default sendEmail;