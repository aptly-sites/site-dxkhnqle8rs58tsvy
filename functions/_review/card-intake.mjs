// Prepared adapter contract. No public route until the card-scoped writer is verified.
const recipient = 'jNc4wKZYTA9FBbEje';
const cardId = '07da266b26004c798acc4658ef406c6a';
export const boardId = 'NNixbbHgtc2ubfnDy';
const origin = 'https://site-dxkhnqle8rs58tsvy.pages.dev';
const items = {brand:'Homepage and navigation', owners:'Owner services', rentals:'Rental search', criteria:'Application criteria', residents:'Resident resources', regions:'Service areas', team:'Team and contact details', policies:'Privacy policy'};
function safeText(text) {
  return text.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g,' ')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('@','＠');
}
export function cardComment(requestOrigin, data) {
  if(requestOrigin!==origin || !data || Object.keys(data).some(k=>!['review','id','company'].includes(k)) ||
     data.company!=='' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(data.id)) throw Error('Invalid submission');
  const r=data.review;
  if(!r || typeof r.name!=='string' || !r.name.trim() || r.name.length>100 ||
     !['changes_requested','ready_for_verification'].includes(r.outcome) || r.confirmed!==true ||
     !Array.isArray(r.checks) || r.checks.length!==8 || !Object.keys(items).every(id=>r.checks.includes(id)) ||
     !Array.isArray(r.feedback) || r.feedback.length>50 || !r.feedback.every(note=>
       note && (note.itemId==='general'||Object.hasOwn(items,note.itemId)) && typeof note.text==='string' && note.text.trim() && note.text.length<=4000)) throw Error('Invalid review');
  const lines=['All 3 Realty website review','Submission reference: '+data.id,'Anonymous submission; name supplied: '+safeText(r.name.trim()),
    'Outcome: '+(r.outcome==='changes_requested'?'Changes requested':'Ready for Aptly verification'),'Reviewed: '+Object.values(items).join(', ')];
  for(const note of r.feedback) lines.push((items[note.itemId]||'General feedback')+' — '+safeText(note.text.trim()));
  const content=lines.join('\n');
  if(content.length>18000)throw Error('Feedback exceeds the comment size limit');
  return {cardId,content,mentions:[recipient]};
}
