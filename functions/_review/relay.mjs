import {handleCardReview} from './card-intake.mjs';

const deployment = 'site-dxkhnqle8rs58tsvy';
const sourceAuthor = 'jNc4wKZYTA9FBbEje';

export function onRequest({request,env}) {
  const key = env.ALL3_ONBOARDING_COMMENT_KEY?.trim();
  return handleCardReview(request,key ? cardWriter(key) : null,deployment);
}

function cardWriter(key) {
  return {async appendAndVerify({boardId,comment,reference,checkOnly}) {
    const base='https://core-api.getaptly.com/api/board/'+boardId+'/'+comment.cardId;
    const headers={'x-token':key,'Content-Type':'application/json'};
    async function comments(){
      const response=await fetch(base+'/comments',{headers,redirect:'manual'}).catch(()=>{throw Object.assign(Error(),{stage:'card-read-network',status:502});});
      if(!response.ok)throw Object.assign(Error('Readback unavailable'),{stage:'card-read',status:response.status});
      const {data}=await response.json().catch(()=>({}));
      if(!Array.isArray(data))throw Object.assign(Error(),{stage:'card-read-format',status:502});
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
    if(checkOnly)throw Object.assign(Error(),{stage:'receipt-not-found',status:404});
    if(rows.filter(r=>r.content?.startsWith('All 3 Realty website review\n') && Date.parse(r.createdAt)>Date.now()-600000).length>=30)throw Error('Too many submissions');
    const response=await fetch(base+'/comment',{method:'POST',headers,redirect:'manual',
      body:JSON.stringify({userId:sourceAuthor,content:comment.content})}).catch(()=>{throw Object.assign(Error(),{stage:'card-append-network',status:502});});
    if(!response.ok)throw Object.assign(Error('Write not confirmed'),{stage:'card-append',status:response.status});
    return receipt(await comments());
  }};
}
