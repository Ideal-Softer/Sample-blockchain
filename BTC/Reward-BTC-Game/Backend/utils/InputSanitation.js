const sanitizeInput = (input) => {
  // 1. Whitelisting: Allow only alphanumeric characters, space, hyphen, and underscore
  const whitelistPattern = /^[a-zA-Z0-9-_ ]*$/
  if (!whitelistPattern.test(input)) {
    return "Invalid input" // or throw an error
  }

  input = input.replace(/<[^>]*>/g, "")

  // Escape special characters to prevent SQL injection
  input = input.replace(/'/g, "''")

  // 2. Escape special characters to prevent issues in HTML or JavaScript
  input = input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;")

  // 3. String length limit
  const maxLength = 255 // arbitrary limit
  if (input.length > maxLength) {
    return input.substring(0, maxLength)
  }

  // 4. Remove control characters
  input = input.replace(/[\x00-\x1F]/g, "")

  return input
}

module.exports = {
  sanitizeInput
}
