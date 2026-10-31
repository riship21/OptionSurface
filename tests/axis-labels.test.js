import test from 'node:test';
import assert from 'node:assert/strict';
import { axisLabelSpecs, projectWorldPoint } from '../js/axis-labels.js';
const info = { minStrike:80, maxStrike:120, minExpiration:30, maxExpiration:180, minIV:.22, maxIV:.39 };
test('axis ticks cover the correct data extremes and midpoint', () => {
 const labels=axisLabelSpecs(info);
 assert.equal(labels.length,9);
 assert.deepEqual(labels.filter(x=>x.axis==='x').map(x=>x.text),['$80','$100','$120']);
 assert.deepEqual(labels.filter(x=>x.axis==='z').map(x=>x.text),['30d','105d','180d']);
 assert.deepEqual(labels.filter(x=>x.axis==='y').map(x=>x.text),['22.0%','30.5%','39.0%']);
});
test('flat IV shows a single truthful y label', () => {
 const labels=axisLabelSpecs({...info,minIV:.25,maxIV:.25});
 assert.deepEqual(labels.filter(x=>x.axis==='y').map(x=>x.text),['25.0%']);
});
test('projectWorldPoint centers origin and clips unseen points', () => {
 const m=new Float32Array(16);[0,5,10,15].forEach(i=>m[i]=1);
 assert.deepEqual(projectWorldPoint([0,0,0],m,1000,500),{x:500,y:250});
 assert.equal(projectWorldPoint([2,0,0],m,1000,500),null);
 assert.equal(projectWorldPoint([0,0,2],m,1000,500),null);
 assert.equal(projectWorldPoint([0,0,0],m,0,500),null);
});

import { selectVisibleLabels, projectAxisAnnotation } from '../js/axis-labels.js';
test('axis ticks use distinct plot edges', () => {
 const labels=axisLabelSpecs(info);
 assert.ok(labels.filter(x=>x.axis==='x').every(x=>x.point[2] > 2));
 assert.ok(labels.filter(x=>x.axis==='z').every(x=>x.point[0] < -2));
});
test('collision layout preserves priority and rejects overlapping or clipped labels', () => {
 const visible=selectVisibleLabels([
  {index:0,x:40,y:40,width:40,height:20,priority:3},
  {index:1,x:45,y:40,width:40,height:20,priority:1},
  {index:2,x:145,y:40,width:40,height:20,priority:1},
  {index:3,x:195,y:40,width:40,height:20,priority:1}
 ],200,100);
 assert.deepEqual([...visible].sort(),[0,2]);
});

test('out-of-bounds X annotations remain in the bottom margin without hiding', () => {
  const m=new Float32Array(16); [0,5,10,15].forEach(i=>m[i]=1);
  const x=projectAxisAnnotation([0,-1.15,0],m,1000,500,'x');
  const z=projectAxisAnnotation([0,-1.15,0],m,1000,500,'z');
  assert.ok(x && z);
  assert.equal(x.y,482);
  assert.equal(z.y,458);
  assert.equal(projectAxisAnnotation([0,-3,0],m,1000,500,'x'),null);
});
