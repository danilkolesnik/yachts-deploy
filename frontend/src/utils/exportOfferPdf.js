import axios from 'axios';
import { URL } from '@/utils/constants';

/**
 * Downloads an offer PDF generated on the server from the approved HTML template.
 * @param {string} offerId
 * @returns {Promise<void>}
 */
export async function downloadOfferPdf(offerId) {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(`${URL}/offer/${offerId}/export-pdf`, {
    responseType: 'blob',
    headers,
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `offer-${offerId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
