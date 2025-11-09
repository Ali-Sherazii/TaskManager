/**
 * Cookie Utility Functions
 * 
 * Helper functions for managing cookies in the browser.
 * Cookies are more secure than localStorage for storing authentication tokens
 * as they can be set with HttpOnly flag (via backend) and SameSite protection.
 */

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days (default: 7)
 */
export const setCookie = (name, value, days = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export const getCookie = (name) => {
  const nameEQ = `${name}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

/**
 * Check if cookies are enabled
 * @returns {boolean} True if cookies are enabled
 */
export const areCookiesEnabled = () => {
  try {
    setCookie('__test__', '1', 0)
    const enabled = getCookie('__test__') === '1'
    deleteCookie('__test__')
    return enabled
  } catch (e) {
    return false
  }
}

