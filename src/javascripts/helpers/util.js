'use strict';

var util = {

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

  defaults: function (obj, defaults) {
    for (var key in defaults) {
      if (!Object.hasOwnProperty.call(obj)) {
        obj[key] = defaults[key];
      }
    }
    return obj;
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

  values: function (obj) {
    return Object.keys(obj).map(function (key) {
      return obj[key];
    });
  },

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

  pluck: function (array, key) {
    return array.map(function (item) {
      return item[key];
    });
  },

  uri: function (url, index) {
    index = index || 0;
    var parts = url.split('/').filter(function (n) { return n; });
    return parts[parts.length - 1 - index];
  },

  cut: function (url, index) {
    index = index || 0;
    var parts = url.split('/').filter(function (n) { return n; });
    return parts.slice(0, parts.length - 1 - index).join('/');
  }
};

module.exports = util;