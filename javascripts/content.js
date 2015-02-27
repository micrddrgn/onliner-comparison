// shortcut for sending a message
function sendMessage(action, data, callback) {
  var message = { action: action, source: 'content', data: data };
  chrome.extension.sendMessage(message, callback);
}

// http://stackoverflow.com/a/18664016/1573638
function getClosest(el, tag) {
  // this is necessary since nodeName is always in upper case
  tag = tag.toUpperCase();
  do {
    if (el.nodeName === tag) {
      // tag name is found! let's return it
      return el;
    }
  } while (el = el.parentNode);

  // not found
  return null;
}

function parseProduct() {

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
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
  switch(request.action) {

    case 'parseProduct':
      sendResponse(parseProduct());
      if (rateBlock !== null) {
        button.classList.add('state-remove');
        button.innerHTML = 'Удалить из сравнения &#10006;';
        button.title = 'Исключить данный товар из списка для сравнения';
      }
      break;

    case 'removeProduct':
      if (rateBlock !== null) {
        button.classList.remove('state-remove');
        button.innerHTML = 'Добавить к сравнению';
        button.title = 'Добавить данный товар в список для сравнения';
      }
      break;

    case 'removePageProduct':

      if (!lastRightClickedEl) {
        return false;
      }

      var tableCell = getClosest(lastRightClickedEl, 'td');

      // cast HTMLNodeCollection to Array
      var tableRowCells = Array.prototype.slice.call(tableCell.parentNode.children);

      // "remove" link is only displayed when there is >= 3 products in the list
      if (tableRowCells.length <= 3) {
        return false;
      }

      var tableCellIndex = tableRowCells.indexOf(tableCell);

      // first column is a list of product attrbiutes
      if (tableCellIndex === 0) {
        return false;
      }

      // find row with links, consider it to be second from the beginning
      var tableBody = compareColumn.querySelector('table#rgMasterTable2 tbody');
      if (!tableBody) { return false; }

      var linksRow = tableBody.children[1];
      if (!linksRow) { return false; }

      var linkCol = linksRow.children[tableCellIndex];
      if (!linkCol) { return false; }

      var links = linkCol.querySelectorAll('a');
      if (! links) { return false };

      var link = links[1];
      if (! link) { return false; }

      // trigger click on a link
      link.click();

      break;

    default:
      return false;
  }
});

// attach custom button to a page

var rateBlock = document.querySelector('.b-offers-desc__info-rating');
if (rateBlock !== null) {

  var product = parseProduct();

  var button = document.createElement('button');
  button.classList.add('onliner-comparison-extension-technical-page-add-button');

  sendMessage('findProduct', product.id, function(response) {
    if (response === null) {
      button.innerHTML = 'Добавить к сравнению';
      button.classList.remove('state-remove');
      button.title = 'Добавить данный товар в список для сравнения';
    } else {
      button.classList.add('state-remove');
      button.innerHTML = 'Удалить из сравнения &#10006;';
      button.title = 'Исключить данный товар из списка для сравнения';
    }
    rateBlock.appendChild(button);
  });

  button.addEventListener('click', function() {
    if (button.classList.contains('state-remove')) {
      sendMessage('removeProduct', product.id, function(response) {
        button.classList.remove('state-remove');
        button.innerHTML = 'Добавить к сравнению';
        button.title = 'Добавить данный товар в список для сравнения';
      });
    } else {
      sendMessage('addProduct', product, function(response) {
        button.classList.add('state-remove');
        button.innerHTML = 'Удалить из сравнения &#10006;';
        button.title = 'Исключить данный товар из списка для сравнения';
      });
    }
  }, true);
}

// comparison page

