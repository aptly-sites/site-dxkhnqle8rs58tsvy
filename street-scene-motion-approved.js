// A deterministic perspective street. One 7.2 m module repeats every 15 s.
// Scene coordinates wrap; the camera's forward velocity never reverses.
export const PERIOD=15, BLOCK=7.2;
export function phaseAt(seconds){return ((seconds%PERIOD)+PERIOD)%PERIOD/PERIOD*BLOCK}
export function relativeZ(z,seconds){return ((z-phaseAt(seconds))%BLOCK+BLOCK)%BLOCK}
export function createStreetScene(canvas,{onFrame=()=>{}}={}){
 const ctx=canvas.getContext('2d');let width=1,height=1,elapsed=0,last=null,running=false,frame=0;
 const yaw=.42,cs=Math.cos(yaw),sn=Math.sin(yaw);let faces=[];
 const palette={wall:'#d9d8d1',trim:'#faf9f4',roof:'#9eaaa9',glass:'#87969a',door:'#8c9895',grass:'#c9cec0',tree:'#b4bfa9',bark:'#9c9c90'};
 const color=(s)=>s;
 function view(p,phase){const z=p[2]-phase,x=p[0]+2.8;return [cs*x-sn*z,p[1]-1.65,sn*x+cs*z]}
 function project(p){const f=Math.min(width*.57,height*.9);return [width*.40+f*p[0]/p[2],height*.43-f*p[1]/p[2]]}
 function polygon(points,fill,stroke='#787f791d'){
  const vs=points.map(p=>view(p,phaseAt(elapsed)));let clipped=[];
  for(let i=0;i<vs.length;i++){const a=vs[i],b=vs[(i+1)%vs.length];if(a[2]>=.35)clipped.push(a);if((a[2]>=.35)!==(b[2]>=.35)){const t=(.35-a[2])/(b[2]-a[2]);clipped.push(a.map((v,j)=>v+(b[j]-v)*t))}}
  if(clipped.length<3)return;const depth=vs.reduce((n,v)=>n+v[2],0)/vs.length;
  if(depth>105)return;faces.push({points:clipped.map(project),fill,stroke,depth});
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
  box(3.1,.18,z-2.7,4.9,3.55,5.4,palette.wall,'#e2e1db');
  // Front-facing gable; roof ridge follows the depth of the cottage.
  polygon([[2.94,3.73,z-2.88],[2.94,5.2,z],[2.94,3.73,z+2.88]],'#e2e1db');
  polygon([[2.94,5.2,z],[8.2,5.2,z],[8.2,3.73,z-2.88],[2.94,3.73,z-2.88]],palette.roof);
  polygon([[2.94,3.73,z+2.88],[8.2,3.73,z+2.88],[8.2,5.2,z],[2.94,5.2,z]],'#afb8b6');
  facade(2.92,3.7,z-2.82,5.64,.1,palette.trim);
  windowAt(z-1.95,1.55);windowAt(z+1.15,1.55);windowAt(z-.38,3.8);
  facade(3.06,.2,z-.49,1,2.18,palette.trim);facade(3.04,.23,z-.41,.84,2.06,palette.door);
  // Porch platform, its own roof, columns, rail and balusters.
  box(1.9,.12,z-2.7,1.2,.22,5.4,'#dfded7');
  polygon([[1.75,2.95,z-2.9],[3.2,3.24,z-2.9],[3.2,3.24,z+2.9],[1.75,2.95,z+2.9]],'#adb5b2');
  box(1.77,2.84,z-2.88,.13,.12,5.76,palette.trim);
  for(const dz of [-2.55,-.7,.7,2.55])box(1.91,.34,z+dz,.11,2.53,.11,palette.trim);
  for(const [a,b] of [[-2.5,-.73],[.8,2.6]]){box(1.9,1.1,z+a,.1,.075,b-a,palette.trim);for(let dz=a+.13;dz<b;dz+=.19)box(1.93,.4,z+dz,.035,.7,.035,palette.trim)}
  box(1.55,.05,z-.65,.35,.10,1.3,'#dfded7');
 }
 function tree(z){
  box(1.2,0,z,.13,3.45,.13,palette.bark);
  // Fixed billboards keep their form; near trees naturally occlude distant ones.
  const blobs=[[-.75,3.9,.65],[-.25,4.5,.85],[.5,4.5,.9],[1,4,.9],[.2,3.8,1]];
  for(const [x,y,r] of blobs){const p=view([1.2+x,y,z],phaseAt(elapsed));if(p[2]<.6||p[2]>105)continue;const xy=project(p),f=Math.min(width*.57,height*.9);faces.push({circle:[...xy,r*f/p[2]],depth:p[2],fill:palette.tree,stroke:'none'})}
 }
 function lamp(z){box(.77,0,z,.055,2.65,.055,'#929b98');box(.66,2.63,z-.1,.27,.36,.25,'#a4afaa');box(.62,3,z-.14,.34,.06,.33,'#929b98')}
 function render(seconds=elapsed){elapsed=seconds;faces=[];ctx.clearRect(0,0,width,height);const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,'#e9eae4');sky.addColorStop(.6,'#f7f5ed');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
  polygon([[-45,0,-20],[-45,0,130],[35,0,130],[35,0,-20]],'#dedfd6');
  polygon([[-35,.001,-20],[-35,.001,130],[-.35,.001,130],[-.35,.001,-20]],'#cdd0ca');
  polygon([[-.35,.015,-20],[-.35,.015,130],[1.8,.015,130],[1.8,.015,-20]],'#eeece4');
  // Draw a full extra module at either end; all entering/exiting geometry is outside view.
  for(let k=-4;k<=19;k++){const z=k*BLOCK;house(z);tree(z+3.32);lamp(z-1.2);
   for(let j=0;j<12;j++){const zz=z+j*.6;polygon([[-.35,.019,zz],[1.8,.019,zz],[1.8,.019,zz+.012],[-.35,.019,zz+.012]],'#c6c7bf')}
   polygon([[1.9,.03,z-2.6],[3.1,.03,z-2.6],[3.1,.03,z+2.6],[1.9,.03,z+2.6]],palette.grass);
  }
  faces.sort((a,b)=>b.depth-a.depth);
  for(const f of faces){ctx.beginPath();if(f.circle){const [x,y,r]=f.circle;ctx.arc(x,y,r,0,Math.PI*2)}else{f.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}ctx.fillStyle=color(f.fill);ctx.fill();if(f.stroke!=='none'){ctx.strokeStyle=f.stroke;ctx.lineWidth=.7;ctx.stroke()}// Distance haze belongs to space, never a timed fade.
   const fog=Math.max(0,Math.min(1,(f.depth-18)/65));if(fog){ctx.fillStyle=`rgba(247,245,237,${fog})`;ctx.fill()}}
  onFrame({seconds:elapsed,phase:phaseAt(elapsed),period:PERIOD,speed:BLOCK/PERIOD});
 }
 function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);render()}
 const observer=new ResizeObserver(resize);observer.observe(canvas);
 function tick(now){if(!running)return;if(last!==null)elapsed+=(now-last)/1000;last=now;render();frame=requestAnimationFrame(tick)}
 return {render,play(){if(running)return;running=true;last=null;frame=requestAnimationFrame(tick)},pause(){running=false;last=null;cancelAnimationFrame(frame)},destroy(){this.pause();observer.disconnect()},get time(){return elapsed},get playing(){return running}};
}
