'use strict';

/*
  todo:
  - rename event
  - simplify parsing
  - review the code
 */

var message = require('../../helpers/message'),
    dom = require('../../helpers/dom');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

function PageProduct() {
  Page.call(this);

  this.on('remove', this.untoggle);
}

PageProduct.prototype = Object.create(Page.prototype);
PageProduct.prototype.constructor = PageProduct;

PageProduct.prototype.parse = function () {
  var container = document.querySelector('.b-offers-desc');

  var title = document.querySelector('.product-header .b-offers-heading .b-offers-title').innerText;
  var url = container.querySelector('.b-offers-desc__leave-review').href.split('/').slice(0, -2).join('/');
  var imageUrl = container.querySelector('.b-offers-desc__figure .b-offers-desc__figure-wrap img').src;
  var id = url.split('/').filter(function(n) { return n; }).pop();
  var description = [];

  var descriptionRows = document.querySelectorAll('.product-specs .product-specs__group--short table tr');
  if (descriptionRows.length > 0) {
    for (var i = 0; i < descriptionRows.length; i++) {
      var descriptionRow = descriptionRows[i];

      var descriptionCell = descriptionRow.children[1];

      var descriptionValue = null;
      // check if a cell contains a 'positive checkmark'
      if (descriptionCell.querySelector('span.i-tip')) {
        descriptionValue = true;
      // check if a cell contains a 'negative cross'
      } else if (descriptionCell.querySelector('span.i-x')) {
        descriptionValue = false;
      }

      // check if a text is a representable information
      var descriptionText = descriptionCell.textContent.trim();
      if (descriptionValue === null && (!descriptionText || descriptionText.toLowerCase() === 'нет данных')) {
        continue;
      }

      var descriptionTitle = descriptionRow.children[0].innerText.trim();

      description.push({
        title: descriptionTitle,
        text: descriptionText,
        value: descriptionValue
      });
    }
  }

  var product = {
    id: id,
    url: url,
    title: title,
    description: description,
    imageUrl: imageUrl
  };

  return product;
};

PageProduct.prototype.untoggle = function (id) {
  var target = document.querySelector('[data-toggler="' + id + '"]');
  if (!target) {
    return true;
  }
  target.toggler.toggle(false);
};

PageProduct.prototype.handle = function (e) {
  e.stopPropagation();
  e.preventDefault();

  var toggler = e.target.toggler;
  var product = this.parse();

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

PageProduct.prototype.id = function (a, skip) {
  var parts = a.href.split('/').filter(function (n) { return n; });
  var n = parts.length - 1;
  if (skip) { n -= skip; }
  return parts[n];
};

PageProduct.prototype.render = function () {
  var container = document.querySelector('.b-offers-desc__info-rating');

  var id = this.id(container.querySelector('a'), 1);

  var toggler = new Toggler({
    className: 'cmpext-toggler',
    data: { toggler: id }
  });

  container.appendChild(toggler.getEl());

  dom.delegate(container, 'click', '.cmpext-toggler', this.handle.bind(this));
};

module.exports = PageProduct;