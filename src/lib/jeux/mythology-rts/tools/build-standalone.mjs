import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const files=['data','terrain','fog','minimap','progression','world','camera','selection','game','sprites','render','main'];
const sections=files.map(name=>{
  const source=readFileSync(new URL(`js/${name}.js`,root),'utf8');
  const withoutImports=source.replace(/\bimport\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?/g,'');
  const plain=withoutImports.replace(/\bexport\s+(?=(?:const|function)\b)/g,'');
  if(/\b(?:import|export)\s/.test(plain))throw new Error(`Unsupported module syntax: ${name}.js`);
  return `\n// js/${name}.js\n${plain}`;
});
const output=`/* Generated from js/*.js by tools/build-standalone.mjs. Edit the modules, then rebuild. */\n(()=>{\n'use strict';\n${sections.join('\n')}\n})();\n`;
if(process.argv.includes('--stdout'))process.stdout.write(output);
else {writeFileSync(new URL('js/game-standalone.js',root),output);console.log('Built js/game-standalone.js');}
