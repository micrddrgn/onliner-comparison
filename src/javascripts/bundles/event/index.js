'use strict';

/*
  TODO

  rename events
  handle errors
  context menu
  send tab message

 */

var message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Storage = require('../../lib/Storage');
var storage = new Storage('products', 'local');

var Badge = require('./Badge');
var badge = new Badge('#F5291A');

var recount = function () {
  console.log('recound');
  storage.count(function (count) {
    badge.setNumber(count);
  });
};

recount();

chrome.extension.onMessage.addListener(function (request, sender, respond) {

  // !!!! handle storage errors?
  console.log(request, sender, respond);

  switch (request.action) {

  case 'load':
    storage.findAll(respond);
    break;

  case 'add':
    storage.add(request.data, function (product, err) {
      if (err) { return respond(null, err); }

      respond(product);
      recount();
    });
    break;

  case 'remove':
    storage.remove(request.data, function (product, err) {
      if (err) { return respond(null, err); }

      respond(product);
      recount();

      message.content(request.action, request.data);
    });
    break;

  case 'reset':
    storage.reset(request.data, function (products, err) {
      if (err) { return respond(null, err); }

      respond(products);
      recount();
    });
    break;

  case 'clear':
    storage.clear(function (products, err) {
      if (err) { return respond(null, err); }

      respond(true);
      recount();
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


// create context menu for "compare" page
// adds functionality that allows users to remove items from compare table
// with no need to scroll down to the original buttons
var contextMenuComparePageRemoveId = 'compare-page-context-menu-remove-id';

chrome.contextMenus.create({
  id: contextMenuComparePageRemoveId,
  title: 'Удалить из сравнения',
  contexts: ['page', 'selection', 'link', 'image'],
  documentUrlPatterns: ['http://catalog.onliner.by/compare/*']
}, function() {
  // log error if failed to create context menu
  if (chrome.runtime.lastError) {
    handleError(chrome.runtime.lastError);
  }
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === contextMenuComparePageRemoveId) {
    message.tab(tab.id, 'context');
  }
});