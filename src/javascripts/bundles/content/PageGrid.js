'use strict';

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

// -----------------------------------------------------------------------------

function PageGrid() {
  Page.call(this);
}

PageGrid.prototype = Object.create(Page.prototype);
PageGrid.prototype.constructor = PageGrid;

PageGrid.prototype.initialize = function () {
  var $imageCell = document.querySelector('.pgimage');
  if (!$imageCell) {
    return handleError('Container child .pgimage not found');
  }

  this.$container = dom.closest($imageCell, 'table');
  if (!this.$container) {
    return handleError('Container for .pgimage not found');
  }

  message.event('ids', function (ids) {

    this.parse(ids);

    this.renderCompareLinks();

    this.updateCompareLinksRef(ids);

    this.bindListeners();

  }.bind(this));
};

// -----------------------------------------------------------------------------

PageGrid.prototype.parse = function (ids) {
  var $imageCells = dom.all(this.$container, '.pgimage');

  // iterate over all products on a page
  $imageCells.forEach(function ($imageCell) {

    // parse current product
    var product = {};
    try {
      var $link = $imageCell.firstChild;
      var $image = $link.firstChild;
      product.title = $image.title;
      product.url = $link.href;
      product.id = util.uri(product.url);
      product.imageUrl = $image.src;
      product.description = '';

    } catch (e) {
      return handleError('Failed to parse product');
    }

    var $productRow = $imageCell.parentNode;
    var $compareRow = $productRow.previousElementSibling;

    // get index of current cell to find a cell for toggler
    var index = dom.array($productRow.children).indexOf($imageCell);
    var $compareCell = $compareRow.querySelectorAll('td.pgcheck')[index];

    var $newCell = dom.create('td.pgcheck');

    // figure out of product is already in cart
    var isActive = !!~ids.indexOf(product.id);

    var toggler = new Toggler({
      isActive: isActive,
      addTitle: 'Добавить в сравнение',
      removeTitle: 'Исключить из сравнения'
    }, {
      className: 'cmpext',
      dataset: {
        togglerId: product.id,
        page: 'grid'
      }
    });
    $newCell.appendChild(toggler.getEl());

    $compareCell.parentNode.replaceChild($newCell, $compareCell);

    this.products[product.id] = {
      data: product,
      toggler: toggler
    };
  }, this);
};

PageGrid.prototype.renderCompareLinks = function () {
  var $compareCells = dom.all(document, '.pgcompbtn table td.pgcheck');
  $compareCells.forEach(function ($compareCell) {

    var $newCell = dom.create('td.pcheck');
    $newCell.appendChild(this.createCompareLink('grid'));

    $compareCell.parentNode.replaceChild($newCell, $compareCell);
  }, this);
};

PageGrid.prototype.bindListeners = function () {
  this.$container.addEventListener('click', this.onToggle.bind(this));
};

module.exports = PageGrid;