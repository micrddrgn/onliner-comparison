'use strict';

function PageGroupedList() {}

PageGroupedList.prototype.parse = function (row) {
  var container = row.querySelector('td.pdescr');

  var title = container.querySelector('strong.pname a').innerText;
  var url = container.querySelector('strong.pname a').href;
  var imageUrl = (row.querySelector('td.pimage img') || {}).src;
  var id = url.split('/').filter(function(n) { return n; }).pop();
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

PageGroupedList.prototype.message = function (action, data, callback) {
  var message = { action: action, source: 'content', data: data };
  chrome.extension.sendMessage(message, callback);
};

PageGroupedList.prototype.handle = function (e) {
  e.stopPropagation();
  e.preventDefault();

  var toggler = e.target.toggler;
  
  var row = dom.closest(toggler.getEl(), 'tr');
  var product = this.parse(row);

  if (toggler.isActive()) {
    this.message('removeProduct', product.id, function () {
      toggler.toggle();
    });
  } else {
    this.message('addProduct', product, function () {
      toggler.toggle();
    });
  }
};

PageGroupedList.prototype.handleAll = function (e) {
  e.stopPropagation();
  e.preventDefault();
  
  var toggler = e.target.toggler;

  var row = dom.closest(toggler.getEl(), 'tr');
  var next = row.nextElementSibling;

  if (toggler.isActive()) {

    var els = dom.all(next, '.cmpext-toggler.active');
    els.forEach(function (el) {
      el.toggler.toggle(false);
    });

    toggler.toggle(false);

  } else {
    var els = dom.all(next, '.cmpext-toggler:not(.active)');
    els.forEach(function (el) {
      el.toggler.toggle(true);
    });

    toggler.toggle(true);
  }

};

PageGroupedList.prototype.render = function () {
  var container = document.querySelector('[name="product_list"]');
  var cells = dom.all(container, 'table tr td.pimage');

  cells.forEach(function (cell) {
    var row = cell.parentNode;

    var moreRow = row.nextElementSibling;

    var productRows = dom.all(moreRow, '.dev_row');

    productRows.forEach(function (productRow) {
      
      productRow.children[0].children[1].style.display = 'none';
      productRow.children[1].children[0].style.display = 'none';


      var toggler = new Toggler({ className: 'cmpext-toggler' });
      productRow.children[1].appendChild(toggler.getEl());
    });


    var cb = cell.children[1].children[0];
    var cbContainer = cb.parentNode;

    dom.children(cbContainer, function (child) {
      child.style.display = 'none';
    });

    var togglerAll = new Toggler({ className: 'cmpext-toggler-all' });
    var el = togglerAll.getEl();
    el.dataset.all = true;
    cbContainer.appendChild(el);

  }, this);

  dom.delegate(container, 'click', '.cmpext-toggler-all', this.handleAll.bind(this));
  dom.delegate(container, 'click', '.cmpext-toggler', this.handle.bind(this));

  this.drawButtons();
};

PageGroupedList.prototype.drawButtons = function () {
  var container = document.querySelector('[name="product_list"]');
  var rows = dom.all(container, 'div.pcompbtn > table tr');

  rows.forEach(function (row) {
    if (row.children.length === 4) {
      row.children[1].style.display = 'none';
      row.children[2].style.display = 'none';
    } else if (row.children.length === 3) {
      row.children[1].style.display = 'none';
    }

    row.children[0].children[0].style.display = 'none';

    row.children[0].appendChild(this.compareLink());

  }, this);
};

PageGroupedList.prototype.compareLink = function () {
  var img = document.createElement('img');
  img.src = 'http://catalog.onliner.by/pic/btn_compare.gif';

  var a = document.createElement('a');
  a.className = '';
  a.title = 'Открыть страницу сравнения товаров в текущей вкладке';
  a.appendChild(img);

  a.addEventListener('click', function (e) {
    e.preventDefault();

    console.log('click on compare link');
  });

  return a;
};