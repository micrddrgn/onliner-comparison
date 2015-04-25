'use strict';

var dom = require('../../helpers/dom'),
    util = require('../../helpers/util'),
    message = require('../../helpers/message'),
    handleError = require('../../helpers/handleError');

var Toggler = require('../../lib/Toggler');

var Page = require('./Page');

// -----------------------------------------------------------------------------

function PageGroupedList() {
  Page.call(this);

  this.groups = {};
}

PageGroupedList.prototype = Object.create(Page.prototype);
PageGroupedList.prototype.constructor = PageGroupedList;

PageGroupedList.prototype.initialize = function () {
  this.$container = document.querySelector('[name="product_list"]');
  if (!this.$container) {
    return handleError('Container [name="product_list"] not found');
  }

  message.event('ids', function (ids) {

    this.parse(ids);

    this.renderCompareLinks();

    this.updateCompareLinksRef(ids);

    this.bindListeners();

  }.bind(this));
};

// -----------------------------------------------------------------------------

PageGroupedList.prototype.parse = function (ids) {
  // iterate over all product groups
  var $imageCells = dom.all(this.$container, 'table tr td.pimage');
  $imageCells.forEach(function ($imageCell) {
    var $productRow = $imageCell.parentNode;

    // grab id of the group for group toggler
    var $groupLink = $productRow.querySelector('td.pdescr strong.pname a');
    if (!$groupLink) { return handleError('Row has no link'); }

    var groupId = util.uri($groupLink.href);
    var groupIds = [], groupActiveIds = [];


    var $configurationsRow = $productRow.nextElementSibling;
    // get all configurations for product/group
    var $configurationRows = dom.all($configurationsRow, '.dev_row');

    $configurationRows.forEach(function ($configurationRow) {
      // parse current configuration (product)
      var product = {};
      try {
        var $pdescr = $configurationRow.querySelector('td.pdescr');
        var $link = $pdescr.querySelector('strong.pname a');
        product.title = $link.innerText;
        product.url = $link.href;
        product.id = util.uri(product.url);
        product.imageUrl = $imageCell.querySelector('img').src;
        product.description = $pdescr.querySelector('div').innerText
                                .replace(', подробнее...', '');
      } catch(e) {
        return handleError('Failed to parse product');
      }

      // figure out if product is already in cart
      var isActive = !!~ids.indexOf(product.id);

      // populate current group with configuration id
      groupIds.push(product.id);
      if (isActive) { groupActiveIds.push(product.id); }

      // replace first cell with our own
      // because original one has some weird effect we don't need
      var $emptyCell = dom.create('td.pcheck');
      var $emptyDiv = dom.create('div', {}, { width: '110px' });
      $emptyCell.appendChild($emptyDiv);
      $configurationRow.replaceChild($emptyCell, $configurationRow.children[0]);

      // create a cell for toggler and replace original cell
      var $togglerCell = dom.create('td.pcheck');
      var toggler = new Toggler({
        isActive: isActive,
        addTitle: 'Добавить все в сравнение',
        removeTitle: 'Исключить все из сравнения'
      }, {
        className: 'cmpext',
        dataset: {
          togglerId: product.id,
          page: 'grouped-list'
        }
      });

      $togglerCell.appendChild(toggler.getEl());
      $configurationRow.replaceChild(
        $togglerCell, $configurationRow.children[1]
      );

      // add product and it's toggler to current page product map
      this.products[product.id] = {
        data: product,
        toggler: toggler,
        groupId: groupId
      };
    }, this);

    // figure out if products of current group are all in cart
    var isGroupActive = (groupIds.length > 0 &&
                         groupIds.length === groupActiveIds.length);

    // grab product (group) checkbox container
    // to replace it with group toggler
    var $checkboxContainer = $imageCell.children[1];
    var $newContainer = dom.create('div');

    var groupToggler = new Toggler({
      isActive: isGroupActive,
      addContent: '+ Сравнить все',
      addTitle: 'Добавить все в сравнение',
      removeContent: '- Исключить все',
      removeTitle: 'Исключить все из сравнения'
    }, {
      className: 'cmpext-group',
      dataset: {
        togglerId: groupId,
        page: 'grouped-list'
      }
    });

    $newContainer.appendChild(groupToggler.getEl());
    $imageCell.replaceChild($newContainer, $checkboxContainer);

    // add current group to groupmap
    this.groups[groupId] = {
      toggler: groupToggler,
      ids: {
        all: groupIds,
        active: groupActiveIds
      }
    };

  }, this);
};

