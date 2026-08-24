/* 校验 jc-map-data.js 里每个项目的坐标是否真的落在其声明的区县多边形内。
   用法：node prototype/tools/check_geo.js */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

global.window = {};
require(path.join(root, 'assets/geo/liuzhou-geo.js'));
require(path.join(root, 'assets/js/jc-map-data.js'));

const geo = global.window.SC_GEO_LIUZHOU;
const D = global.window.JCDATA;

function inRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inFeature(pt, f) {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  return polys.some(poly => inRing(pt, poly[0]) && !poly.slice(1).some(h => inRing(pt, h)));
}
function locate(pt) {
  const hit = geo.features.filter(f => inFeature(pt, f));
  return hit.map(f => f.properties.name);
}

let bad = 0;
D.projects.forEach(p => {
  const names = locate([p.lng, p.lat]);
  const ok = names.includes(p.qx);
  if (!ok) { bad++; console.log(`MISMATCH  ${p.n}  声明 ${p.qx}  实际 ${names.join('/') || '市域外'}  (${p.lng},${p.lat})`); }
});
console.log(`\n项目总数 ${D.projects.length}，落点与区县不符 ${bad} 个`);

const byQx = {};
D.projects.forEach(p => { byQx[p.qx] = (byQx[p.qx] || 0) + 1; });
console.log('各区县项目数:', JSON.stringify(byQx, null, 0));
