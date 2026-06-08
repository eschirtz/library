export function isApple(): boolean {
  return !!navigator.vendor && navigator.vendor.includes('Apple')
}

export function isSafari(): boolean {
  return /Safari/.test(navigator.userAgent) && isApple()
}

export function isIOS(): boolean {
  return (
    ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
      navigator.platform,
    ) ||
    (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  )
}

export function isInstagram(): boolean {
  return /Instagram/.test(navigator.userAgent)
}

/** Returns the major Safari/WebKit version, or null on non-Apple platforms */
export function safariMajorVersion(): number | null {
  if (!isApple()) return null
  let match = navigator.userAgent.match(/Version\/(\d+)/)
  if (match?.[1]) return parseInt(match[1], 10)
  match = navigator.userAgent.match(/OS (\d+)(?:_\d+)?/)
  if (match?.[1]) return parseInt(match[1], 10)
  return null
}

export function hasMSE(): boolean {
  return typeof MediaSource !== 'undefined'
}

export function checkFlacSupport(): boolean {
  if (isApple()) {
    const oldSafari = (safariMajorVersion() ?? 0) < 14
    if (oldSafari || isInstagram()) return false
  }
  return true
}

/** Pick gapless manifest version based on MSE support */
export function gaplessVersion(): 'v1' | 'v2' {
  const major = safariMajorVersion()
  const isOldSafari = major ? major < 16 : false
  return hasMSE() && !isOldSafari ? 'v2' : 'v1'
}
