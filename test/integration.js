const assert = require('node:assert/strict');
const path = require('node:path');
const vscode = require('vscode');
async function run() {
  const uri = vscode.Uri.file(path.join(__dirname, '..', 'demo', 'index.html'));
  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document);
  await vscode.extensions.getExtension('N04H.html-event-definition').activate();
  for (const name of ['filterBooks', 'showResults']) {
    const pos = document.positionAt(document.getText().indexOf(name));
    const definitions = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', uri, pos);
    assert.ok(definitions.some(d => d.uri.fsPath.endsWith('app.js')), `missing definition for ${name}`);
    const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', uri, pos);
    assert.ok(hovers.some(h => h.contents.some(c => String(c.value || c).includes(name))), `missing hover for ${name}`);
  }
  require('node:fs').writeFileSync(path.join(require('node:os').tmpdir(), 'html-event-integration-passed.txt'), 'definition and hover passed');
}
module.exports = { run };

