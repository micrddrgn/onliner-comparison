'use strict';

function PageList() {
  Page.call(this);

  this.on('removeProduct', this.untoggle);
}

PageList.prototype = Object.create(Page.prototype);
PageList.prototype.constructor = PageList;

PageList.prototype.parse = function (row) {
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

PageList.prototype.id = function (row) {
  return row.querySelector('td.pdescr strong.pname a').href.split('/')
            .filter(function(n) { return n; }).pop();
};

PageList.prototype.message = function (action, data, callback) {
  var message = { action: action, source: 'content', data: data };
  chrome.extension.sendMessage(message, callback);
};

PageList.prototype.untoggle = function (id) {
  var target = document.querySelector('[data-toggler="' + id + '"]');
  if (!target) {
    return true;
  }
  target.toggler.toggle(false);
};

PageList.prototype.handler = function (e) {
  var toggler = e.target.toggler;
  if (!toggler) {
    return true;
  }
  e.stopPropagation();
  e.preventDefault();

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

PageList.prototype.render = function () {
  var container = document.querySelector('[name="product_list"]');
  var cells = dom.all(container, 'table td.pcheck');

  cells.forEach(function (cell, index) {
    var row = cell.parentNode;
    var id = this.id(row);

    dom.children(cell, function (child) {
      child.style.display = 'none';
    });

    if (index === 0) {
      cell.appendChild(this.compareLink());
    }

    var toggler = new Toggler({
      className: 'cmpext',
      data: { toggler: id }
    });
    cell.appendChild(toggler.getEl());

    if (index === cells.length - 1) {
      cell.appendChild(this.compareLink());
    }

    row.replaceChild(cell, cell);
  }, this);

  container.addEventListener('click', this.handler.bind(this));
};


PageList.prototype.compareLink = function () {
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