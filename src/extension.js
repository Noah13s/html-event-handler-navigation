const vscode = require('vscode');
const { htmlParts, callAt, definitions } = require('./core');
async function resolve(document, position, token) {
  const text = document.getText(), parts = htmlParts(text), offset = document.offsetAt(position);
  const handler = parts.handlers.find(h => offset >= h.start && offset < h.end);
  const call = handler && callAt(handler, offset);
  if (!call) return;
  const matches = [];
  for (const script of parts.scripts) {
    if (token.isCancellationRequested) return;
    let source = document, content, base = 0;
    if (script.src !== undefined) {
      let url;
      try { url = new URL(script.src, document.uri.toString()); } catch { continue; }
      if (url.protocol !== 'file:' || !/\.[cm]?js$/i.test(url.pathname)) continue;
      url.search = ''; url.hash = '';
      try { source = await vscode.workspace.openTextDocument(vscode.Uri.parse(url.toString())); } catch { continue; }
      content = source.getText();
    } else {
      base = script.start;
      content = text.slice(script.start, script.end);
    }
    for (const def of definitions(content, call.name)) {
      const range = new vscode.Range(source.positionAt(base + def.start), source.positionAt(base + def.end));
      matches.push({ location: new vscode.Location(source.uri, range), excerpt: def.excerpt });
    }
  }
  return { matches, range: new vscode.Range(document.positionAt(call.start), document.positionAt(call.end)) };
}
function activate(context) {
  const selector = { language: 'html' };
  context.subscriptions.push(vscode.languages.registerDefinitionProvider(selector, {
    async provideDefinition(document, position, token) {
      const result = await resolve(document, position, token);
      return result && result.matches.map(m => m.location);
    }
  }));
  context.subscriptions.push(vscode.languages.registerHoverProvider(selector, {
    async provideHover(document, position, token) {
      const result = await resolve(document, position, token);
      if (!result || !result.matches.length) return;
      const md = new vscode.MarkdownString();
      for (const match of result.matches) {
        md.appendCodeblock(match.excerpt, 'javascript');
        md.appendText(`${vscode.workspace.asRelativePath(match.location.uri)}:${match.location.range.start.line + 1}\n\n`);
      }
      return new vscode.Hover(md, result.range);
    }
  }));
}
module.exports = { activate };
