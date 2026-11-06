import { build } from 'esbuild';
await build({ entryPoints:['tools/supabase-entry.js'], outfile:'docs/vendor/supabase.js', bundle:true, format:'esm', platform:'browser', target:['es2022'], minify:true, supported:{'template-literal':false}, legalComments:'eof' });
