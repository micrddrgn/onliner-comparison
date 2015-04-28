'use strict';

var util = {

  // --- Object utils ---

  size: function(obj) {
    return Object.keys(obj).length;
  },

  keys: function (obj) {
    return Object.keys(obj);
  },

  values: function (obj) {
    return Object.keys(obj).map(function (key) {
      return obj[key];
    });
  },

  pluck: function (array, key) {
    return array.map(function (item) {
      return item[key];
    });
  },

  extend: function (dest, source) {
    for (var key in source) {
      if (Object.hasOwnProperty.call(source, key)) {
        if (source[key].toString() === '[object Object]') {
          dest[key] = this.extend(dest[key], source[key]);
        } else {
          dest[key] = source[key];
        }
      }
    }
    return dest;
  },

  pick: function (obj, keys) {
    if (arguments.length > 2 || typeof keys === 'string') {
      keys = Array.prototype.slice.call(arguments, 1);
    }
    if (!keys.length) {
      return this.values(obj);
    }

    var values = [];
    Object.keys(obj).forEach(function (key) {
      if (~keys.indexOf(key)) {
        values.push(obj[key]);
      }
    });
    return values;
  },

  // --- Array utils ---

  // remove from the "source" all "values"
  subtract: function (source, values) {
    var copy = source.slice();
    values.forEach(function (value) {
      var index = copy.indexOf(value);
      if (~index) {
        copy.splice(index, 1);
      }
    });
    return copy;
  },

  // --- Url utils ---

  // get url part
  // index - "index" from the end
  uri: function (url, index) {
    index = index || 0;
    var parts = url.split('/').filter(function (n) { return n; });
    return parts[parts.length - 1 - index];
  },

  // cut url
  // index - without "index" in the end
  cut: function (url, index) {
    index = index || 0;
    var parts = url.split('/').filter(function (n) { return n; });
    return parts.slice(0, parts.length - 1 - index).join('/');
  },

  // --- String utils ---

  ellipsize: function (string, n, ellipse) {
    ellipse = ellipse || '…';
    if (string.length <= n) {
      return string;
    }
    console.log(string);
    return string.substring(0, n - ellipse.length) + ellipse;
  }

};

module.exports = util;