var mori = require('mori')
var membrane = require('./membrane')

var EdgeKeys = require('./EdgeKeys')

module.exports = Edge

function Edge (model, edge) {
  this.model = model
  this._edge = edge
}

Edge.prototype.get = function (name) {
  this._exists()
  return mori.get_in(this._edge, [EdgeKeys.DATA, name])
}

Edge.prototype.getData = function () {
  this._exists()
  return membrane.toObject(mori.get(this._edge, EdgeKeys.DATA))
}

Edge.prototype.update = function (updates) {
  this._exists()

  var data = membrane.toHashMap(updates)
  this._edge = this.model.updateEdge(this._edge, EdgeKeys.DATA, data);

  return this
}

Edge.prototype.remove = function () {
  this._exists()
  this.model.removeEdge(
    mori.get(this._edge, EdgeKeys.TYPE),
    mori.get(this._edge, EdgeKeys.SRC),
    mori.get(this._edge, EdgeKeys.DEST)
  )
  this._edge = false
}

Edge.prototype.order = function (value) {
  this._exists()

  if (value) {
    this._edge = this.model.updateEdge(this._edge, EdgeKeys.ORDER, value);
    return this
  } else {
    return mori.get(this._edge, EdgeKeys.ORDER)
  }
}

Edge.prototype.source = function (NodeClass) {
  var key = mori.get(this._edge, EdgeKeys.SRC)
  return NodeClass.get(this.model, key)
}

Edge.prototype.dest = function (NodeClass) {
  var key = mori.get(this._edge, EdgeKeys.DEST)
  return NodeClass.get(this.model, key)
}

Edge.prototype.rawData = function () {
  return mori.get(this._edge, EdgeKeys.DATA)
}

Edge.prototype._exists = function () {
  if (this._edge) {
    var edges = mori.get(this.model._edges,
                         mori.get(this._edge, EdgeKeys.SRC))

    var exists = mori.first(mori.filter(function (edge) {
      return edge === this._edge
    }.bind(this), edges))

    if (exists)
      return true
  }
  this._edge = false
  throw new Error("edge no longer exists")
}
