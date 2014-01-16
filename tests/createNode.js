var test = require('tape')
var User = require('./fixture/user')
var MoriModel = require('../src/MoriModel');

test('createNode', function(t) {
  

  var model = new MoriModel();

  var u1 = User.createUser(model, 'pete', 25);
  var u2 = User.createUser(model, 'tina', 26);

  u1.addFriend(u2);

  t.equal(u1.getDescription(), 'User pete, age 25 (1 friends)');
  t.equal(u2.getDescription(), 'User tina, age 26 (1 friends)');

  model = model.commit();

  u1 = User.get(model, 'pete');

  t.equal(u1.getDescription(), 'User pete, age 25 (1 friends)');
  t.equal(u1.getFriends().length, 1);
  t.equal(u1.getFriends()[0].getDescription(), 'User tina, age 26 (1 friends)');

  t.end()
});
