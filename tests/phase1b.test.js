import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DATASETS, findDataset } from '../js/dataset-catalog.js';
import { validateVolatilityData } from '../js/volatility-data.js';
import { buildSurfaceMesh } from '../js/surface-mesh.js';
import { GPUResources } from '../js/gpu-resources.js';

test('all dataset definitions load and generate well-formed meshes', () => {
  for (const item of DATASETS) {
    const data = JSON.parse(readFileSync(new URL(`../${item.path}`, import.meta.url), 'utf8'));
    validateVolatilityData(data);
    const mesh = buildSurfaceMesh(data);
    assert.equal(mesh.vertices.length/3, 441);
    assert.equal(mesh.indices.length/3, 800);
    assert.ok(mesh.vertices.every(Number.isFinite));
    assert.ok(mesh.normals.every(Number.isFinite));
    assert.ok(mesh.ivValues.every(Number.isFinite));
  }
});
test('dataset catalog rejects unknown identifiers', () => {
  assert.throws(() => findDataset('not-there'), /Unknown dataset/);
});
test('GPU resource tracker deletes each buffer and VAO once', () => {
  const deleted = [];
  let serial = 0;
  const gl = {
    ARRAY_BUFFER: 1, ELEMENT_ARRAY_BUFFER: 2,
    createBuffer: () => `buffer-${++serial}`,
    createVertexArray: () => `vao-${++serial}`,
    bindVertexArray: () => {}, bindBuffer: () => {},
    deleteBuffer: x => deleted.push(x),
    deleteVertexArray: x => deleted.push(x)
  };
  const resources = new GPUResources(gl);
  const b1 = resources.createBuffer(), b2=resources.createBuffer(), vao=resources.createVertexArray();
  resources.dispose(); resources.dispose();
  assert.deepEqual(new Set(deleted), new Set([b1,b2,vao]));
  assert.equal(deleted.length,3);
});
