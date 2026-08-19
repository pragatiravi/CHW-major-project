import { describe, expect, it } from 'vitest';
import { escapeHTML } from './pdfExport';

describe('print export escaping', () => {
  it('escapes markup and event-handler payloads from patient text', () => {
    const payload = `<img src=x onerror="alert('xss')"> & patient`;
    const escaped = escapeHTML(payload);

    expect(escaped).toBe(
      '&lt;img src=x onerror=&quot;alert(&#039;xss&#039;)&quot;&gt; &amp; patient'
    );
    expect(escaped).not.toContain('<img');
  });

  it('handles nullish and numeric clinical values safely', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(185)).toBe('185');
  });
});
