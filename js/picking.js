// Ray / triangle intersection (Möller–Trumbore) in world coordinates.
// Triangles use the actual rendered mesh, not nearest grid-node approximations.
const EPS = 1e-8;
function dot(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function sub(a,b) { return [a[0]-b[0],a[1]-b[1],a[2]-b[2]]; }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function normalize(a) { const n=Math.hypot(...a); if(n<EPS) throw new Error('Invalid picking ray'); return a.map(x=>x/n); }
export function intersectRayTriangle(origin,direction,a,b,c) {
  const e1=sub(b,a),e2=sub(c,a),p=cross(direction,e2),det=dot(e1,p);
  if(Math.abs(det)<EPS) return null;
  const inv=1/det,tvec=sub(origin,a),u=dot(tvec,p)*inv;
  if(u<-EPS||u>1+EPS) return null;
  const q=cross(tvec,e1),v=dot(direction,q)*inv;
  if(v<-EPS||u+v>1+EPS) return null;
  const t=dot(e2,q)*inv;
  if(t<=EPS) return null;
  return {distance:t, barycentric:[1-u-v,u,v]};
}
export function pickMesh(origin,direction,mesh) {
  if (!mesh?.vertices || !mesh?.indices) return null;
  const {vertices,indices}=mesh;
  let closest=null;
  const v=i=>[vertices[3*i],vertices[3*i+1],vertices[3*i+2]];
  for(let k=0;k<indices.length;k+=3) {
    const ids=[indices[k],indices[k+1],indices[k+2]];
    const a=v(ids[0]),b=v(ids[1]),c=v(ids[2]);
    const hit=intersectRayTriangle(origin,direction,a,b,c);
    if(hit && (!closest || hit.distance<closest.distance)) {
      const point=origin.map((x,i)=>x+hit.distance*direction[i]);
      closest={...hit,point,triangleIndex:k/3};
    }
  }
  return closest;
}
// Inverse view-projection transforms NDC coordinates to world space.
export function rayFromNDC(ndcX,ndcY,inverseViewProjection) {
  function unproject(z) {
    const m=inverseViewProjection,x=ndcX,y=ndcY;
    const w=m[3]*x+m[7]*y+m[11]*z+m[15];
    if(Math.abs(w)<EPS) throw new Error('Cannot unproject near-zero w');
    return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,
      (m[1]*x+m[5]*y+m[9]*z+m[13])/w,
      (m[2]*x+m[6]*y+m[10]*z+m[14])/w];
  }
  const origin=unproject(-1),far=unproject(1);
  return {origin,direction:normalize(sub(far,origin))};
}
export function surfacePointValues(point,info) {
  if(!info || !point || !point.every(Number.isFinite)) return null;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const strike=info.minStrike+(point[0]/4+.5)*(info.maxStrike-info.minStrike);
  const expiration=info.minExpiration+(point[2]/4+.5)*(info.maxExpiration-info.minExpiration);
  const iv=info.maxIV===info.minIV?info.minIV:info.minIV+(point[1]/1.5)*(info.maxIV-info.minIV);
  return {strike:clamp(strike,info.minStrike,info.maxStrike),
    expiration:clamp(expiration,info.minExpiration,info.maxExpiration),
    iv:clamp(iv,info.minIV,info.maxIV)};
}
