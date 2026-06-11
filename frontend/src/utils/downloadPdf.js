function getFilenameFromContentDisposition(header) {
  if (!header || typeof header !== 'string') return null;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(header);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const plainMatch = /filename=([^;]+)/i.exec(header);
  if (plainMatch?.[1]) return plainMatch[1].trim().replace(/^"|"$/g, '');

  return null;
}

/**
 * Triggers a browser download for a PDF axios blob response.
 * @param {import('axios').AxiosResponse<Blob>} response
 * @param {string} fallbackFilename
 */
export function downloadPdfBlob(response, fallbackFilename) {
  const header =
    response?.headers?.['content-disposition'] ||
    response?.headers?.['Content-Disposition'];
  const filename = getFilenameFromContentDisposition(header) || fallbackFilename;

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
