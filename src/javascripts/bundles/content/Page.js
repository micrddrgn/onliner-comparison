'use strict';

/*
  todo:
    - parseProduct is called twice to grab all info for remove and add
      for remove we only need id
 */

var message = require('../../helpers/message');

var EventEmitter = require('../../lib/EventEmitter');

var CompareLink = require('../../common/CompareLink');

function Page() {

  EventEmitter.call(this);

  // store all created compare links
  this.compareLinks = [];
  // when 'ids' event is fired - it will give a list of current ids
  // so links always should have up-to-date hrefs
  // 'ids' event will fire for any kind of action
  // that changes a products list
  this.on('ids', this.onIds.bind(this));

  this.on('remove', this.onRemove.bind(this));
}

Page.prototype = Object.create(EventEmitter.prototype);
Page.prototype.constructor = Page;

Page.prototype.createCompareLink = function () {
  var compareLink = new CompareLink();
  this.compareLinks.push(compareLink);
  return compareLink.getEl();
};

Page.prototype.updateCompareLinksRef = function (ids) {
  this.compareLinks.forEach(function (compareLink) {
    compareLink.updateRef(ids);
  });
};

Page.prototype.onIds = function (ids) {
  this.updateCompareLinksRef(ids);
};

Page.prototype.onRemove = function (id) {};

Page.prototype.onToggle = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) { return true; }
  e.stopPropagation();
  e.preventDefault();

  var product = this.parseProduct(toggler);

  if (toggler.isActive()) {
    product = this.parseProduct(toggler, true);
    message.event('remove', product.id, function () {
      toggler.toggle(false);
    });
  } else {
    message.event('add', product, function () {
      toggler.toggle(true);
    });
  }
};

module.exports = Page;