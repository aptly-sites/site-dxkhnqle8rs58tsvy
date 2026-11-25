const origin = 'https://site-dxkhnqle8rs58tsvy.pages.dev';
const project = '3971c004018e4052a04312c7bc77c844';
const reply = (status, message) => Response.json({message}, {status, headers:{'Cache-Control':'no-store'}});

export async function acceptFeedback({request, env}) {
  const url = new URL(request.url);
  if (url.origin !== origin || url.pathname !== '/api/website-review/feedback' || url.search || request.method !== 'POST') return reply(404,'Unavailable');
  if (request.headers.get('Origin') !== origin) return reply(403,'Open the form on the website.');
  const db = env.ALL3_FEEDBACK_DB;
  if (!db) return reply(503,'Feedback is currently unavailable.');
  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return reply(415,'JSON required.');
  const reader = request.body?.getReader();
  if (!reader) return reply(400,'Feedback required.');
  const bytes = new Uint8Array(256000);
  let length = 0;
  for (;;) {
    const {done,value} = await reader.read();
    if (done) break;
    if (length + value.length > bytes.length) { await reader.cancel(); return reply(413,'Feedback is too long.'); }
    bytes.set(value,length); length += value.length;
  }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(bytes.subarray(0,length))); } catch { return reply(400,'Invalid feedback.'); }
  const items = ['brand','owners','rentals','criteria','residents','regions','team','policies'];
  const r = data?.review;
  if (!data || Object.keys(data).some(k => !['id','review','company'].includes(k)) ||
      data.company !== '' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(data.id) ||
      !r || typeof r.name !== 'string' || !r.name.trim() || r.name.length>100 ||
      !['changes_requested','ready_for_verification'].includes(r.outcome) || r.confirmed!==true ||
      !Array.isArray(r.checks) || r.checks.length!==items.length || !items.every(id=>r.checks.includes(id)) ||
      !Array.isArray(r.feedback) || r.feedback.length>100 ||
      !r.feedback.every(n=>n && (items.includes(n.itemId)||n.itemId==='general') && typeof n.text==='string' && n.text.trim() && n.text.length<=4000))
    return reply(400,'Invalid or incomplete review.');
  const message=JSON.stringify({name:r.name.trim(),outcome:r.outcome,checks:items,feedback:r.feedback.map(({itemId,text})=>({itemId,text}))});
  const now = Math.floor(Date.now()/1000);
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return reply(503,'Feedback is currently unavailable.');
  const encoder = new TextEncoder();
  try {
  const config = await db.prepare("SELECT value FROM all3_feedback_config WHERE setting='rate_key'").first();
  const key = await crypto.subtle.importKey('raw',encoder.encode(config.value),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const hash = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(ip))),b=>b.toString(16).padStart(2,'0')).join('');
    const result = await db.prepare(`INSERT INTO all3_feedback(project,request_id,message,submitted_at,visitor_hash)
      SELECT ?,?,?,?,? WHERE (SELECT count(*) FROM all3_feedback WHERE visitor_hash=? AND submitted_at>?)<3
      AND (SELECT count(*) FROM all3_feedback WHERE submitted_at>?)<60
      ON CONFLICT(project,request_id) DO NOTHING`).bind(project,data.id,message,now,hash,hash,now-600,now-600).run();
    if (!result.meta.changes) {
      const retry = await db.prepare('SELECT 1 AS ok FROM all3_feedback WHERE project=? AND request_id=? AND visitor_hash=? AND message=?').bind(project,data.id,hash,message).first();
      if (!retry) return reply(429,'Please wait before sending more feedback.');
    }
    return Response.json({message:'Feedback received.',receipt:data.id},{status:202,headers:{'Cache-Control':'no-store'}});
  } catch { return reply(503,'Receipt could not be confirmed. Keep your feedback and retry.'); }
}
