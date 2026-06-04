import axios from 'axios';
import { URL } from '@/utils/constants';

const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000;

export function isVideoFile(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('video/')) return true;
  const name = (file.name || '').toLowerCase();
  return /\.(mp4|mov|webm|avi|mkv|m4v|mpeg|mpg|3gp)$/i.test(name);
}

export function getUploadErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data?.message) {
      return Array.isArray(data.message)
        ? data.message.join(', ')
        : String(data.message);
    }
    if (error.code === 'ECONNABORTED') {
      return 'Upload timed out. Try a smaller file or check your connection.';
    }
    if (error.response?.status === 413) {
      return 'File is too large (max 500 MB).';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to upload files.';
    }
    if (error.response?.status === 401) {
      return 'Session expired. Please sign in again.';
    }
  }
  return error?.message || 'Upload failed';
}

/**
 * @param {string} url
 * @param {File} file
 * @param {{ onProgress?: (percent: number) => void }} [options]
 */
export async function postMediaFormData(url, file, { onProgress } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(url, formData, {
    timeout: UPLOAD_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      const percent = Math.round((event.loaded * 100) / event.total);
      onProgress(percent);
    },
  });

  const fileUrl = response.data?.file?.url;
  if (!fileUrl) {
    throw new Error(
      response.data?.message || 'Upload failed: server did not return a file URL',
    );
  }

  return {
    fileUrl,
    isVideo: isVideoFile(file),
    code: response.data?.code,
    message: response.data?.message,
  };
}

export function uploadOfferMedia(offerId, file, options) {
  return postMediaFormData(`${URL}/upload/${offerId}`, file, options);
}

export function uploadOrderMedia(orderId, tab, file, options) {
  return postMediaFormData(`${URL}/orders/${orderId}/upload/${tab}`, file, options);
}
