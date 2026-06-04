import {
  ORDER_MEDIA_SECTIONS,
  normalizeOrderMediaFields,
} from 'src/constants/order-media';
import { getLogoUrl, resolveYachtFields } from './pdfFormatters';

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function toAbsoluteMediaUrl(url: string): string {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = (process.env.SERVER_URL || 'http://localhost:5000').replace(
    /\/$/,
    '',
  );
  return trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

function buildSectionMediaHtml(
  label: string,
  images: string[],
  videos: string[],
): string {
  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;
  if (!hasImages && !hasVideos) {
    return `<p class="empty">No media in this section.</p>`;
  }

  const imagesHtml = hasImages
    ? `
    <h4>Photos</h4>
    <div class="media-grid">
      ${images
        .map(
          (url, index) => `
        <div class="media-item">
          <img src="${escapeHtml(toAbsoluteMediaUrl(url))}" alt="${escapeHtml(label)} photo ${index + 1}" />
          <p class="caption">Photo ${index + 1}</p>
        </div>
      `,
        )
        .join('')}
    </div>`
    : '';

  const videosHtml = hasVideos
    ? `
    <h4>Videos</h4>
    <ul class="video-list">
      ${videos
        .map(
          (url, index) => `
        <li>
          <strong>Video ${index + 1}</strong><br />
          <a href="${escapeHtml(toAbsoluteMediaUrl(url))}">${escapeHtml(toAbsoluteMediaUrl(url))}</a>
        </li>
      `,
        )
        .join('')}
    </ul>`
    : '';

  return `${imagesHtml}${videosHtml}`;
}

export function buildMediaSectionsFromOrder(order: Record<string, unknown>) {
  const normalized = normalizeOrderMediaFields(order);
  return ORDER_MEDIA_SECTIONS.map((section) => ({
    id: section.id,
    label: section.label,
    images: normalized[section.imageKey as keyof typeof normalized] as string[],
    videos: normalized[section.videoKey as keyof typeof normalized] as string[],
  }));
}

export function buildMediaReportExportHtml(data: {
  order: any;
  offer: any;
}): string {
  const order = data.order || {};
  const offer = data.offer || {};
  const yacht = resolveYachtFields(offer);
  const sections = buildMediaSectionsFromOrder(order);

  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const createdAtString = isNaN(createdAt.getTime())
    ? ''
    : createdAt.toLocaleString('en-GB');

  const sectionsHtml = sections
    .map(
      (section) => `
      <section class="report-section">
        <h2>${escapeHtml(section.label)}</h2>
        ${buildSectionMediaHtml(section.label, section.images, section.videos)}
      </section>
    `,
    )
    .join('');

  const totalImages = sections.reduce((n, s) => n + s.images.length, 0);
  const totalVideos = sections.reduce((n, s) => n + s.videos.length, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Media report — Order ${escapeHtml(order.id)}</title>
  <style>
    * { box-sizing: border-box; font-family: Roboto, Arial, sans-serif; color: #111; }
    body { margin: 0; padding: 24px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { width: 140px; height: auto; }
    h1 { font-size: 22px; margin: 0 0 8px; }
    .meta { font-size: 12px; line-height: 1.5; }
    .summary { font-size: 12px; margin-bottom: 24px; color: #444; }
    .report-section { page-break-inside: avoid; margin-bottom: 32px; }
    .report-section h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 6px; margin: 0 0 12px; }
    .report-section h4 { font-size: 14px; margin: 16px 0 8px; }
    .media-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .media-item img { width: 100%; max-height: 280px; object-fit: contain; border: 1px solid #ccc; border-radius: 4px; }
    .caption { font-size: 11px; text-align: center; margin: 4px 0 0; color: #555; }
    .video-list { font-size: 11px; padding-left: 18px; }
    .video-list a { word-break: break-all; color: #0066cc; }
    .empty { font-size: 12px; color: #777; font-style: italic; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Media report</h1>
      <div class="meta">
        <div><strong>Order:</strong> ${escapeHtml(order.id)}</div>
        <div><strong>Offer:</strong> ${escapeHtml(offer.id ?? order.offerId ?? '')}</div>
        <div><strong>Customer:</strong> ${escapeHtml(offer.customerFullName ?? '')}</div>
        <div><strong>Yacht:</strong> ${escapeHtml(yacht.yachtName)} ${yacht.yachtModel ? `(${escapeHtml(yacht.yachtModel)})` : ''}</div>
        <div><strong>Status:</strong> ${escapeHtml(order.status ?? '')}</div>
        <div><strong>Created:</strong> ${escapeHtml(createdAtString)}</div>
        <div><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString('en-GB'))}</div>
      </div>
    </div>
    <img class="logo" src="${escapeHtml(getLogoUrl())}" alt="Logo" />
  </div>
  <p class="summary">${totalImages} photo(s), ${totalVideos} video link(s) across ${sections.length} sections.</p>
  ${sectionsHtml}
</body>
</html>`;
}
