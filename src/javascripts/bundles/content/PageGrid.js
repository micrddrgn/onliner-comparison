'use strict';

/*
  todo:
    - review the code
    - optimize
 */

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

function PageGrid() {
  Page.call(this);

  this.on('remove', this.onRemove);
}

PageGrid.prototype = Object.create(Page.prototype);
PageGrid.prototype.constructor = PageGrid;

PageGrid.prototype.render = function () {
  var cells = dom.all(document, '.pgimage');
  if (!cells.length) {
    return handleError('.pgimage cells not found');
  }

  this.container = dom.closest(cells[0], 'table');
  if (!this.container) {
    return handleError('Container table for .pgimage not found');
  }

  message.event('ids', function (ids) {

    this.renderButtons(ids);

    this.updateCompareLinks(ids);

    this.container.addEventListener('click', this.onToggle.bind(this));

  }.bind(this));
};

PageGrid.prototype.renderButtons = function (ids) {
  var cells = dom.all(this.container, '.pgimage');

  cells.forEach(function (oldCell) {
    var row = oldCell.parentNode;
    var compareRow = row.previousElementSibling;

    var link = oldCell.querySelector('a');
    if (!link) {
      return handleError('Cell has no link');
    }

    var index = dom.array(row.children).indexOf(oldCell);
    if (index === -1) {
      return handleError('Cell not found within row');
    }

    var compareCell = compareRow.querySelectorAll('td.pgcheck')[index];

    var cell = document.createElement('td');
    cell.className = 'pgcheck';

    var id = util.uri(link.href);
    var isActive = ids.indexOf(id) > -1;

    var toggler = new Toggler({
      className: 'cmpext',
      isActive: isActive,
      data: { toggler: id }
    });

    cell.appendChild(toggler.getEl());

    compareCell.parentNode.replaceChild(cell, compareCell);
  }, this);

  var compareCells = dom.all(document, '.pgcompbtn table td.pgcheck');
  compareCells.forEach(function (compareCell) {

    var newCell = document.createElement('td');
    newCell.className = 'pcheck';
    newCell.appendChild(this.createCompareLink());

    compareCell.parentNode.replaceChild(newCell, compareCell);
  }, this);
};

PageGrid.prototype.onToggle = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

  var cell = dom.closest(toggler.getEl(), 'td');
  var product = this.parseProduct(cell);

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

PageGrid.prototype.parseProduct = function (cell) {
  var row = cell.parentNode;
  var siblings = dom.all(row, 'td.pgcheck');

  var index = siblings.indexOf(cell);

  var imageRow = row.nextElementSibling;
  var imageCell = imageRow.children[index];
  var nameRow = imageRow.nextElementSibling;
  var nameCell = nameRow.children[index];

  var title = nameCell.querySelector('div.pgname a').innerText;
  var url = nameCell.querySelector('div.pgname a').href;
  var imageUrl = imageCell.querySelector('img').src;
  var id = util.uri(url);
  var description = '';

  var product = {
    id: id,
    url: url,
    title: title,
    description: description,
    imageUrl: imageUrl
  };

  return product;
};

PageGrid.prototype.onRemove = function (id) {
  var target = document.querySelector('[data-toggler="' + id + '"]');
  if (!target) { return handleError('Removed product not found on a page'); }
  target.toggler.toggle(false);
};

module.exports = PageGrid;