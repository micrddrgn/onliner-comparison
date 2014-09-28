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

  var container = document.querySelector('.b-whbd-i');

  var title = container.querySelector('.product_h1 td h1 span').innerHTML;
  var description = container.querySelector('.ppdescr').innerHTML;
  var url = container.querySelector('.ppimage a').href;
  var imageUrl = container.querySelector('.ppimage img').src;
  var id = url.split('/').filter(function(n) { return n; }).pop();  

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

var rateBlock = document.querySelector('.pprate');
if (rateBlock !== null) {

  var button = document.createElement('button');
  button.className = 'onliner-comparison-extension-technical-page-add-button';
  button.innerHTML = 'Сравнить';

  rateBlock.appendChild(button);

  button.addEventListener('click', function() {
    sendMessage('addProduct', parseProduct(), function(response) {});
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

}