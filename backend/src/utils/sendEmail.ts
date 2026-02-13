import * as nodemailer from 'nodemailer';
import { createPdfBuffer } from './createPdf';

export async function sendEmail(to: string, data: any, type: string, subject: string, message:string) {
  try {
    const pdfBuffer = await createPdfBuffer(data,type);
    
    console.log('Email configuration:', {
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      user: process.env.ZOHO_EMAIL,
      hasPassword: !!process.env.ZOHO_APP_PASSWORD
    });
    
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu", 
      port: 465, 
      secure: true,
      auth: {
        user: 'kirill.hetman@zohomail.eu',
        pass: 'fV3U2ZA#u4:6$Gg',
      },
    });

    // Verify the connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"kirill.hetman@zohomail.eu"`,
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

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return {
      code: 200,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    return {
      code: 500,
      message: 'Failed to send email',
    };
  }
}