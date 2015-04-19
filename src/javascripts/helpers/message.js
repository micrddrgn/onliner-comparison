'use strict';

var message = {

  // arguments: action, data, cb
  popup: function () {
    this.send(arguments, function (message, cb) {
      chrome.extension.sendMessage(message, cb);
    });
  },

  // arguments: action, data, cb
  event: function () {
    this.send(arguments, function (message, cb) {
      chrome.extension.sendMessage(message, cb);
    });
  },

  // arguments: action, data, cb
  content: function () {
    this.send(arguments, function (message, cb) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, cb);
      });
    });
  },

  // arguments: tab, action, data, cb
  tab: function (tab) {
    // shift one arg because of tab
    this.send(arguments, 1, function (message, cb) {
      chrome.tabs.sendMessage(tab, message, cb);
    });
  },

  send: function (args, shift, caller) {
    if (caller === undefined && typeof shift === 'function') {
      caller = shift;
      shift = 0;
    }
    // [0] - action
    // [1] - data (optional) or callback (optional) if no data
    // [2] - callback (optional)
    // could be shifted, if some data is coming before these default args
    var action = args[shift],
        data = args[shift + 1],
        cb = args[shift + 2];

    if (cb === undefined && typeof data === 'function') {
      cb = data;
      data = null;
    }
    if (cb === undefined) {
      cb = Function.prototype();
    }

    caller({ action: action, data: data }, cb);
  }

};

module.exports = message;