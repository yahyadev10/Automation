import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('infra/n8n/workflows');
mkdirSync(outDir, { recursive: true });

const WF = {
  qualify: '1c4e7b30-9d2a-4f11-8c33-0a1b2c3d4e5f',
  draft: '2d5f8c41-0e3b-4a22-9d44-1b2c3d4e5f60',
  send: '3e6a9d52-1f4c-4b33-ae55-2c3d4e5f6071',
  error: '9f3c2a11-7b44-4e0d-9a1f-2c8e5d6b7a90',
};

let seq = 0;
const nodeId = (prefix) => `${prefix}-${String(++seq).padStart(3, '0')}`;

const webhook = (name, webhookPath, x, y) => ({
  parameters: { httpMethod: 'POST', path: webhookPath, responseMode: 'responseNode', options: {} },
  id: nodeId('webhook'),
  name,
  type: 'n8n-nodes-base.webhook',
  typeVersion: 2.1,
  position: [x, y],
  webhookId: nodeId('wh'),
});

const codeNode = (name, jsCode, x, y, onError) => ({
  parameters: { mode: 'runOnceForAllItems', jsCode },
  id: nodeId('code'),
  name,
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [x, y],
  ...(onError ? { onError } : {}),
});

const httpNode = (name, url, bodyExpr, secretHeader, x, y, options = {}) => ({
  parameters: {
    method: 'POST',
    url,
    authentication: 'none',
    sendHeaders: true,
    headerParameters: {
      parameters: [
        {
          name: secretHeader ? 'X-LeadFlow-Secret' : 'Authorization',
          value: secretHeader ? '={{ $env.N8N_WEBHOOK_SECRET }}' : "={{ 'Bearer ' + $env.GROQ_API_KEY }}",
        },
        { name: 'Content-Type', value: 'application/json' },
      ],
    },
    sendBody: true,
    contentType: 'json',
    specifyBody: 'json',
    jsonBody: bodyExpr,
    options: { timeout: options.timeout || 20000 },
    ...(options.retry ? { retryOnFail: true, maxTries: 2, waitBetweenTries: 1000 } : {}),
  },
  id: nodeId('http'),
  name,
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.2,
  position: [x, y],
  ...(options.onError ? { onError: options.onError } : {}),
});

const respondNode = (name, x, y, responseCode) => ({
  parameters: {
    respondWith: 'json',
    responseBody: '={{ JSON.stringify($json.response || { accepted: true }) }}',
    ...(responseCode ? { options: { responseCode } } : {}),
  },
  id: nodeId('respond'),
  name,
  type: 'n8n-nodes-base.respondToWebhook',
  typeVersion: 1.1,
  position: [x, y],
});

const ifNode = (name, x, y) => ({
  parameters: {
    conditions: {
      options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
      conditions: [{
        id: nodeId('condition'),
        leftValue: '={{ $json.ok }}',
        rightValue: 'true',
        operator: { type: 'boolean', operation: 'true', singleValue: true },
      }],
      combinator: 'and',
    },
    options: {},
  },
  id: nodeId('if'),
  name,
  type: 'n8n-nodes-base.if',
  typeVersion: 2.2,
  position: [x, y],
});

const chain = (...names) => {
  const connections = {};
  for (let i = 0; i < names.length - 1; i += 1) {
    connections[names[i]] = { main: [[{ node: names[i + 1], type: 'main', index: 0 }]] };
  }
  return connections;
};

const guardedChain = (...names) => {
  const [webhookName, verifyName, ifName, unauthorizedName, ...rest] = names;
  const link = (name) => ({ node: name, type: 'main', index: 0 });
  return {
    [webhookName]: { main: [[link(verifyName)]] },
    [verifyName]: { main: [[link(ifName)]] },
    [ifName]: { main: [[link(rest[0])], [link(unauthorizedName)]] },
    ...chain(...rest),
  };
};

const workflow = (id, name, nodes, connections, withErrorWorkflow = true) => ({
  name,
  nodes,
  connections,
  active: false,
  settings: {
    executionOrder: 'v1',
    ...(withErrorWorkflow ? { errorWorkflow: WF.error } : {}),
  },
  versionId: nodeId('version'),
  id,
  tags: [],
  pinData: {},
});

const verifyCode = (required) => `
const item = $input.first().json;
const headers = item.headers || {};
const expected = $env.N8N_WEBHOOK_SECRET || '';
const provided = headers['x-leadflow-secret'] || '';
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function reject(message) {
  return [{ json: { ok: false, responseCode: 401, response: { accepted: false, error: message } } }];
}
if (!expected || !safeEqual(provided, expected)) {
  return reject('Unauthorized webhook call');
}
const body = item.body || item;
const required = ${JSON.stringify(required)};
for (const key of required) {
  const value = body[key];
  if (value === undefined || value === null || value === '') {
    return reject('Missing required field: ' + key);
  }
}
return [{ json: Object.assign({}, body, { ok: true }) }];
`.trim();

