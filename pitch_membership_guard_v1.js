(function (root, factory) {
  let geometryGuard = root && root.CAYPitchGeometryGuard;
  if (typeof module === 'object' && module.exports) {
    try { geometryGuard = require('./pitch_geometry_guard_v1.js'); } catch (e) { geometryGuard = null; }
  }
  const api = factory(geometryGuard);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CAYPitchMembershipGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (geometryGuard) {
  'use strict';

  function finite(n) { return Number.isFinite(Number(n)); }

  function bottomCenterAnchor(box) {
    if (!box || !finite(box.x) || !finite(box.y) || !finite(box.width) || !finite(box.height)) return null;
    const x = Number(box.x), y = Number(box.y), w = Number(box.width), h = Number(box.height);
    if (w <= 0 || h <= 0) return null;
    return { x: x + w / 2, y: y + h };
  }

  function pointOnSegment(p, a, b, eps) {
    const e = eps == null ? 1e-9 : eps;
    const cross = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
    if (Math.abs(cross) > e) return false;
    const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
    if (dot < -e) return false;
    const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    return dot <= len2 + e;
  }

  function pointInPolygon(point, polygon) {
    if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[j], b = polygon[i];
      if (!a || !b || !finite(a.x) || !finite(a.y) || !finite(b.x) || !finite(b.y)) return false;
      if (pointOnSegment(point, a, b)) return true;
      const intersects = ((b.y > point.y) !== (a.y > point.y)) &&
        (point.x < (a.x - b.x) * (point.y - b.y) / ((a.y - b.y) || Number.EPSILON) + b.x);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function canonicalPitchPolygon(pitchPolygon, options) {
    if (!Array.isArray(pitchPolygon) || pitchPolygon.length < 3) {
      return { ok: false, reason: 'PITCH_POLYGON_MISSING', boundary: null };
    }
    if (!geometryGuard || typeof geometryGuard.canonicalizeBoundary !== 'function') {
      return { ok: true, reason: null, boundary: pitchPolygon, geometry: null };
    }
    const geometry = geometryGuard.canonicalizeBoundary(pitchPolygon, options && options.pitchGeometry);
    if (!geometry.ok) return { ok: false, reason: geometry.reason || 'PITCH_GEOMETRY_INVALID', boundary: null, geometry };
    return { ok: true, reason: null, boundary: geometry.boundary, geometry };
  }

  function evaluateDetection(detection, pitchPolygon, options) {
    const opts = options || {};
    const minConfidence = finite(opts.minConfidence) ? Number(opts.minConfidence) : 0.35;
    const confidence = finite(detection && detection.confidence) ? Number(detection.confidence) : 0;
    const anchor = bottomCenterAnchor(detection && detection.box);
    const canonical = canonicalPitchPolygon(pitchPolygon, opts);

    if (!canonical.ok) {
      return { status: 'INDISPONIBLE', eligible: false, reason: canonical.reason, anchor: anchor, pitchGeometry: canonical.geometry || null };
    }
    if (!anchor) return { status: 'REJETE', eligible: false, reason: 'INVALID_BOX', anchor: null, pitchGeometry: canonical.geometry || null };
    if (confidence < minConfidence) return { status: 'REJETE', eligible: false, reason: 'LOW_CONFIDENCE', anchor: anchor, pitchGeometry: canonical.geometry || null };
    if (!pointInPolygon(anchor, canonical.boundary)) {
      return { status: 'REJETE', eligible: false, reason: 'GROUND_POINT_OUTSIDE_PITCH', anchor: anchor, pitchGeometry: canonical.geometry || null };
    }
    return { status: 'ELIGIBLE', eligible: true, reason: 'GROUND_POINT_INSIDE_PITCH', anchor: anchor, pitchGeometry: canonical.geometry || null };
  }

  function filterDetections(detections, pitchPolygon, options) {
    const accepted = [], rejected = [], unavailable = [];
    (Array.isArray(detections) ? detections : []).forEach(function (detection, index) {
      const result = evaluateDetection(detection, pitchPolygon, options);
      const row = { index: index, detection: detection, decision: result };
      if (result.status === 'ELIGIBLE') accepted.push(row);
      else if (result.status === 'INDISPONIBLE') unavailable.push(row);
      else rejected.push(row);
    });
    return { accepted: accepted, rejected: rejected, unavailable: unavailable };
  }

  return {
    VERSION: '1.1.0',
    POLICY: 'BOTTOM_CENTER_GROUND_ANCHOR_ON_CANONICAL_PITCH_BOUNDARY',
    bottomCenterAnchor: bottomCenterAnchor,
    pointInPolygon: pointInPolygon,
    canonicalPitchPolygon: canonicalPitchPolygon,
    evaluateDetection: evaluateDetection,
    filterDetections: filterDetections
  };
});
