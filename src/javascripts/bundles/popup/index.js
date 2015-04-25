// this script will run any time user opens a popup

'use strict';

var message = require('../../helpers/message');

var CompareLink = require('../../common/CompareLink');

var Cart = require('./Cart');


var $list = document.getElementById('products'),
    $status = document.getElementById('status'),
    $compare = document.getElementById('compare');


var compareLink = new CompareLink();
$compare.appendChild(compareLink.getEl());


var cart = new Cart($list, $status);

cart.on('remove', function (id) {
  message.event('remove', id, function (response) {
    if (response) {
      cart.remove(id);
      compareLink.updateRef(cart.getIds());
    }
  });
});

message.event('load', function (products) {
  if (products.length > 0) {

    products.forEach(function (product) {
      cart.add(product);
    });

    compareLink.updateRef(cart.getIds());

  } else {
    cart.refresh();
  }
});