const qualLlmCode = `
const ctx = $('Verify and Validate').first().json;
const key = $env.GROQ_API_KEY;
const model = $env.GROQ_MODEL;
const base = ($env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\\/+$/, '');
if (!key) throw new Error('GROQ_API_KEY is not configured');
if (!model) throw new Error('GROQ_MODEL is not configured');
const system = [
  'You qualify B2B prospects for a small agency.',
  'Use ONLY the facts supplied by the user. Never invent company information, budget, customers or outcomes.',
  'Explicitly list missing information. Do not claim external verification.',
  'Return ONLY a JSON object with keys: score (integer 0-100), category (HIGH/MEDIUM/LOW),',
  'summary (string), strengths (string array), weaknesses (string array),',
  'missingInformation (string array), recommendations (string array), confidence (HIGH/MEDIUM/LOW).',
  'If information is insufficient, lower the score and confidence instead of guessing.'
].join(' ');
const user = JSON.stringify({
  prospectId: ctx.prospectId,
  companyName: ctx.companyName,
  contactName: ctx.contactName || null,
  email: ctx.email || null,
  website: ctx.website || null,
  industry: ctx.industry || null,
  companyDescription: ctx.companyDescription,
  source: ctx.source || 'MANUAL'
});
const body = {
  model: model,
  temperature: 0.1,
  response_format: { type: 'json_object' },
  messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
};
if (String(model).indexOf('gpt-oss') >= 0) body.reasoning_effort = 'low';
return [{ json: { llmUrl: base + '/chat/completions', llmBody: body } }];
`.trim();

const qualParseCode = `
const ctx = $('Verify and Validate').first().json;
function fail(message) {
  return [{
    json: {
      callback: {
        correlationId: ctx.correlationId,
        prospectId: ctx.prospectId,
        status: 'FAILURE',
        errorMessage: String(message).slice(0, 500)
      },
      response: { accepted: false, correlationId: ctx.correlationId, error: 'Qualification failed' }
    }
  }];
}
try {
  const http = $input.first().json;
  let content = http && http.choices && http.choices[0] && http.choices[0].message
    ? http.choices[0].message.content : null;
  if (!content) return fail('Invalid LLM response: no content');
  content = String(content).trim().replace(/^\`\`\`(?:json)?/i, '').replace(/\`\`\`$/, '').trim();
  const parsed = JSON.parse(content);
  const rawScore = Number(parsed.score);
  if (!Number.isFinite(rawScore)) return fail('Invalid score in LLM response');
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const category = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
  const list = (value) => Array.isArray(value)
    ? value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim().slice(0, 500)).slice(0, 20)
    : [];
  const rawConfidence = String(parsed.confidence || '').toUpperCase();
  const confidence = ['HIGH', 'MEDIUM', 'LOW'].indexOf(rawConfidence) >= 0 ? rawConfidence : 'LOW';
  const summary = String(parsed.summary || 'Assessment based only on the supplied information.').slice(0, 2000);
  return [{
    json: {
      callback: {
        correlationId: ctx.correlationId,
        prospectId: ctx.prospectId,
        status: 'SUCCESS',
        score: score,
        category: category,
        summary: summary,
        strengths: list(parsed.strengths),
        weaknesses: list(parsed.weaknesses),
        missingInformation: list(parsed.missingInformation),
        recommendations: list(parsed.recommendations),
        confidence: confidence,
        modelName: $env.GROQ_MODEL || null,
        promptVersion: ctx.promptVersion || 'v1'
      },
      response: { accepted: true, correlationId: ctx.correlationId, score: score, category: category }
    }
  }];
} catch (error) {
  return fail(error && error.message ? error.message : 'Invalid LLM JSON');
}
`.trim();

