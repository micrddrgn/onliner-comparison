'use strict';

/*
  finish
  could be prettier
 */

function CompareLink() {
  var a = document.createElement('a');
  a.className = 'cmpext-link';
  a.title = 'Открыть страницу сравнения товаров в новой вкладке';
  a.target = '_blank';

  var i = document.createElement('i');
  i.className = 'cmpext-new-tab';
  a.appendChild(i);

  var img = document.createElement('img');
  img.src = 'http://catalog.onliner.by/pic/btn_compare.gif';
  a.appendChild(img);

  a.addEventListener('click', function (e) {
    e.preventDefault();

    console.log('click on compare link');
  });

  return a;
}

module.exports = CompareLink;