'use strict';

/*
  todo:
 */

function PageGrid() {}

PageGrid.prototype.parse = function (cell) {
  var row = cell.parentNode;
  var siblings = row.querySelectorAll('td.pgcheck');

  var index = Array.prototype.slice.call(siblings).indexOf(cell);

  var imageRow = row.nextElementSibling;
  var imageCell = imageRow.children[index];
  var nameRow = imageRow.nextElementSibling;
  var nameCell = nameRow.children[index];

  var title = nameCell.querySelector('div.pgname a').innerText;
  var url = nameCell.querySelector('div.pgname a').href;
  var imageUrl = imageCell.querySelector('img').src;
  var id = url.split('/').filter(function(n) { return n; }).pop();
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

PageGrid.prototype.id = function (cell) {
  return cell.querySelector('a').href.split('/')
             .filter(function(n) { return n; }).pop();
};

PageGrid.prototype.message = function (action, data, callback) {
  var message = { action: action, source: 'content', data: data };
  chrome.extension.sendMessage(message, callback);
};

PageGrid.prototype.handler = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

  var cell = dom.closest(toggler.getEl(), 'td');
  var product = this.parse(cell);

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

PageGrid.prototype.render = function () {
  var cells = as.array(document.querySelectorAll('.pgimage'));
  var container = dom.closest(cells[0], 'table');

  cells.forEach(function (cell) {
    var row = cell.parentNode;
    var compareRow = row.previousElementSibling;

    var index = as.array(row.children).indexOf(cell);
    var compareCell = compareRow.querySelectorAll('td.pgcheck')[index];

    var id = this.id(cell);

    dom.children(compareCell, function (child) {
      child.style.display = 'none';
    });

    var toggler = new Toggler();
    compareCell.appendChild(toggler.getEl());

  }, this);

  container.addEventListener('click', this.handler.bind(this));

  this.drawButtons();
};


PageGrid.prototype.drawButtons = function () {
  var cells = as.array(document.querySelectorAll('.pgcompbtn table td.pgcheck'));
  cells.forEach(function (cell) {

    dom.children(cell, function (child) {
      child.style.display = 'none';
    });

    cell.appendChild(this.compareLink());

  }, this);
};

PageGrid.prototype.compareLink = function () {
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