const draftLlmCode = `
const ctx = $('Verify and Validate').first().json;
const key = $env.GROQ_API_KEY;
const model = $env.GROQ_MODEL;
const base = ($env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\\/+$/, '');
if (!key) throw new Error('GROQ_API_KEY is not configured');
if (!model) throw new Error('GROQ_MODEL is not configured');
const system = [
  'Write a short professional B2B outreach email draft in English.',
  'Use only the supplied facts. Do not invent a previous relationship, results, promises or pricing.',
  'If contact name is missing, start with "Hello".',
  'Return ONLY a JSON object with keys subject (string) and body (string).',
  'The draft must remain neutral and clearly based on the supplied information.'
].join(' ');
const user = JSON.stringify({
  companyName: ctx.companyName,
  contactName: ctx.contactName || null,
  email: ctx.email || null,
  industry: ctx.industry || null,
  companyDescription: ctx.companyDescription,
  score: ctx.score,
  category: ctx.category,
  analysisSummary: ctx.analysisSummary,
  recommendations: ctx.recommendations || [],
  missingInformation: ctx.missingInformation || []
});
const body = {
  model: model,
  temperature: 0.2,
  response_format: { type: 'json_object' },
  messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
};
if (String(model).indexOf('gpt-oss') >= 0) body.reasoning_effort = 'low';
return [{ json: { llmUrl: base + '/chat/completions', llmBody: body } }];
`.trim();

const draftParseCode = `
const ctx = $('Verify and Validate').first().json;
function fail(message) {
  return [{
    json: {
      callback: {
        correlationId: ctx.correlationId,
        prospectId: ctx.prospectId,
        draftId: ctx.draftId || null,
        kind: 'DRAFT',
        status: 'FAILURE',
        errorMessage: String(message).slice(0, 500)
      },
      response: { accepted: false, correlationId: ctx.correlationId, error: 'Draft generation failed' }
    }
  }];
}
try {
  const http = $input.first().json;
  let content = http && http.choices && http.choices[0] && http.choices[0].message
    ? http.choices[0].message.content : null;
  if (!content) return fail('Invalid LLM response: no content');
  content = String(content).trim().replace(/^\`\`\`(?:json)?/i, '').replace(/\`\`\`$/, '').trim();
  const parsed = JSON.parse(content);
  const subject = String(parsed.subject || '').trim().slice(0, 300);
  const body = String(parsed.body || '').trim();
  if (!subject || !body) return fail('Invalid draft: subject or body missing');
  return [{
    json: {
      callback: {
        correlationId: ctx.correlationId,
        prospectId: ctx.prospectId,
        draftId: ctx.draftId || null,
        kind: 'DRAFT',
        status: 'SUCCESS',
        subject: subject,
        body: body
      },
      response: { accepted: true, correlationId: ctx.correlationId, status: 'PENDING_REVIEW' }
    }
  }];
} catch (error) {
  return fail(error && error.message ? error.message : 'Invalid LLM JSON');
}
`.trim();

const sendCode = `
const ctx = $('Verify and Validate').first().json;
const provider = String($env.EMAIL_PROVIDER || 'console').toLowerCase();
const simulated = provider === 'console' || provider !== 'smtp';
const message = simulated
  ? 'Simulation only: no real email delivered (EMAIL_PROVIDER=' + provider + ')'
  : 'Real provider configured: implementation required before use';
return [{
  json: {
    callback: {
      correlationId: ctx.correlationId,
      draftId: ctx.draftId,
      prospectId: ctx.prospectId,
      kind: 'EMAIL',
      status: simulated ? 'SUCCESS' : 'FAILURE',
      simulated: simulated,
      provider: provider,
      errorMessage: simulated ? null : 'No real email provider implemented'
    },
    response: {
      accepted: simulated,
      correlationId: ctx.correlationId,
      simulated: simulated,
      message: message
    }
  }
}];
`.trim();

const errorCode = `
const data = $input.first().json || {};
let message = String((data.error && data.error.message) || data.message || 'Unknown error');
for (const key of ['GROQ_API_KEY', 'N8N_WEBHOOK_SECRET', 'N8N_ENCRYPTION_KEY', 'APP_JWT_SECRET']) {
  const value = $env[key];
  if (value) message = message.split(value).join('[REDACTED]');
}
message = message
  .replace(/(Bearer\\s+)[A-Za-z0-9._-]+/gi, '$1[REDACTED]')
  .replace(/(api[_-]?key|password|secret|token)\\s*[=:]\\s*[^,\\s]+/gi, '$1=[REDACTED]')
  .slice(0, 500);
const errorData = data.error || {};
const correlationId = errorData.correlationId || data.correlationId || null;
return [{
  json: {
    callback: {
      workflowName: String((data.workflow && data.workflow.name) || 'unknown-workflow').slice(0, 120),
      correlationId: correlationId,
      executionId: String((data.execution && data.execution.id) || '').slice(0, 120),
      message: message
    }
  }
}];
`.trim();

