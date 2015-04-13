'use strict';

var compareLink = require('../../helpers/compareLink'),
    message = require('../../helpers/message');

var PopupList = require('./PopupList');

// this script will run any time user opens a popup

/*
  TODO

  comment
  escape/unecape test
  truncate
  rename events
 */

var $list = document.getElementById('products'),
    $status = document.getElementById('status'),
    $compare = document.getElementById('compare');

$compare.appendChild(compareLink());


var popupList = new PopupList($list, $status);

popupList.on('remove', function (id) {
  message.event('removeProduct', id, function (response) {
    if (response) {
      popupList.remove(id);
    }
  });
});

message.event('loadProducts', function (products) {
  if (products.length > 0) {

    products.forEach(function (product) {
      popupList.add(product);
    });

  } else {
    popupList.refresh();
  }
});