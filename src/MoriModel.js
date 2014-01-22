var mori = require('mori');

var EdgeKeys = require('./EdgeKeys');

module.exports = MoriModel;

function MoriModel(onCommit) {
  this._nodes = mori.hash_map();
  this._edges = mori.hash_map();
  this._onCommit = onCommit
  this._committed = false;
}

MoriModel.prototype.getNode = function(key) {
  return mori.get(this._nodes, key);
}

MoriModel.prototype.addNode = function(key, value) {
  throwIfCommitted(this)
  this._nodes = mori.assoc(this._nodes, key, value);
}

MoriModel.prototype.removeNode = function(key) {
  throwIfCommitted(this)
  this.addNode(key, null);
}

MoriModel.prototype.updateNode = function (key, value) {
  throwIfCommitted(this)
  this._nodes = mori.assoc(this._nodes, key, value);
}

MoriModel.prototype.addEdge = function(type, key, key2, order, data) {
  throwIfCommitted(this)
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
  throwIfCommitted(this)
  var prevEdges = mori.get(this._edges, key);
  if (prevEdges) {
    var nextEdges = mori.filter(function(edge) {
      return !(mori.get(edge, EdgeKeys.TYPE) === type && mori.get(edge, EdgeKeys.DEST) === key2);
    });
    this._edges = mori.assoc(this._edges, key, nextEdges);
  }
}

MoriModel.prototype.updateEdge = function (oldEdge, property, value) {
  throwIfCommitted(this)
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

MoriModel.prototype.fork = function (onCommit) {
  var model = new MoriModel(onCommit || this._onCommit)
  model._nodes = this._nodes
  model._edges = this._edges
  return model
}

MoriModel.prototype.commit = function(metadata) {
  throwIfCommitted(this)

  var snapshot = this.fork()
  snapshot._committed = true

  if (this._onCommit) this._onCommit(snapshot, metadata)

  return snapshot;
}

function throwIfCommitted (model) {
  if (model._committed) {
    throw new Error('This model is a snapshot')
  }
}
