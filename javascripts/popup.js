// this script will run any time user opens a popup

// shortcut for sending a message
function sendMessage(action, data, callback) {
  var message = { action: action, source: 'popup', data: data };
  chrome.extension.sendMessage(message, callback);
}

// truncate a string if limit of symbols was reached, end the string with a replacement
function truncate(string, limit, replacement) {
  return (string.length <= limit)
    ? string
    : string.slice(0, limit) + (replacement || '...');
}

// unescape string in case it has '&' as '&amp' in it and so on
function html_unescape(string) {
  var div = document.createElement('div');
  div.innerHTML = string;
  return div.firstChild.nodeValue;
}

document.addEventListener('DOMContentLoaded', function() {

  // base url for comparison
  var compareUrl = 'http://catalog.onliner.by/compare/';
  // products ids delimiter in compare url
  var compareUrlDelimiter = '+';

  var domElements = {
    compareLink: document.querySelector('.compare'),
    addButton: document.querySelector('.onliner-comparison-extension-popup-add-button'),
    list: document.querySelector('.products'),
    status: document.querySelector('.status'),
    syncCheckbox: document.querySelector('.sync')
  };

  // template for a single product list item
  var templates = {
    product:  '<div class="image">' +
                '<img src="" title="" alt="">' +
              '</div>' +
              '<a href="" target="_blank" title=""></a>' +
              '<p></p>' +
              '<button class="remove" title="Удалить из сравнения">&#10006;</button>' +
              '<div class="clear"></div>'
  };

  var statuses = {
    noItems: 'Товары для сравнения отсутствуют',
    loading: 'Загрузка...'
  };

  var viewManager = {

    // store ids of visible products
    // used to build a compare url
    ids: [],

    add: function(product) {
      var that = this;

      var li = document.createElement('li');
      li.className = 'product';
      li.dataset.id = product.id;
      li.innerHTML = templates.product;

      var img = li.querySelector('div.image img');
      img.src = product.imageUrl;
      img.title = img.alt = product.title;

      // unescape title in case it has '&', '>' in it
      // to know exact string length before inserting
      var title = html_unescape(product.title);

      var link = li.querySelector('a');
      link.href = product.url;
      link.title = title;
      link.innerHTML = truncate(title, 27);

      var p = li.querySelector('p');
      p.innerHTML = product.description || '(описание отсутствует)';

      var button = li.querySelector('button');
      button.addEventListener('click', function() {

        var parent = this.parentNode;
        var id = parent.dataset.id;

        that.remove(id);

      }, true);

      domElements.list.appendChild(li);

      // save added product id
      this.ids.push(product.id);

      this.updateCompareUrl();
      this.hideStatus();
    },
    remove: function(id) {
      var that = this;

      sendMessage('removeProduct', id, function(response) {
        // if product is deleted
        if (response === true) {
          // remove item from popup
          domElements.list.querySelector('[data-id="' + id + '"]').remove();

          // and from ids
          var index = that.ids.indexOf(id);
          if (index !== -1) {
            that.ids.splice(index, 1);
          }

          that.updateCompareUrl();
          if (that.ids.length === 0) {
            that.showStatus('noItems');
          }
        }
      });
    },
    updateCompareUrl: function() {
      var productsStr = this.ids.join(compareUrlDelimiter);
      domElements.compareLink.href = compareUrl + productsStr;
    },
    showStatus: function(type) {
      domElements.status.innerHTML = statuses[type];
      domElements.status.style.display = 'block';
    },
    hideStatus: function() {
      domElements.status.style.display = 'none';
    }  
  };

  domElements.addButton.addEventListener('click', function() {
    sendMessage('parseProduct', null, function(response) {
      viewManager.add(response);
    });
  }, true);

  domElements.syncCheckbox.addEventListener('change', function() {
    if (this.checked) {
      sendMessage('enableSync', null, function(response) {
        // do nothing on response
      });
    } else {
      sendMessage('disableSync', null, function(response) {
        // do nothing on response
      });
    }
  }, true);


  // load products when opening a popup
  sendMessage('loadProducts', null, function(products) {
    if (products.length > 0) {
      for (var i = 0; i < products.length; i++) {
        viewManager.add(products[i]);
      }
      viewManager.hideStatus();
    } else {
      viewManager.showStatus('noItems');
    }
  });

  // load initial state of "sync" checkbox
  sendMessage('isEnabledSync', null, function(response) {
    var checked = !!response;
    domElements.syncCheckbox.checked = checked;
  });

});
