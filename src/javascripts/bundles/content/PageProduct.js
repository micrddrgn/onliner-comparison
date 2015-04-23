'use strict';

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

// -----------------------------------------------------------------------------

function PageProduct() {
  Page.call(this);
}

PageProduct.prototype = Object.create(Page.prototype);
PageProduct.prototype.constructor = PageProduct;

PageProduct.prototype.initialize = function () {
  this.$container = document.querySelector('.product-primary-i');
  if (!this.$container) {
    return handleError('Container .product-primary-i not found');
  }

  message.event('ids', function (ids) {

    this.parse(ids);

    this.bindListeners();

  }.bind(this));
};

PageProduct.prototype.parse = function (ids) {
  // parse current product
  var product = {};
  try {
    var $desc = this.$container.querySelector('.b-offers-desc');
    var $link = $desc.querySelector('.b-offers-desc__leave-review');

    product.title = document.querySelector('.b-offers-title').innerText;
    product.url = util.cut($link.href, 1);
    product.id = util.uri(product.url);
    product.imageUrl = $desc.querySelector('#device-header-image').src;
    product.description = [];

    var $descriptionRows = dom
          .all(this.$container, '.product-specs__group--short table tr');

    if ($descriptionRows.length > 0) {
      $descriptionRows.forEach(function ($descriptionRow) {
        var $descriptionCell = $descriptionRow.children[1];

        var descriptionValue = null;
        // check if a cell contains a 'positive checkmark'
        if ($descriptionCell.querySelector('span.i-tip')) {
          descriptionValue = true;
        // check if a cell contains a 'negative cross'
        } else if ($descriptionCell.querySelector('span.i-x')) {
          descriptionValue = false;
        }

        // check if a text is a representable information
        var descriptionText = $descriptionCell.textContent.trim();
        if (descriptionValue === null &&
          (!descriptionText || descriptionText.toLowerCase() === 'нет данных')
        ) {
          return;
        }

        var descriptionTitle = $descriptionRow.children[0].innerText.trim();

        product.description.push({
          title: descriptionTitle,
          text: descriptionText,
          value: descriptionValue
        });
      });
    }


  } catch (e) {
    return handleError('Failed to parse product');
  }

  // figure out if product is already in cart
  var isActive = !!~ids.indexOf(product.id);

  var $rating = document.querySelector('.b-offers-desc__info-rating');

  var toggler = new Toggler({
    isActive: isActive
  }, {
    className: 'cmpext',
    dataset: { togglerId: product.id }
  });

  $rating.appendChild(toggler.getEl());

  this.products[product.id] = {
    data: product,
    toggler: toggler
  };
};

PageProduct.prototype.bindListeners = function () {
  dom.delegate(this.$container, 'click', '.cmpext', this.onToggle.bind(this));
};

// -----------------------------------------------------------------------------

PageProduct.prototype.onToggle = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

  // get product id from the toggler
  var id = toggler.getEl().dataset.togglerId;

  // find product in the list of parsed products
  var product = this.products[id];
  if (!product) { return handleError('Toggled product not found on a page'); }

  if (toggler.isActive()) {
    message.event('remove', id, function () {
      toggler.toggle(false);
    });
  } else {
    message.event('add', product.data, function () {
      toggler.toggle(true);
    });
  }
};

PageProduct.prototype.onRemove = function (id) {
  // find product in a list of parsed products
  var product = this.products[id];
  if (!product) {
    return handleError('Removed product not found on a page');
  }
  product.toggler.toggle(false);
};

module.exports = PageProduct;