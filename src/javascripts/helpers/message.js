'use strict';

/*
  bad code
 */

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

  // [0] - action
  // [1] - data (optional) or callback (optional) if no data
  // [2] - callback (optional)
  // could be shifted by value, if some data is coming before these default args
  // example: this.tab
  /*
  _args: function (args, shift) {
    shift = shift || 0;

    var action = args[shift],
        data = args[shift + 1],
        cb = args[shift + 2];

    if (cb === undefined && typeof data === 'function') {
      cb = data;
      data = null;
    }

    return {
      cb: cb,
      message: { action: action, data: data }
    };
  },
  */

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

  /*

  popup: function () {
    this.send.apply(null, this.concat('popup', arguments));
  },

  content: function () {
    this.send.apply(null, this.concat('content', arguments));
  },

  event: function () {
    this.send.apply(null, this.concat('event', arguments));
  },

  forward: function (destination, msg) {
    this.send(destination, msg.action, msg.data, msg.cb);
  },

  send: function (destination, action, data, cb) {
    if (cb === undefined && typeof data === 'function') {
      cb = data;
      data = null;
    }

    var msg = { action: action, data: data };

    switch (destination) {

    case 'popup':
    case 'event':
      chrome.extension.sendMessage(msg, cb);
      break;

    case 'content':
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, msg, cb);
      });
      break;

    default:
      console.warn('Unknown destination: %s', destination);
    }
  },

  concat: function (thing, args) {
    return [thing].concat(Array.prototype.slice.call(args));
  }
  */
};

module.exports = message;