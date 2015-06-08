'use strict';

var handleError = require('../../helpers/handleError');

var PageDetector = require('../../lib/PageDetector');

var dom = require('../../helpers/dom');

var pages = {
  product: require('./PageProduct'),
  compare: require('./PageCompare'),
  list: require('./PageList'),
  grid: require('./PageGrid'),
  groupedList: require('./PageGroupedList')
};

// create IIFE to be able to call return from it
// if something goes wrong in the process to stop execution
(function () {
  var pageDetector = new PageDetector({
    'list': {
      selector: '[name="product_list"]'
    },
    'grid': {
      url: 'gridview'
    },
    'compare': {
      selector: '#compare_column'
    },
    'product': {
      selector: '.b-offers-desc__info-rating'
    }
  });

  var pageName = pageDetector.detect();
  if (!pageName) { return handleError('Unable to detect a page:', pageName); }

  // after update we have to detect type of the page when data was fetched
  // as it is being fetched by AJAX, we have to listen to DOM changes
  // but this thing is only actual for 'list' type of pages
  if (pageName === 'list') {

    var nodeSel = '[name="product_list"]';
    var childSel = ['table', '.schema-products'];

    var observer = dom.onChildAdd(nodeSel, childSel, function (table) {
      if (!table) { return; }

      // if table has checkboxes, then it is a grouped list page
      // otherwise, it is a simple list page
      var checkbox = table.querySelector('tr td.pimage input[type="checkbox"]');
      if (checkbox) {
        initPage('groupedList');
      } else {
        initPage('list');
      }

      // stop this observer, we already know the page
      observer.disconnect();
    });

  // if page is not of list type, just init it immediately
  } else {
    initPage(pageName);
  }

  function initPage(pageName) {
    if (!Object.hasOwnProperty.call(pages, pageName)) {
      return handleError('Unknown page type: ' + pageName);
    }

    var page = new pages[pageName]();
    if (!page) { return handleError('Failed to create a page'); }

    page.initialize();

    // just forward messages to a page
    chrome.extension.onMessage.addListener(function (request) {
      page.emit(request.action, request.data);
    });
  }

}());