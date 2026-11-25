// Same-origin relay only. Review data is stored by Website Studio, never here.
const STUDIO='https://website-studio-unified.getaptly-8093.chatgpt.site';
export const PROJECT = '3971c004018e4052a04312c7bc77c844';
const ORIGIN='https://site-dxkhnqle8rs58tsvy.pages.dev';
const fail=(error,status)=>Response.json({message:error},{status,headers:{'Cache-Control':'no-store'}});
export async function onRequest({request,env}){
 const url=new URL(request.url);
 if(url.origin!==ORIGIN)return fail('Review origin mismatch.',403);
 if(url.pathname==='/api/website-review/feedback' && request.method==='OPTIONS' && request.headers.get('Origin')===ORIGIN)
   return new Response(null,{status:env.WEBSITE_REVIEW_ENABLED==='true'?204:503,headers:{'Cache-Control':'no-store'}});
 if(url.pathname!=='/api/website-review/feedback'||request.method!=='POST'||url.search)return fail('Review route not found.',404);
 if(request.method==='POST'&&request.headers.get('Origin')!==ORIGIN)return fail('Same-origin request required.',403);
 if(env.WEBSITE_REVIEW_ENABLED!=='true'||!env.STUDIO_REVIEW_SERVICE_TOKEN)return fail('Private review access is not enabled.',503);
 // Never forward visitor identity, arbitrary headers, destinations or Studio credentials.
 const headers=new Headers({'OAI-Sites-Authorization':'Bearer '+env.STUDIO_REVIEW_SERVICE_TOKEN,'X-Website-Review-Project':PROJECT,'Origin':ORIGIN});
 const ip=request.headers.get('CF-Connecting-IP');
 if(!ip)return fail('Feedback connection unavailable.',503);
 headers.set('CF-Connecting-IP',ip);
 let body;
 if(request.method==='POST'){
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return fail('JSON required.',415);
  const reader=request.body?.getReader();if(!reader)return fail('Request body required.',400);
  const chunks=[];let size=0;try{for(;;){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>256000)return fail('Review request is too large.',413);chunks.push(r.value)}}finally{await reader.cancel().catch(()=>{})}
  body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}headers.set('Content-Type','application/json');
 }
 try{
  let upstream;
  upstream=await fetch(STUDIO+url.pathname,{method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(upstream.status>=300&&upstream.status<400||!upstream.headers.get('Content-Type')?.includes('application/json'))return fail('Website Studio review connection is unavailable.',503);
  const result=await upstream.json();
  if(upstream.status===202 && /^[a-f0-9-]{36}$/.test(result.receipt))return Response.json({receipt:result.receipt},{status:202,headers:{'Cache-Control':'no-store'}});
  return Response.json({message:typeof result.message==='string'?result.message:'Studio could not confirm receipt.'},{status:upstream.ok?503:upstream.status,headers:{'Cache-Control':'no-store'}});
 }catch{return fail('Website Studio is temporarily unavailable.',503)}
}
