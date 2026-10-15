import { describe, expect, it } from 'vitest';
import { normalizeMobileNumber, validateContactForm, validateProductInquiryForm } from './contactValidation';

describe('contact validation', () => {
  it('requires a mobile number', () => {
    const result = validateContactForm({
      name: 'Priya',
      email: 'priya@example.com',
      message: 'Hello',
      mobileNumber: '   ',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.mobileNumber).toBe('Mobile number is required.');
  });

  it('rejects numbers that are not exactly 10 digits', () => {
    const result = validateContactForm({
      name: 'Priya',
      email: 'priya@example.com',
      message: 'Hello',
      mobileNumber: '12345',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
  });

  it('accepts a valid 10-digit mobile number', () => {
    const result = validateContactForm({
      name: 'Priya',
      email: 'priya@example.com',
      message: 'Hello',
      mobileNumber: '9876543210',
    });

    expect(result.isValid).toBe(true);
    expect(result.errors.mobileNumber).toBeUndefined();
    expect(normalizeMobileNumber('9876543210')).toBe('9876543210');
  });

  it('requires a valid phone number and description for a product inquiry', () => {
    const result = validateProductInquiryForm({
      productName: 'Saree',
      selectedColor: 'Red',
      phoneNumber: '123',
      description: '   ',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.phoneNumber).toBe('Please enter a valid 10-digit phone number');
    expect(result.errors.description).toBe('Description is required.');
  });

  it('accepts a valid product inquiry payload', () => {
    const result = validateProductInquiryForm({
      productName: 'Saree',
      selectedColor: 'Red',
      phoneNumber: '9876543210',
      description: 'Need help with sizing',
    });

    expect(result.isValid).toBe(true);
    expect(result.normalizedValues.phoneNumber).toBe('9876543210');
    expect(result.normalizedValues.description).toBe('Need help with sizing');
  });
});
