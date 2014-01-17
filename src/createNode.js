var mori = require('mori')
var extend = require('extend')

var Edge = require('./Edge')
var EdgeKeys = require('./EdgeKeys')
var membrane = require('./membrane')

module.exports = createNode

function createNode(spec) {
  function Node(jsonMoriModel, key) {
    this.key = key;
    this.model = jsonMoriModel;
  }

  extend(Node.prototype, NodePrototype)

  Node.get = function(model, key) {
    return new Node(model, key);
  }

  Node.create = function(model, key, data) {
    model.addNode(key, membrane.toHashMap(data));
    var node = this.get(model, key);
    return node;
  }

  if (spec) mixin(Node, spec)

  return Node;
}

var NodePrototype = {
  getData: function() {
    return membrane.toObject(this.model.getNode(this.key));
  },

  get: function (name) {
    var data = this.model.getNode(this.key)
    return mori.get(data, name)
  },

  update: function(updates) {
    var prevData = this.getData();

    this.model.updateNode(
      this.key,
      membrane.toHashMap(updates)
    );
    return this
  },

  remove: function() {
    this.model.removeNode(this.key);
  },

  addEdge: function(type, node, order, data) {
    this.model.addEdge(type, this.key, node.key, order, data);
  },

  removeEdge: function(type, node) {
    this.model.removeEdge(type, this.key, node.key);
  },

  getEdge: function(type, node, EdgeClass) {
    EdgeClass = EdgeClass || Edge
    var edge = this.model.getEdge(type, this.key, node.key)
    return edge && new EdgeClass(this.model, edge);
  },

  getEdges: function(type, EdgeClass) {
    EdgeClass = EdgeClass || Edge
    return mori.map(function (edge) {
      return new EdgeClass(this.model, edge)
    }.bind(this), this.model.getEdges(type, this.key));
  },

  getNodes: function(type, NodeClass) {
    return mori.reduce(function (nodes, edge) {
      var key = mori.get(edge, EdgeKeys.DEST)
      nodes.push(NodeClass.get(this.model, key))
      return nodes
    }.bind(this), [], this.model.getEdges(type, this.key))
  }
}

function mixin (ctor, spec) {
  spec = extend({}, spec) // copy to avoid modifying mixins
  var subMixin = mixin.bind(null, ctor)
  for (var k in spec) {
    switch (k) {
      case "static":
        extend(true, ctor, spec[k]);
        break;
      case "mixins":
        spec[k].forEach(subMixin)
        break;
      default:
        ctor.prototype[k] = spec[k];
    }
  }
}
