import * as nodemailer from 'nodemailer';
import { createPdfBuffer } from './createPdf';

export async function sendEmail(to: string, data: any, type: string, subject: string, message:string) {
  try {
    console.log('[EMAIL] Starting email send process...');
    console.log('[EMAIL] Parameters:', { to, type, subject, messageLength: message?.length });
    
    console.log('[EMAIL] Creating PDF buffer...');
    const pdfBuffer = await createPdfBuffer(data,type);
    console.log('[EMAIL] PDF buffer created, size:', pdfBuffer?.length, 'bytes');
    
    const emailUser = process.env.ZOHO_EMAIL || 'kirill.hetman@zohomail.eu';
    const emailPassword = process.env.ZOHO_APP_PASSWORD || '';
    
    console.log('[EMAIL] Email configuration:', {
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      user: emailUser,
      hasPassword: !!emailPassword,
      passwordLength: emailPassword?.length || 0
    });
    
    if (!emailPassword) {
      console.error('[EMAIL] ERROR: ZOHO_APP_PASSWORD environment variable is not set');
      throw new Error('ZOHO_APP_PASSWORD environment variable is not set');
    }
    
    console.log('[EMAIL] Creating SMTP transporter...');
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu", 
      port: 465, 
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    console.log('[EMAIL] Verifying SMTP connection...');
    // Verify the connection configuration
    await transporter.verify();
    console.log('[EMAIL] ✓ SMTP connection verified successfully');

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

    console.log('[EMAIL] Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachments: !!mailOptions.attachments && mailOptions.attachments.length > 0,
      attachmentFilename: mailOptions.attachments?.[0]?.filename
    });

    console.log('[EMAIL] Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] ✓ Email sent successfully!');
    console.log('[EMAIL] Response details:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      envelope: info.envelope
    });
    
    if (info.rejected && info.rejected.length > 0) {
      console.warn('[EMAIL] WARNING: Some recipients were rejected:', info.rejected);
    }
    
    if (!info.messageId) {
      console.warn('[EMAIL] WARNING: No messageId received from SMTP server');
    }
    
    return {
      code: 200,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error('[EMAIL] ✗ ERROR occurred during email send process');
    console.error('[EMAIL] Error type:', error?.constructor?.name);
    console.error('[EMAIL] Error message:', error?.message);
    console.error('[EMAIL] Error stack:', error?.stack);
    console.error('[EMAIL] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[EMAIL] Error details:', {
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
      errno: error?.errno,
      syscall: error?.syscall,
      hostname: error?.hostname,
      port: error?.port
    });
    
    let errorMessage = 'Failed to send email';
    if (error?.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check ZOHO_EMAIL and ZOHO_APP_PASSWORD environment variables. Make sure you are using an App Password, not your regular account password.';
      console.error('[EMAIL] Authentication error detected. Check credentials.');
    } else if (error?.message && error.message.includes('ZOHO_APP_PASSWORD')) {
      errorMessage = error.message;
    } else if (error?.code === 'ECONNECTION' || error?.code === 'ETIMEDOUT') {
      errorMessage = `Connection error: ${error.message}. Check network connectivity and SMTP server availability.`;
      console.error('[EMAIL] Connection error detected.');
    } else if (error?.code === 'EENVELOPE') {
      errorMessage = `Envelope error: ${error.message}. Check recipient email address.`;
      console.error('[EMAIL] Envelope error detected.');
    }
    
    return {
      code: 500,
      message: errorMessage,
      errorCode: error?.code,
      errorResponse: error?.response
    };
  }
}