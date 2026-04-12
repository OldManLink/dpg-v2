export function encodeContext(profile) {
  const encoder = new TextEncoder()

  function field(str) {
    const bytes = encoder.encode(str)
    return `${bytes.length}:${str}\0`
  }

  function normalizeRequire(req) {
    const order = ['lower', 'upper', 'digit', 'symbol']
    return order.filter(x => req.includes(x)).join(',')
  }

  const parts = [
    'DPGCTX\0',
    field(profile.version),
    field(profile.service),
    field(profile.account || ''),
    field(String(profile.counter)),
    field(String(profile.length)),
    field(normalizeRequire(profile.require)),
    field(profile.symbolSet || '')
  ]

  return encoder.encode(parts.join(''))
}

