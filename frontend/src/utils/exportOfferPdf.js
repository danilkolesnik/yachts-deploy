import axios from 'axios';
import { URL } from '@/utils/constants';
import { downloadPdfBlob } from '@/utils/downloadPdf';

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

  downloadPdfBlob(response, `offer-${offerId}.pdf`);
}
