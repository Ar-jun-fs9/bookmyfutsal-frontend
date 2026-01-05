// Validation utilities for super admin dashboard forms

export function validatePhone(phone: string): boolean {
  // Phone must be 10 digits starting with 9
  const phoneRegex = /^9\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validatePassword(password: string): { isValid: boolean, message: string } {
  if (password.length === 0) return { isValid: true, message: '' }; // Optional password
  if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters' };
  return { isValid: true, message: '' };
}

export function validateFutsalForm(formData: any): { isValid: boolean, errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!validateRequired(formData.name)) errors.name = 'Name is required';
  if (!validateRequired(formData.location)) errors.location = 'Location is required';
  if (!validateRequired(formData.city)) errors.city = 'City is required';
  if (!validateRequired(formData.phone)) errors.phone = 'Phone is required';
  else if (!validatePhone(formData.phone)) errors.phone = 'Phone must be 10 digits starting with 9';
  if (!validateRequired(formData.price_per_hour)) errors.price_per_hour = 'Price per hour is required';
  if (!validateRequired(formData.game_format)) errors.game_format = 'Game format is required';
  if (!validateRequired(formData.opening_hours)) errors.opening_hours = 'Opening hours is required';
  if (!validateRequired(formData.closing_hours)) errors.closing_hours = 'Closing hours is required';

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateAdminForm(formData: any): { isValid: boolean, errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!validateRequired(formData.username)) errors.username = 'Username is required';
  if (!validateRequired(formData.email)) errors.email = 'Email is required';
  else if (!validateEmail(formData.email)) errors.email = 'Invalid email format';
  if (!validateRequired(formData.phone)) errors.phone = 'Phone is required';
  else if (!validatePhone(formData.phone)) errors.phone = 'Phone must be 10 digits starting with 9';
  if (!validateRequired(formData.password)) errors.password = 'Password is required';
  else {
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) errors.password = passwordValidation.message;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateUserForm(formData: any): { isValid: boolean, errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!validateRequired(formData.first_name)) errors.first_name = 'First name is required';
  if (!validateRequired(formData.last_name)) errors.last_name = 'Last name is required';
  if (!validateRequired(formData.username)) errors.username = 'Username is required';
  if (!validateRequired(formData.email)) errors.email = 'Email is required';
  else if (!validateEmail(formData.email)) errors.email = 'Invalid email format';
  if (!validateRequired(formData.phone)) errors.phone = 'Phone is required';
  else if (!validatePhone(formData.phone)) errors.phone = 'Phone must be 10 digits starting with 9';

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) errors.password = passwordValidation.message;

  return { isValid: Object.keys(errors).length === 0, errors };
}