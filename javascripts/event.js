var storageManager = {

  add: function(product, sendResponse) {

    // check for invalid products like undefined's and stuff
    // undefined may come when page is not initialized yet
    if (! this.isValid(product)) {
      return false;
    }

    chrome.storage.local.get(null, function(storageData) {
      var products = storageData.products || [];

      // do not add products which already exist
      for (var i = 0; i < products.length; i++) {
        if (products[i].id === product.id) {
          return false;
        }
      }

      products.push(product);
      chrome.storage.local.set({ products: products }, function() {
        sendResponse(product);
        updateBadge(products.length);
      });
    });
  },

  remove: function(id, sendResponse) {
    chrome.storage.local.get(null, function(storageData) {
      var products = storageData.products || [];
      for (var i = 0; i < products.length; i++) {
        if (products[i].id === id) {
          products.splice(i, 1);
          chrome.storage.local.set({ products: products }, function() {
            // send positive response if product was deleted
            sendResponse(true);
            updateBadge(products.length);
          });
          return;
        }
      }
      sendResponse(false);
    });
  },

  load: function(sendResponse) {
    chrome.storage.local.get(null, function(storageData) {
      var products = storageData.products || [];
      sendResponse(products);
      updateBadge(products.length)
    });
  },

  isValid: function(product) {
    return (product !== undefined && product.id);
  }
};



chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

  switch(request.action) {

    case 'loadProducts':
      storageManager.load(sendResponse);
      break;

    case 'addProduct':
      storageManager.add(request.data, sendResponse);
      break;

    case 'parseProduct':
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
          storageManager.add(response, sendResponse);
        });
      });

      break;

    case 'removeProduct':
      storageManager.remove(request.data, sendResponse);
      break;

    default:
      return false;
  }

  // This function becomes invalid when the event listener returns,
  // unless you return true from the event listener to indicate 
  // you wish to send a response asynchronously (this will keep the
  // message channel open to the other end until sendResponse is called).
  return true;
});

// set badge dafault color
chrome.browserAction.setBadgeBackgroundColor({ color: '#F5291A' });

// update badge counter on demand
function updateBadge(value) {
  // four characters is a maximum
  var text = (value > 999) ? '999+' : value.toString();
  chrome.browserAction.setBadgeText({ text: text });
}

// load items when extension is loaded so the badge will be up-to-date
storageManager.load(function() {});

// create context menu for "compare" page
// adds functionality that allows users to remove items from compare table 
// with no need to scroll down to the original buttons
var contextMenuComparePageRemoveId = 'compare-page-context-menu-remove-id';

chrome.contextMenus.create({
  id: contextMenuComparePageRemoveId,
  title: 'Удалить из сравнения',
  contexts: ['page', 'selection', 'link', 'image'],
  documentUrlPatterns: ['http://catalog.onliner.by/compare/*']
}, function() {
  // log error if failed to create context menu
  console.error(chrome.runtime.lastError);
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === contextMenuComparePageRemoveId) {
    var message = { action: 'removePageProduct', source: 'event', data: null };
    chrome.tabs.sendMessage(tab.id, message, function(response) {
      // do nothing on response
    });
  }
});