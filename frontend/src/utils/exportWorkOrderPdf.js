import axios from 'axios';
import { URL } from '@/utils/constants';
import { downloadPdfBlob } from '@/utils/downloadPdf';
import { getOrderDocumentNumber } from '@/utils/documentNumbers';

/**
 * Downloads work order (заказ-наряд) PDF from the company HTML template.
 * @param {string} orderId - internal order UUID
 * @param {string} [documentNumber] - offer / ZN number for fallback filename
 */
export async function downloadWorkOrderPdf(orderId, documentNumber) {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await axios.get(`${URL}/orders/${orderId}/export-pdf`, {
    responseType: 'blob',
    headers,
  });

  const fallback = documentNumber
    ? `work-order-${documentNumber}.pdf`
    : `work-order-${orderId}.pdf`;
  downloadPdfBlob(response, fallback);
}

/**
 * @param {object} order
 */
export function downloadWorkOrderPdfForOrder(order) {
  if (!order?.id) return Promise.resolve();
  return downloadWorkOrderPdf(order.id, getOrderDocumentNumber(order));
}
