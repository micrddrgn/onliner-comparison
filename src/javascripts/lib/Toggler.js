'use strict';

var util = require('../helpers/util');

function Toggler(options, attrs) {

  this.options = util.extend({
    tagName: 'button',
    isActive: false,
    activeClassName: 'active',
    addContent: '+',
    addTitle: 'Add',
    removeContent: '-',
    removeTitle: 'Remove'
  }, options);

  this.el = this.createEl(attrs);
  this.toggle(this.options.isActive);
}

Toggler.prototype.createEl = function (attrs) {
  var el = document.createElement(this.options.tagName);

  attrs = attrs || {};
  // workaround read-only dataset property
  if (attrs.dataset) {
    util.extend(el.dataset, attrs.dataset);
    delete attrs.dataset;
  }

  util.extend(el, attrs || {});

  // add toggler reference to an element
  el.toggler = this;

  return el;
};

Toggler.prototype.toggle = function (to) {
  if (to !== true && to !== false) {
    to = !this.options.isActive;
  }
  if (to) {
    this.el.classList.add(this.options.activeClassName);
    this.el.innerHTML = this.options.removeContent;
    this.el.title = this.options.removeTitle;
  } else {
    this.el.classList.remove(this.options.activeClassName);
    this.el.innerHTML = this.options.addContent;
    this.el.title = this.options.addTitle;
  }
  this.options.isActive = to;
};

Toggler.prototype.isActive = function () {
  return this.options.isActive;
};

Toggler.prototype.getEl = function () {
  return this.el;
};

module.exports = Toggler;