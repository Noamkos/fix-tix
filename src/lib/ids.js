let counter = 0

// Short unique ids for new records: "l-mbq3x9a01".
export function newId(prefix) {
  counter = (counter + 1) % 1296
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36).padStart(2, '0')}`
}
