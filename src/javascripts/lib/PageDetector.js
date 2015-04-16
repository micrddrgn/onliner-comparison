'use strict';

function PageDetector(options) {
  this.pages = {};

  this.add(options);
}

PageDetector.prototype.add = function (name, options) {
  if (name && typeof name === 'object' && !options) {
    options = name;
  } else {
    options = {};
    options[name] = arguments[1];
  }

  Object.keys(options).forEach(function (name) {
    this.pages[name] = options[name];
  }, this);
};

PageDetector.prototype.detect = function () {

  var results = [];

  Object.keys(this.pages).forEach(function (name) {
    var options = this.pages[name];

    var match = true;

    if (options.selector !== undefined) {
      match = match && this.matchSelector(options.selector);
    }
    if (options.notSelector !== undefined) {
      match = match && !this.matchSelector(options.notSelector);
    }
    if (options.url !== undefined) {
      match = match && this.matchUrl(options.url);
    }

    if (match) {
      results.push(name);
    }
  }, this);

  if (results.length > 1) {
    console.warn('PageDetector: please set more descriptive rules, ' +
                 'there are multiple results for provided options');
    return null;
  }

  return results[0] || null;
};

PageDetector.prototype.matchSelector = function (selector) {
  if (typeof selector === 'string') {
    selector = [selector];
  }
  return selector.every(function (s) {
    return !!document.querySelector(s);
  });
};

PageDetector.prototype.matchUrl = function (url) {
  if (typeof url === 'string') {
    url = new RegExp(url);
  }
  return url.test(window.location.href);
};

module.exports = PageDetector;