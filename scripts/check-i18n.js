/* global process */
import en from '../src/utils/translations/en.js';
import kn from '../src/utils/translations/kn.js';
import hi from '../src/utils/translations/hi.js';
import mr from '../src/utils/translations/mr.js';

console.log('🔍 Running Automated i18n & Translation Parity Check...\n');

const dicts = { en, kn, hi, mr };
const enKeys = Object.keys(en);
let hasError = false;

console.log(`Found ${enKeys.length} master translation keys in English.`);

// 1. Verify 100% Key Parity
['kn', 'hi', 'mr'].forEach(lang => {
  const targetKeys = Object.keys(dicts[lang]);
  const missing = enKeys.filter(k => !(k in dicts[lang]));
  const extra = targetKeys.filter(k => !(k in en));

  if (missing.length > 0) {
    console.error(`❌ [${lang}] Missing ${missing.length} keys: ${missing.join(', ')}`);
    hasError = true;
  }
  if (extra.length > 0) {
    console.warn(`⚠️ [${lang}] Has ${extra.length} extra keys not in en: ${extra.join(', ')}`);
  }

  // Check for empty values
  enKeys.forEach(k => {
    const val = dicts[lang][k];
    if (!val || typeof val !== 'string' || val.trim().length === 0) {
      console.error(`❌ [${lang}] Key "${k}" has empty or invalid value.`);
      hasError = true;
    }
  });
});

// 2. Verify Distinct Translations (prevent copying English over)
['kn', 'hi', 'mr'].forEach(lang => {
  const identical = enKeys.filter(k => dicts[lang][k] === en[k]);
  if (identical.length > 0) {
    console.error(`❌ [${lang}] Keys are identical to English: ${identical.join(', ')}`);
    hasError = true;
  }
});

if (hasError) {
  console.error('\n❌ i18n check FAILED. Please fix the missing or copied translation keys above.');
  process.exit(1);
} else {
  console.log('✅ 100% translation key parity verified across English, Kannada, Hindi, and Marathi.');
  console.log('✅ Zero untranslated or empty keys found.\n');
  process.exit(0);
}
