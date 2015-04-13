'use strict';

function EventEmitter() {
  this._eventmap = {};
}

EventEmitter.prototype.on = function (event, listener) {
  this._eventmap[event] = this._eventmap[event] || [];
  this._eventmap[event].push(listener);
};

EventEmitter.prototype.emit = function (event) {
  var listeners = this._eventmap[event];
  if (!listeners) {
    return;
  }

  var args = Array.prototype.slice.call(arguments, 1);

  listeners.forEach(function (listener) {
    listener.apply(null, args);
  });
};

module.exports = EventEmitter;