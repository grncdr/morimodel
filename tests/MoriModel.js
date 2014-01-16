var test = require('tape')
var mori = require('mori');
var MoriModel = require('../src/MoriModel');

test('MoriModel', function(t) {
  var graph = new MoriModel();

  t.equals(graph.getNode('mykey'), null);
  graph.addNode('mykey', mori.hash_map('name', 'myvalue'));
  t.ok(
    mori.equals(graph.getNode('mykey'), mori.hash_map('name', 'myvalue'))
  )

  graph.addNode('mykey2', mori.hash_map('name', 'myvalue2'));
  graph.addEdge('friends', 'mykey', 'mykey2');

  var graph2 = graph.commit();

  t.equals(graph.getNode('mykey'), null);
  t.ok(
    mori.equals(graph2.getNode('mykey'), mori.hash_map('name', 'myvalue'))
  )

  graph = graph2;

  t.ok(
    mori.equals(
      graph.getNodesByType('friends', 'mykey'),
      mori.vector(mori.hash_map('name', 'myvalue2'))
    )
  )

  t.end()
});
