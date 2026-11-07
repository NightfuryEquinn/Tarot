import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Load authored TypeScript data without adding a test framework or emitting files.
const cache = new Map();
function load(file) {
  const path = resolve(file);
  if (cache.has(path)) return cache.get(path);
  const module = { exports: {} };
  cache.set(path, module.exports);
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(source, { module, exports: module.exports, URL, require: name => {
    assert(name.startsWith('.'), 'History data must not depend on runtime services');
    return load(resolve(dirname(path), `${name}.ts`));
  } }, { filename: path });
  return module.exports;
}
const { cards } = load('src/data/cards.ts');
const { histories, validateHistories } = load('src/data/history.ts');
validateHistories();
const uniqueTeasers = new Set();
const counts = [];
for (const card of cards) {
  assert(existsSync(`public${card.image}`), `Missing artwork: ${card.id}`);
  const pair = histories[card.id];
  assert(pair.en.teaser !== pair['zh-CN'].teaser, `Missing translation: ${card.id}`);
  const story = pair.en;
  assert(!uniqueTeasers.has(story.teaser), `Repeated teaser: ${card.id}`);
  uniqueTeasers.add(story.teaser);
  const words = [story.teaser,...story.origin,...story.evolution,...story.symbols.flatMap(s=>[s.name,s.text]),...story.today,story.detail].join(' ').trim().split(/\s+/).length;
  counts.push(words);
  assert(words >= 500, `Article below 500-word target: ${card.id} (${words})`);
  assert(words <= 800, `Article exceeds comfortable reading length: ${card.id} (${words})`);
}
console.log(`Validated 78 bilingual histories; English article lengths ${Math.min(...counts)}–${Math.max(...counts)} words.`);
if (process.argv.includes('--export')) {
  const manifest = JSON.parse(readFileSync('out/offline-manifest.json', 'utf8'));
  for (const path of ['/history/index.html', ...cards.map(c=>`/history/${c.id}/index.html`)]) {
    assert(manifest.assets.includes(path), `Not cached offline: ${path}`);
    const html = readFileSync(`out${path}`, 'utf8');
    assert(html.includes('<h1'), `Missing article heading: ${path}`);
  }
  for (const card of cards) {
    const html = readFileSync(`out/history/${card.id}/index.html`, 'utf8');
    assert(html.includes(card.name), `Wrong card content: ${card.id}`);
    assert(html.includes(histories[card.id]['zh-CN'].teaser), `Chinese story not exported: ${card.id}`);
    assert(html.includes(`/cards/?card=${card.id}`), `Missing meaning link: ${card.id}`);
  }
  console.log('Verified history hub and all 78 article pages in static export and offline manifest.');
}
