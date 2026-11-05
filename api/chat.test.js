import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from './chat.js';

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

function request({ message, headers = {}, context = {}, language = 'en' }) {
  return {
    method: 'POST',
    headers: { 'x-forwarded-for': `192.0.2.${Math.floor(Math.random() * 200) + 1}`, ...headers },
    socket: { remoteAddress: '192.0.2.1' },
    body: { message, context, language }
  };
}

describe('POST /api/chat server pipeline', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('requires either a verified user token or an explicitly enabled demo marker', async () => {
    vi.stubEnv('ALLOW_DEMO_CHAT', 'false');
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key-1234567890');
    const res = mockResponse();
    await handler(request({ message: 'How do I make tea?' }), res);
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('unauthenticated');
  });

  it('rejects structured account or patient context from demo sessions', async () => {
    vi.stubEnv('ALLOW_DEMO_CHAT', 'true');
    const res = mockResponse();
    await handler(request({ message: 'What is normal BP?', headers: { 'x-chw-demo-session': 'true' }, context: { patientName: 'Test' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('demo_patient_data_rejected');
  });

  it('returns a pregnancy referral before calling the AI', async () => {
    vi.stubEnv('ALLOW_DEMO_CHAT', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = mockResponse();
    await handler(request({ message: 'Pregnant woman has BP 150/100 and severe headache', headers: { 'x-chw-demo-session': 'true' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.code).toBe('red_flag');
    expect(res.body.reply).toContain('108');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('answers an unrelated demo question with the online model and a general-answer badge', async () => {
    vi.stubEnv('ALLOW_DEMO_CHAT', 'true');
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key-1234567890');
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.8-flash');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'Boil water, add tea leaves, steep, then strain.' }] } }]
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const res = mockResponse();
    await handler(request({ message: 'How do I make tea?', headers: { 'x-chw-demo-session': 'true' } }), res);
    expect(res.body.reply).toContain('Boil water');
    expect(res.body.badge).toBe('online_ai_general');
    expect(fetchSpy.mock.calls[0][0]).toContain('/models/gemini-3.8-flash:generateContent');
    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(payload.generationConfig.maxOutputTokens).toBeLessThanOrEqual(150);
    expect(payload.generationConfig).not.toHaveProperty('temperature');
  });

  it('accepts real sessions only after Supabase getUser validates the bearer token', async () => {
    vi.stubEnv('ALLOW_DEMO_CHAT', 'false');
    vi.stubEnv('SUPABASE_URL', 'https://project-test.supabase.co');
    vi.stubEnv('SUPABASE_ANON_KEY', 'test-public-anon-key');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project-test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-public-anon-key');
    vi.stubEnv('GEMINI_API_KEY', 'test-api-key-1234567890');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('/auth/v1/user')) {
        return new Response(JSON.stringify({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'real@example.org' }), { status: 200 });
      }
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Online answer.' }] } }] }), { status: 200 });
    });
    const res = mockResponse();
    await handler(request({ message: 'How do I make tea?', headers: { authorization: 'Bearer verified-test-token' } }), res);
    expect(fetchSpy.mock.calls[0][0]).toContain('/auth/v1/user');
    expect(res.statusCode).toBe(200);
    expect(res.body.authMode).toBe('real');
    expect(res.body.badge).toBe('online_ai_general');
  });
});
