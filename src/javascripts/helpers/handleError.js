'use strict';

// use it everywhere so it could be AJAXed or logged later if needed
function handleError(message) {
  console.error(message);
  return false;
}

module.exports = handleError;