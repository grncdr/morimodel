var mori = require('mori');

var utils = require('./utils');
var copyProperties = utils.copyProperties;
var emptyFunction = utils.emptyFunction;

var MoriModel = require('./MoriModel');

function objectToHashMap(obj) {
  if (mori.is_map(obj)) {
    return obj;
  }
  var newArgs = [];
  for (var k in obj) {
    if (!obj.hasOwnProperty(k)) {
      continue;
    }
    var v = obj[k]
    if (typeof v == 'object' && v != null && !mori.is_collection(v)) {
      throw new Error("It is unsafe to store mutable objects on model nodes")
    }
    newArgs.push(k, v);
  }
  return mori.hash_map.apply(mori, newArgs);
}

function hashMapToObject(hashMap) {
  if (!mori.is_map(hashMap)) {
    return hashMap;
  }

  return mori.reduce(function(accum, key) {
    accum[key] = mori.get(hashMap, key);
    return accum;
  }, {}, mori.keys(hashMap));
}

function JSONMoriModel(onChange, moriModel) {
  this._onChange = onChange || emptyFunction;
  this._moriModel = moriModel || new MoriModel();
}

copyProperties(JSONMoriModel.prototype, {
  getNode: function(key) {
    return hashMapToObject(this._moriModel.getNode(key));
  },
  addNode: function(key, value) {
    this._moriModel.addNode(key, objectToHashMap(value));
  },
  updateNode: function(key, updates) {
    var prevNode = this._moriModel.getNode(key);
    if (!prevNode) {
      this.addNode(key, updates);
      return;
    }
    var newNode = mori.into(prevNode, objectToHashMap(updates));
    this._moriModel.addNode(key, newNode);
  },
  removeNode: function(key) {
    this._moriModel.removeNode(key);
  },
  addEdge: function(type, key, key2, order, data) {
    this._moriModel.addEdge(type, key, key2, order, objectToHashMap(data));
  },
  removeEdge: function(type, key, key2) {
    this._moriModel.removeEdge(type, key, key2);
  },
  getEdge: function(type, key, key2) {
    return hashMapToObject(this._moriModel.getEdge(type, key, key2));
  },
  getEdges: function(type, key) {
    return mori.reduce(function(accum, edge) {
      accum.push(hashMapToObject(edge));
      return accum;
    }, [], this._moriModel.getEdges(type, key));
  },
  getNodesByType: function(type, key) {
    return mori.reduce(function(accum, node) {
      accum.push(hashMapToObject(node));
      return accum;
    }, [], this._moriModel.getNodesByType(type, key));
  },
  getNodeByType: function(type, key) {
    return this.getNodes(type, key)[0];
  },
  commit: function() {
    var nextMoriModel = this._moriModel.commit();
    var nextJSONMoriModel = new JSONMoriModel(
      this._onChange,
      nextMoriModel
    );
    this._onChange(nextJSONMoriModel);
    return nextJSONMoriModel;
  }
});

module.exports = JSONMoriModel;
