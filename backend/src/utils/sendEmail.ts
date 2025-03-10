import * as nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, text: string, html?: string, pdfFilePath?: string) {

  const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com', 
    port: 587, 
    secure: false,
    auth: {
      user: 'outlook_91A721DC25DF8FF7@outlook.com',
      pass: 'your-email-password',
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

  const mailOptions: nodemailer.SendMailOptions = {
    from: '"Your Name" <outlook_91A721DC25DF8FF7@outlook.com>',
    to,
    subject,
    text,
    html,
    attachments: pdfFilePath ? [
      {
        filename: 'attachment.pdf',
        path: pdfFilePath,
        contentType: 'application/pdf'
      }
    ] : []
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