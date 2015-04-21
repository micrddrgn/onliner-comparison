'use strict';

/*
  todo:
  - fix children, could be better
 */

var dom = {

  array: function(arraylike) {
    return Array.prototype.slice.call(arraylike);
  },

  all: function (node, selector) {
    return dom.array(node.querySelectorAll(selector));
  },

  closest: function (node, selector) {
    node = node.parentNode;
    while(node) {
      if (this.is(node, selector)) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  },

  is: function (node, selector) {
    if ((selector[0] === '.' && node.classList.contains(selector.slice(1))) ||
      (selector[0] === '#' && node.id === selector.slice(1)) ||
      (node.tagName === selector.toUpperCase())
    ) {
      return true;
    }
    return false;
  },

  delegate: function (node, eventName, selector, cb) {
    var handler = function (e) {
      if (!this.is(e.target, selector)) {
        return true;
      }
      cb.bind(e.currentTarget)(e);
    };
    node.addEventListener(eventName, handler.bind(this));
  },

  attempt: function (node, selector, delay, attempts, success, fail) {
    var el;

    function query() {
      el = node.querySelector(selector);
      if (attempts > 0 && !el) {
        attempts -= 1;
        setTimeout(query, delay);
      } else if (attempts === 0) {
        if (fail) { fail(); }
      } else {
        if (success) { success(el); }
      }
    }

    query();
  },

  attr: function (nodes, attrs) {
    if (nodes.length === undefined) {
      nodes = [nodes];
    }

    this.array(nodes).forEach(function (node) {
      Object.keys(attrs).forEach(function (attr) {
        node[attr] = attrs[attr];
      });
    });
  },

  style: function (nodes, styles) {
    if (nodes.length === undefined) {
      nodes = [nodes];
    }

    this.array(nodes).forEach(function (node) {
      Object.keys(styles).forEach(function (prop) {
        node.style[prop] = styles[prop];
      });
    });
  },

  hide: function (nodes) {
    this.style(nodes, { display: 'none' });
  },

  create: function (selector, attrs, styles) {
    var parts = selector.split('.');

    var tagName = parts[0] || 'div';

    var node = document.createElement(tagName);

    if (parts.length > 1) {
      node.className = parts.slice(1).join(' ');
    }

    if (attrs !== undefined) {
      this.attr(node, attrs);
    }

    if (styles !== undefined) {
      this.style(node, styles);
    }

    return node;
  }

};

module.exports = dom;