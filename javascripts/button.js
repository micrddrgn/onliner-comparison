var rateBlock = document.querySelector('.pprate');

var button = document.createElement('button');
button.className = 'onliner-comparison-extension-technical-page-add-button';
button.innerHTML = 'Сравнить';

rateBlock.appendChild(button);

button.addEventListener('click', function() {

  var getProduct = function() {

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
  };

  var product = getProduct();

  chrome.storage.local.get(null, function(data) {
    var list = data.products;

    for (var i in list) {
      if (list[i].id === product.id) {
        return false;
      }
    }

    list.push(product);

    chrome.storage.local.set({ products: list });
  });

  return false;
});