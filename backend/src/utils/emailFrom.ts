/** Display name shown in the recipient's inbox (not the SMTP login). */
export const EMAIL_SENDER_NAME =
  process.env.EMAIL_SENDER_NAME || 'All Services Marine';

export function getEmailFromAddress(
  emailUser: string = process.env.ZOHO_EMAIL || 'kirill.hetman@zohomail.eu',
): string {
  return `"${EMAIL_SENDER_NAME}" <${emailUser}>`;
}
