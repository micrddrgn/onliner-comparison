'use strict';

var util = require('../helpers/util');

function CompareLink(attrs) {
  this.el = this.createEl(attrs);
}

CompareLink.prototype.createEl = function (attrs) {
  var a = document.createElement('a');
  a.className = 'cmpext-link';
  a.title = 'Открыть страницу сравнения товаров в новой вкладке';
  a.target = '_blank';

  attrs = attrs || {};
  // workaround read-only dataset property
  if (attrs.dataset) {
    util.extend(a.dataset, attrs.dataset);
    delete attrs.dataset;
  }

  util.extend(a, attrs || {});

  return a;
};

CompareLink.prototype.getEl = function () {
  return this.el;
};

CompareLink.prototype.updateRef = function (ids) {
  var url = 'http://catalog.onliner.by/compare/' + ids.join('+');
  this.el.href = url;
};

module.exports = CompareLink;