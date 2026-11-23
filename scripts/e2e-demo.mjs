const apiBase = process.env.API_BASE || 'http://localhost:18080/api/v1';
const email = process.env.DEMO_EMAIL || 'demo@leadflow.ai';
const password = process.env.DEMO_PASSWORD || 'DemoPass123!';
const timeoutMs = Number(process.env.E2E_TIMEOUT_MS || 60000);

let cookie = '';

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${text.slice(0, 500)}`);
  }
  return { body, headers: response.headers };
}

async function poll(path, predicate, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { body } = await request(path);
    if (predicate(body)) return body;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timeout while waiting for ${label}`);
}

const login = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
cookie = login.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
console.log('LOGIN_OK', login.body.email);

const created = await request('/prospects', {
  method: 'POST',
  body: JSON.stringify({
    companyName: `E2E Groq SARL ${Date.now()}`,
    contactName: 'Alice Martin',
    email: 'alice.martin@example.test',
    website: 'https://example.test',
    industry: 'Laboratory software',
    companyDescription: 'Laboratory software company evaluating a targeted B2B outreach workflow.',
    source: 'MANUAL'
  })
}).then((result) => result.body);
console.log('PROSPECT_CREATED', created.id);

const trigger = await request(`/prospects/${created.id}/qualify`, { method: 'POST' }).then((result) => result.body);
console.log('QUALIFICATION_TRIGGERED', trigger.correlationId);

const analyzed = await poll(
  `/prospects/${created.id}`,
  (detail) => Array.isArray(detail.analyses) && detail.analyses.length > 0,
  'qualification analysis'
);
const analysis = analyzed.analyses[0];
console.log('ANALYSIS_OK', analysis.score, analysis.category, analysis.confidence);
if (String(analysis.summary).includes('TEST MOCK')) {
  throw new Error('Mock response detected in real Groq run');
}
console.log('ANALYSIS_SUMMARY', String(analysis.summary).slice(0, 240));

const draftTrigger = await request(`/prospects/${created.id}/email-drafts/generate`, { method: 'POST' }).then((result) => result.body);
console.log('DRAFT_TRIGGERED', draftTrigger.correlationId);

const withDraft = await poll(
  `/prospects/${created.id}`,
  (detail) => Array.isArray(detail.drafts) && detail.drafts.length > 0,
  'email draft'
);
const draft = withDraft.drafts[0];
console.log('DRAFT_OK', draft.id, draft.status);
if (`${draft.subject} ${draft.body}`.includes('TEST MOCK')) {
  throw new Error('Mock draft detected in real Groq run');
}
console.log('DRAFT_SUBJECT', draft.subject);

const approved = await request(`/email-drafts/${draft.id}/approve`, { method: 'POST' }).then((result) => result.body);
console.log('DRAFT_APPROVED', approved.status);

const sent = await request(`/email-drafts/${draft.id}/send`, { method: 'POST' }).then((result) => result.body);
console.log('SEND_TRIGGERED', sent.status, sent.simulated);

const finalDraft = await poll(
  `/email-drafts/${draft.id}`,
  (value) => value.status === 'SENT',
  'sent draft'
);
console.log('DRAFT_SENT', finalDraft.id, finalDraft.status);

const finalDetail = await request(`/prospects/${created.id}`).then((result) => result.body);
const events = finalDetail.activity.map((item) => item.eventType).join(',');
console.log('ACTIVITY_OK', events);
console.log('E2E_SUCCESS');
