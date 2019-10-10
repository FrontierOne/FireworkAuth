const nodemailer = require('nodemailer');
var config = require('./config');

   const transporter = nodemailer.createTransport({
    service: config.mailer.service,
    auth: {
           user: config.mailer.username,
           pass: config.mailer.password
       }
   });

 module.exports = transporter;