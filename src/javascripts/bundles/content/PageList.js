'use strict';

/*
  todo:
    - review the code
 */

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

function PageList() {
  Page.call(this);

  this.on('remove', this.onRemove);
}

PageList.prototype = Object.create(Page.prototype);
PageList.prototype.constructor = PageList;

PageList.prototype.render = function () {
  this.container = document.querySelector('[name="product_list"]');
  if (!this.container) {
    return handleError('Container [name="product_list"] not found');
  }

  message.event('ids', function (ids) {

    this.renderButtons(ids);

    this.updateCompareLinks(ids);

    this.container.addEventListener('click', this.onToggle.bind(this));

  }.bind(this));
};

PageList.prototype.renderButtons = function (ids) {
  var cells = dom.all(this.container, 'table td.pcheck');

  cells.forEach(function (oldCell, index) {
    var row = oldCell.parentNode;

    var link = row.querySelector('td.pdescr strong.pname a');
    if (!link) { return handleError('Row has no link'); }

    var cell = document.createElement('td');
    cell.className = 'pcheck';

    if (index === 0) {
      cell.appendChild(this.createCompareLink());
    }

    var id = util.uri(link.href);
    var isActive = ids.indexOf(id) > -1;

    var toggler = new Toggler({
      className: 'cmpext',
      isActive: isActive,
      data: { toggler: id }
    });
    cell.appendChild(toggler.getEl());

    if (index === cells.length - 1) {
      cell.appendChild(this.createCompareLink());
    }

    row.replaceChild(cell, oldCell);
  }, this);
};

PageList.prototype.onToggle = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

  var row = dom.closest(toggler.getEl(), 'tr');
  var product = this.parseProduct(row);

  if (toggler.isActive()) {
    message.event('remove', product.id, function () {
      toggler.toggle(false);
    });
  } else {
    message.event('add', product, function () {
      toggler.toggle(true);
    });
  }
};

PageList.prototype.parseProduct = function (row) {
  var container = row.querySelector('td.pdescr');

  var title = container.querySelector('strong.pname a').innerText;
  var url = container.querySelector('strong.pname a').href;
  var imageUrl = (row.querySelector('td.pimage img') || {}).src;
  var id = util.uri(url);
  var description = container.querySelector('div').innerText
                             .replace(', подробнее...', '');
  var product = {
    id: id,
    url: url,
    title: title,
    description: description,
    imageUrl: imageUrl
  };

  return product;
};

PageList.prototype.onRemove = function (id) {
  var target = document.querySelector('[data-toggler="' + id + '"]');
  if (!target) { return handleError('Removed product not found on a page'); }
  target.toggler.toggle(false);
};

module.exports = PageList;