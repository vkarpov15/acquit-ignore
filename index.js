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
  },
  getIndentDifferenceFromNextLine: {
    $type: 'boolean',
    $default: true
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

  const startRegexp = new RegExp(`^[\\s]*${options.start}$`);
  const endRegexp = new RegExp(`^[\\s]*${options.end}$`);

  parser.transform(/** @param {AcquitBlock} block */function(block) {
    const spacesRegexp = /^(\s*)/;

    /** Output accumulator (to not modify block.code directly) */
    let out = '';
    /**
     * States:
     * 0: no ignore
     * 1: ignore lines
     */
    let currentState = { state: 0, hadMatch: false };
    /** Keeps track of the state from the previous line */
    let lastLineState = { state: 0, hadMatch: false };

    /** Sets which line-ending to use */
    let lineEnd = '\n';

    // determine original line endings
    {
      const matches = /(\r?\n)^/m.exec(block.code);

      if (matches !== null) {
       lineEnd = matches[0];
      }
    }

    /** Stores the indent that should get removed */
    let diffIndent = '';

    for (let line of block.code.split(/\r?\n/)) {
      // set the last line state
      lastLineState.hadMatch = currentState.hadMatch;
      lastLineState.state = currentState.state;      

      let typeMatch;
      switch (currentState.state) {
        case 0:
          typeMatch = startRegexp.exec(line);
          if (typeMatch !== null) {
            currentState.state = 1;
          }
          break;
        case 1:
          typeMatch = endRegexp.exec(line);
          if (typeMatch !== null) {
            currentState.state = 0;
          }
          break;
        default:
          throw new Error("Encountered invalid state");
      }

      currentState.hadMatch = typeMatch !== null;

      // set the indent to remove, and use the next line after end comment if "options.getIndentDifferenceFromNextLine" is "true"
      if (currentState.state === 0 && (typeMatch !== null || (options.getIndentDifferenceFromNextLine && lastLineState.state === 0 && lastLineState.hadMatch))) {
        // get the start indent of the match
        const _currentIndent = spacesRegexp.exec(line);
        // change the regexp result into always being a string
        const currentIndent = _currentIndent !== null ? _currentIndent[0] : '';

        diffIndent = currentIndent.substring(0, currentIndent.length);
      }

      // add the current line to the output accumulator
      if (currentState.state === 0 && typeMatch === null) {
        // check if the indent to remove length matches the actual indent string, and only remove if matches
        const sub = line.substring(0, diffIndent.length);
        if (sub === diffIndent) {
          line = line.substring(sub.length);
        }

        out = out + line + '\n'; // this will always add a trailing newline, will later be removed if needed
      } 
    }

    // determine if the original code ended with a line break (and with which) and modify the output accordingly
    {
      // only take the last 5 characters to make matching easier
      const lastChars = block.code.substring(block.code.length-5);

      const matches = /(\r?\n)$/.exec(lastChars);

      if (matches === null) {
        out = out.substring(0, out.length - lineEnd.length);
      }
    }

    block.code = out;
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
 * @property {boolean} getIndentDifferenceFromNextLine
 */
