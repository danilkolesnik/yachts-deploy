export const ORDER_MEDIA_TABS = ['process', 'result', 'tab'] as const;

/** UI / PDF section labels mapped to order entity fields */
export const ORDER_MEDIA_SECTIONS = [
  {
    id: 'before',
    label: 'Before',
    apiTab: 'process',
    imageKey: 'processImageUrls',
    videoKey: 'processVideoUrls',
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    apiTab: 'result',
    imageKey: 'resultImageUrls',
    videoKey: 'resultVideoUrls',
  },
  {
    id: 'after',
    label: 'Result',
    apiTab: 'tab',
    imageKey: 'tabImageUrls',
    videoKey: 'tabVideoUrls',
  },
] as const;

export type OrderMediaTab = (typeof ORDER_MEDIA_TABS)[number];

export function isValidOrderMediaTab(tab: string): tab is OrderMediaTab {
  return (ORDER_MEDIA_TABS as readonly string[]).includes(tab);
}

export function normalizeMediaUrlList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizeOrderMediaFields<T extends Record<string, unknown>>(
  order: T,
): T {
  return {
    ...order,
    processImageUrls: normalizeMediaUrlList(order.processImageUrls),
    processVideoUrls: normalizeMediaUrlList(order.processVideoUrls),
    resultImageUrls: normalizeMediaUrlList(order.resultImageUrls),
    resultVideoUrls: normalizeMediaUrlList(order.resultVideoUrls),
    tabImageUrls: normalizeMediaUrlList(order.tabImageUrls),
    tabVideoUrls: normalizeMediaUrlList(order.tabVideoUrls),
  };
}
