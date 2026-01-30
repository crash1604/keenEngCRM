// Email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

export const isValidEmail = (email) => {
  if (!email?.trim()) return { valid: false, error: 'Email is required' };
  if (!EMAIL_REGEX.test(email)) return { valid: false, error: 'Please enter a valid email address' };
  return { valid: true, error: null };
};

// Password validation
const MIN_PASSWORD_LENGTH = 8;

const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'monkey', 'master', 'dragon', 'letmein', 'login',
  'admin', 'welcome', 'iloveyou', 'sunshine', 'princess', 'football', 'baseball'
];

export const validatePassword = (password) => {
  return password?.length >= MIN_PASSWORD_LENGTH;
};

export const getPasswordStrength = (password, userInfo = {}) => {
  const { email = '', firstName = '', lastName = '' } = userInfo;
  const emailPrefix = email.split('@')[0].toLowerCase();
  const passwordLower = password?.toLowerCase() || '';

  return {
    minLength: password?.length >= MIN_PASSWORD_LENGTH,
    notSimilarToUser: password?.length > 0 &&
      !passwordLower.includes(emailPrefix) &&
      !passwordLower.includes(firstName.toLowerCase()) &&
      !passwordLower.includes(lastName.toLowerCase()) &&
      !emailPrefix.includes(passwordLower) &&
      (firstName.length === 0 || !firstName.toLowerCase().includes(passwordLower)) &&
      (lastName.length === 0 || !lastName.toLowerCase().includes(passwordLower)),
    notCommon: password?.length > 0 && !COMMON_PASSWORDS.includes(passwordLower),
    notNumericOnly: password?.length > 0 && !/^\d+$/.test(password),
  };
};

export const isValidPassword = (password) => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  return { valid: true, error: null };
};

// Required field validation
export const validateRequired = (value) => {
  return value && String(value).trim().length > 0;
};

export const isValidRequired = (value, fieldName = 'Field') => {
  if (!value || !String(value).trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true, error: null };
};

// Form validation helper - validates multiple fields at once
export const validateForm = (data, rules) => {
  const errors = {};

  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const result = validator(data[field], data);
      if (!result.valid) {
        errors[field] = result.error;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common field validators for use with validateForm
export const validators = {
  required: (fieldName) => (value) => isValidRequired(value, fieldName),
  email: () => (value) => isValidEmail(value),
  password: () => (value) => isValidPassword(value),
  minLength: (min, fieldName) => (value) => {
    if (value && value.length < min) {
      return { valid: false, error: `${fieldName} must be at least ${min} characters` };
    }
    return { valid: true, error: null };
  },
  match: (otherField, fieldName) => (value, data) => {
    if (value !== data[otherField]) {
      return { valid: false, error: `${fieldName} do not match` };
    }
    return { valid: true, error: null };
  }
};