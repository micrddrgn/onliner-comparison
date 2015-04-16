'use strict';

var message = require('../../helpers/message');

var CompareLink = require('../../common/CompareLink');

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

$compare.appendChild(new CompareLink());

var popupList = new PopupList($list, $status);

popupList.on('remove', function (id) {
  message.event('remove', id, function (response) {
    if (response) {
      popupList.remove(id);
    }
  });
});

message.event('load', function (products) {
  if (products.length > 0) {

    products.forEach(function (product) {
      popupList.add(product);
    });

  } else {
    popupList.refresh();
  }
});