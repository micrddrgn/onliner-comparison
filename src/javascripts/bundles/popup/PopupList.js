'use strict';

var dom = require('../../helpers/dom');

var EventEmitter = require('../../lib/EventEmitter');

function PopupList($list, $status) {
  EventEmitter.call(this);

  this.$list = $list;
  this.$status = $status;
  this.ids = [];

  this.bindListeners();
}

PopupList.prototype = Object.create(EventEmitter.prototype);
PopupList.prototype.constructor = PopupList;

PopupList.prototype.template = '' +
  '<li class="product" data-id="{{id}}">' +
    '<div class="image">' +
      '<img src="{{imageUrl}}" title="{{title}}" alt="{{title}}">' +
    '</div>' +
    '<a href="{{url}}" ' +
        'target="_blank" ' +
        'title="{{title}} - откроется в новой вкладке">' +
      '<i class="icon-new-tab"></i>' +
      '<span>{{title}}</span>' +
    '</a>' +
    '<p>{{description}}</p>' +
    '<button class="remove"' +
            'title="Исключить товар из списка сравнения">' +
      '&#10006;' +
    '</button>' +
    '<div class="clear"></div>' +
  '</li>';

PopupList.prototype.compile = function (data) {
  // copy template to a variable
  var html = this.template;
  // iterate over data keys
  Object.keys(data).forEach(function (key) {
    var value = data[key];
    // create a placeholder pattern for particular key
    var pattern = new RegExp('{{' + key + '}}', 'gi');
    // replace globally
    html = html.replace(pattern, value);
  });
  // remove from the template all unused placeholders
  html = html.replace(/{{.*?}}/gi, '');

  var fragment = document.createElement('div');
  fragment.innerHTML = html;

  return fragment.firstChild;
};

PopupList.prototype.statuses = {
  empty: 'Товары для сравнения отсутствуют',
  loading: 'Загрузка...'
};

PopupList.prototype.showStatus = function (type) {
  this.$status.textContent = this.statuses[type];
  this.$status.classList.remove('cmpext-hidden');
};

PopupList.prototype.hideStatus = function () {
  this.$status.classList.add('cmpext-hidden');
};

PopupList.prototype.refresh = function () {
  if (this.ids.length === 0) {
    this.showStatus('empty');
  }
};

PopupList.prototype.getIds = function () {
  return this.ids;
};

PopupList.prototype.add = function (product) {

  var description = this.prepareDescription(product.description);

  var $fragment = this.compile({
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

PopupList.prototype.remove = function (id) {
  var index = this.ids.indexOf(id);
  if (index === -1) {
    return false;
  }
  this.ids.splice(index, 1);

  var $el = this.$list.querySelector('[data-id="' + id + '"]');
  if ($el) { $el.remove(); }

  this.refresh();
};

PopupList.prototype.prepareDescription = function (description) {
  // save compatibility with old string-like description
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

PopupList.prototype.stateIcon = function (state) {
  var word = state ? 'yes' : 'no';
  return '<img width="12" height="12" border="0" ' +
         'src="http://catalog.onliner.by/pic/ico_' + word + '.gif">';
};

PopupList.prototype.bindListeners = function () {

  dom.delegate(this.$list, 'click', '.remove', function (e) {

    var id = e.target.parentNode.dataset.id;
    this.emit('remove', id);

  }.bind(this));

};

module.exports = PopupList;