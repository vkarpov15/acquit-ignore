'use strict';

const acquit = require('acquit');
const fs = require('fs');

let md = fs.readFileSync('./HEADER.md');
md += '\n';

const blocks = acquit.parse(fs.readFileSync('./test/examples.test.js').toString());

for (let i = 0; i < blocks.length; ++i) {
  const block = blocks[i];
  md += '## ' + block.contents.trim() + '\n\n';
  for (let j = 0; j < block.blocks.length; ++j) {
    const it = block.blocks[j];
    md += '#### It ' + it.contents.trim() + '\n\n';
    if (it.comments.length) {
      md += acquit.trimEachLine(it.comments[0]).trim() + '\n\n';
    }
    md += '```javascript\n';
    md += '    ' + it.code + '\n';
    md += '```\n\n';
  }
}

require('fs').writeFileSync('./README.md', md);
