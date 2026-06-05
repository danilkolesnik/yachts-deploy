import axios from 'axios';
import { URL } from '@/utils/constants';

/**
 * @param {string} offerId
 * @param {{ email?: string; useCustomerEmail?: boolean }} payload
 */
export async function sendOfferEmail(offerId, payload) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
  const response = await axios.post(`${URL}/offer/${offerId}/send-email`, payload, {
    headers,
  });
  return response.data;
}
