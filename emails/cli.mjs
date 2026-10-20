#!/usr/bin/env node
/**
 * Semli email. One place to see every marketing email, who it goes to, and where it stands.
 *
 *   npm run email                 this help
 *   npm run email build           render docs/emails/*.html and *.txt from templates.mjs
 *   npm run email preview         build, then open a gallery of all five in the browser
 *   npm run email status          segments with counts, every broadcast, and the plan at a glance
 *   npm run email sync            Supabase waitlist -> Resend contacts in Survey / Waitlist / Updates
 *   npm run email add testers a@b.edu [more…]   put installed testers in the Testers segment
 *   npm run email send <name> [--at "2027-01-05T13:00:00Z"] [--yes]
 *                                 draft a broadcast in Resend; --yes sends (or schedules with --at)
 *   npm run email send all [--yes]   one draft per email that has a date; --yes schedules them
 *   npm run email send feedback --to a@b.edu --name Ana --about "…" --reply "…"
 *
 * Reads RESEND_API_KEY and EMAIL_POSTAL_ADDRESS from the repo-root .env. The key needs full
 * access (the send-only key Supabase uses cannot list segments or create broadcasts).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHtml, renderText, wordCount } from './layout.mjs';
import { emails, segments, feedbackThankYou, SURVEY_TESTFLIGHT, BETA_LINK } from './templates.mjs';
import { client, ResendError } from './resend.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'docs', 'emails');
const FROM = 'Semli <hello@semli.app>';
const REPLY_TO = 'hello@semli.app';
const MAX_WORDS = 80;

function env() {
  const vars = {};
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return { ...vars, ...process.env };
}

const E = env();
const POSTAL = E.EMAIL_POSTAL_ADDRESS || '[SENDER_POSTAL_ADDRESS]';
const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const has = (name) => args.includes(`--${name}`);
const warn = (s) => console.log(`  ! ${s}`);
const pad = (s, n) => String(s ?? '').padEnd(n);

function table(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i] ?? '').length)));
  for (const r of rows) console.log('  ' + r.map((c, i) => pad(c, widths[i])).join('  '));
}

// ---------- build / preview ----------

function build({ quiet } = {}) {
  mkdirSync(out, { recursive: true });
  for (const [name, e] of Object.entries(emails)) {
    writeFileSync(join(out, `${name}.html`), renderHtml(e, POSTAL));
    writeFileSync(join(out, `${name}.txt`), renderText(e, POSTAL));
    const words = wordCount(e);
    if (!quiet) console.log(`  ${pad(name, 20)} ${pad(words + ' words', 10)} ${words > MAX_WORDS ? `over ${MAX_WORDS}, trim it` : ''}`);
  }
  const fb = feedbackThankYou({ name: '[FIRST_NAME]', about: '[FEEDBACK_SUMMARY]', reply: '[PERSONAL_REPLY]' });
  writeFileSync(join(out, 'feedback-thank-you.html'), renderHtml(fb, POSTAL));
  writeFileSync(join(out, 'feedback-thank-you.txt'), renderText(fb, POSTAL));
  if (!quiet) console.log(`  ${pad('feedback-thank-you', 20)} ${pad(wordCount(fb) + ' words', 10)} one-to-one, filled by \`send feedback\``);
  if (POSTAL.startsWith('[')) warn('EMAIL_POSTAL_ADDRESS is not set in .env; the footer shows a placeholder.');
}

function preview() {
  build();
  const fb = feedbackThankYou({ name: 'Ana', about: 'the overlap warning hiding the class name', reply: 'I can see how that would be confusing. Could you tell me which screen you were on when it happened?' });
  const all = [...Object.entries(emails), ['feedback-thank-you', { ...fb, segment: 'one-to-one', plan: 'Reply after reading their message' }]];
  const cards = all.map(([name, e]) => `
    <section>
      <header><strong>${name}</strong><span>${segments[e.segment] ?? e.segment} · ${wordCount(e)} words</span><em>${e.subject}</em><small>${e.preheader}</small></header>
      <iframe title="${name}" srcdoc="${renderHtml(e, POSTAL).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></iframe>
      <p>${e.plan}</p>
    </section>`).join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Semli emails</title>
<style>
  body{margin:0;background:#F0EFEB;color:#222320;font:14px/20px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif}
  h1{font-weight:400;font-size:24px;margin:28px 24px 4px}
  .lead{margin:0 24px 20px;color:#686963}
  main{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:20px;padding:0 24px 40px}
  section{background:#FFF;border:1px solid #E5E4DE;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
  header{padding:14px 16px 10px;border-bottom:1px solid #E5E4DE;display:grid;gap:2px}
  header span,header small{color:#686963}
  header em{font-style:normal;font-weight:500}
  iframe{border:0;width:100%;height:640px;background:#FAF9F6}
  section p{margin:0;padding:10px 16px 14px;color:#686963;border-top:1px solid #E5E4DE}
</style></head><body>
<h1>Semli emails</h1><p class="lead">Rendered from emails/templates.mjs through the one layout. Postal address: ${POSTAL}.</p>
<main>${cards}</main></body></html>`;
  const file = join(out, 'preview.html');
  writeFileSync(file, html);
  console.log(`  ${file}`);
  if (process.platform === 'darwin') spawnSync('open', [file]);
}

// ---------- Resend ----------

function resend() {
  if (!E.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing from the repo-root .env');
  return client(E.RESEND_API_KEY);
}

async function ensureSegments(api) {
  const existing = await api.segments();
  const byName = Object.fromEntries(existing.map((s) => [s.name.toLowerCase(), s]));
  const ids = {};
  for (const [key, name] of Object.entries(segments)) {
    let s = byName[name.toLowerCase()];
    if (!s) { s = await api.createSegment(name); console.log(`  created segment ${name}`); }
    ids[key] = s.id;
  }
  return ids;
}

async function ensureProperties(api) {
  const keys = new Set((await api.properties()).map((p) => p.key));
  for (const key of ['ref', 'source']) if (!keys.has(key)) { await api.createProperty(key); console.log(`  created contact property ${key}`); }
}

/** Create or update one contact and put it in its segments. */
async function upsert(api, { email, first_name, properties }, segmentIds) {
  try {
    await api.createContact({ email, first_name, unsubscribed: false, properties, segments: segmentIds.map((id) => ({ id })) });
    return 'added';
  } catch (err) {
    if (!(err instanceof ResendError) || ![409, 422].includes(err.status)) throw err;
    await api.updateContact(email, { properties });
    for (const id of segmentIds) await api.addToSegment(email, id).catch((e) => { if (e.status !== 409) throw e; });
    return 'updated';
  }
}

