import axios from 'axios';
import { URL } from '@/utils/constants';
import { downloadPdfBlob } from '@/utils/downloadPdf';

/**
 * Creates an invoice from an offer (if it does not exist yet).
 */
export async function createInvoiceFromOffer(offerId) {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await axios.post(`${URL}/invoice/from-offer/${offerId}`, null, { headers });
  return response.data;
}

/**
 * Downloads invoice PDF for an offer (creates invoice automatically if missing).
 */
export async function downloadInvoicePdfByOffer(offerId) {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(`${URL}/invoice/by-offer/${offerId}/export-pdf`, {
    responseType: 'blob',
    headers,
  });

  downloadPdfBlob(response, `invoice-${offerId}.pdf`);
}

/**
 * Sends invoice PDF to email (creates invoice automatically if missing).
 */
/**
 * @param {string} offerId
 * @param {{ email?: string; useCustomerEmail?: boolean }} payload
 */
export async function sendInvoiceEmailByOffer(offerId, payload) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
  const response = await axios.post(
    `${URL}/invoice/by-offer/${offerId}/send-email`,
    payload,
    { headers },
  );
  return response.data;
}
