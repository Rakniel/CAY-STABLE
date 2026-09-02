(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CAYPitchGeometryGuard = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EPS = 1e-9;
  const finite = n => Number.isFinite(Number(n));
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  function normalizePoints(points) {
    if (!Array.isArray(points)) return [];
    const out = [];
    for (const p of points) {
      if (!p || !finite(p.x) || !finite(p.y)) return [];
      const q = { x: Number(p.x), y: Number(p.y) };
      if (!out.some(v => Math.hypot(v.x - q.x, v.y - q.y) <= EPS)) out.push(q);
    }
    return out;
  }

  function polygonArea(points) {
    if (!Array.isArray(points) || points.length < 3) return 0;
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      sum += a.x * b.y - b.x * a.y;
    }
    return Math.abs(sum) / 2;
  }

  function convexHull(points) {
    const sorted = normalizePoints(points).sort((a, b) => a.x - b.x || a.y - b.y);
    if (sorted.length <= 2) return sorted;
    const lower = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= EPS) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= EPS) upper.pop();
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  function pointLineDistance(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const den = Math.hypot(dx, dy);
    if (den <= EPS) return Math.hypot(p.x - a.x, p.y - a.y);
    return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / den;
  }

  function bboxDiagonal(points) {
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  }

  function reduceHullToQuadrilateral(hull, options) {
    const opts = options || {};
    const maxDeviationRatio = finite(opts.maxCornerDeviationRatio) ? Math.max(0.001, Number(opts.maxCornerDeviationRatio)) : 0.025;
    const quad = hull.map(p => ({ ...p }));
    const diagonal = bboxDiagonal(quad);
    if (diagonal <= EPS) return { ok: false, reason: 'PITCH_BOUNDARY_DEGENERATE' };
    let removed = 0;

    while (quad.length > 4) {
      let bestIndex = -1, bestRatio = Infinity;
      for (let i = 0; i < quad.length; i++) {
        const prev = quad[(i - 1 + quad.length) % quad.length];
        const cur = quad[i];
        const next = quad[(i + 1) % quad.length];
        const ratio = pointLineDistance(cur, prev, next) / diagonal;
        if (ratio < bestRatio) { bestRatio = ratio; bestIndex = i; }
      }
      if (bestIndex < 0 || bestRatio > maxDeviationRatio) {
        return {
          ok: false,
          reason: 'PITCH_BOUNDARY_NOT_QUADRILATERAL',
          significantCorners: quad.length,
          smallestExtraCornerDeviationRatio: Number(bestRatio.toFixed(5))
        };
      }
      quad.splice(bestIndex, 1);
      removed++;
    }
    return { ok: quad.length === 4, boundary: quad, removedHullCorners: removed };
  }

  function canonicalizeBoundary(points, options) {
    const opts = options || {};
    const normalized = normalizePoints(points);
    if (normalized.length < 4) return { ok: false, reason: 'PITCH_BOUNDARY_NEEDS_FOUR_POINTS' };

    const hull = convexHull(normalized);
    if (hull.length < 4) return { ok: false, reason: 'PITCH_BOUNDARY_DEGENERATE' };

    const hullArea = polygonArea(hull);
    const minArea = finite(opts.minArea) ? Math.max(EPS, Number(opts.minArea)) : 1;
    if (!finite(hullArea) || hullArea < minArea) return { ok: false, reason: 'PITCH_BOUNDARY_AREA_TOO_SMALL' };

    const reduced = reduceHullToQuadrilateral(hull, opts);
    if (!reduced.ok) return { ...reduced, inputPoints: normalized.length, hullPoints: hull.length };

    const canonicalArea = polygonArea(reduced.boundary);
    const areaRetention = canonicalArea / hullArea;
    const minAreaRetention = finite(opts.minAreaRetention) ? Math.max(0.8, Math.min(1, Number(opts.minAreaRetention))) : 0.94;
    if (areaRetention < minAreaRetention) {
      return {
        ok: false,
        reason: 'PITCH_BOUNDARY_EXCESSIVE_SHAPE_LOSS',
        areaRetention: Number(areaRetention.toFixed(4)),
        inputPoints: normalized.length,
        hullPoints: hull.length
      };
    }

    return {
      ok: true,
      boundary: reduced.boundary,
      inputPoints: normalized.length,
      hullPoints: hull.length,
      removedSamples: normalized.length - reduced.boundary.length,
      removedHullCorners: reduced.removedHullCorners,
      areaRetention: Number(areaRetention.toFixed(4)),
      policy: 'FOOTBALL_PITCH_CANONICAL_QUADRILATERAL',
      evidencePolicy: 'RAW_LINE_SAMPLES_MAY_BE_MANY; PLAYABLE_BOUNDARY_IS_ALWAYS_FOUR_PROJECTED_SIDES'
    };
  }

  function canonicalPitchModel(options) {
    const opts = options || {};
    const lengthM = finite(opts.lengthM) ? Number(opts.lengthM) : 105;
    const widthM = finite(opts.widthM) ? Number(opts.widthM) : 68;
    if (lengthM < 90 || lengthM > 120 || widthM < 45 || widthM > 90) {
      return { ok: false, reason: 'PITCH_DIMENSIONS_OUT_OF_ASSOCIATION_FOOTBALL_RANGE' };
    }
    return {
      ok: true,
      lengthM,
      widthM,
      corners: [
        { x: 0, y: 0 },
        { x: lengthM, y: 0 },
        { x: lengthM, y: widthM },
        { x: 0, y: widthM }
      ],
      fixedFeatures: {
        penaltyMarkM: 11,
        penaltyAreaDepthM: 16.5,
        penaltyAreaWidthM: 40.32,
        goalAreaDepthM: 5.5,
        goalAreaWidthM: 18.32,
        centerCircleRadiusM: 9.15,
        goalWidthM: 7.32
      }
    };
  }

  return {
    VERSION: '1.0.0',
    POLICY: 'CONSTRAINED_FOOTBALL_PITCH_GEOMETRY',
    canonicalizeBoundary,
    canonicalPitchModel,
    convexHull,
    polygonArea,
    pointLineDistance
  };
});
