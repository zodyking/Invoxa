/**
 * Formats a phone number to (xxx) xxx-xxxx format
 * Accepts digits only and formats as user types
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10)
  
  // Format based on length
  if (limited.length === 0) return ""
  if (limited.length <= 3) return `(${limited}`
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
}

/**
 * Formats a phone number for display (from stored value)
 * Handles both formatted and unformatted numbers
 */
export function formatPhoneDisplay(value: string | null | undefined): string {
  if (!value) return ""
  
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")
  
  // If we have 10 digits, format it
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  // If already formatted or partial, return as is
  return value
}

/**
 * Removes formatting from phone number for storage
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, "")
}







