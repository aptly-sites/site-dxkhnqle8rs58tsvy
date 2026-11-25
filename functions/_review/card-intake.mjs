// Prepared adapter contract. No public route until the card-scoped writer is verified.
const sites = new Map([["site-dxkhnqle8rs58tsvy", {
  "name": "All 3 Realty",
  "origin": "https://site-dxkhnqle8rs58tsvy.pages.dev",
  "boardId": "NNixbbHgtc2ubfnDy",
  "cardId": "07da266b26004c798acc4658ef406c6a",
  "recipient": "jNc4wKZYTA9FBbEje",
  "items": {
    "brand": "Homepage and navigation",
    "owners": "Owner services",
    "rentals": "Rental search",
    "criteria": "Application criteria",
    "residents": "Resident resources",
    "regions": "Service areas",
    "team": "Team and contact details",
    "policies": "Privacy policy"
  },
  "paths": {
    "brand": [
      "/"
    ],
    "owners": [
      "/property-management-services/"
    ],
    "rentals": [
      "/homes-for-rent/"
    ],
    "criteria": [
      "/application-qualification/"
    ],
    "residents": [
      "/current-residents/"
    ],
    "regions": [
      "/markets/georgia/",
      "/markets/alabama/"
    ],
    "team": [
      "/contact/",
      "/company/"
    ],
    "policies": [
      "/privacy-policy/"
    ]
  }
}]]);
function safeText(text) {
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,' ')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('@','＠');
}
function cardComment(site, data) {
  const {items,cardId,recipient}=site;
  if(!data || Object.keys(data).some(k=>!['review','id','company','checkOnly'].includes(k)) ||
     data.company!=='' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(data.id)) throw Error('Invalid submission');
  const r=data.review;
  if(!r || typeof r.name!=='string' || !r.name.trim() || r.name.length>100 ||
     !['changes_requested','ready_for_verification'].includes(r.outcome) || r.confirmed!==true ||
     !Array.isArray(r.checks) || r.checks.length!==Object.keys(items).length || !Object.keys(items).every(id=>r.checks.includes(id)) ||
     !Array.isArray(r.feedback) || r.feedback.length>50 || !r.feedback.every(note=>
       note && (note.itemId==='general'||Object.hasOwn(items,note.itemId)) && typeof note.text==='string' && note.text.trim() && note.text.length<=4000)) throw Error('Invalid review');
  const lines=[site.name+' website review','Preview: '+site.origin,'Submission reference: '+data.id,'Anonymous submission; name supplied: '+safeText(r.name.trim()),
    'Outcome: '+(r.outcome==='changes_requested'?'Changes requested':'Ready for Aptly verification'),'Reviewed pages:',...Object.entries(items).map(([id,title])=>title+' — '+site.paths[id].join(', '))];
  for(const note of r.feedback) lines.push((items[note.itemId]||'General feedback')+' — '+safeText(note.text.trim()));
  const content=lines.join('\n');
  if(content.length>18000)throw Error('Feedback exceeds the comment size limit');
  return {cardId,content,mentions:[recipient]};
}

const inFlight = new Set();
const recent = new Map();
const reply = (status, body) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});

// writer is an internal adapter. It must verify a persisted receipt on the fixed card,
// and return only the receipt to the anonymous client.
export async function handleCardReview(request, writer, deploymentSiteId) {
  const site=sites.get(deploymentSiteId);
  if(!site)return reply(404,{message:'Unavailable.'});
  const {origin,boardId,cardId,recipient}=site;
  const url=new URL(request.url);
  if(url.origin!==origin || url.pathname!=='/api/website-review/feedback' || url.search || request.method!=='POST')return reply(404,{message:'Unavailable.'});
  if(request.headers.get('Origin')!==origin)return reply(403,{message:'Use the website review panel.'});
  if(!writer)return reply(503,{message:'Final submission is temporarily unavailable.'});
  if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return reply(415,{message:'JSON required.'});
  const ip=request.headers.get('CF-Connecting-IP');
  if(!ip || !request.body)return reply(400,{message:'Invalid request.'});
  const now=Date.now();
  for(const [key,window] of recent)if(window.until<=now)recent.delete(key);
  const window=recent.get(ip)||{count:0,until:now+600000};
  if(window.count>=6 || recent.size>=4096)return reply(429,{message:'Please wait before trying again.'});
  window.count++;recent.set(ip,window);
  const reader=request.body.getReader(), chunks=[];let size=0;
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>96000){await reader.cancel();return reply(413,{message:'Feedback is too long.'});}chunks.push(value);}
  let data,comment;
  try{data=JSON.parse(await new Blob(chunks).text());comment=cardComment(site,data);}catch{return reply(400,{message:'Invalid review.'});}
  if(inFlight.has(data.id))return reply(409,{message:'Submission is being checked.'});
  inFlight.add(data.id);
  try{
    const result=await writer.appendAndVerify({boardId,comment,reference:data.id,checkOnly:data.checkOnly===true});
    if(result?.cardId!==cardId || result.reference!==data.id || !result.commentId)return reply(503,{message:'Receipt could not be verified.'});
    return reply(202,{receipt:data.id});
  }catch{return reply(503,{message:'Receipt could not be verified.'});}
  finally{inFlight.delete(data.id);}
}
