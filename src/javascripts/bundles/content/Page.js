'use strict';

var EventEmitter = require('../../lib/EventEmitter');

function Page() {
  EventEmitter.call(this);
}

Page.prototype = Object.create(EventEmitter.prototype);
Page.prototype.constructor = Page;

module.exports = Page;