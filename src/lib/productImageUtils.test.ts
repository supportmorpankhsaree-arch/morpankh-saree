import { describe, expect, it } from 'vitest';
import { buildColorVariantPayload, getColorDisplayImage, getColorImageGallery } from './productImageUtils';

describe('product image utilities', () => {
  it('keeps the main image first and preserves sub images', () => {
    const gallery = getColorImageGallery({
      image: 'https://cdn.example.com/main.jpg',
      subImages: ['https://cdn.example.com/one.jpg', 'https://cdn.example.com/two.jpg'],
    });

    expect(gallery).toEqual([
      'https://cdn.example.com/main.jpg',
      'https://cdn.example.com/one.jpg',
      'https://cdn.example.com/two.jpg',
    ]);
  });

  it('returns a color display image when one exists', () => {
    const displayImage = getColorDisplayImage({
      colorImage: 'https://cdn.example.com/color.jpg',
      image: 'https://cdn.example.com/main.jpg',
    });

    expect(displayImage).toBe('https://cdn.example.com/color.jpg');
  });

  it('defaults missing sub images to an empty array', () => {
    const payload = buildColorVariantPayload({
      colorName: 'Emerald',
      stock: 12,
      image: 'https://cdn.example.com/main.jpg',
    });

    expect(payload).toMatchObject({
      colorName: 'Emerald',
      stock: 12,
      colorImage: '',
      image: 'https://cdn.example.com/main.jpg',
      subImages: [],
    });
  });
});
