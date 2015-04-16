'use strict';

var util = {

  extend: function (dest, source) {
    for (var key in source) {
      if (Object.hasOwnProperty.call(source)) {
        dest[key] = source[key];
      }
    }
    return dest;
  },

  uri: function (url, index) {
    index = index || 0;
    var parts = url.split('/').filter(function (n) { return n; });
    return parts[parts.length - 1 - index];
  }
};

module.exports = util;