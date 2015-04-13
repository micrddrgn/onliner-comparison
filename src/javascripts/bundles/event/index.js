'use strict';

/*
  TODO

  rename events
  handle errors
  context menu
  send tab message

 */

var message = require('../../helpers/message');

var Storage = require('../../lib/Storage');
var storage = new Storage('products', 'local');

var Badge = require('./Badge');
var badge = new Badge('#F5291A');

var recount = function () {
  storage.count(function (count) {
    badge.setNumber(count);
  });
};

recount();

chrome.extension.onMessage.addListener(function (request, sender, respond) {

  // !!!! handle storage errors?
  console.log(request, sender, respond);

  switch (request.action) {
  case 'loadProducts':


    storage.findAll(respond);
    break;
  case 'addProduct':
    storage.add(request.data, function (product, err) {
      if (err) { return respond(null, err); }

      respond(product);
      recount();
    });
    break;
  case 'removeProduct':
    storage.remove(request.data, function (product, err) {
      if (err) { return respond(null, err); }

      respond(product);
      recount();

      message.forward('content', request);

    });
    break;
  default:
    console.warn('Unknown action: %s', request.action);
    break;
  }

  // This function becomes invalid when the event listener returns,
  // unless you return true from the event listener to indicate
  // you wish to send a response asynchronously (this will keep the
  // message channel open to the other end until sendResponse is called).
  return true;
});