// detect element that was right-clicked last in comparison table
// then this element will be used to detect a product column
// when context menu is invoked
var lastRightClickedEl = null;
var compareColumn = document.querySelector('#compare_column');
if (compareColumn !== null) {

  compareColumn.addEventListener('mousedown', function(event) {
    // 2 - right click
    if (event.button === 2) {
      lastRightClickedEl = event.target;
    }
  }, true);

  // for some reason table itself does not exist after page load
  // maybe some javascript is involved
  // so constantly try to get the table
  var compareTable;
  function parseCompareTable() {
    compareTable = document.querySelector('#rgMasterTable2');
    if (!compareTable) {
      setTimeout(parseCompareTable, 50);
    } else {
      // table has been found

      var products = [];

      // ignore first column, because it is not about productc
      var startIndex = 1;

      var tableBody = compareTable.children[0];
      if (! tableBody) { return false };

      var tableRowWithImages = tableBody.children[0],
        tableRowWithTitles = tableBody.children[1],
        tableRowWithDescriptions = null;

      // at least one product should exist
      if (tableRowWithImages.children.length <= startIndex) {
        return false;
      }

      // get all cells from the first column
      // and try to find a row with descriptions, it may not exist with some products
      var tableFirstColumnCells = tableBody.querySelectorAll('tr td:nth-child(1)');
      for (var i = 0; i < tableFirstColumnCells.length; i++) {
        var tableCell = tableFirstColumnCells[i];
        if (! tableCell.parentNode.classList.contains('pdsection')) {
          continue;
        }

        var title = tableCell.textContent;
        if (title.toLowerCase() !== 'основные') {
          continue;
        }

        // index of a cell is the index of the row with descriptions
        tableRowWithDescriptions = tableBody.children[i];
      }

      for (var i = startIndex; i < tableRowWithImages.children.length; i++) {

        var tableCellWithImage = tableRowWithImages.children[i],
          tableCellWithTitle = tableRowWithTitles.children[i];

        var title = tableCellWithTitle.querySelector('a').innerHTML;
        var url = tableCellWithImage.querySelector('a').href;
        var imageUrl = tableCellWithImage.querySelector('img').src;
        var id = url.split('/').filter(function(n) { return n; }).pop();
        var description = '';

        if (tableRowWithDescriptions) {
          var description = [];

          // iterate all rows under 'Основные' section until we reach next section
          // intermediate sections contain information on which an original description is based on
          var currentRow = tableRowWithDescriptions;
          do {
            currentRow = currentRow.nextElementSibling;
            // if current row is a next section
            if (currentRow.classList.contains('pdsection')) {
              break;
            }

            var descriptionCell = currentRow.children[i];

            var descriptionValue = null;
            // check if a cell contains a 'positive checkmark'
            if (descriptionCell.querySelector('img[src$="ico_yes.gif"]')) {
              descriptionValue = true;
            // check if a cell contains a 'negative cross'
            } else if (descriptionCell.querySelector('img[src$="ico_no.gif"]')) {
              descriptionValue = false;
            }

            // check if a text is a representable information
            var descriptionText = descriptionCell.textContent.trim();
            if (descriptionValue === null && (!descriptionText || descriptionText.toLowerCase() === 'нет данных')) {
              continue;
            }

            // get parameter name for title attribute
            var descriptionTitle = currentRow.children[0].querySelector('a:last-child').textContent.trim();

            description.push({
              title: descriptionTitle,
              text: descriptionText,
              value: descriptionValue
            });
          } while (currentRow);
        }

        var product = {
          id: id,
          url: url,
          title: title,
          description: description,
          imageUrl: imageUrl
        };

        products.push(product);
      }

      // at least on product should exist
      if (products.length === 0) {
        return false;
      }

      sendMessage('resetProducts', products, function(response) {
        // do nothing on response
      });
    }
  }

  // if sync is enabled parse a comparison table for products
  // and reset data in popup to have the same products
  sendMessage('isEnabledSync', null, function(response) {
    var enabled = !!response;
    if (enabled) {
      parseCompareTable();
    }
  });

}

