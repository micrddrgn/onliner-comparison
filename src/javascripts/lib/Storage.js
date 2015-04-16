'use strict';

// manage array of objects with id

function Storage(namespace, type) {
  this.namespace = namespace;

  this.type = (type === 'sync') ? 'sync' : 'local';
  this.storage = chrome.storage[this.type];

  this.cache = {
    count: undefined
  };
}

Storage.prototype.get = function (cb) {
  this.storage.get(null, function (data) {
    var items = data[this.namespace] || [];
    this.cache.count = items.length;
    cb(items);
  }.bind(this));
};

Storage.prototype.set = function (items, cb) {
  var data = {};
  data[this.namespace] = items;
  this.storage.set(data, function () {
    this.cache.count = items.length;
    cb(items);
  }.bind(this));
};

Storage.prototype.add = function (item, cb) {
  // check for invalid items like undefined's and stuff
  // undefined may come when page is not initialized yet
  if (! this.isValid(item)) {
    return cb(null, new Error('Item is invalid'));
  }

  this.get(function (items) {

    var exists = items.some(function (i) {
      return i.id === item.id;
    });

    if (exists) {
      return cb(null, new Error('Item already exists'));
    }

    items.push(item);

    this.set(items, function () {
      cb(item);
    });

  }.bind(this));
};

Storage.prototype.isValid = function (item) {
  return item && item.id;
};

Storage.prototype.remove = function (id, cb) {
  this.get(function (items) {

    var index = this.indexOfSync(items, id);
    if (index === -1) {
      return cb(null, new Error('Item not found'));
    }

    var item = items[index];

    items.splice(index, 1);

    this.set(items, function () {
      cb(item);
    });

  }.bind(this));
};

Storage.prototype.reset = function (items, cb) {
  if (!Array.isArray(items)) {
    return cb(null, new Error('Reset requires array'));
  }
  var validItems = items.filter(this.isValid);
  if (!validItems.length) {
    return cb([]);
  }

  this.set(validItems, cb);
};

Storage.prototype.clear = function (cb) {
  this.set([], cb);
};

Storage.prototype.find = function (id, cb) {
  this.get(function (items) {

    var index = this.indexOfSync(items, id);
    if (index === -1) {
      return cb(null, new Error('Item not found'));
    }

    cb(items[index]);
  });
};

Storage.prototype.findAll = function (cb) {
  this.get(cb);
};

Storage.prototype.count = function (cb) {
  if (this.cache.count !== undefined) {
    return cb(this.cache.count);
  }

  this.get(function () {
    cb(this.cache.count);
  }.bind(this));
};


// ??????????????????????????????????????????????????
Storage.prototype.indexOfSync = function (items, id) {
  var index = -1;
  items.some(function (item, i) {
    if (item.id === id) {
      index = i;
      return true;
    }
  });
  return index;
};

// ??????????????????????????????????????????????????
Storage.prototype.ids = function () {
  
};

module.exports = Storage;




