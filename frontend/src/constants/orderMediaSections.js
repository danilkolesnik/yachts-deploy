/** Media report sections: UI label → API tab → order entity fields */
export const ORDER_MEDIA_SECTIONS = [
  {
    id: 'before',
    label: 'Было',
    apiTab: 'process',
    imageKey: 'processImageUrls',
    videoKey: 'processVideoUrls',
  },
  {
    id: 'in-progress',
    label: 'Процесс',
    apiTab: 'result',
    imageKey: 'resultImageUrls',
    videoKey: 'resultVideoUrls',
  },
  {
    id: 'after',
    label: 'Результат',
    apiTab: 'tab',
    imageKey: 'tabImageUrls',
    videoKey: 'tabVideoUrls',
  },
];

export function normalizeOrderMedia(order) {
  if (!order) return order;

  const toArray = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  return {
    ...order,
    processImageUrls: toArray(order.processImageUrls),
    processVideoUrls: toArray(order.processVideoUrls),
    resultImageUrls: toArray(order.resultImageUrls),
    resultVideoUrls: toArray(order.resultVideoUrls),
    tabImageUrls: toArray(order.tabImageUrls),
    tabVideoUrls: toArray(order.tabVideoUrls),
  };
}

export function getSectionByApiTab(apiTab) {
  return ORDER_MEDIA_SECTIONS.find((section) => section.apiTab === apiTab);
}
