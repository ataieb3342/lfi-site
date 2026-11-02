import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArticleElement, serializeArticleElement, renderArticleElement } from '../src/lib/article-layout.ts';
import { parseEditorDocument, serializeEditorDocument } from '../src/lib/article-editor.ts';
import { markdownBlocks, renderMarkdown, toPlainText } from '../src/lib/markdown.ts';
import { defaultScene, serializeScene } from '../src/lib/speech-bubbles.ts';
import { groupArticleFlow } from '../src/lib/article-flow.ts';

test('keeps the image, opening bubble and paragraph in the same bounded group', () => {
 const image = serializeArticleElement({kind:'image',src:'/media/a.png',alt:'Dessin',width:44,align:'left',clear:true,keepWithNext:true,halo:'parchment'});
 const bubble = serializeArticleElement({kind:'bubble',text:'Bonjour',width:52,align:'right',clear:false,keepWithNext:true,color:'blue'});
 const source = [image,bubble,'La question du syndicalisme.','Un autre paragraphe.'].join('\n\n');
 const blocks = parseEditorDocument(source);
 const groups = groupArticleFlow(blocks);
 assert.deepEqual(groups.map(group => group.items.length),[3,1]);
 assert.equal(serializeEditorDocument(blocks),source);
 const html = renderMarkdown(source);
 assert.match(html,/article-flow-left/);
 assert.match(html,/article-element-parchment/);
 assert.match(html,/<div class="article-flow-content">[\s\S]*Bonjour[\s\S]*La question du syndicalisme\.<\/p>\n<\/div><\/div><p>Un autre paragraphe\./);
});

test('never attaches a group across headings, tables, code or reference definitions', () => {
 const bubble = serializeArticleElement({kind:'bubble',text:'Réplique',width:36,align:'right',clear:true,keepWithNext:true,color:'ochre'});
 for(const following of ['## Section','| A | B |\n| - | - |\n| 1 | 2 |','```js\nconst x = 1;\n```','[ref]: https://example.org\n\nUn [lien][ref].']) {
  const source = bubble+'\n\n'+following;
  assert.equal(groupArticleFlow(parseEditorDocument(source))[0].grouped,false);
  assert.ok(!renderMarkdown(source).includes('class="article-flow '));
 }
});

test('groups paired bubbles without changing their text or order in plain text', () => {
 const first=serializeArticleElement({kind:'bubble',text:'Question ?',width:48,align:'right',clear:true,keepWithNext:true,color:'ochre'});
 const second=serializeArticleElement({kind:'bubble',text:'Réponse.',width:23,align:'left',clear:false,color:'blue'});
 const source=first+'\n\n'+second;
 assert.match(renderMarkdown(source),/article-flow-objects/);
 assert.equal(toPlainText(source),'Question ? Réponse.');
 assert.equal(serializeEditorDocument(parseEditorDocument(source)),source);
 assert.equal(parseArticleElement('{"kind":"image","src":"/media/a.png","keepWithNext":"true","halo":"url(evil)"}')?.halo,undefined);
 assert.equal(parseArticleElement('{"kind":"image","src":"/media/a.png","keepWithNext":"true"}')?.keepWithNext,undefined);
});

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

test('bubble shapes survive both editor modes and keep dialogue escaped and readable', () => {
 for (const bubbleStyle of ['speech-left','speech-right','thought'] as const) {
  const element = {kind:'bubble',align:'right',width:40,clear:true,color:'blue',text:'Bonjour <script>\nEt après ?',bubbleStyle,...(bubbleStyle==='thought'?{}:{nearImage:true as const})} as const;
  const source=serializeArticleElement(element);
  assert.deepEqual(parseEditorDocument(source)[0].element,element);
  assert.equal(serializeEditorDocument(parseEditorDocument(source)),source);
  const html=renderMarkdown(source);
  assert.match(html,new RegExp('article-bubble-'+bubbleStyle));
  assert.match(html,/aria-hidden="true"/);
  assert.match(html,/&lt;script&gt;/);
  assert.ok(!html.includes('<script>'));
  assert.equal(toPlainText(source),'Bonjour <script Et après ?');
  assert.equal(html.includes('<ellipse'),bubbleStyle==='thought');
 }
});

test('new decoration options cannot change legacy bubbles or leak into image settings', () => {
 const plain=parseArticleElement('{"kind":"bubble","text":"Bonjour","color":"blue"}')!;
 assert.match(renderArticleElement(plain),/<div class="article-bubble article-bubble-blue">Bonjour<\/div>/);
 assert.ok(!renderArticleElement(plain).includes('<svg'));
 for(const bubbleStyle of ['<script>','',null,'thought']) {
  const parsed=parseArticleElement(JSON.stringify({kind:'bubble',text:'Texte',bubbleStyle,nearImage:true}))!;
  assert.equal(parsed.nearImage,undefined);
  if(bubbleStyle!=='thought') assert.equal(parsed.bubbleStyle,undefined);
 }
 const image=parseArticleElement('{"kind":"image","src":"/a.png","bubbleStyle":"speech-left","nearImage":true}')!;
 assert.equal(image.bubbleStyle,undefined);
 assert.equal(image.nearImage,undefined);
});

test('reuses every bubble shape with unrelated images, widths and placements', () => {
 for (const align of ['left','right','center'] as const) {
  for (const width of [25,44,70]) {
   for (const bubbleStyle of [undefined,'speech-left','speech-right','thought'] as const) {
    const image=serializeArticleElement({kind:'image',src:'/media/atelier-velo.png',alt:'Atelier vélo',align,width,clear:true,keepWithNext:true});
    const bubble=serializeArticleElement({kind:'bubble',text:'La roue est prête ?\nOui, vous pouvez repartir.',align:'right',width:40,clear:false,color:'ochre',bubbleStyle,nearImage:true,keepWithNext:true});
    const source=[image,bubble,'Un paragraphe sur la réparation des vélos.'].join('\n\n');
    const html=renderMarkdown(source);
    assert.match(html,new RegExp('article-flow-'+align));
    assert.match(html,/atelier-velo\.png/);
    assert.ok(!/CGT|syndiqu|Amfis/.test(html));
    assert.equal(serializeEditorDocument(parseEditorDocument(source)),source);
    assert.equal(toPlainText(source),'La roue est prête ? Oui, vous pouvez repartir. Un paragraphe sur la réparation des vélos.');
   }
  }
 }
});

test('preserves editorial Markdown styles and source through the visual parser', () => {
 const source='## Atelier\n\n[[couleur:violet|***Une phrase***]] et [[police:gowun-batang|du texte]].\n\n> [[couleur:rouge|**Une citation**]]\n\n- Un point\n- Un [lien][ref]\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n[ref]: https://example.org';
 assert.equal(serializeEditorDocument(parseEditorDocument(source)),source);
 const html=renderMarkdown(source);
 for(const expected of ['texte-couleur-violet','texte-couleur-rouge','texte-police-gowun-batang','<strong>','<em>','<blockquote>','<ul>','<table>','href="https://example.org"']) assert.ok(html.includes(expected),expected);
});
