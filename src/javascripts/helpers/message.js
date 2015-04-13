'use strict';

/*
  bad code
 */

var message = {

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

};

module.exports = message;