function waitlistRows() {
  const sql = "select email, ref, created_at from public.waitlist order by created_at";
  let text;
  try {
    text = execFileSync('npx', ['--no-install', 'supabase', 'db', 'query', '--linked', '--output-format', 'json', sql], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    throw new Error(`supabase db query failed; run \`npx supabase login\` and \`npx supabase link\` first.\n${err.stderr ?? err.message}`);
  }
  const json = JSON.parse(text.slice(text.indexOf('[') >= 0 && text.indexOf('[') < (text.indexOf('{') + 1 || Infinity) ? text.indexOf('[') : text.indexOf('{')));
  const rows = Array.isArray(json) ? json : json.rows ?? json.result ?? json.data ?? [];
  if (!Array.isArray(rows)) throw new Error(`unexpected query output: ${text.slice(0, 200)}`);
  return rows;
}

async function sync() {
  const api = resend();
  const ids = await ensureSegments(api);
  await ensureProperties(api);
  const rows = waitlistRows();
  console.log(`  ${rows.length} waitlist rows`);
  const counts = { added: 0, updated: 0 };
  for (const r of rows) {
    const source = r.ref === 'survey' ? 'survey' : 'waitlist';
    const result = await upsert(api, { email: r.email, properties: { ref: r.ref ?? '', source } }, [ids[source], ids.updates]);
    counts[result]++;
  }
  console.log(`  ${counts.added} added, ${counts.updated} already there (segments and properties refreshed)`);
  console.log('  Unsubscribes stay as they are in Resend; sync never re-subscribes anyone.');
}

async function add(group, addresses) {
  if (!segments[group]) throw new Error(`unknown group ${group}; one of ${Object.keys(segments).join(', ')}`);
  if (!addresses.length) throw new Error('give at least one email address');
  const api = resend();
  const ids = await ensureSegments(api);
  for (const email of addresses) {
    const result = await upsert(api, { email: email.toLowerCase(), properties: {} }, [ids[group], ids.updates]);
    console.log(`  ${result} ${email} -> ${segments[group]}`);
  }
}

async function status() {
  const api = resend();
  let segs, broadcasts;
  try {
    segs = await api.segments();
    broadcasts = await api.broadcasts();
  } catch (err) {
    if (err.name === 'restricted_api_key') {
      warn('The RESEND_API_KEY in .env is send-only. Create a full-access key in Resend (API Keys, "Full access") and put it in .env.');
      warn('Supabase keeps using its own key for sign-in codes; nothing there changes.');
      return;
    }
    throw err;
  }
  const byName = Object.fromEntries(segs.map((s) => [s.name.toLowerCase(), s]));
  const count = {};
  for (const [key, name] of Object.entries(segments)) {
    const s = byName[name.toLowerCase()];
    if (!s) { count[key] = 'missing (run sync)'; continue; }
    const contacts = await api.contacts(s.id);
    const unsub = contacts.filter((c) => c.unsubscribed).length;
    count[key] = `${contacts.length - unsub}${unsub ? ` (+${unsub} unsubscribed)` : ''}`;
  }

  console.log('\nGroups');
  table([['group', 'contacts'], ...Object.entries(segments).map(([k, n]) => [n, count[k]])]);

  console.log('\nEmails');
  const rows = [['email', 'to', 'words', 'last broadcast', 'plan']];
  for (const [name, e] of Object.entries(emails)) {
    const mine = broadcasts.filter((b) => b.name === name).sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    const b = mine[0];
    const state = b ? `${b.status}${b.sent_at ? ' ' + b.sent_at.slice(0, 10) : b.scheduled_at ? ' for ' + b.scheduled_at.slice(0, 10) : ''}` : 'not drafted';
    rows.push([name, segments[e.segment], wordCount(e), state, e.plan]);
  }
  rows.push(['feedback-thank-you', 'one person', wordCount(feedbackThankYou({ name: 'x', about: 'x', reply: 'x' })), 'sent as needed', 'Reply after reading their message']);
  table(rows);

  const other = broadcasts.filter((b) => !emails[b.name]);
  if (other.length) {
    console.log('\nOther broadcasts in Resend');
    table([['name', 'status', 'created'], ...other.map((b) => [b.name, b.status, b.created_at.slice(0, 10)])]);
  }
  console.log('');
  if (POSTAL.startsWith('[')) warn('EMAIL_POSTAL_ADDRESS is not set in .env; broadcasts will carry a placeholder footer.');
  warn(`Survey invite link: ${SURVEY_TESTFLIGHT}. Confirm it accepts testers before sending.`);
  warn(`Beta invite link: ${BETA_LINK}. Needs TESTFLIGHT_URL set on Vercel.`);
}

async function send(name) {
  if (name === 'feedback') return sendFeedback();
  const names = name === 'all' ? Object.keys(emails) : [name];
  if (!names.every((n) => emails[n])) throw new Error(`unknown email ${name}; one of ${Object.keys(emails).join(', ')}, all, feedback`);
  if (POSTAL.startsWith('[')) throw new Error('Set EMAIL_POSTAL_ADDRESS in .env before drafting a broadcast; the footer needs a real address.');
  const api = resend();
  const ids = await ensureSegments(api);
  const at = flag('at');
  const yes = has('yes');
  if (name === 'all' && yes && !at) throw new Error('`send all --yes` needs --at; it schedules every email for the same time. Send them one by one for different dates.');
  for (const n of names) {
    const e = emails[n];
    const body = {
      name: n,
      from: FROM,
      reply_to: REPLY_TO,
      subject: e.subject,
      segment_id: ids[e.segment],
      html: renderHtml(e, POSTAL),
      text: renderText(e, POSTAL).replace(/^Subject: .*\n\n/, ''),
      send: yes,
      ...(yes && at ? { scheduled_at: at } : {}),
    };
    const b = await api.createBroadcast(body);
    const what = yes ? (at ? `scheduled for ${at}` : 'sending now') : 'drafted';
    console.log(`  ${pad(n, 20)} -> ${pad(segments[e.segment], 9)} ${what}   https://resend.com/broadcasts/${b.id}`);
  }
  if (!yes) console.log('  Drafts only. Open each in Resend to proof it, then rerun with --yes (and --at to schedule).');
}

async function sendFeedback() {
  const to = flag('to'); const about = flag('about'); const reply = flag('reply'); const name = flag('name');
  if (!to || !about || !reply) throw new Error('send feedback needs --to, --about and --reply (and --name if you know it)');
  const e = feedbackThankYou({ name, about, reply });
  const api = resend();
  const r = await api.sendEmail({ from: FROM, to: [to], reply_to: REPLY_TO, subject: e.subject, html: renderHtml(e, POSTAL), text: renderText(e, POSTAL).replace(/^Subject: .*\n\n/, '') });
  console.log(`  sent to ${to}  ${r.id}`);
}

// ---------- main ----------

const [cmd, ...rest] = args;
const run = {
  build: () => build(),
  preview: () => preview(),
  status,
  sync,
  add: () => add(rest[0], rest.slice(1).filter((a) => !a.startsWith('--'))),
  send: () => send(rest[0]),
}[cmd];

if (!run) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('\n').slice(2).map((l) => l.replace(/^ \* ?/, '')).join('\n'));
} else {
  Promise.resolve().then(run).catch((err) => { console.error(`\n  ${err.message}\n`); process.exit(1); });
}
