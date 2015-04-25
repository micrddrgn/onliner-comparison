'use strict';

var message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var CompareLink = require('../../common/CompareLink');

var EventEmitter = require('../../lib/EventEmitter');

function Page() {

  EventEmitter.call(this);

  // all products parsed on the page
  // should be added to this object, with id as a key
  this.products = {};

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

// -----------------------------------------------------------------------------

Page.prototype.createCompareLink = function (page) {
  var compareLink = new CompareLink({
    dataset: {
      page: page,
      order: this.compareLinks.length + 1
    }
  });
  this.compareLinks.push(compareLink);
  return compareLink.getEl();
};

Page.prototype.updateCompareLinksRef = function (ids) {
  this.compareLinks.forEach(function (compareLink) {
    compareLink.updateRef(ids);
  });
};

// -----------------------------------------------------------------------------

Page.prototype.onIds = function (ids) {
  this.updateCompareLinksRef(ids);
};

Page.prototype.onRemove = function (id) {
  // find product in a list of parsed products
  var product = this.products[id];
  if (!product) {
    return handleError('Removed product not found on a page');
  }
  product.toggler.toggle(false);
};

// toggle should be bind or overridden by a child page
Page.prototype.onToggle = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

  // get product id from the toggler
  var id = toggler.getEl().dataset.togglerId;

  // find product in the list of parsed products
  var product = this.products[id];
  if (!product) { return handleError('Toggled product not found on a page'); }

  if (toggler.isActive()) {
    message.event('remove', id, function () {
      toggler.toggle(false);
    });
  } else {
    message.event('add', product.data, function () {
      toggler.toggle(true);
    });
  }
};

module.exports = Page;