// shortcut for sending a message
function sendMessage(action, data, callback) {
  var message = { action: action, source: 'content', data: data };
  chrome.extension.sendMessage(message, callback);
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
  if (request.action === 'parseProduct') {
    sendResponse(parseProduct());
  }
});

// attach custom button to a page

var rateBlock = document.querySelector('.pprate');

var button = document.createElement('button');
button.className = 'onliner-comparison-extension-technical-page-add-button';
button.innerHTML = 'Сравнить';

rateBlock.appendChild(button);

button.addEventListener('click', function() {
  sendMessage('addProduct', parseProduct(), function(response) {});
}, true);
