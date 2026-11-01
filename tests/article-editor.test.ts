import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArticleElement, serializeArticleElement, renderArticleElement } from '../src/lib/article-layout.ts';
import { parseEditorDocument, serializeEditorDocument } from '../src/lib/article-editor.ts';
import { markdownBlocks, renderMarkdown, toPlainText } from '../src/lib/markdown.ts';
import { defaultScene, serializeScene } from '../src/lib/speech-bubbles.ts';

test('preserves untouched text blocks, lists, references and code when moving an illustration', () => {
 const source = '## Titre\n\nUn **mot** et [un lien][ref].\n\n- un\n- deux\n\n```js\nconst a = 1;\n```\n\n[ref]: https://example.org/source';
 const blocks = parseEditorDocument(source);
 assert.equal(blocks.filter(b => b.editable).length, 3);
 assert.equal(serializeEditorDocument(blocks), source);
 assert.match(markdownBlocks(source)[1].html, /href="https:\/\/example.org\/source"/);
 assert.match(renderMarkdown('Un [lien][ref].', source), /href="https:\/\/example.org\/source"/);
});

test('round-trips independent image and bubble settings with the same safe public renderer', () => {
 const image = { kind: 'image', src: '/media/cgt.png', alt: 'CGT "dessin"', width: 35, align: 'right', clear: false, crop: 1.4 } as const;
 const bubble = { kind: 'bubble', text: 'Ma branche ?\nJe suis chômeur.', width: 33, align: 'left', clear: true, color: 'blue' } as const;
 const source = [serializeArticleElement(image), 'Un paragraphe.', serializeArticleElement(bubble)].join('\n\n');
 const blocks = parseEditorDocument(source);
 assert.equal(blocks.length, 3);
 assert.deepEqual(blocks[0].element, image);
 assert.deepEqual(blocks[2].element, bubble);
 assert.equal(serializeEditorDocument(blocks), source);
 assert.match(renderMarkdown(source), /article-element-left/);
 assert.match(renderMarkdown(source), /--image-zoom:1.4/);
 assert.equal(toPlainText(source), 'Un paragraphe. Ma branche ? Je suis chômeur.');
});

test('expands old scenes into independent elements without losing dialogue', () => {
 const scene = defaultScene();
 const blocks = parseEditorDocument(serializeScene(scene));
 assert.equal(blocks.length, 5);
 assert.equal(blocks[0].element?.src, scene.image);
 assert.deepEqual(blocks.slice(1).map(b => b.element?.text), scene.bubbles.map(b => b.text));
 const legacy = parseEditorDocument('![dialogue-cgt | Dessin](/media/cgt.png)');
 assert.equal(legacy.length, 5);
 assert.equal(legacy[0].element?.src, '/media/cgt.png');
});

test('does not replace the original Amfis characters or discard unsupported blocks', () => {
 const source = '![R | dessin](/images/articles/sticker-r-web.png)\n\n| A | B |\n| - | - |\n| 1 | 2 |';
 const blocks = parseEditorDocument(source);
 assert.equal(blocks.length, 2);
 assert.ok(blocks.every(b => !b.editable && !b.element));
 assert.match(blocks[0].html, /bulle-amfis/);
 assert.equal(serializeEditorDocument(blocks), source);
});

test('validates URLs, coordinates and colors, and escapes HTML in text and attributes', () => {
 for (const src of ['javascript:alert(1)', 'data:image/png;base64,a', '//evil.example/a', '/\\evil.example/a', 'https://example.org/\na']) {
  assert.equal(parseArticleElement(JSON.stringify({kind:'image',src})), null);
 }
 const image = parseArticleElement(JSON.stringify({kind:'image',src:'/media/a.png',alt:'" onerror="alert(1)',width:999,crop:999,align:'<style>'}))!;
 assert.equal(image.width,100); assert.equal(image.crop,1.6); assert.equal(image.align,'right');
 assert.ok(renderArticleElement(image).includes('&quot; onerror=&quot;'));
 const bubble = parseArticleElement(JSON.stringify({kind:'bubble',text:'<script>alert(1)</script>',color:'<style>',width:-10}))!;
 assert.equal(bubble.width,20); assert.equal(bubble.color,'ochre');
 assert.ok(!renderArticleElement(bubble).includes('<script>'));
 assert.match(renderArticleElement(bubble), /&lt;script&gt;/);
 assert.equal(parseArticleElement('{bad'),null);
 assert.ok(!renderMarkdown('<script>alert(1)</script>').includes('<script>'));
});
