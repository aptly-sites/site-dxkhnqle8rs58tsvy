import {handleCardReview} from './card-intake.mjs';

const deployment = 'site-dxkhnqle8rs58tsvy';
const sourceAuthor = 'jNc4wKZYTA9FBbEje';

export function onRequest({request,env}) {
  const key = env.ALL3_ONBOARDING_COMMENT_KEY;
  return handleCardReview(request,key ? cardWriter(key) : null,deployment);
}

function cardWriter(key) {
  return {async appendAndVerify({boardId,comment,reference,checkOnly}) {
    const base='https://core-api.getaptly.com/api/board/'+boardId+'/'+comment.cardId;
    const headers={'x-token':key,'Content-Type':'application/json'};
    async function comments(){
      const response=await fetch(base+'/comments',{headers,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw Object.assign(Error('Readback unavailable'),{stage:'card-read',status:response.status});
      const {data}=await response.json();
      if(!Array.isArray(data))throw Error('Invalid readback');
      return data;
    }
    const marker='Submission reference: '+reference+'\n';
    function receipt(rows){
      const existing=rows.find(row=>row.userId===sourceAuthor && row.content?.includes(marker));
      if(!existing)return null;
      if(existing.content!==comment.content)throw Error('Reference already used');
      return {cardId:comment.cardId,reference,commentId:existing.id};
    }
    const rows=await comments();
    const previous=receipt(rows);
    if(previous)return previous;
    if(checkOnly)throw Error('No matching receipt');
    if(rows.filter(r=>r.content?.startsWith('All 3 Realty website review\n') && Date.parse(r.createdAt)>Date.now()-600000).length>=30)throw Error('Too many submissions');
    const response=await fetch(base+'/comment',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(12000),
      body:JSON.stringify({userId:sourceAuthor,content:comment.content})});
    if(!response.ok)throw Object.assign(Error('Write not confirmed'),{stage:'card-append',status:response.status});
    return receipt(await comments());
  }};
}
