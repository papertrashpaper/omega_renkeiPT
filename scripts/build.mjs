import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const f of ['index.html','style.css','app.js','engine.js','camera.js'])await copyFile(f,`dist/${f}`);
await cp('assets','dist/assets',{recursive:true});
console.log('Static site built in dist/');
