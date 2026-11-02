import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coreFile = path.resolve(__dirname, '../node_modules/tau-prolog/modules/core.js');

if (fs.existsSync(coreFile)) {
  let content = fs.readFileSync(coreFile, 'utf-8');

  // Limpiar cualquier repetición previa de var
  content = content.replace(/\b(?:var\s+)+/g, 'var ');

  // 1. Declarar variables internas del sistema de archivos y flujos
  const declarationHeader = `var version = { major: 0, minor: 3, patch: 4, status: "beta" };\n\tvar tau_file_system, tau_user_input, tau_user_output, tau_user_error;\n\tvar nodejs_file_system, nodejs_user_input, nodejs_user_output, nodejs_user_error;\n\tvar indicator;`;

  if (!content.includes('var tau_file_system, tau_user_input, tau_user_output, tau_user_error;')) {
    content = content.replace(
      /var version = \{ major: 0, minor: 3, patch: 4, status: "beta" \};/,
      declarationHeader
    );
  }

  content = content.replace(/^\s*(?:var\s+)?(tau_file_system\s*=)/gm, '\tvar tau_file_system =');
  content = content.replace(/^\s*(?:var\s+)?(tau_user_input\s*=)/gm, '\tvar tau_user_input =');
  content = content.replace(/^\s*(?:var\s+)?(tau_user_output\s*=)/gm, '\tvar tau_user_output =');
  content = content.replace(/^\s*(?:var\s+)?(tau_user_error\s*=)/gm, '\tvar tau_user_error =');
  content = content.replace(/^\s*(?:var\s+)?(nodejs_file_system\s*=)/gm, '\tvar nodejs_file_system =');
  content = content.replace(/^\s*(?:var\s+)?(nodejs_user_input\s*=)/gm, '\tvar nodejs_user_input =');
  content = content.replace(/^\s*(?:var\s+)?(nodejs_user_output\s*=)/gm, '\tvar nodejs_user_output =');
  content = content.replace(/^\s*(?:var\s+)?(nodejs_user_error\s*=)/gm, '\tvar nodejs_user_error =');

  // 2. Corregir detección de entorno Node.js vs Navegador:
  content = content.replace(
    /var nodejs_flag = typeof process !== 'undefined' && !process\.browser/g,
    'var nodejs_flag = typeof window === "undefined" && typeof process !== "undefined" && !process.browser && Array.isArray(process.argv)'
  );

  content = content.replace(
    /var nodejs_arguments = nodejs_flag \?/g,
    'var nodejs_arguments = (nodejs_flag && typeof process !== "undefined" && Array.isArray(process.argv)) ?'
  );

  // 3. Corregir variables no declaradas en directivas de Prolog:
  // En "dynamic/1", 'indicator' no estaba declarada con var
  content = content.replace(
    /"dynamic\/1": function\( thread, atom, options \) \{\s*(?:var indicator,\s*)?indicators = atom\.args\[0\];/,
    "\"dynamic/1\": function( thread, atom, options ) {\n\t\t\t\tvar indicator, indicators = atom.args[0];"
  );
  content = content.replace(
    /\t\t\t\twhile\(pl\.type\.is_term\(pointer\) && pointer\.indicator === "\.\/2"\) \{\s*(?:var\s+)?indicator = pointer\.args\[0\];/,
    "\t\t\t\twhile(pl.type.is_term(pointer) && pointer.indicator === \"./2\") {\n\t\t\t\t\tvar indicator = pointer.args[0];"
  );

  // En "keygroup/2", 'group' no estaba declarada con var
  content = content.replace(
    /\b(?:var\s+)?group = new Term\("\[\]", \[\]\);/,
    "var group = new Term(\"[]\", []);"
  );

  // En lectura de stream, 'num_token' no estaba declarada
  content = content.replace(
    /var char, tokenizer, expr(?:, num_token)?;/g,
    "var char, tokenizer, expr, num_token;"
  );

  // Limpiar cualquier duplicación accidental de var en todo el archivo
  content = content.replace(/\b(?:var\s+)+/g, 'var ');

  fs.writeFileSync(coreFile, content, 'utf-8');
  console.log('[patch-tau-prolog] Patched tau-prolog core.js successfully.');
}
