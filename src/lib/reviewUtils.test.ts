import { describe, expect, it } from 'vitest';
import { normalizeReviewPayload } from './reviewUtils';

describe('normalizeReviewPayload', () => {
  it('keeps a supplied image URL and trims the payload fields', () => {
    expect(
      normalizeReviewPayload({
        name: '  Anna  ',
        rating: 5,
        comment: ' Loved it! ',
        imageUrl: ' https://example.com/review.jpg ',
      })
    ).toEqual({
      name: 'Anna',
      rating: 5,
      comment: 'Loved it!',
      imageUrl: 'https://example.com/review.jpg',
    });
  });

  it('omits the image URL when no upload is provided', () => {
    expect(
      normalizeReviewPayload({
        name: 'Sam',
        rating: 4,
        comment: 'Great experience',
      })
    ).toEqual({
      name: 'Sam',
      rating: 4,
      comment: 'Great experience',
    });
  });
});
