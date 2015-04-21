'use strict';

// manage array of objects with id

function Storage(namespace, type) {
  this.namespace = namespace;

  this.type = (type === 'sync') ? 'sync' : 'local';
  this.storage = chrome.storage[this.type];

  this.cache = {
    count: undefined,
    ids: undefined
  };
}


Storage.prototype.add = function (item, cb) {
  if (! this.isValid(item)) {
    return cb(null, new Error('Item is invalid'));
  }

  this._get(function (items) {

    var exists = items.some(function (i) {
      return i.id === item.id;
    });

    if (exists) {
      return cb(null, new Error('Item already exists'));
    }

    items.push(item);

    this._set(items, function () {
      cb(item);
    });

  }.bind(this));
};

Storage.prototype.addBatch = function (items, cb) {
  if (!Array.isArray(items)) {
    return cb(null, new Error('AddBatch requires array'));
  }
  this._get(function (oldItems) {

    var validItems = items.filter(this.isValid);
    if (!validItems.length) {
      return cb([]);
    }

    var newItems = oldItems.concat(validItems);

    this._set(newItems, function () {
      cb(validItems);
    });

  }.bind(this));
};

Storage.prototype.remove = function (id, cb) {
  this._get(function (items) {

    var index = this._indexOfSync(items, id);
    if (!~index) {
      return cb(null, new Error('Item not found'));
    }

    var item = items[index];

    items.splice(index, 1);

    this._set(items, function () {
      cb(item);
    });

  }.bind(this));
};

Storage.prototype.removeBatch = function (ids, cb) {
  if (!Array.isArray(ids)) {
    return cb(null, new Error('RemoveBatch requires array'));
  }
  this._get(function (oldItems) {

    var newItems = [], removedItems = [];

    oldItems.forEach(function (item) {
      if (~ids.indexOf(item.id)) {
        removedItems.push(item);
      } else {
        newItems.push(item);
      }
    });

    this._set(newItems, function () {
      cb(removedItems);
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

  this._set(validItems, cb);
};

Storage.prototype.clear = function (cb) {
  this._set([], cb);
};

// check for invalid items like undefined's and stuff
// undefined may come when page is not initialized yet
Storage.prototype.isValid = function (item) {
  return item && item.id;
};


Storage.prototype.find = function (id, cb) {
  this._get(function (items) {

    var index = this._indexOfSync(items, id);
    if (!~index) {
      return cb(null, new Error('Item not found'));
    }

    cb(items[index]);
  });
};

Storage.prototype.findAll = function (cb) {
  this._get(cb);
};

Storage.prototype.count = function (cb) {
  this._uncache('count', cb);
};

Storage.prototype.ids = function (cb) {
  this._uncache('ids', cb);
};


Storage.prototype._get = function (cb) {
  this.storage.get(null, function (data) {
    var items = data[this.namespace] || [];
    this.cache.count = items.length;
    this.cache.ids = this._idsSync(items);
    cb(items);
  }.bind(this));
};

Storage.prototype._set = function (items, cb) {
  var data = {};
  data[this.namespace] = items;
  this.storage.set(data, function () {
    this.cache.count = items.length;
    this.cache.ids = this._idsSync(items);
    cb(items);
  }.bind(this));
};


Storage.prototype._uncache = function (key, cb) {
  if (this.cache[key] !== undefined) {
    return cb(this.cache[key]);
  }

  // cache is set in get
  this._get(function () {
    cb(this.cache[key]);
  }.bind(this));
};

Storage.prototype._indexOfSync = function (items, id) {
  var index = -1;
  items.some(function (item, i) {
    if (item.id === id) {
      index = i;
      return true;
    }
  });
  return index;
};

Storage.prototype._idsSync = function (items) {
  return items.map(function (item) {
    return item.id;
  });
};

module.exports = Storage;