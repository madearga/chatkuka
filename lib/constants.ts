/**
 * File upload constants for defining allowed file types and size limits
 */

// Maximum file size in megabytes (MB)
export const MAX_FILE_SIZE_MB = 10;

// Maximum file size in bytes
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed file MIME types
export const ALLOWED_FILE_TYPES = {
  // Document types
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/msword': '.doc',

  // Spreadsheet types
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'text/csv': '.csv',

  // Text types
  'text/plain': '.txt',

  // Image types (already supported)
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

// Allowed file extensions string for file input element
export const ALLOWED_FILE_EXTENSIONS =
  Object.values(ALLOWED_FILE_TYPES).join(',');

// Allowed MIME types array for validation
export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_FILE_TYPES);
