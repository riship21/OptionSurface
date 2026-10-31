import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSurfaceMesh } from '../js/surface-mesh.js';
import { validateVolatilityData } from '../js/volatility-data.js';
const sample={strikes:[80,90,100,110,120],expirations:[30,60,90,120,180],volatility:[[.39,.37,.35,.34,.33],[.31,.29,.28,.27,.27],[.24,.23,.22,.22,.23],[.28,.27,.26,.26,.27],[.35,.33,.32,.32,.33]]};
test('high-resolution mesh has correct topology and upward normals',()=>{
 const m=buildSurfaceMesh(sample);assert.equal(m.vertices.length/3,441);assert.equal(m.indices.length/3,800);
 assert.equal(m.ivValues.length,441);assert.ok(m.normals.every(Number.isFinite));
 for(let i=0;i<m.normals.length;i+=3){assert.ok(m.normals[i+1]>0);assert.ok(Math.abs(Math.hypot(...m.normals.slice(i,i+3))-1)<1e-5)}
});
test('original observed values reproduced at grid nodes',()=>{
 const m=buildSurfaceMesh(sample);for(let r=0;r<5;r++)for(let c=0;c<5;c++){
 const i=(r*5)*21+(c*5);assert.ok(Math.abs(m.ivValues[i]-(sample.volatility[r][c]-.22)/(.39-.22))<1e-5);
 }
});
test('constant IV data stays finite',()=>{const m=buildSurfaceMesh({strikes:[90,110],expirations:[30,90],volatility:[[.25,.25],[.25,.25]]});assert.ok(m.vertices.every(Number.isFinite));assert.ok(m.ivValues.every(x=>x===.5))});
test('bad grid shapes and ordering rejected',()=>{assert.throws(()=>validateVolatilityData({...sample,strikes:[90,80]}));assert.throws(()=>validateVolatilityData({...sample,volatility:[[.2]]}));assert.throws(()=>buildSurfaceMesh(sample,0));});
