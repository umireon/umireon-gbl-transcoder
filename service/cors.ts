import type { HttpFunction } from '@google-cloud/functions-framework'

export const handleCors: HttpFunction = (req, res) => {
  const origin = req.get('Origin')
  if (typeof origin !== 'undefined') {
    const { hostname } = new URL(origin)
    if (hostname.toLowerCase() === 'localhost') {
      res.set('Access-Control-Allow-Origin', '*')
    } else {
      res.set(
        'Access-Control-Allow-Origin',
        'https://umireon-gbl-transcoder.web.app'
      )
    }
  }

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Authorization')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return false
  }

  return true
}
