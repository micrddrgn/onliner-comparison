'use strict';

var message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Storage = require('../../lib/Storage');
var storage = new Storage('products', 'local');

var Badge = require('./Badge');
var badge = new Badge('#F5291A');

var recount = function () {
  storage.count(function (count) {
    badge.setNumber(count);
  });
  storage.ids(function (ids) {
    message.content('ids', ids);
  });
};
recount();

chrome.extension.onMessage.addListener(function (request, sender, respond) {

  switch (request.action) {

  case 'load':
    storage.findAll(respond);
    break;

  case 'ids':
    storage.ids(respond);
    break;

  case 'add':
    storage.add(request.data, function (product, err) {
      if (err) { return respond(null, err); }

      respond(product);
      recount();
    });
    break;

  case 'addBatch':
    storage.addBatch(request.data, function (products, err) {
      if (err) { return respond(null, err); }

      respond(products);
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

  case 'removeBatch':
    storage.removeBatch(request.data, function (products, err) {
      if (err) { return respond(null, err); }

      respond(products);
      recount();
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
var menuItemId = 'cmpext-compare-page-remove';

chrome.contextMenus.create({
  id: menuItemId,
  title: 'Удалить из сравнения',
  contexts: ['page', 'selection', 'link', 'image'],
  documentUrlPatterns: ['http://catalog.onliner.by/compare/*']
}, function () {
  // log error if failed to create context menu
  if (chrome.runtime.lastError) {
    handleError(chrome.runtime.lastError);
  }
});

// let content script know about menu item click
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === menuItemId) {
    message.tab(tab.id, 'context');
  }
});