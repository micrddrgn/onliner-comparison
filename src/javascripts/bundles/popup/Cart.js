'use strict';

var dom = require('../../helpers/dom');

var EventEmitter = require('../../lib/EventEmitter');

function Cart($list, $status) {
  EventEmitter.call(this);

  this.$list = $list;
  this.$status = $status;
  this.ids = [];

  this.bindListeners();
}

Cart.prototype = Object.create(EventEmitter.prototype);
Cart.prototype.constructor = Cart;

Cart.prototype.template = '' +
  '<li class="product" data-id="{{id}}">' +
    '<div class="image">' +
      '<img src="{{imageUrl}}" title="{{title}}" alt="{{title}}">' +
    '</div>' +
    '<a href="{{url}}" ' +
        'target="_blank" ' +
        'title="{{title}} - откроется в новой вкладке">' +
      '<span>{{title|ellipsize:28}}</span>' +
    '</a>' +
    '<p>{{description}}</p>' +
    '<button class="remove"' +
            'title="Исключить из сравнения">' +
      '&#10006;' +
    '</button>' +
    '<div class="clear"></div>' +
  '</li>';

Cart.prototype.statuses = {
  empty: 'Товары для сравнения отсутствуют',
  loading: 'Загрузка...'
};

Cart.prototype.showStatus = function (type) {
  this.$status.textContent = this.statuses[type];
  this.$status.classList.remove('cmpext-hidden');
};

Cart.prototype.hideStatus = function () {
  this.$status.classList.add('cmpext-hidden');
};

Cart.prototype.refresh = function () {
  if (this.ids.length === 0) {
    this.showStatus('empty');
  }
};

Cart.prototype.getIds = function () {
  return this.ids;
};

Cart.prototype.add = function (product) {

  var description = this.prepareDescription(product.description);

  var $fragment = dom.template.compile(this.template, {
    id: product.id,
    title: product.title,
    url: product.url,
    imageUrl: product.imageUrl,
    description: description
  });

  this.ids.push(product.id);

  this.$list.appendChild($fragment);
  this.hideStatus();
};

Cart.prototype.remove = function (id) {
  var index = this.ids.indexOf(id);
  if (!~index) {
    return false;
  }
  this.ids.splice(index, 1);

  var $el = this.$list.querySelector('[data-id="' + id + '"]');
  if ($el) { $el.remove(); }

  this.refresh();
};

Cart.prototype.prepareDescription = function (description) {
  // compatibility with old string-like description
  if (Array.isArray(description)) {
    description = description.map(function (part) {
      var html = '<span title="' + part.title + '">';
      if (part.value === true || part.value === false) {
        html += this.stateIcon(part.value);
      }
      html += ' ' + part.text + '</span>';
      return html;
    }, this).join(', ');
  }
  return description || '(описание отсутствует)';
};

Cart.prototype.stateIcon = function (state) {
  var word = state ? 'yes' : 'no';
  return '<img width="12" height="12" border="0" ' +
         'src="http://catalog.onliner.by/pic/ico_' + word + '.gif">';
};

Cart.prototype.bindListeners = function () {

  dom.delegate(this.$list, 'click', '.remove', function (e) {

    var id = e.target.parentNode.dataset.id;
    this.emit('remove', id);

  }.bind(this));

};

module.exports = Cart;