'use strict';

var handleError = require('../../helpers/handleError');

var PageDetector = require('../../lib/PageDetector');

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
      selector: '[name="product_list"]',
      notSelector: 'table tr td.pimage input[type="checkbox"]'
    },
    'groupedList': {
      selector: [
        '[name="product_list"]',
        'table tr td.pimage input[type="checkbox"]'
      ]
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

}());