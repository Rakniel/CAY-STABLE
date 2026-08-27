(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CAYPitchMembershipGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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

  function evaluateDetection(detection, pitchPolygon, options) {
    const opts = options || {};
    const minConfidence = finite(opts.minConfidence) ? Number(opts.minConfidence) : 0.35;
    const confidence = finite(detection && detection.confidence) ? Number(detection.confidence) : 0;
    const anchor = bottomCenterAnchor(detection && detection.box);

    if (!Array.isArray(pitchPolygon) || pitchPolygon.length < 3) {
      return { status: 'INDISPONIBLE', eligible: false, reason: 'PITCH_POLYGON_MISSING', anchor: anchor };
    }
    if (!anchor) return { status: 'REJETE', eligible: false, reason: 'INVALID_BOX', anchor: null };
    if (confidence < minConfidence) return { status: 'REJETE', eligible: false, reason: 'LOW_CONFIDENCE', anchor: anchor };
    if (!pointInPolygon(anchor, pitchPolygon)) {
      return { status: 'REJETE', eligible: false, reason: 'GROUND_POINT_OUTSIDE_PITCH', anchor: anchor };
    }
    return { status: 'ELIGIBLE', eligible: true, reason: 'GROUND_POINT_INSIDE_PITCH', anchor: anchor };
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
    VERSION: '1.0.0',
    POLICY: 'BOTTOM_CENTER_GROUND_ANCHOR_ONLY',
    bottomCenterAnchor: bottomCenterAnchor,
    pointInPolygon: pointInPolygon,
    evaluateDetection: evaluateDetection,
    filterDetections: filterDetections
  };
});
