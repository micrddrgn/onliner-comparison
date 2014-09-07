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

chrome.extension.sendMessage({
  action: 'parseProduct',
  source: product
});