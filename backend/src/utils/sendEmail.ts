import * as nodemailer from 'nodemailer';
import { createPdfBuffer } from './createPdf';

export async function sendEmail(to: string, data: any, type: string, subject: string, message:string) {
  try {
    const pdfBuffer = await createPdfBuffer(data,type);
    
    const emailUser = process.env.ZOHO_EMAIL || 'kirill.hetman@zohomail.eu';
    const emailPassword = process.env.ZOHO_APP_PASSWORD || '';
    
    console.log('Email configuration:', {
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      user: emailUser,
      hasPassword: !!emailPassword
    });
    
    if (!emailPassword) {
      throw new Error('ZOHO_APP_PASSWORD environment variable is not set');
    }
    
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu", 
      port: 465, 
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Verify the connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${emailUser}"`,
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
    
    let errorMessage = 'Failed to send email';
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check ZOHO_EMAIL and ZOHO_APP_PASSWORD environment variables. Make sure you are using an App Password, not your regular account password.';
    } else if (error.message && error.message.includes('ZOHO_APP_PASSWORD')) {
      errorMessage = error.message;
    }
    
    return {
      code: 500,
      message: errorMessage,
    };
  }
}