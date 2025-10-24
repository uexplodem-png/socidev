// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6 || password.length > 15) {
    errors.push('Password must be between 6 and 15 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one number or special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Country data with country codes and phone number lengths
export const countries = [
  { code: "TR", name: "Turkey", countryCode: "+90", phoneLength: 10 },
  { code: "US", name: "United States", countryCode: "+1", phoneLength: 10 },
  { code: "GB", name: "United Kingdom", countryCode: "+44", phoneLength: 10 },
  { code: "DE", name: "Germany", countryCode: "+49", phoneLength: 10 },
  { code: "FR", name: "France", countryCode: "+33", phoneLength: 9 },
  { code: "IT", name: "Italy", countryCode: "+39", phoneLength: 10 },
  { code: "ES", name: "Spain", countryCode: "+34", phoneLength: 9 },
  { code: "RU", name: "Russia", countryCode: "+7", phoneLength: 10 },
  { code: "CN", name: "China", countryCode: "+86", phoneLength: 11 },
  { code: "JP", name: "Japan", countryCode: "+81", phoneLength: 10 },
  { code: "KR", name: "South Korea", countryCode: "+82", phoneLength: 10 },
  { code: "IN", name: "India", countryCode: "+91", phoneLength: 10 },
  { code: "BR", name: "Brazil", countryCode: "+55", phoneLength: 10 },
  { code: "CA", name: "Canada", countryCode: "+1", phoneLength: 10 },
  { code: "AU", name: "Australia", countryCode: "+61", phoneLength: 9 },
  { code: "NL", name: "Netherlands", countryCode: "+31", phoneLength: 9 },
  { code: "SE", name: "Sweden", countryCode: "+46", phoneLength: 9 },
  { code: "NO", name: "Norway", countryCode: "+47", phoneLength: 8 },
  { code: "DK", name: "Denmark", countryCode: "+45", phoneLength: 8 },
  { code: "FI", name: "Finland", countryCode: "+358", phoneLength: 9 },
  { code: "PL", name: "Poland", countryCode: "+48", phoneLength: 9 },
  { code: "BE", name: "Belgium", countryCode: "+32", phoneLength: 9 },
  { code: "AT", name: "Austria", countryCode: "+43", phoneLength: 10 },
  { code: "CH", name: "Switzerland", countryCode: "+41", phoneLength: 9 },
  { code: "PT", name: "Portugal", countryCode: "+351", phoneLength: 9 },
  { code: "GR", name: "Greece", countryCode: "+30", phoneLength: 10 },
  { code: "CZ", name: "Czech Republic", countryCode: "+420", phoneLength: 9 },
  { code: "HU", name: "Hungary", countryCode: "+36", phoneLength: 9 },
  { code: "RO", name: "Romania", countryCode: "+40", phoneLength: 9 },
  { code: "BG", name: "Bulgaria", countryCode: "+359", phoneLength: 9 },
  { code: "HR", name: "Croatia", countryCode: "+385", phoneLength: 9 },
  { code: "RS", name: "Serbia", countryCode: "+381", phoneLength: 9 },
  { code: "SI", name: "Slovenia", countryCode: "+386", phoneLength: 8 },
  { code: "SK", name: "Slovakia", countryCode: "+421", phoneLength: 9 },
  { code: "EE", name: "Estonia", countryCode: "+372", phoneLength: 7 },
  { code: "LV", name: "Latvia", countryCode: "+371", phoneLength: 8 },
  { code: "LT", name: "Lithuania", countryCode: "+370", phoneLength: 8 },
  { code: "LU", name: "Luxembourg", countryCode: "+352", phoneLength: 9 },
  { code: "IE", name: "Ireland", countryCode: "+353", phoneLength: 9 },
  { code: "IS", name: "Iceland", countryCode: "+354", phoneLength: 7 },
  { code: "MT", name: "Malta", countryCode: "+356", phoneLength: 8 },
  { code: "CY", name: "Cyprus", countryCode: "+357", phoneLength: 8 },
  { code: "AL", name: "Albania", countryCode: "+355", phoneLength: 9 },
  { code: "MK", name: "North Macedonia", countryCode: "+389", phoneLength: 8 },
  { code: "BA", name: "Bosnia and Herzegovina", countryCode: "+387", phoneLength: 8 },
  { code: "ME", name: "Montenegro", countryCode: "+382", phoneLength: 8 },
  { code: "XK", name: "Kosovo", countryCode: "+383", phoneLength: 8 },
  { code: "MD", name: "Moldova", countryCode: "+373", phoneLength: 8 },
  { code: "BY", name: "Belarus", countryCode: "+375", phoneLength: 9 },
  { code: "UA", name: "Ukraine", countryCode: "+380", phoneLength: 9 },
];

// Phone number validation with country-specific formatting
export const validatePhoneNumber = (phone: string, selectedCountry: typeof countries[0] | null): { isValid: boolean; formattedPhone: string; error?: string } => {
  if (!selectedCountry) {
    return { isValid: false, formattedPhone: phone, error: "Please select a country" };
  }

  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '');

  // Handle different input formats
  if (cleanPhone.startsWith('0') && cleanPhone.length > 1) {
    // Local format with leading 0, replace with country code
    cleanPhone = selectedCountry.countryCode + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith('+') && cleanPhone.length > 0) {
    // No country code, add it
    cleanPhone = selectedCountry.countryCode + cleanPhone;
  } else if (cleanPhone.startsWith('+')) {
    // Already has +, check if it matches selected country
    if (!cleanPhone.startsWith(selectedCountry.countryCode)) {
      return { isValid: false, formattedPhone: phone, error: `Phone number should start with ${selectedCountry.countryCode}` };
    }
  }

  // Extract just the digits after the country code
  const countryCodeLength = selectedCountry.countryCode.length;
  const phoneNumberDigits = cleanPhone.startsWith('+')
    ? cleanPhone.substring(1 + countryCodeLength - 1)
    : cleanPhone.substring(countryCodeLength);

  // Check length
  if (phoneNumberDigits.length !== selectedCountry.phoneLength) {
    return {
      isValid: false,
      formattedPhone: cleanPhone,
      error: `Phone number for ${selectedCountry.name} should be ${selectedCountry.phoneLength} digits long (excluding country code)`
    };
  }

  return { isValid: true, formattedPhone: cleanPhone };
};