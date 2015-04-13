'use strict';

function Badge(color) {
  if (color) {
    this.setColor(color);
  }
}

Badge.prototype.setColor = function (color) {
  chrome.browserAction.setBadgeBackgroundColor({
    color: color
  });
};

Badge.prototype.setText = function (text) {
  // four characters is a maximum
  chrome.browserAction.setBadgeText({ text: text.substring(0, 4) });
};

Badge.prototype.setNumber = function (number) {
  // four characters is a maximum
  var text = (number > 999) ? '999+' : number.toString();
  this.setText(text);
};

module.exports = Badge;