PageGroupedList.prototype.renderCompareLinks = function () {
  var $compareRows = dom.all(this.$container, 'div.pcompbtn > table tr');

  // because original compare buttons are weirdly placed
  // hide some stuff to make our compare buttons look nice
  $compareRows.forEach(function ($compareRow) {

    var $newRow = dom.create('tr');

    var $newCompareCell = dom.create('td');
    $newCompareCell.appendChild(this.createCompareLink('grouped-list'));

    var $newDescCell = $compareRow.lastElementChild.cloneNode(true);

    $newRow.appendChild($newCompareCell);
    $newRow.appendChild($newDescCell);

    $compareRow.parentNode.replaceChild($newRow, $compareRow);
  }, this);
};

PageGroupedList.prototype.bindListeners = function () {
  dom.delegate(this.$container, 'click', '.cmpext',
               this.onToggle.bind(this));

  dom.delegate(this.$container, 'click', '.cmpext-group',
               this.onToggleAll.bind(this));
};

// -----------------------------------------------------------------------------

PageGroupedList.prototype.onToggle = function (e) {
  // extract toggler from element
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

  // add/remove a product to/from database
  if (toggler.isActive()) {

    message.event('remove', id, function () {

      // find a group for current product and remove this product
      var group = this.groups[product.groupId];
      var index = group.ids.active.indexOf(id);

      if (~index) {
        group.ids.active.splice(index, 1);
      }

      // untoggle group toggler if no more products from this group are in
      if (group.ids.active.length === 0) {
        group.toggler.toggle(false);
      }

      toggler.toggle(false);

    }.bind(this));

  } else {

    message.event('add', product.data, function () {

      // find a group for current product and add this product
      var group = this.groups[product.groupId];
      var index = group.ids.active.indexOf(id);

      if (!~index) {
        group.ids.active.push(product.data.id);
      }

      // toggle group toggler if all products from this group are in
      if (group.ids.active.length === group.ids.all.length) {
        group.toggler.toggle(true);
      }

      toggler.toggle(true);

    }.bind(this));

  }
};

PageGroupedList.prototype.onToggleAll = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

  // get group id from the toggler
  var id = toggler.getEl().dataset.togglerId;

  // find group in the list of created groups
  var group = this.groups[id];
  if (!group) { return handleError('Toggled group not found on a page'); }

  // add/remove groups of products to/from database
  if (toggler.isActive()) {
    if (group.ids.active.length !== 0) {

      // remove all ids that are active now
      message.event('removeBatch', group.ids.active, function () {

        // get only active parsed products
        var products = util.pick(this.products, group.ids.active);

        // untoggle their togglers
        products.forEach(function (product) {
          product.toggler.toggle(false);
        });
        toggler.toggle(false);

        // reset a list because all products from this group are now removed
        group.ids.active = [];

      }.bind(this));

    }
  } else {
    if (group.ids.active.length !== group.ids.all.length) {

      // calculate a list of "inactive" ids
      var inactiveIds = util.subtract(group.ids.all, group.ids.active);

      // pick only inactive products to add
      var products = util.pick(this.products, inactiveIds);
      var data = util.pluck(products, 'data');

      message.event('addBatch', data, function () {
        // toggle all inactive products
        products.forEach(function (product) {
          product.toggler.toggle(true);
        });
        toggler.toggle(true);

        // now all products from this group are in
        // make copy to avoid references
        group.ids.active = group.ids.all.slice();

      }.bind(this));

    }
  }
};

PageGroupedList.prototype.onRemove = function (id) {
  // find product in a list of parsed products
  var product = this.products[id];
  if (!product) {
    return handleError('Removed product not found on a page');
  }

  // find a group for this product
  var group = this.groups[product.groupId];
  if (!group) {
    return handleError('Removed product group not found on a page');
  }

  // remove this product from the list of group's active products
  var index = group.ids.active.indexOf(id);
  if (~index) {
    group.ids.active.splice(index, 1);
  }

  // untoggle both group and product togglers
  if (group.ids.active.length < group.ids.all.length) {
    group.toggler.toggle(false);
  }
  product.toggler.toggle(false);
};

module.exports = PageGroupedList;