const parse5 = require('parse5');
const ts = require('typescript');
function htmlParts(text) {
  const handlers = [], scripts = [];
  const doc = parse5.parse(text, { sourceCodeLocationInfo: true });
  function walk(node) {
    const loc = node.sourceCodeLocation;
    if (node.attrs && loc) {
      for (const attr of node.attrs) {
        if (!/^on[a-z][\w-]*$/i.test(attr.name)) continue;
        const a = loc.attrs && loc.attrs[attr.name];
        if (!a) continue;
        const raw = text.slice(a.startOffset, a.endOffset);
        const match = /^[^\s=]+\s*=\s*(?:(["'])|)/.exec(raw);
        if (!match) continue;
        const start = a.startOffset + match[0].length;
        const end = a.endOffset - (match[1] && raw.endsWith(match[1]) ? 1 : 0);
        handlers.push({ start, end, text: text.slice(start, end) });
      }
      if (node.tagName === 'script') {
        const src = node.attrs.find(a => a.name === 'src');
        const type = node.attrs.find(a => a.name === 'type');
        if (!type || !/^(module|application\/ld\+json|importmap)$/i.test(type.value.trim())) {
          if (src) scripts.push({ src: src.value });
          else if (loc.startTag && loc.endTag) scripts.push({ start: loc.startTag.endOffset, end: loc.endTag.startOffset });
        }
      }
    }
    for (const child of node.childNodes || []) walk(child);
    if (node.content) walk(node.content);
  }
  walk(doc);
  return { handlers, scripts };
}
function callAt(handler, offset) {
  const file = ts.createSourceFile('handler.js', handler.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let found;
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const e = node.expression;
      let name;
      if (ts.isIdentifier(e)) name = e;
      else if (ts.isPropertyAccessExpression(e) && ts.isIdentifier(e.expression) && ['window', 'globalThis'].includes(e.expression.text)) name = e.name;
      if (name && offset >= handler.start + name.getStart(file) && offset < handler.start + name.end) found = { name: name.text, start: handler.start + name.getStart(file), end: handler.start + name.end };
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return found;
}
function definitions(text, name) {
  const file = ts.createSourceFile('script.js', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const result = [];
  function add(identifier, declaration) {
    if (identifier && identifier.text === name) result.push({ start: identifier.getStart(file), end: identifier.end, excerpt: declaration.getText(file).split(/\r?\n/)[0].slice(0, 240) });
  }
  for (const statement of file.statements) {
    if (ts.isFunctionDeclaration(statement)) add(statement.name, statement);
    if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) {
      if (ts.isIdentifier(d.name) && d.initializer && (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))) add(d.name, statement);
    }
    if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
      const b = statement.expression, l = b.left;
      if (b.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isPropertyAccessExpression(l) && ts.isIdentifier(l.expression) && ['window', 'globalThis'].includes(l.expression.text) && (ts.isArrowFunction(b.right) || ts.isFunctionExpression(b.right))) add(l.name, statement);
    }
  }
  return result;
}
module.exports = { htmlParts, callAt, definitions };

