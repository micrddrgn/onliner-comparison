'use strict';

var EventEmitter = require('../../lib/EventEmitter');

var CompareLink = require('../../common/CompareLink');

function Page() {
  EventEmitter.call(this);

  // store all created compare links
  this.compareLinks = [];
  // when 'change' event is fired - it will give a list of current ids
  // so links always should have up-to-date hrefs
  // 'change' event will fire for any kind of action
  // that changes a products list
  this.on('change', this.updateCompareLinks.bind(this));
}

Page.prototype = Object.create(EventEmitter.prototype);
Page.prototype.constructor = Page;

Page.prototype.createCompareLink = function () {
  var compareLink = new CompareLink();
  this.compareLinks.push(compareLink);
  return compareLink.getEl();
};

Page.prototype.updateCompareLinks = function (ids) {
  this.compareLinks.forEach(function (compareLink) {
    compareLink.updateHref(ids);
  });
};

module.exports = Page;