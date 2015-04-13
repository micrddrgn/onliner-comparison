'use strict';

function PageCompare() {
  Page.call(this);

  // detect element that was right-clicked last in comparison table
  // then this element will be used to detect a product column
  // when context menu is invoked
  this.lastRightClickedEl = null;
}

PageCompare.prototype = Object.create(Page.prototype);
PageCompare.prototype.constructor = PageCompare;

PageCompare.prototype.handle = function (e) {
  // 2 - right click
  if (e.button === 2) {
    this.lastRightClickedEl = e.target;
    console.log('yoo');
  }
};

PageCompare.prototype.render = function () {
  var container = document.querySelector('#compare_column');
  container.addEventListener('mousedown', this.handle.bind(this));
};