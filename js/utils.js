/**
 * QUARANTIN — Utility Functions
 * Shared helpers: currency formatting, date formatting,
 * number sanitization, UUID generation, debounce.
 */

/**
 * Formats a number as USD currency using Intl.NumberFormat.
 * @param {number} amount - The numeric amount to format
 * @returns {string} Formatted currency string (e.g., "$1,234.56")
 * @example
 * formatCurrency(3400) → "$3,400.00"
 * formatCurrency(0) → "$0.00"
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return '$0.00';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(amount);
}

/**
 * Formats a number as a percentage string.
 * @param {number} value - The decimal value (e.g., 0.25 for 25%)
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage string (e.g., "25.0%")
 * @example
 * formatPercentage(0.2534) → "25.3%"
 */
function formatPercentage(value, decimals = 1) {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return '0.0%';
  }
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Formats a date string or Date object to a readable format.
 * @param {string|Date} dateInput - ISO date string or Date object
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 * @example
 * formatDate('2024-01-15') → "Jan 15, 2024"
 * formatDate(new Date()) → "Aug 3, 2026"
 */
function formatDate(dateInput) {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return '—';
  }
}

/**
 * Formats a date string to include time.
 * @param {string|Date} dateInput - ISO date string or Date object
 * @returns {string} Formatted date with time
 * @example
 * formatDateTime('2024-01-15T10:30:00') → "Jan 15, 2024 10:30 AM"
 */
function formatDateTime(dateInput) {
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch (e) {
    return '—';
  }
}

/**
 * Sanitizes user input to extract a valid number.
 * Removes currency symbols, commas, and non-numeric characters.
 * @param {string} input - Raw user input string
 * @returns {number} Parsed number, or 0 if invalid
 * @example
 * sanitizeNumber("$3,400.50") → 3400.50
 * sanitizeNumber("abc") → 0
 * sanitizeNumber("") → 0
 */
function sanitizeNumber(input) {
  if (typeof input === 'number') {
    return isFinite(input) ? input : 0;
  }
  if (typeof input !== 'string') {
    return 0;
  }
  // Remove everything except digits and decimal point
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (cleaned === '' || cleaned === '.') {
    return 0;
  }
  const parsed = parseFloat(cleaned);
  return isFinite(parsed) ? parsed : 0;
}

/**
 * Formats a number for display in a currency input field.
 * Adds comma separators but no currency symbol.
 * @param {number} amount - The numeric amount
 * @returns {string} Formatted number string (e.g., "3,400.50")
 * @example
 * formatInputNumber(3400.5) → "3,400.50"
 */
function formatInputNumber(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0.00';
  }
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Generates a unique identifier using Web Crypto API.
 * Falls back to timestamp-based ID if crypto is unavailable.
 * @returns {string} UUID string
 * @example
 * generateId() → "550e8400-e29b-41d4-a716-446655440000"
 */
function generateId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fall through to fallback
  }
  // Fallback: timestamp + random string
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 11);
}

/**
 * Creates a debounced version of a function.
 * @param {Function} func - The function to debounce
 * @param {number} wait - Milliseconds to wait before invoking
 * @returns {Function} Debounced function
 * @example
 * const debouncedCalc = debounce(calculate, 150);
 * input.addEventListener('input', debouncedCalc);
 */
function debounce(func, wait) {
  let timeoutId = null;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeoutId);
      func(...args);
    };
    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
  };
}

/**
 * Clamps a number between min and max values.
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 * @example
 * clamp(150, 0, 100) → 100
 * clamp(-5, 0, 100) → 0
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Gets the current year.
 * @returns {number} Current 4-digit year
 * @example
 * getCurrentYear() → 2026
 */
function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Gets today's date at midnight (start of day).
 * @returns {Date} Date object set to start of today
 * @example
 * getToday() → Date object for today at 00:00:00
 */
function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Calculates the number of days between two dates.
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Absolute number of days between dates
 * @example
 * daysBetween(new Date('2024-01-01'), new Date('2024-01-15')) → 14
 */
function daysBetween(date1, date2) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.round(Math.abs((utc2 - utc1) / msPerDay));
}

/**
 * Validates that a value is a positive number.
 * @param {*} value - The value to validate
 * @returns {boolean} True if valid positive number
 * @example
 * isPositiveNumber(100) → true
 * isPositiveNumber(-5) → false
 * isPositiveNumber("abc") → false
 */
function isPositiveNumber(value) {
  const num = typeof value === 'number' ? value : sanitizeNumber(value);
  return isFinite(num) && num > 0;
}

/**
 * Creates a text node safely (prevents XSS).
 * @param {string} text - Text content
 * @returns {Text} Text node
 * @example
 * safeText("<script>alert('xss')</script>") → Text node with literal content
 */
function safeText(text) {
  return document.createTextNode(String(text));
}

/**
 * Gets the current timestamp as ISO string.
 * @returns {string} ISO 8601 timestamp
 * @example
 * nowISO() → "2026-08-03T12:00:00.000Z"
 */
function nowISO() {
  return new Date().toISOString();
}