const qualifyNodes = [
  webhook('Webhook', 'leadflow/qualify', -600, 0),
  codeNode('Verify and Validate', verifyCode(['prospectId', 'correlationId', 'companyName', 'companyDescription']), -360, 0),
  ifNode('Is Authorized', -120, 0),
  codeNode('Build LLM Request', qualLlmCode, 120, 0),
  httpNode('Call Groq', '={{ $json.llmUrl }}', '={{ JSON.stringify($json.llmBody) }}', false, 360, 0, { retry: true, onError: 'continueRegularOutput' }),
  codeNode('Parse and Normalize', qualParseCode, 600, 0),
  httpNode('Send Qualification Callback', '={{ $env.BACKEND_CALLBACK_URL + "/qualification" }}', '={{ JSON.stringify($json.callback) }}', true, 840, 0, { retry: true }),
  respondNode('Respond to Webhook', 1080, 0),
  respondNode('Respond Unauthorized', 120, 220, 401),
];

const draftNodes = [
  webhook('Webhook', 'leadflow/email-draft', -600, 0),
  codeNode('Verify and Validate', verifyCode(['prospectId', 'correlationId', 'companyDescription', 'score', 'category', 'analysisSummary']), -360, 0),
  ifNode('Is Authorized', -120, 0),
  codeNode('Build LLM Request', draftLlmCode, 120, 0),
  httpNode('Call Groq', '={{ $json.llmUrl }}', '={{ JSON.stringify($json.llmBody) }}', false, 360, 0, { retry: true, onError: 'continueRegularOutput' }),
  codeNode('Parse Draft', draftParseCode, 600, 0),
  httpNode('Send Draft Callback', '={{ $env.BACKEND_CALLBACK_URL + "/email" }}', '={{ JSON.stringify($json.callback) }}', true, 840, 0, { retry: true }),
  respondNode('Respond to Webhook', 1080, 0),
  respondNode('Respond Unauthorized', 120, 220, 401),
];

const sendNodes = [
  webhook('Webhook', 'leadflow/email-send', -600, 0),
  codeNode('Verify and Validate', verifyCode(['draftId', 'prospectId', 'correlationId', 'subject', 'body']), -360, 0),
  ifNode('Is Authorized', -120, 0),
  codeNode('Simulated Email Provider', sendCode, 120, 0),
  httpNode('Send Email Callback', '={{ $env.BACKEND_CALLBACK_URL + "/email" }}', '={{ JSON.stringify($json.callback) }}', true, 360, 0, { retry: true }),
  respondNode('Respond to Webhook', 600, 0),
  respondNode('Respond Unauthorized', 120, 220, 401),
];

const errorNodes = [
  {
    parameters: {},
    id: nodeId('errortrigger'),
    name: 'Error Trigger',
    type: 'n8n-nodes-base.errorTrigger',
    typeVersion: 1,
    position: [-400, 0],
  },
  codeNode('Sanitize Error', errorCode, -160, 0),
  httpNode('Send Failure Callback', '={{ $env.BACKEND_CALLBACK_URL + "/error" }}', '={{ JSON.stringify($json.callback) }}', true, 80, 0, { retry: true }),
];

const files = [
  ['WF-01-prospect-qualification.json', workflow(WF.qualify, 'WF-01 - Prospect Qualification', qualifyNodes,
    guardedChain('Webhook', 'Verify and Validate', 'Is Authorized', 'Respond Unauthorized',
      'Build LLM Request', 'Call Groq', 'Parse and Normalize', 'Send Qualification Callback',
      'Respond to Webhook'))],
  ['WF-02-email-draft-generation.json', workflow(WF.draft, 'WF-02 - Email Draft Generation', draftNodes,
    guardedChain('Webhook', 'Verify and Validate', 'Is Authorized', 'Respond Unauthorized',
      'Build LLM Request', 'Call Groq', 'Parse Draft', 'Send Draft Callback', 'Respond to Webhook'))],
  ['WF-03-approved-email-sending.json', workflow(WF.send, 'WF-03 - Approved Email Sending', sendNodes,
    guardedChain('Webhook', 'Verify and Validate', 'Is Authorized', 'Respond Unauthorized',
      'Simulated Email Provider', 'Send Email Callback', 'Respond to Webhook'))],
  ['WF-04-error-handling.json', workflow(WF.error, 'WF-04 - Error Handling', errorNodes,
    chain('Error Trigger', 'Sanitize Error', 'Send Failure Callback'), false)],
];

for (const [fileName, definition] of files) {
  writeFileSync(path.join(outDir, fileName), JSON.stringify(definition, null, 2) + '\n');
  console.log('generated ' + fileName);
}

writeFileSync(path.join(outDir, 'all-workflows.json'), JSON.stringify(files.map(([, definition]) => definition), null, 2) + '\n');
console.log('generated all-workflows.json');
