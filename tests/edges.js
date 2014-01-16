var test = require('tape')
var User = require('./fixture/user')
var MoriModel = require('../src/MoriModel');

test('edge operations', function(t) {
  var model = new MoriModel()
  var u1 = User.createUser(model, 'Stephen', 25);
  var u2 = User.createUser(model, 'Erin', 26);

  t.equal(u1.getEdge('friend', u2), null)

  u1.addFriend(u2)

  var friendship = u1.getEdge('friend', u2)

  t.equal(friendship.order(), -1)

  friendship.order(3)
  t.equal(friendship.order(), 3)

  friendship.update({age: 'old'})
  t.equal(friendship.get('age'), 'old')

  model.commit()
  
  t.throws(function () {
    friendship.get('age')
  }, "edge no longer exists after commit")

  t.end()
})
