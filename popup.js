(function() {
  // var validUrlRegExp = new RegExp('http://catalog.onliner.by/[a-zA-Z0-9_]+/[a-zA-Z0-9_]+');

  // chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {

    // var url = tabs[0].url;

    // console.log(tabs);
    // console.log(tabs[0].url);

    // console.log(url);
  // });

  document.addEventListener('DOMContentLoaded', function() {

    var compareUrl = 'http://catalog.onliner.by/compare/';
    var compareUrlDelimiter = '+';

    var dom = {
      compareLink: document.querySelector('.compare'),
      addButton: document.querySelector('.add'),
      list: document.querySelector('.products')
    };

    var templates = {
      item: '<img src="" title="" alt="" align="left"><a href="" target="_blank" title="Открыть в новой вкладке"></a><p></p><button class="remove" title="Удалить из сравнения">&#10006;</button>'
    };

    var products = {
      list: [],
      load: function() {
        var that = this;

        chrome.storage.local.get(null, function(data) {
          data = data.products;
          for (var i = 0; i < data.length; i++) {
            that.add(data[i], true);
          }
        });
        
        this.updateCompareUrl();
      },
      add: function(product, silent) {
        silent = silent || false;
        var that = this;

        this.list.push(product);

        var listItem = document.createElement('li');

        listItem.className = 'product';
        listItem.dataset.id = product.id;
        listItem.innerHTML = templates.item;

        var img = listItem.querySelector('img');
        img.src = product.imageUrl;
        img.title = img.alt = product.title;

        var link = listItem.querySelector('a');
        link.href = product.url;
        link.innerHTML = product.title;

        var p = listItem.querySelector('p');
        p.innerHTML = product.description;

        var button = listItem.querySelector('button');
        button.addEventListener('click', function() {

          var parent = this.parentNode;
          var id = parent.dataset.id;

          that.remove(id);

        });

        dom.list.appendChild(listItem);

        if (silent === false) {
          this.updateStorage();
          this.updateCompareUrl();
        }
      },
      remove: function(id) {

        for(var i = 0; i < this.list.length; i++) {
          if (this.list[i].id === id) {
            this.list.splice(i, 1);
            dom.list.querySelector('[data-id="' + id + '"]').remove();
            break;
          }
        }

        this.updateStorage();
        this.updateCompareUrl();
      },
      updateCompareUrl: function() {

        var ids = [];
        for (var i = 0; i < this.list.length; i++) {
          ids.push(this.list[i].id);
        }

        var productsStr = ids.join(compareUrlDelimiter);
        dom.compareLink.href = compareUrl + productsStr;
      },
      updateStorage: function() {
        chrome.storage.local.set({ products: this.list }, function() {});
      }
    };


    products.load();

    dom.addButton.addEventListener('click', function() {

      chrome.tabs.executeScript(null, {
        file: 'inject.js'
      });

    });


    chrome.extension.onMessage.addListener(function(request, sender) {
      if (request.action == 'parseProduct') {
        products.add(request.source);
      }
    });

  });
})();