// products list page
var productsForm = document.querySelector('[name="product_list"]');
if (productsForm !== null) {

  function parseListProduct(button) {

    var tableRow = getClosest(button, 'tr');

    var container = tableRow.querySelector('td.pdescr');

    var title = container.querySelector('strong.pname a').innerText;
    var url = container.querySelector('strong.pname a').href;
    var imageUrl = (tableRow.querySelector('td.pimage img') || {}).src;
    var id = url.split('/').filter(function(n) { return n; }).pop();
    var description = container.querySelector('div').innerText.replace(', подробнее...', '');

    var product = {
      id: id,
      url: url,
      title: title,
      description: description,
      imageUrl: imageUrl
    };

    return product;
  }

  function renderList(ids) {

    var checkTableCells = productsForm.querySelectorAll('table td.pcheck');
    var drawnCompareLinks = 0;

    for (var i = 0; i < checkTableCells.length; i++) {
      var checkTableCell = checkTableCells[i];
      var checkTableRow = checkTableCell.parentNode;

      var hasCompareLink = false;

      for (var j = 0; j < checkTableCell.children.length; j++) {
        if (checkTableCell.children[j].classList.contains('pcompbtn')) {
          hasCompareLink = true;
        }
        checkTableCell.children[j].style.display = 'none';
      }

      if (hasCompareLink) {
        var compareLinkImg = document.createElement('img');
        compareLinkImg.src = 'http://catalog.onliner.by/pic/btn_compare.gif';

        var compareLink = document.createElement('a');
        compareLink.href = 'javascript: void(0)';
        compareLink.className = 'onliner-comparison-extension-list-page-compare-button';
        compareLink.title = 'Открыть страницу сравнения товаров в текущей вкладке';
        compareLink.appendChild(compareLinkImg);

        compareLink.addEventListener('click', function(ev) {

          sendMessage('generateCompareLink', null, function(url) {
            window.location.href = url;
          });

          return false;
        });
      }

      var button = document.createElement('button');
      var productId = checkTableRow.querySelector('td.pdescr strong.pname a').href
                        .split('/').filter(function(n) { return n; }).pop();

      button.className = 'onliner-comparison-extension-list-page-add-button';

      if (ids.indexOf(productId) === -1) {
        button.innerHTML = '+';
        button.title = 'Добавить данный товар в список для сравнения';
      } else {
        button.innerHTML = '&#10006;';
        button.classList.add('state-remove');
        button.title = 'Исключить данный товар из списка для сравнения';
      }

      button.addEventListener('click', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var that = this;

        var product = parseListProduct(that);

        if (that.classList.contains('state-remove')) {
          sendMessage('removeProduct', product.id, function(response) {
            that.classList.remove('state-remove');
            that.innerHTML = '+';
            that.title = 'Добавить данный товар в список для сравнения';
          });
        } else {
          sendMessage('addProduct', product, function(response) {
            that.classList.add('state-remove');
            that.innerHTML = '&#10006;';
            that.title = 'Исключить данный товар из списка для сравнения';
          });
        }

        return false;
      });

      if (hasCompareLink && drawnCompareLinks === 0) {
        checkTableCell.appendChild(compareLink);
        checkTableCell.appendChild(button);
        drawnCompareLinks = 1;
      } else if (hasCompareLink && drawnCompareLinks === 1) {
        checkTableCell.appendChild(button);
        checkTableCell.appendChild(compareLink);
        drawnCompareLinks = 2;
      } else {
        checkTableCell.appendChild(button);
      }

      hasCompareLink = false;
    }
  }

  function renderGroupedList(ids) {
    var productImageCells = productsForm.querySelectorAll('table tr td.pimage');

    for (var i = 0; i < productImageCells.length; i++) {
      var productImageCell = productImageCells[i];
      var checkTableRow = getClosest(productImageCells[i], 'tr');

      var moreProductsTableRow = checkTableRow.nextElementSibling;

      var productRows = moreProductsTableRow.querySelectorAll('.dev_row');
      var addedProductsCount = 0;

      var buttonAll = document.createElement('button');

      for (var j = 0; j < productRows.length; j++) {
        var productRow = productRows[j];

        var pchecks = productRow.querySelectorAll('.pcheck');

        pchecks[0].querySelector('label').classList.add('onliner-comparison-extension-force-display-none');

        pchecks[1].children[0].classList.add('onliner-comparison-extension-force-display-none');

        var button = document.createElement('button');
        var productId = productRow.querySelector('td.pdescr strong.pname a').href
                        .split('/').filter(function(n) { return n; }).pop();

        button.className = 'onliner-comparison-extension-grouped-list-page-add-button';
        if (ids.indexOf(productId) === -1) {
          button.innerHTML = '+';
          button.title = 'Добавить данный товар в список для сравнения';
        } else {
          addedProductsCount += 1;
          button.innerHTML = '&#10006;';
          button.classList.add('state-remove');
          button.title = 'Исключить данный товар из списка для сравнения';
        }

        button.addEventListener('click', (function(productImageCell, buttonAll, moreProductsTableRow) {
          return function(ev) {

          ev.preventDefault();
          ev.stopPropagation();
          var that = this;

          var product = parseListProduct(that);
          product.imageUrl = productImageCell.querySelector('img').src;

          if (that.classList.contains('state-remove')) {
            sendMessage('removeProduct', product.id, function(response) {
              that.classList.remove('state-remove');
              that.innerHTML = '+';
              that.title = 'Добавить данный товар в список для сравнения';

              buttonAll.innerHTML = '+ все';
              buttonAll.classList.remove('state-remove');
              buttonAll.title = 'Добавить все товары данного типа в список для сравнения';
            });
          } else {
            sendMessage('addProduct', product, function(response) {
              that.classList.add('state-remove');
              that.innerHTML = '&#10006;';
              that.title = 'Исключить данный товар из списка для сравнения';

              if (moreProductsTableRow.querySelectorAll('.onliner-comparison-extension-grouped-list-page-add-button.state-remove').length === moreProductsTableRow.querySelectorAll('.onliner-comparison-extension-grouped-list-page-add-button').length) {
                buttonAll.innerHTML = '&#10006; все';
                buttonAll.classList.add('state-remove');
                buttonAll.title = 'Исключить все товары данного типа из списка для сравнения';
              }
            });
          }

          return false;
          }

        })(productImageCell, buttonAll, moreProductsTableRow));

        pchecks[1].appendChild(button);
      }


      var checkAllBox = productImageCell.querySelector('input[type="checkbox"]');
      var checkAllBoxContainer = checkAllBox.parentNode;

      for (var j = 0; j < checkAllBoxContainer.children.length; j++) {
        checkAllBoxContainer.children[j].style.display = 'none';
      }

      buttonAll.classList.add('onliner-comparison-extension-grouped-list-page-add-all-button');

      if (addedProductsCount === productRows.length) {
        buttonAll.innerHTML = '&#10006; все';
        buttonAll.classList.add('state-remove');
        buttonAll.title = 'Исключить все товары данного типа из списка для сравнения';
      } else {
        buttonAll.innerHTML = '+ все';
        buttonAll.classList.remove('state-remove');
        buttonAll.title = 'Добавить все товары данного типа в список для сравнения';
      }

      buttonAll.innerHTML = '+ все';

      if (productRows.length === 0) {
        buttonAll.setAttribute('disabled', 'disabled');
      } else {
        buttonAll.addEventListener('click', (function(moreProductsTableRow) {
          return function(ev) {

          ev.preventDefault();
          ev.stopPropagation();
          var that = this;

          if (that.classList.contains('state-remove')) {

            var productRowsButtonsStateRemove = moreProductsTableRow.querySelectorAll('.onliner-comparison-extension-grouped-list-page-add-button.state-remove');

            for (var k = 0; k < productRowsButtonsStateRemove.length; k++) {
                productRowsButtonsStateRemove[k].click();
            }

            that.innerHTML = '+ все';
            that.classList.remove('state-remove');
            that.title = 'Добавить все товары данного типа в список для сравнения';
          } else {
            var productRowsButtonsStateAdd = moreProductsTableRow.querySelectorAll('.onliner-comparison-extension-grouped-list-page-add-button:not(.state-remove)');

            for (var k = 0; k < productRowsButtonsStateAdd.length; k++) {
              productRowsButtonsStateAdd[k].click();
            }

            that.innerHTML = '&#10006; все';
            that.classList.add('state-remove');
            that.title = 'Исключить все товары данного типа из списка для сравнения';
          }

          return false;
          }

        }(moreProductsTableRow)));
      }

      checkAllBoxContainer.appendChild(buttonAll);
    }


    var compareButtonsRows = productsForm.querySelectorAll('div.pcompbtn > table tr');
    for (var i = 0; i < compareButtonsRows.length; i++) {
      var compareButtonRow = compareButtonsRows[i];

      if (compareButtonRow.children.length === 4) {
        compareButtonRow.children[1].classList.add('onliner-comparison-extension-force-display-none');
        compareButtonRow.children[2].classList.add('onliner-comparison-extension-force-display-none');
      } else if (compareButtonRow.children.length === 3) {
        compareButtonRow.children[1].classList.add('onliner-comparison-extension-force-display-none');
      }

      compareButtonRow.children[0].querySelector('a').classList.add('onliner-comparison-extension-force-display-none');

      var compareLinkImg = document.createElement('img');
      compareLinkImg.src = 'http://catalog.onliner.by/pic/btn_compare.gif';

      var compareLink = document.createElement('a');
      compareLink.href = 'javascript: void(0)';
      compareLink.className = 'onliner-comparison-extension-grouped-list-page-compare-button';
      compareLink.title = 'Открыть страницу сравнения товаров в текущей вкладке';
      compareLink.appendChild(compareLinkImg);

      compareLink.addEventListener('click', function(ev) {

        sendMessage('generateCompareLink', null, function(url) {
          window.location.href = url;
        });

        return false;
      });

      compareButtonRow.children[0].appendChild(compareLink);

    }

  }

  sendMessage('findAllProducts', null, function(response) {

    var ids = response.map(function(product) {
      return product.id;
    });

    var isGroupedList = !!productsForm.querySelector('table tr td.pimage input[type="checkbox"]');

    if (isGroupedList) {
      renderGroupedList(ids);
    } else {
      renderList(ids);
    }
  });
}

