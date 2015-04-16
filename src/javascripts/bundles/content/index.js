'use strict';

var handleError = require('../../helpers/handleError');

var PageDetector = require('../../lib/PageDetector');

var pages = {
  product: require('./PageProduct'),
  compare: require('./PageCompare')
};

// create IIFE to be able to return from it if something goes wrong in the middle
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
  console.log('Page detected: %s', pageName);

  if (!Object.hasOwnProperty.call(pages, pageName)) {
    return handleError('Unknown page type: ' + pageName);
  }

  var page = new pages[pageName]();
  if (!page) { return handleError('Failed to create a page'); }
  console.log('Page created:', page);

  page.render();

  chrome.extension.onMessage.addListener(function (request) {
    switch(request.action) {
    case 'remove':
      page.emit('remove', request.data);
      break;
    case 'context':
      page.emit('context');
      break;
    default:
      return false;
    }
  });

}());