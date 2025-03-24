import * as nodemailer from 'nodemailer';
import { createPdfBuffer } from './createPdf';

export async function sendEmail(to: string, data: any) {

  const pdfBuffer = await createPdfBuffer(data);
  
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
    subject: 'Offer created',
    text: 'Offer created',
    html: `
      <p>Offer created. Please find the attached PDF.</p>
      <p>You can confirm your offer by clicking the following link:</p>
      <a href="${process.env.SERVER_URL}/offer/confirm/${data.id}">Confirm Offer</a>
      <p>You can cancel your offer by clicking the following link:</p>
      <a href="${process.env.SERVER_URL}/offer/cancel/${data.id}">Cancel Offer</a>
    `,
    attachments: [
      {
        filename: 'offer.pdf',
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