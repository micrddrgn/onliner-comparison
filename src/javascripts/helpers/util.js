'use strict';

var util = {
  extend: function (dest, source) {
    for (var key in source) {
      if (Object.hasOwnProperty.call(source)) {
        dest[key] = source[key];
      }
    }
    return dest;
  }
};

module.exports = util;