module.exports = [
  'TYPE',
  'ORDER',
  'SRC',
  'DEST',
  'DATA'
].reduce(function (acc, key, i) {
  acc[key] = i;
  return acc
}, {})
