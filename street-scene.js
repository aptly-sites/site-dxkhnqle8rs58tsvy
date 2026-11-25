// A deterministic perspective street. One 7.2 m module repeats every 15 s.
// Scene coordinates wrap; the camera's forward velocity never reverses.
export const PERIOD=15, BLOCK=7.2;
export function phaseAt(seconds){return ((seconds%PERIOD)+PERIOD)%PERIOD/PERIOD*BLOCK}
export function relativeZ(z,seconds){return ((z-phaseAt(seconds))%BLOCK+BLOCK)%BLOCK}
export function createStreetScene(canvas,{onFrame=()=>{},finish="watercolor",assetImages}={}){
 const ctx=canvas.getContext('2d');let width=1,height=1,elapsed=0,last=null,running=false,frame=0,samples=0,sampleAt=null;
 const yaw=.42,cs=Math.cos(yaw),sn=Math.sin(yaw);let faces=[];
 const studyPalette={wall:'#d9d8d1',trim:'#faf9f4',roof:'#9eaaa9',glass:'#87969a',door:'#8c9895',grass:'#c9cec0',tree:'#b4bfa9',bark:'#9c9c90'};
 const painted=finish==='watercolor';
 const palette=painted?{wall:'#cad8dc',trim:'#fffaf0',roof:'#7e939e',glass:'#788b8c',door:'#6b7f7a',grass:'#c0c59a',tree:'#9caa74',bark:'#8b8066'}:studyPalette;
 const images=assetImages?{...assetImages}:{};
 if(painted&&!assetImages&&typeof Image!=='undefined')for(const name of ['siding','canopy','facade']){const image=new Image();image.onload=()=>{images[name]=image;render()};image.src=new URL(`./assets/watercolor/${name}.render.png`,import.meta.url).href}
 const color=(s)=>s;
 // Each material is projected from world geometry, so its brushwork travels with the house.
 function texturedQuad(world,image){
  if(world[0][0]===world[1][0]&&world[0][2]===world[1][2])world=[world[1],world[2],world[3],world[0]];
  if(!image||world.length!==4||world.some(p=>view(p,phaseAt(elapsed))[2]<.6))return;
  const verts=world.map(p=>project(view(p,phaseAt(elapsed))));
  const minX=Math.min(...verts.map(p=>p[0])),maxX=Math.max(...verts.map(p=>p[0]));
  if(maxX<0||minX>width||maxX-minX<25)return;
  const n=maxX-minX>300?4:2;
  const point=(u,v)=>world[0].map((_,j)=>(1-u)*(1-v)*world[0][j]+u*(1-v)*world[1][j]+u*v*world[2][j]+(1-u)*v*world[3][j]);
  function triangle(uv){const d=uv.map(([u,v])=>project(view(point(u,v),phaseAt(elapsed))));const src=uv.map(([u,v])=>[u*image.width,v*image.height]);const [[x0,y0],[x1,y1],[x2,y2]]=src;const det=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);if(Math.abs(det)<.001)return;
   const affine=axis=>[(d[0][axis]*(y1-y2)+d[1][axis]*(y2-y0)+d[2][axis]*(y0-y1))/det,(d[0][axis]*(x2-x1)+d[1][axis]*(x0-x2)+d[2][axis]*(x1-x0))/det,(d[0][axis]*(x1*y2-x2*y1)+d[1][axis]*(x2*y0-x0*y2)+d[2][axis]*(x0*y1-x1*y0))/det];
   const a=affine(0),b=affine(1);ctx.save();ctx.beginPath();d.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.transform(a[0],b[0],a[1],b[1],a[2],b[2]);ctx.drawImage(image,0,0);ctx.restore();
  }
  ctx.save();ctx.globalAlpha=image===images.facade?.95:.55;ctx.globalCompositeOperation=image===images.facade?'source-over':'multiply';
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=x/n,v=y/n,U=(x+1)/n,V=(y+1)/n;triangle([[u,v],[U,v],[U,V]]);triangle([[u,v],[U,V],[u,V]])}ctx.restore();
 }

 function view(p,phase){const z=p[2]-phase,x=p[0]+2.8;return [cs*x-sn*z,p[1]-1.65,sn*x+cs*z]}
 function project(p){const f=Math.min(width*.57,height*.9);return [width*.40+f*p[0]/p[2],height*.43-f*p[1]/p[2]]}
 function polygon(points,fill,stroke='#787f791d'){
  const vs=points.map(p=>view(p,phaseAt(elapsed)));let clipped=[];
  for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];if(a[2]>=.35)clipped.push(a);if((a[2]>=.35)!==(b[2]>=.35)){const t=(.35-a[2])/(b[2]-a[2]);clipped.push(a.map((v,j)=>v+(b[j]-v)*t))}}
  if(clipped.length<3)return;const depth=vs.reduce((n,v)=>n+v[2],0)/vs.length;
  if(depth>105)return;faces.push({points:clipped.map(project),fill,stroke,depth,world:points,material:painted&&(fill===palette.wall||fill==='#d4dfe0'||fill===palette.roof||fill==='#9eafb4')});
 }
 function box(x,y,z,w,h,d,fill,trim=fill){
  polygon([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],fill);
  polygon([[x,y,z+d],[x,y+h,z+d],[x+w,y+h,z+d],[x+w,y,z+d]],fill);
  polygon([[x,y,z],[x,y+h,z],[x,y+h,z+d],[x,y,z+d]],trim);
  polygon([[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z]],fill);
  polygon([[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]],fill);
 }
 function facade(x,y,z,w,h,fill){polygon([[x,y,z],[x,y+h,z],[x,y+h,z+w],[x,y,z+w]],fill)}
 function windowAt(z,y){facade(3.085,y,z,.78,1.14,palette.trim);facade(3.07,y+.08,z+.08,.62,.98,palette.glass);facade(3.055,y+.08,z+.365,.045,.98,palette.trim);facade(3.05,y+.53,z+.08,.62,.035,palette.trim)}
 function house(z){
  box(3.1,.18,z-2.7,4.9,3.55,5.4,palette.wall,painted?'#d4dfe0':painted?'#d4c3a5':'#e2e1db');
  // Front-facing gable; roof ridge follows the depth of the cottage.
  polygon([[2.94,3.73,z-2.88],[2.94,5.2,z],[2.94,3.73,z+2.88]],painted?'#d4c3a5':'#e2e1db');
  polygon([[2.94,5.2,z],[8.2,5.2,z],[8.2,3.73,z-2.88],[2.94,3.73,z-2.88]],palette.roof);
  polygon([[2.94,3.73,z+2.88],[8.2,3.73,z+2.88],[8.2,5.2,z],[2.94,5.2,z]],painted?'#9eafb4':'#afb8b6');
  facade(2.92,3.7,z-2.82,5.64,.1,palette.trim);
  if(painted){for(let y=.5;y<3.6;y+=.16)facade(3.087,y,z-2.68,5.36,.008,'#9eafb044');}
  if(!painted||!images.facade){windowAt(z-1.95,1.55);windowAt(z+1.15,1.55);}windowAt(z-.38,3.8);
  if(!painted||!images.facade){facade(3.06,.2,z-.49,1,2.18,palette.trim);facade(3.04,.23,z-.41,.84,2.06,palette.door);}
  // Porch platform, its own roof, columns, rail and balusters.
  box(1.9,.12,z-2.7,1.2,.22,5.4,painted?'#e0d8c6':'#dfded7');
  polygon([[1.75,2.95,z-2.9],[3.2,3.24,z-2.9],[3.2,3.24,z+2.9],[1.75,2.95,z+2.9]],painted?'#8c9fa4':'#adb5b2');
  box(1.77,2.84,z-2.88,.13,.12,5.76,palette.trim);
  for(const dz of [-2.55,-.7,.7,2.55])box(1.91,.34,z+dz,.11,2.53,.11,palette.trim);
  for(const [a,b] of [[-2.5,-.73],[.8,2.6]]){box(1.9,1.1,z+a,.1,.075,b-a,palette.trim);for(let dz=a+.13;dz<b;dz+=.19)box(1.93,.4,z+dz,.035,.7,.035,palette.trim)}
  box(1.55,.05,z-.65,.35,.10,1.3,painted?'#e0d8c6':'#dfded7');
 }
 function shrub(x,z){
  if(!painted||!images.canopy)return;const v=view([x,.42,z],phaseAt(elapsed));if(v[2]<.6||v[2]>105)return;const [px,py]=project(v),f=Math.min(width*.57,height*.9),w=1.1*f/v[2],h=.76*f/v[2];faces.push({sprite:images.canopy,rect:[px-w/2,py-h/2,w,h],depth:v[2],fill:palette.tree,stroke:'none'});
 }
 function tree(z){
  box(1.2,0,z,.13,3.45,.13,palette.bark);
  if(painted&&images.canopy){const v=view([1.4,4.2,z],phaseAt(elapsed));if(v[2]>.6&&v[2]<105){const [x,y]=project(v),f=Math.min(width*.57,height*.9),w=4.4*f/v[2],h=w*images.canopy.height/images.canopy.width;faces.push({sprite:images.canopy,rect:[x-w/2,y-h/2,w,h],depth:v[2],fill:palette.tree,stroke:'none'});}return;}
  // Fixed billboards keep their form; near trees naturally occlude distant ones.
  const blobs=[[-.75,3.9,.65],[-.25,4.5,.85],[.5,4.5,.9],[1,4,.9],[.2,3.8,1]];
  for(const [x,y,r] of blobs){const p=view([1.2+x,y,z],phaseAt(elapsed));if(p[2]<.6||p[2]>105)continue;const xy=project(p),f=Math.min(width*.57,height*.9);faces.push({circle:[...xy,r*f/p[2]],depth:p[2],fill:palette.tree,stroke:'none'})}
 }
 function lamp(z){box(.77,0,z,.055,2.65,.055,painted?'#5c6865':'#929b98');box(.66,2.63,z-.1,.27,.36,.25,painted?'#e2d4a5':'#a4afaa');box(.62,3,z-.14,.34,.06,.33,painted?'#5c6865':'#929b98')}
 function render(seconds=elapsed){elapsed=seconds;faces=[];ctx.clearRect(0,0,width,height);const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,painted?'#eee9d8':'#e9eae4');sky.addColorStop(.6,'#faf5e8');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  polygon([[-45,0,-20],[-45,0,130],[35,0,130],[35,0,-20]],painted?'#d8d8b8':'#dedfd6');
  polygon([[-35,.001,-20],[-35,.001,130],[-.35,.001,130],[-.35,.001,-20]],painted?'#d8d9cd':'#cdd0ca');
  polygon([[-.35,.015,-20],[-.35,.015,130],[1.8,.015,130],[1.8,.015,-20]],painted?'#ede4ce':'#eeece4');
  // Draw a full extra module at either end; all entering/exiting geometry is outside view.
  for(let k=-4;k<=19;k++){const z=k*BLOCK;if(painted){for(let j=0;j<7;j++){const zz=z+j*.83;const x=.15+Math.sin(j*3.7)*.55;polygon([[x-.34,.022,zz],[x+.26,.022,zz-.25],[x+.52,.022,zz+.1],[x+.2,.022,zz+.42],[x-.25,.022,zz+.3]],'#78845a12');}}house(z);tree(z+3.32);lamp(z-1.2);if(painted){shrub(2.65,z-1.8);shrub(2.65,z+1.8);}
   for(let j=0;j<12;j++){const zz=z+j*.6;polygon([[-.35,.019,zz],[1.8,.019,zz],[1.8,.019,zz+.012],[-.35,.019,zz+.012]],painted?'#c8bfa9':'#c6c7bf')}
   polygon([[1.9,.03,z-2.6],[3.1,.03,z-2.6],[3.1,.03,z+2.6],[1.9,.03,z+2.6]],palette.grass);
  }
  faces.sort((a,b)=>b.depth-a.depth);
  for(const f of faces){
   const fog=Math.max(0,Math.min(1,(f.depth-18)/65));
   if(f.sprite){ctx.save();ctx.globalAlpha=1-fog;ctx.drawImage(f.sprite,...f.rect);ctx.restore();continue;}
   ctx.beginPath();if(f.circle){const [x,y,r]=f.circle;ctx.arc(x,y,r,0,Math.PI*2)}else{f.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}
   ctx.fillStyle=color(f.fill);ctx.fill();if(f.stroke!=='none'){ctx.strokeStyle=f.stroke;ctx.lineWidth=painted?.45:.7;ctx.stroke()}
   if(f.material)texturedQuad(f.world,f.fill==='#d4dfe0'&&images.facade?images.facade:images.siding);
   if(fog){ctx.beginPath();if(f.circle){const [x,y,r]=f.circle;ctx.arc(x,y,r,0,Math.PI*2)}else{f.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}ctx.fillStyle=`rgba(250,245,232,${fog})`;ctx.fill()}
  }
  onFrame({seconds:elapsed,phase:phaseAt(elapsed),period:PERIOD,speed:BLOCK/PERIOD});
 }
 function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);render()}
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 function tick(now){if(!running)return;if(sampleAt===null)sampleAt=now;samples++;if(now-sampleAt>=1000){if(canvas.dataset)canvas.dataset.fps=(samples*1000/(now-sampleAt)).toFixed(1);samples=0;sampleAt=now;}if(last!==null)elapsed+=(now-last)/1000;last=now;render();frame=requestAnimationFrame(tick)}
 return {render,play(){if(running)return;running=true;last=null;frame=requestAnimationFrame(tick)},pause(){running=false;last=null;cancelAnimationFrame(frame)},destroy(){this.pause();observer.disconnect()},get time(){return elapsed},get playing(){return running}};
}
