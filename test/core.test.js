const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { htmlParts, callAt, definitions } = require('../src/core');
test('finds event calls and ignores ordinary attributes and strings', () => {
  const html = `<button title="foo()" ONINPUT='first(); window.second(3)' onclick="third()">`;
  const parts = htmlParts(html);
  assert.equal(parts.handlers.length, 2);
  for (const name of ['first', 'second', 'third']) {
    const offset = html.indexOf(name) + 1;
    assert.equal(callAt(parts.handlers.find(h => offset >= h.start && offset < h.end), offset).name, name);
  }
  assert.equal(callAt(parts.handlers[0], html.indexOf('window')), undefined);
});
test('finds inline and external scripts, skipping modules', () => {
  const html = `<script>function inline(){}</script><script src="a.js"></script><script type="module">function hidden(){}</script>`;
  const p = htmlParts(html);
  assert.equal(p.scripts.length, 2);
  assert.equal(html.slice(p.scripts[0].start, p.scripts[0].end), 'function inline(){}');
  assert.equal(p.scripts[1].src, 'a.js');
});
test('finds top-level function declarations, function variables, and global assignments', () => {
  const js = `function a() {}\nconst b = () => {};\nlet c = function() {};\nwindow.d = () => {};\nfunction outer() { function inner() {} }`;
  for (const name of ['a', 'b', 'c', 'd']) {
    const [d] = definitions(js, name);
    assert.equal(js.slice(d.start, d.end), name);
  }
  assert.equal(definitions(js, 'inner').length, 0);
  assert.equal(definitions('// function missing() {}', 'missing').length, 0);
});
test('resolves the included example', () => {
  const folder = path.join(__dirname, '..', 'demo');
  const html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
  const parts = htmlParts(html);
  const script = fs.readFileSync(path.join(folder, parts.scripts[0].src), 'utf8');
  for (const name of ['filterBooks', 'showResults']) {
    const handler = parts.handlers.find(h => h.text.includes(name + '('));
    const offset = handler.start + handler.text.indexOf(name);
    assert.equal(callAt(handler, offset).name, name);
    assert.equal(definitions(script, name).length, 1);
  }
});

