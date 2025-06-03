import * as nodemailer from 'nodemailer';
import { createPdfBuffer } from './createPdf';

export async function sendEmail(to: string, data: any, type: string, subject: string, message:string) {
  console.log(to, data, type, subject, message);

  const pdfBuffer = await createPdfBuffer(data,type);
  
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.eu", 
    port: 465, 
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_APP_PASSWORD,
    },
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"${process.env.ZOHO_EMAIL}"`,
    to,
    subject,
    text: 'Offer created',
    html: message,
    attachments: [
      {
        filename: `${type}.pdf`,
        content: pdfBuffer
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return {
      code: 200,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email: %s', error);
    return {
      code: 500,
      message: 'Failed to send email',
    };
  }
}