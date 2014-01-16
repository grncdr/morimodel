var mori = require('mori');

var EdgeKeys = require('./EdgeKeys');

module.exports = MoriModel;

function MoriModel(opts) {
  opts = opts || {}
  this._nodes = this._prevNodes = opts.nodes || mori.hash_map();
  this._edges = this._prevEdges = opts.edges || mori.hash_map();
  this._onCommit = opts._onCommit
  this._committed = false;
}

MoriModel.prototype.getNode = function(key) {
  return mori.get(this._nodes, key);
}

MoriModel.prototype.addNode = function(key, value) {
  this._nodes = mori.assoc(this._nodes, key, value);
}

MoriModel.prototype.removeNode = function(key) {
  this.addNode(key, null);
}

MoriModel.prototype.updateNode = function (key, value) {
  this._nodes = mori.assoc(this._nodes, key, value);
}

MoriModel.prototype.addEdge = function(type, key, key2, order, data) {
  var newEdge = mori.vector(
    type,
    order || -1,
    key,
    key2,
    data || mori.hash_map()
  );
  if (!mori.get(this._edges, key)) {
    this._edges = mori.assoc(this._edges, key, mori.sorted_set(newEdge));
  } else {
    var prevEdges = mori.get(this._edges, key);
    var replaced = false;
    var newEdges = mori.map(function(edge) {
      if (mori.get(edge, EdgeKeys.TYPE) === type &&
          mori.get(edge, EdgeKeys.DEST) === key2) {
        replaced = true;
        return newEdge;
      } else {
        return edge
      }
    }, prevEdges);
    
    if (!replaced) {
      newEdges = mori.conj(newEdges, newEdge);
    }
    this._edges = mori.assoc(this._edges, key, newEdges);
  }
}

MoriModel.prototype.removeEdge = function(type, key, key2) {
  var prevEdges = mori.get(this._edges, key);
  if (prevEdges) {
    var nextEdges = mori.filter(function(edge) {
      return !(mori.get(edge, EdgeKeys.TYPE) === type && mori.get(edge, EdgeKeys.DEST) === key2);
    });
    this._edges = mori.assoc(this._edges, key, nextEdges);
  }
}

MoriModel.prototype.updateEdge = function (oldEdge, property, value) {
  var sourceKey = mori.get(oldEdge, EdgeKeys.SRC)
  var prevEdges = mori.get(this._edges, sourceKey)
  var newEdge = mori.assoc(oldEdge, property, value)
  var nextEdges = mori.map(function (edge) {
    return (edge === oldEdge) ? newEdge : edge
  }, prevEdges)
  this._edges = mori.assoc(this._edges, sourceKey, nextEdges)
  return newEdge
}

MoriModel.prototype.getEdge = function(type, key, key2) {
  return mori.first(
    mori.filter(function(edge) {
      return mori.get(edge, EdgeKeys.DEST) === key2;
    }, this.getEdges(type, key))
  );
}

MoriModel.prototype.getEdges = function(type, key) {
  return mori.filter(function(edge) {
    return mori.get(edge, EdgeKeys.TYPE) === type;
  }, mori.seq(mori.get(this._edges, key)));
}

MoriModel.prototype.getNodesByType = function(type, key) {
  return mori.map(function(edge) {
    return this.getNode(mori.get(edge, EdgeKeys.DEST));
  }.bind(this), this.getEdges(type, key));
}

MoriModel.prototype.getNodeByType = function(type, key) {
  return mori.first(this.getNodesByType(type, key));
}

MoriModel.prototype.commit = function(metadata) {
  if (this._committed) {
    throw new Error('You already called commit() on this model.');
  }

  var nextGraph = new MoriModel({
    nodes: this._nodes,
    edges: this._edges,
    onCommit: this._onCommit
  });

  this._nodes = this._prevNodes
  this._edges = this._prevEdges

  this._committed = true;
  if (this._onCommit) this._onCommit(metadata)

  return nextGraph;
}
