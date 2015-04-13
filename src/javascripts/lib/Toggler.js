'use strict';

function Toggler(options) {
  this.options = {};
  this.setOptions(options || {});

  this.el = this.createEl();
  this.toggle(this.options.isActive);
}

Toggler.prototype.defaults = {
  tagName: 'button',
  className: '',
  isActive: false,
  activeClassName: 'active',
  data: {},
  addContent: '+',
  addTitle: 'Add',
  removeContent: '-',
  removeTitle: 'Remove'
};

Toggler.prototype.setOptions = function (options) {
  Object.keys(this.defaults).forEach(function (name) {
    if (Object.hasOwnProperty.call(options, name)) {
      this.options[name] = options[name];
    } else {
      this.options[name] = this.defaults[name];
    }
  }, this);
};

Toggler.prototype.createEl = function () {
  var el = document.createElement(this.options.tagName);
  if (this.options.className) {
    el.className = this.options.className;
  }
  Object.keys(this.options.data).forEach(function (key) {
    var value = this.options.data[key];
    el.dataset[key] = value;
  }, this);
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