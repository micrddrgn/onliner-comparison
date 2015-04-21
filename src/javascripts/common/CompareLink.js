'use strict';

function CompareLink() {
  this.el = this.createEl();
}

CompareLink.prototype.createEl = function () {
  var a = document.createElement('a');
  a.className = 'cmpext-link';
  a.title = 'Открыть страницу сравнения товаров в новой вкладке';
  a.target = '_blank';
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