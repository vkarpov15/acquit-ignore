'use strict';

const defaultOptions = {
  start: '// acquit:ignore:start',
  end: '// acquit:ignore:end'
};

module.exports = function(parser, options) {
  if (!parser) {
    parser = require('acquit');
  } else if (parser.constructor.name === 'Object') {
    options = parser;
    parser = require('acquit');
  }

  options = options || {};
  if (!options.start) {
    options.start = defaultOptions.start;
  }
  if (!options.end) {
    options.end = defaultOptions.end;
  }

  const startsWithRegexp = new RegExp('^' + options.start + '[\\s\\S]*?' +
    options.end + '\n?', 'g');
  const inlineRegexp = new RegExp('[\\s]*' + options.start + '[\\s\\S]*?' +
    options.end, 'g');

  parser.transform(function(block) {
    block.code = block.code.
      replace(startsWithRegexp, '').
      replace(inlineRegexp, '');
  });
};
