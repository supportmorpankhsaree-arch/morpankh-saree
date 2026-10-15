export interface ContactFormValues {
  name: string;
  email: string;
  message: string;
  mobileNumber: string;
}

export interface ProductInquiryFormValues {
  productName: string;
  selectedColor: string;
  phoneNumber: string;
  description: string;
}

export function normalizeMobileNumber(value: string): string {
  return String(value ?? '').trim().replace(/\D/g, '');
}

export function validateContactForm(values: Partial<ContactFormValues>) {
  const normalizedMobileNumber = normalizeMobileNumber(values.mobileNumber ?? '');
  const errors: Partial<Record<keyof ContactFormValues, string>> = {};

  if (!normalizedMobileNumber) {
    errors.mobileNumber = 'Mobile number is required.';
  } else if (!/^\d{10}$/.test(normalizedMobileNumber)) {
    errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedValues: {
      ...values,
      mobileNumber: normalizedMobileNumber,
    },
  };
}

export function validateProductInquiryForm(values: Partial<ProductInquiryFormValues>) {
  const normalizedPhoneNumber = normalizeMobileNumber(values.phoneNumber ?? '');
  const trimmedDescription = String(values.description ?? '').trim();
  const errors: Partial<Record<keyof ProductInquiryFormValues, string>> = {};

  if (!normalizedPhoneNumber) {
    errors.phoneNumber = 'Phone number is required';
  } else if (!/^\d{10}$/.test(normalizedPhoneNumber)) {
    errors.phoneNumber = 'Please enter a valid 10-digit phone number';
  }

  if (!trimmedDescription) {
    errors.description = 'Description is required.';
  } else if (trimmedDescription.length > 500) {
    errors.description = 'Description must be 500 characters or less.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedValues: {
      ...values,
      phoneNumber: normalizedPhoneNumber,
      description: trimmedDescription,
    },
  };
}
