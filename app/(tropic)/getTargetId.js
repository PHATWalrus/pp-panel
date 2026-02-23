'use client'
import createTarget from '../actions/createTarget'

const COOKIE_NAME = 'target_id'
const COOKIE_MAX_AGE = 60 * 60 * 2 // 2 hours in seconds

// Maintain a single promise for concurrent getTargetId calls
let pendingPromise = null;

export async function getTargetId() {
  try {
    // Check for existing cookie first
    const cookieTargetId = getCookie(COOKIE_NAME)
    if (cookieTargetId) {
      return cookieTargetId
    }

    // If the cookie doesn't exist but we already have a pending creation request,
    // return that promise instead of creating a new one
    if (pendingPromise) {
      console.log('Using existing pending target ID request')
      return pendingPromise
    }

    // Create a new promise and store it
    pendingPromise = (async () => {
      try {
        console.log('Creating new target ID')
        const ua = navigator.userAgent
        let clientIp = null
        try {
          const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
          const data = await res.json()
          if (data?.ip) clientIp = String(data.ip).trim()
        } catch {
          // ipify failed; server will use headers
        }
        const result = await createTarget(ua, clientIp)
        if (result.closed) {
          return 'closed'
        }
        const id = result.id
        if (!id || id === 'dev-target-no-db') {
          return id
        }
        // Set the cookie before returning
        setCookie(COOKIE_NAME, id, COOKIE_MAX_AGE)
        console.log('Target ID created:', id)
        return id
      } finally {
        // Clear the pending promise after a short delay to handle closely-timed requests
        setTimeout(() => {
          pendingPromise = null
        }, 500)
      }
    })()

    return pendingPromise
  } catch (error) {
    console.error('Error in getTargetId:', error)
    throw new Error('Failed to get target ID')
  }
}

// Cookie helper functions
function getCookie(name) {
  if (typeof document === 'undefined') return null
  const matches = document.cookie.match(new RegExp(
    '(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'
  ))
  return matches ? decodeURIComponent(matches[1]) : null
}

function setCookie(name, value, maxAge) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}