if (window.location.pathname.split('/').indexOf('gridview') !== -1) {

  function parseTableProduct(button) {
    var compareCell = button.parentNode;
    var compareRow = compareCell.parentNode;
    var compareCellSiblings = compareRow.querySelectorAll('td.pgcheck');

    var index = Array.prototype.slice.call(compareCellSiblings).indexOf(compareCell);

    var imageRow = compareRow.nextElementSibling;
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
  }


  sendMessage('findAllProducts', null, function(response) {

    var ids = response.map(function(product) {
      return product.id;
    });

    var productCells = document.querySelectorAll('.pgimage');
    for (var i = 0; i < productCells.length; i++) {
      var productCell = productCells[i];

      if (! productCell.innerHTML) {
        continue;
      }

      var productRow = productCell.parentNode;
      var compareRow = productRow.previousElementSibling;

      var index = Array.prototype.slice.call(productRow.children).indexOf(productCell);

      var compareCell = compareRow.querySelectorAll('td.pgcheck')[index];

      for (var j = 0; j < compareCell.children.length; j++) {
        compareCell.children[j].classList.add('onliner-comparison-extension-force-display-none');
      }

      var button = document.createElement('button');
      var productId = productCell.querySelector('a').href
                        .split('/').filter(function(n) { return n; }).pop();

      button.className = 'onliner-comparison-extension-table-list-page-add-button';

      if (ids.indexOf(productId) === -1) {
        button.innerHTML = '+';
        button.title = 'Добавить данный товар в список для сравнения';
      } else {
        button.innerHTML = '&#10006;';
        button.classList.add('state-remove');
        button.title = 'Исключить данный товар из списка для сравнения';
      }

      button.addEventListener('click', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var that = this;

        var product = parseTableProduct(that);

        if (that.classList.contains('state-remove')) {
          sendMessage('removeProduct', product.id, function(response) {
            that.classList.remove('state-remove');
            that.innerHTML = '+';
            that.title = 'Добавить данный товар в список для сравнения';
          });
        } else {
          sendMessage('addProduct', product, function(response) {
            that.classList.add('state-remove');
            that.innerHTML = '&#10006;';
            that.title = 'Исключить данный товар из списка для сравнения';
          });
        }

        return false;
      });

      compareCell.appendChild(button);
    }

    var compareButtonCells = document.querySelectorAll('.pgcompbtn table td.pgcheck');
    for (var i = 0; i < compareButtonCells.length; i++) {
      var compareButtonCell = compareButtonCells[i];

      console.dir(compareButtonCell);

      for (var j = 0; j < compareButtonCell.children.length; j++) {
        compareButtonCell.children[j].classList.add('onliner-comparison-extension-force-display-none');
      }

      var compareLinkImg = document.createElement('img');
      compareLinkImg.src = 'http://catalog.onliner.by/pic/btn_compare.gif';

      var compareLink = document.createElement('a');
      compareLink.href = 'javascript: void(0)';

      if (i === 0) {
        compareLink.className = 'onliner-comparison-extension-table-list-page-compare-top-button';
      } else {
        compareLink.className = 'onliner-comparison-extension-table-list-page-compare-button';
      }

      compareLink.title = 'Открыть страницу сравнения товаров в текущей вкладке';
      compareLink.appendChild(compareLinkImg);

      compareLink.addEventListener('click', function(ev) {

        sendMessage('generateCompareLink', null, function(url) {
          window.location.href = url;
        });

        return false;
      });

      compareButtonCell.appendChild(compareLink);
    }

  });
}

