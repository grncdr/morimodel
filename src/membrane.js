var mori = require('mori');

/**
 * Unlike mori.js_to_clj, this performs a shallow copy and throws errors if any
 * of the values are mutable.
 */
exports.toHashMap = function (obj) {
  if (mori.is_map(obj)) {
    return obj;
  }
  var args = [];
  for (var k in obj) {
    if (!obj.hasOwnProperty(k)) {
      continue;
    }
    var v = obj[k]
    if (typeof v == 'object' && v !== null && !mori.is_collection(v)) {
      throw new Error("It is unsafe to store mutable objects on model nodes, use more nodes and edges instead")
    }
    args.push(k, v);
  }
  return mori.hash_map.apply(mori, args);
}

/**
 * Unlike mori.clj_to_js this just does a shallow copy, because we expect it to
 * only be used on hash_maps created by toHashMap
 */
exports.toObject = function (hashMap) {
  if (!mori.is_map(hashMap)) {
    return hashMap;
  }

  return mori.reduce(function(accum, key) {
    accum[key] = mori.get(hashMap, key);
    return accum;
  }, {}, mori.keys(hashMap));
}
