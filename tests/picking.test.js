import test from 'node:test';
import assert from 'node:assert/strict';
import {intersectRayTriangle,pickMesh,rayFromNDC,surfacePointValues} from '../js/picking.js';
import {buildSurfaceMesh} from '../js/surface-mesh.js';
const sample={strikes:[80,100,120],expirations:[30,90,180],volatility:[[.4,.3,.28],[.25,.22,.24],[.36,.32,.3]]};
test('ray hits triangle with barycentric coordinates and rejects misses',()=>{
 const hit=intersectRayTriangle([.2,.2,1],[0,0,-1],[0,0,0],[1,0,0],[0,1,0]);
 assert.ok(hit);assert.ok(Math.abs(hit.distance-1)<1e-9);
 assert.ok(Math.abs(hit.barycentric.reduce((a,b)=>a+b,0)-1)<1e-9);
 assert.equal(intersectRayTriangle([2,2,1],[0,0,-1],[0,0,0],[1,0,0],[0,1,0]),null);
});
test('picking rendered mesh returns closest hit; misses return null',()=>{
 const mesh=buildSurfaceMesh(sample);
 const hit=pickMesh([0,3,0],[0,-1,0],mesh);
 assert.ok(hit);assert.ok(Number.isFinite(hit.point[1]));
 assert.equal(pickMesh([10,3,10],[0,-1,0],mesh),null);
});
test('world position maps back to strike, expiration, IV; handles flat IV',()=>{
 const info={minStrike:80,maxStrike:120,minExpiration:30,maxExpiration:180,minIV:.2,maxIV:.4};
 const result=surfacePointValues([0,.75,0],info);
 assert.equal(result.strike,100);assert.equal(result.expiration,105);
 assert.ok(Math.abs(result.iv-.3)<1e-10);
 assert.equal(surfacePointValues([0,.75,0],{...info,minIV:.25,maxIV:.25}).iv,.25);
});
test('unprojection of identity matrix gives centered -Z ray',()=>{
 const eye=rayFromNDC(0,0,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
 assert.deepEqual(eye.origin,[0,0,-1]);assert.deepEqual(eye.direction,[0,0,1]);
});
