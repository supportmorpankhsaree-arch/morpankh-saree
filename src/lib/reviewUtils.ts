export type ReviewPayload = {
  name?: unknown;
  rating?: unknown;
  comment?: unknown;
  imageUrl?: unknown;
};

export function normalizeReviewPayload(payload: ReviewPayload) {
  const safeName = String(payload.name || '').trim();
  const safeComment = String(payload.comment || '').trim();
  const safeRating = Number(payload.rating);
  const safeImageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() : '';

  const normalized: {
    name: string;
    rating: number;
    comment: string;
    imageUrl?: string;
  } = {
    name: safeName,
    rating: safeRating,
    comment: safeComment,
  };

  if (safeImageUrl) {
    normalized.imageUrl = safeImageUrl;
  }

  return normalized;
}
