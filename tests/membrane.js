var test = require('tape')
var membrane = require('../src/membrane')

test('mutable <-> persistent helpers', function (t) {
  t.throws(function () {
    membrane.toHashMap({array: [1, 2, 3]})
  }, "Cannot store mutable objects in hashmaps")

  membrane.toHashMap({x: null})
  t.pass("Can store null in hashmaps")

  t.end()
})
