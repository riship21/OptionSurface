import test from 'node:test';
import assert from 'node:assert/strict';
import { ShaderProgram } from '../js/shader-program.js';

function mockGL({failCompile=false,failLink=false}={}) {
  let shaderSeq=0, programSeq=0;
  const deletedShaders=[],deletedPrograms=[];
  const gl={
    VERTEX_SHADER:1, FRAGMENT_SHADER:2, COMPILE_STATUS:3, LINK_STATUS:4,
    createShader:()=>({id:++shaderSeq}), shaderSource:()=>{}, compileShader:()=>{},
    getShaderParameter:()=>!failCompile, getShaderInfoLog:()=> 'compile failure',
    deleteShader:s=>deletedShaders.push(s),
    createProgram:()=>({id:++programSeq}), attachShader:()=>{},linkProgram:()=>{},
    getProgramParameter:()=>!failLink,getProgramInfoLog:()=> 'link failure',
    deleteProgram:p=>deletedPrograms.push(p),useProgram:()=>{},
    getAttribLocation:()=>0,getUniformLocation:()=>null
  };
  return {gl,deletedShaders,deletedPrograms};
}
test('linked shaders are deleted and program disposal is idempotent',()=>{
  const m=mockGL(); const shader=new ShaderProgram(m.gl,'vertex','fragment');
  assert.equal(m.deletedShaders.length,2);
  shader.dispose();shader.dispose();
  assert.equal(m.deletedPrograms.length,1);
});
test('compile failure deletes shader and does not leak program',()=>{
  const m=mockGL({failCompile:true});
  assert.throws(()=>new ShaderProgram(m.gl,'bad','fragment'),/compile/);
  assert.equal(m.deletedShaders.length,1);
  assert.equal(m.deletedPrograms.length,0);
});
test('link failure deletes both shaders and program',()=>{
  const m=mockGL({failLink:true});
  assert.throws(()=>new ShaderProgram(m.gl,'vertex','fragment'),/link/);
  assert.equal(m.deletedShaders.length,2);
  assert.equal(m.deletedPrograms.length,1);
});
