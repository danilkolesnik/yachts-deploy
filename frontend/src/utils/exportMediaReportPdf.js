import axios from 'axios';
import { URL } from '@/utils/constants';

/**
 * Downloads media report PDF (Before / In Progress / Result sections).
 * @param {string} orderId
 */
export async function downloadMediaReportPdf(orderId) {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(`${URL}/orders/${orderId}/export-media-pdf`, {
    responseType: 'blob',
    headers,
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `media-report-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
