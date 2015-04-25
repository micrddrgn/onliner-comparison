'use strict';

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

// -----------------------------------------------------------------------------

function PageList() {
  Page.call(this);
}

PageList.prototype = Object.create(Page.prototype);
PageList.prototype.constructor = PageList;

PageList.prototype.initialize = function () {
  this.$container = document.querySelector('[name="product_list"]');
  if (!this.$container) {
    return handleError('Container [name="product_list"] not found');
  }

  message.event('ids', function (ids) {

    this.parse(ids);

    this.updateCompareLinksRef(ids);

    this.bindListeners();

  }.bind(this));
};

// -----------------------------------------------------------------------------

PageList.prototype.parse = function (ids) {
  var $checkCells = dom.all(this.$container, 'table td.pcheck');

  // iterate over all products on a page
  $checkCells.forEach(function ($checkCell, index) {
    var $productRow = $checkCell.parentNode;

    // parse current product
    var product = {};
    try {
      var $pdescr = $productRow.querySelector('td.pdescr');
      var $link = $pdescr.querySelector('strong.pname a');
      product.title = $link.innerText;
      product.url = $link.href;
      product.id = util.uri(product.url);
      product.imageUrl = $productRow.querySelector('td.pimage img').src;
      product.description = $pdescr.querySelector('div').innerText
                              .replace(', подробнее...', '');
    } catch(e) {
      return handleError('Failed to parse product');
    }

    var $newCell = dom.create('td.pcheck');

    if (index === 0) {
      $newCell.appendChild(this.createCompareLink('list'));
    }

    // figure out if product is already in cart
    var isActive = !!~ids.indexOf(product.id);

    var toggler = new Toggler({
      isActive: isActive,
      addTitle: 'Добавить в сравнение',
      removeTitle: 'Исключить из сравнения'
    }, {
      className: 'cmpext',
      dataset: {
        togglerId: product.id,
        page: 'list'
      }
    });

    $newCell.appendChild(toggler.getEl());

    if (index === $checkCells.length - 1) {
      $newCell.appendChild(this.createCompareLink('list'));
    }

    $productRow.replaceChild($newCell, $checkCell);

    this.products[product.id] = {
      data: product,
      toggler: toggler
    };
  }, this);
};

PageList.prototype.bindListeners = function () {
  this.$container.addEventListener('click', this.onToggle.bind(this));
};

module.exports = PageList;