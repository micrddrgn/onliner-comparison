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
      // or grab a string
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