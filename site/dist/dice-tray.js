import {dieMeshes,visibleDice} from './dice-geometry.js';

const colors={4:[153,73,111],6:[115,75,151],8:[60,108,141],10:[42,121,103],12:[155,92,60],20:[110,63,159]};
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
const cross=([x,y,z],[u,v,w])=>[y*w-z*v,z*u-x*w,x*v-y*u];
const unit=v=>v.map(n=>n/Math.hypot(...v));
const rotate=([x,y,z],a,b,c)=>{
  const y1=y*Math.cos(a)-z*Math.sin(a), z1=y*Math.sin(a)+z*Math.cos(a);
  const x2=x*Math.cos(b)+z1*Math.sin(b), z2=-x*Math.sin(b)+z1*Math.cos(b);
  return [x2*Math.cos(c)-y1*Math.sin(c),x2*Math.sin(c)+y1*Math.cos(c),z2];
};

export function createDiceTray(canvas) {
  const ctx=canvas.getContext('2d');
  if(!ctx) return {draw(){},roll:async()=>{}};
  let dice=[];
  let progress=1;
  function draw(t=progress) {
    progress=t;
    const {width,height}=canvas.getBoundingClientRect();
    if(!width||!height) return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const w=Math.round(width*ratio), h=Math.round(height*ratio);
    if(canvas.width!==w||canvas.height!==h) {canvas.width=w;canvas.height=h;}
    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.clearRect(0,0,width,height);
    const columns=Math.min(width<420?3:6,dice.length)||1;
    const rows=Math.ceil(dice.length/columns)||1;
    const scale=Math.min(55,width/columns*.37,height/rows*.38);
    dice.forEach(({model,basis,face,sides,percentile,units,spin},index)=>{
      const column=index%columns;
      const row=Math.floor(index/columns);
      const count=Math.min(columns,dice.length-row*columns);
      const settle=1-t;
      const bounce=Math.abs(Math.sin(t*3*Math.PI))*settle*settle*scale*1.75;
      const x=width/2+(column-(count-1)/2)*scale*2.28+spin*settle*scale;
      const y=(row+.52)*height/rows;
      ctx.fillStyle='rgba(10,5,15,.25)';
      ctx.beginPath();
      ctx.ellipse(x,y+scale*.78,scale*.69,scale*.17,0,0,Math.PI*2);
      ctx.fill();
      const transform=vector=>rotate(basis.map(axis=>dot(vector,axis)),.22+settle*8*spin,-.23+settle*11,.12+settle*7*spin);
      const project=([px,py,pz])=>[x+px*scale*(1+pz*.16),y+py*scale*(1+pz*.16)-bounce];
      const points=model.points.map(point=>project(transform(point)));
      const faces=model.faces.map((f,i)=>({...f,i,direction:transform(f.normal),position:transform(f.center)}))
        .filter(f=>f.direction[2]>.075).sort((a,b)=>a.position[2]-b.position[2]);
      for(const f of faces) {
        const light=.73+Math.max(0,dot(f.direction,[-.4,-.44,.75]))*.51;
        ctx.fillStyle='rgb('+(percentile?[165,112,51]:colors[sides]).map(n=>Math.round(n*light)).join(',')+')';
        ctx.strokeStyle='rgba(255,230,185,.56)';
        ctx.lineWidth=1.15;
        ctx.beginPath();
        f.indices.forEach((i,j)=>j?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if(f.direction[2]>.42) {
          const label=percentile?String(f.i*10).padStart(2,'0'):String(units?f.i:f.i+1);
          ctx.fillStyle='#fff5e4';
          ctx.font='700 '+Math.round(scale*(f.i===face&&t===1?.37:.28))+'px system-ui,sans-serif';
          ctx.textAlign='center';
          ctx.textBaseline='middle';
          ctx.fillText(label,...project(f.position));
        }
      }
    });
  }
  new ResizeObserver(()=>draw()).observe(canvas);
  async function roll(sides,results,reduced=false) {
    dice=visibleDice(sides,results).map((data,i)=>{
      const model=dieMeshes[data.sides];
      const normal=model.faces[data.face].normal;
      const horizontal=unit(cross(Math.abs(normal[1])>.9?[1,0,0]:[0,1,0],normal));
      return {...data,model,basis:[horizontal,cross(normal,horizontal),normal],spin:i%2?-.86:1};
    });
    if(reduced) {draw(1);return;}
    await new Promise(resolve=>{
      const start=performance.now();
      const frame=timestamp=>{
        const t=Math.min(1,Math.max(0,(timestamp-start)/1000));
        draw(t);
        if(t<1&&!document.hidden) requestAnimationFrame(frame);
        else {draw(1);resolve();}
      };
      requestAnimationFrame(frame);
    });
  }
  return {draw,roll};
}
