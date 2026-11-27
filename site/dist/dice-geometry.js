const golden=(1+Math.sqrt(5))/2;
const signs=[-1,1];
const cube=signs.flatMap(x=>signs.flatMap(y=>signs.map(z=>[x,y,z])));
const cycle=([x,y,z])=>[[x,y,z],[y,z,x],[z,x,y]];
const ring=(angle,height)=>[Math.cos(angle),Math.sin(angle),height];
const vertices={
  4:cube.filter(([x,y,z])=>x*y*z===1),
  6:cube,
  8:cycle([1,0,0]).flatMap(point=>signs.map(s=>point.map(n=>s*n))),
  12:[...cube,...signs.flatMap(x=>signs.flatMap(y=>cycle([0,x*golden,y/golden])))],
  20:signs.flatMap(x=>signs.flatMap(y=>cycle([0,x,y*golden])))
};
const dot=(a,b)=>a.reduce((n,value,i)=>n+value*b[i],0);
const sub=(a,b)=>a.map((n,i)=>n-b[i]);
const cross=([x,y,z],[u,v,w])=>[y*w-z*v,z*u-x*w,x*v-y*u];
const unit=v=>v.map(n=>n/Math.hypot(...v));

function mesh(points) {
  const radius=Math.max(...points.map(point=>Math.hypot(...point)));
  points=points.map(point=>point.map(n=>n/radius));
  const faces=new Map();
  const epsilon=.003;
  for(let i=0;i<points.length;i++) for(let j=i+1;j<points.length;j++) for(let k=j+1;k<points.length;k++) {
    let normal=unit(cross(sub(points[j],points[i]),sub(points[k],points[i])));
    if(!Number.isFinite(normal[0])) continue;
    if(dot(normal,points[i])<0) normal=normal.map(n=>-n);
    const distance=dot(normal,points[i]);
    const offsets=points.map(point=>dot(point,normal)-distance);
    if(offsets.some(offset=>offset>epsilon)) continue;
    const indices=offsets.flatMap((offset,index)=>Math.abs(offset)<epsilon?[index]:[]);
    const id=indices.join(',');
    if(faces.has(id)) continue;
    const center=[0,1,2].map(a=>indices.reduce((sum,n)=>sum+points[n][a],0)/indices.length);
    const axis=unit(sub(points[i],center)), side=cross(normal,axis);
    const angle=p=>Math.atan2(dot(sub(points[p],center),side),dot(sub(points[p],center),axis));
    faces.set(id,{indices:indices.sort((a,b)=>angle(a)-angle(b)),normal,center});
  }
  return {points,faces:[...faces.values()]};
}
// A d10 is the dual of a pentagonal antiprism, giving ten kite-shaped faces.
const antiprism=mesh(Array.from({length:10},(_,i)=>ring(i*Math.PI/5,i%2?-.5:.5)));
vertices[10]=antiprism.faces.map(({center,normal})=>normal.map(value=>value/dot(center,normal)));
export const dieMeshes=Object.fromEntries(Object.entries(vertices).map(([sides,points])=>[sides,mesh(points)]));

export function rollDice(sides,count,random=()=>crypto.getRandomValues(new Uint32Array(1))[0]) {
  if(![4,6,8,10,12,20,100].includes(sides)||!Number.isInteger(count)||count<1||count>20) throw new RangeError('Unsupported roll');
  const limit=2**32-(2**32%sides);
  return Array.from({length:count},()=>{
    let value;
    do value=random(); while(value>=limit);
    return value%sides+1;
  });
}

export function visibleDice(sides,results) {
  return results.slice(0,sides===100?3:6).flatMap(value=>sides===100?
    [{sides:10,face:Math.floor((value%100)/10),percentile:true},{sides:10,face:value%10,units:true}]:
    [{sides,face:value-1}]);
}
