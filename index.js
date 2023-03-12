'use strict';

const Archetype = require('archetype');

const OptionsType = new Archetype({
  start: {
    $type: 'string',
    $default: '// acquit:ignore:start'
  },
  end: {
    $type: 'string',
    $default: '// acquit:ignore:end'
  }
}).compile('OptionsType');

/**
 * 
 * @param {*} parser 
 * @param {AcquitIgnoreOptions} options 
 */
module.exports = function(parser, options) {
  if (!parser) {
    parser = require('acquit');
  } else if (parser.constructor.name === 'Object') {
    options = parser;
    parser = require('acquit');
  }

  options = new OptionsType(options || {});

  const inlineRegexp = new RegExp('^[\\s]*' + options.start + '[\\s\\S]*?' +
    options.end + '\n?', 'gm');

  parser.transform(/** @param {AcquitBlock} block */function(block) {
    block.code = block.code.
      replace(inlineRegexp, '');
  });
};

/**
 * @typedef {Object} AcquitBlock
 * @property {String} type Test type (like "it")
 * @property {String} contents Test name (like "should work")
 * @property {Array.<String>} comments
 * @property {String} code All the code inside the test (without outer indent)
 */

/**
 * @typedef {Object} AcquitIgnoreOptions
 * @property {String} start
 * @property {String} end
 */
