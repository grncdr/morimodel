var createNode = require('../../src/createNode');

var User = module.exports = createNode({
  getDescription: function() {
    var data = this.getData();
    return 'User ' + data.name + ', age ' + data.age + ' (' + this.getNodes('friend', User).length + ' friends)';
  },
  addFriend: function(node) {
    this.addEdge('friend', node);
    node.addEdge('friend', this);
  },
  getFriends: function() {
    return this.getNodes('friend', User);
  },
  static: {
    createUser: function(model, name, age) {
      return this.create(model, name, {name: name, age: age});
    }
  }
});
