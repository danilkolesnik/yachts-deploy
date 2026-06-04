export const ORDER_MEDIA_TABS = ['process', 'result', 'tab'] as const;

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
