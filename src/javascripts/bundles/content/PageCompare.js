'use strict';

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Page = require('./Page');

function PageCompare() {
  Page.call(this);

  // detect element that was right-clicked last in comparison table
  // then this element will be used to detect a product column
  // when context menu is invoked
  this.$lastRightClickedEl = null;

  this.on('context', this.onContext.bind(this));
}

PageCompare.prototype = Object.create(Page.prototype);
PageCompare.prototype.constructor = PageCompare;

PageCompare.prototype.initialize = function () {
  var $container = document.querySelector('#compare_column');
  $container.addEventListener('mousedown', this.onRightClick.bind(this));

  // table is not in DOM on page load, try grab it a bit later
  var fail = function () {
    handleError('Attempt failed to grab #rgMasterTable2');
  };
  dom.attempt(document, '#rgMasterTable2', 300, 5,
              this.parseTable.bind(this), fail);
};

PageCompare.prototype.onRightClick = function (e) {
  // 2 - right click
  if (e.button === 2) {
    this.$lastRightClickedEl = e.target;
  }
};

PageCompare.prototype.parseTable = function (table) {
  // ignore first column, because it is not about productc
  var startIndex = 1;

  var $tableBody = table.children[0];
  if (!$tableBody) { return handleError('Table body not found'); }

  var $rowWithImages = $tableBody.children[0],
      $rowWithTitles = $tableBody.children[1],
      $rowWithDescriptions = null;

  // at least one product should exist
  if ($rowWithImages.children.length <= startIndex) {
    return handleError('No any products');
  }

  // get all cells from the first column and
  // try to find a row with descriptions, it may not exist with some products
  var $firstColumnCells = dom.all($tableBody, 'tr td:nth-child(1)');

  $firstColumnCells.forEach(function ($cell, index) {
    // cell with class .pdsection is just a header of a section
    if (!$cell.parentNode.classList.contains('pdsection')) {
      return;
    }

    // all we need is cells in 'основные' section
    var title = $cell.textContent;
    if (title.toLowerCase() !== 'основные') {
      return;
    }

    // index of a cell is the index of the row with descriptions
    $rowWithDescriptions = $tableBody.children[index];
  });

  for (var i = startIndex, l = $rowWithImages.children.length; i < l; i++) {
    var $cellWithImage = $rowWithImages.children[i],
        $cellWithTitle = $rowWithTitles.children[i];

    var product = {};

    try {
      product.title = $cellWithTitle.querySelector('a').innerHTML;
      product.url = $cellWithImage.querySelector('a').href;
      product.id = util.uri(product.url);
      product.imageUrl = $cellWithImage.querySelector('img').src;
      product.description = '';
    } catch (e) {
      return handleError('Failed to parse product');
    }

    if ($rowWithDescriptions) {
      product.description = [];

      // iterate all rows under 'Основные' section until we reach next section
      // intermediate sections contain information
      // on which an original description is based on
      var $currentRow = $rowWithDescriptions;
      do {
        $currentRow = $currentRow.nextElementSibling;
        // if current row is a next section
        if ($currentRow.classList.contains('pdsection')) {
          break;
        }

        var $descriptionCell = $currentRow.children[i];

        var descriptionValue = null;
        // check if a cell contains a 'positive checkmark'
        if ($descriptionCell.querySelector('img[src$="ico_yes.gif"]')) {
          descriptionValue = true;
        // check if a cell contains a 'negative cross'
        } else if ($descriptionCell.querySelector('img[src$="ico_no.gif"]')) {
          descriptionValue = false;
        }

        // check if a text is a representable information
        var descriptionText = $descriptionCell.textContent.trim();
        if (descriptionValue === null &&
            (!descriptionText || descriptionText.toLowerCase() === 'нет данных')
        ) {
          continue;
        }

        // get parameter name for title attribute
        var descriptionTitle = $currentRow.children[0]
          .querySelector('a:last-child').textContent.trim();

        product.description.push({
          title: descriptionTitle,
          text: descriptionText,
          value: descriptionValue
        });
      } while ($currentRow);
    }

    this.products[product.id] = product;
  }

  // at least on product should exist
  if (util.size(this.products) === 0) {
    return handleError('No products for reset');
  }

  var data = util.values(this.products);
  message.event('reset', data, function () {
    // create empty function as a callback to keep conection with event page
  });
};

PageCompare.prototype.onContext = function () {
  if (!this.$lastRightClickedEl) {
    return handleError('No any last right-clicked el');
  }

  // get a cell for clicked element
  var $clickedCell = dom.closest(this.$lastRightClickedEl, 'td', true);
  if (!$clickedCell) {
    return handleError('No parent td for last right-clicked el');
  }

  // get index of this cell in a row
  var $siblingCells = dom.array($clickedCell.parentNode.children);
  // subract one because first column is not in count
  var index = $siblingCells.indexOf($clickedCell) - 1;
  // first column is a list of product attrbiutes
  if (!~index) {
    return handleError('Click on bad column');
  }

  var ids = util.keys(this.products);
  // remove element by ids index
  ids.splice(index, 1);

  var baseUrl = 'http://catalog.onliner.by';
  // if there are some more products left, refresh the page
  if (ids.length > 0) {

    var url = baseUrl + '/compare/' + ids.join('+');
    window.location.href = url;

  // if not - clear storage and redirect to home page
  } else {
    message.event('clear', function () {
      // create empty function as a callback to keep conection with event page
    });
    window.location.href = baseUrl;
  }

};

PageCompare.prototype.onRemove = function (id) {
  var ids = util.keys(this.products);

  // check if product is on a page
  var index = ids.indexOf(id);
  if (!~index) {
    return handleError('Product is not present');
  }

  // remove it to generate new url
  ids.splice(index, 1);

  var baseUrl = 'http://catalog.onliner.by';
  // if there are some more products left, refresh the page
  if (ids.length > 0) {
    var url = baseUrl + '/compare/' + ids.join('+');
    window.location.href = url;

  // if not - redirect to home page
  } else {
    window.location.href = baseUrl;
  }
};

module.exports = PageCompare;