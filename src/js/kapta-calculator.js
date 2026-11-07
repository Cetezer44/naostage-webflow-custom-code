/* ── kapta-calculator ── source Webflow : cmp_section-2-faq.html ── */
(function() {
  // Garde : le calculateur n'existe que sur la page FAQ (markup conservé dans l'Embed Webflow)
  if (!document.getElementById('kapta-grid')) return;

  const WORLD_X_MIN = -20, WORLD_X_MAX = 20;
  const WORLD_Y_MIN = -5,  WORLD_Y_MAX = 20;
  const WORLD_W = WORLD_X_MAX - WORLD_X_MIN;
  const WORLD_H = WORLD_Y_MAX - WORLD_Y_MIN;
  const ASPECT = WORLD_W / WORLD_H;
  const HFOV = 95;
  const VFOV = 76;
  const SNAP = 0.5;
  const CLOSE_THRESHOLD_PX = 12;

  const canvas  = document.getElementById('kapta-grid');
  const ctx     = canvas.getContext('2d');
  const elHeight   = document.getElementById('kapta-height');
  const elMargin   = document.getElementById('kapta-margin');
  const elAngle    = document.getElementById('kapta-angle');
  const elAngleVal = document.getElementById('kapta-angle-val');
  const elHMargin  = document.getElementById('kapta-h-margin');
  const elVMargin  = document.getElementById('kapta-v-margin');
  const elHMarginM = document.getElementById('kapta-h-margin-m');
  const elVMarginM = document.getElementById('kapta-v-margin-m');
  const elEffFov   = document.getElementById('kapta-effective-fov');
  const elCoverageArea = document.getElementById('kapta-coverage-area');
  const elStageArea    = document.getElementById('kapta-stage-area');
  const elWarning      = document.getElementById('kapta-warning');
  const btnDraw  = document.getElementById('kapta-btn-draw');
  const btnUndo  = document.getElementById('kapta-btn-undo');
  const btnClear = document.getElementById('kapta-btn-clear');

  // Dark mode colors for canvas
  const C = {
    bg:          '#111113',
    gridMinor:   '#1e1e22',
    gridMajor:   '#2a2a30',
    axis:        '#444450',
    axisLabel:   '#666674',
    camera:      '#c0c0c8',
    coverage:    { fill: 'rgba(152, 51, 236, 0.15)', stroke: 'rgba(152, 51, 236, 0.7)' },
    stage:       { fill: 'rgba(255, 160, 0, 0.12)', stroke: 'rgba(255, 160, 0, 0.8)' },
    snapNormal:  { fill: 'rgba(255, 160, 0, 0.5)', stroke: 'rgba(255, 160, 0, 0.8)' },
    snapClose:   { fill: 'rgba(0, 220, 100, 0.5)', stroke: 'rgba(0, 220, 100, 0.9)' },
  };

  let scale = 1, offsetX = 0, offsetY = 0, dpr = 1;
  let stagePoints = [], isDrawing = false, polygonClosed = false;
  let mouseSnap = null, coverageCorners = null, coverageFarInfinite = false;

  function worldToCanvas(wx, wy) {
    return [offsetX + wx * scale, offsetY - wy * scale];
  }
  function canvasToWorld(cx, cy) {
    return [(cx - offsetX) / scale, -(cy - offsetY) / scale];
  }
  function snapToGrid(val) {
    return Math.round(val / SNAP) * SNAP;
  }

  function resize() {
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = w / ASPECT;
    dpr = window.devicePixelRatio || 1;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = h + 'px';
    scale = canvas.width / WORLD_W;
    offsetX = -WORLD_X_MIN * scale;
    offsetY = WORLD_Y_MAX * scale;
    render();
  }

  new ResizeObserver(resize).observe(canvas.parentElement);

  function computeCoverage(hInstall, margin, alphaDeg, hMarginDeg, vMarginDeg, hMarginM, vMarginM) {
    const H = hInstall - margin;
    if (H <= 0) return { error: 'Effective height is zero or negative (margin ≥ camera height)' };
    const effH = HFOV - 2 * hMarginDeg;
    const effV = VFOV - 2 * vMarginDeg;
    if (effH <= 0) return { error: 'H margin too large (effective HFOV ≤ 0)' };
    if (effV <= 0) return { error: 'V margin too large (effective VFOV ≤ 0)' };
    const a = (effH / 2) * Math.PI / 180;
    const b = (effV / 2) * Math.PI / 180;
    const alpha = alphaDeg * Math.PI / 180;
    const ca = Math.cos(alpha), sa = Math.sin(alpha);

    function hit(u, v) {
      let dx = Math.tan(u), dy = 1, dz = Math.tan(v);
      const s = Math.sqrt(dx*dx + dy*dy + dz*dz);
      dx /= s; dy /= s; dz /= s;
      return { dx, dy: ca*dy + sa*dz, dz: -sa*dy + ca*dz };
    }

    const rays = [{ u:-a,v:-b },{ u:a,v:-b },{ u:a,v:b },{ u:-a,v:b }];
    let corners = [], farInfinite = false;

    for (const r of rays) {
      const d = hit(r.u, r.v);
      if (d.dz >= 0) {
        farInfinite = true;
        corners.push(d.dy > 0
          ? { x: (WORLD_Y_MAX / d.dy) * d.dx, y: WORLD_Y_MAX }
          : { x: d.dx > 0 ? WORLD_X_MAX : WORLD_X_MIN, y: WORLD_Y_MAX });
      } else {
        const t = -H / d.dz;
        const gx = t * d.dx, gy = t * d.dy;
        if (gy > WORLD_Y_MAX) {
          farInfinite = true;
          corners.push({ x: (WORLD_Y_MAX / d.dy) * d.dx, y: WORLD_Y_MAX });
        } else {
          corners.push({ x: gx, y: gy });
        }
      }
    }

    if ((hMarginM > 0 || vMarginM > 0) && corners.length === 4) {
      const [oFL, oFR, oRR, oRL] = corners;
      let fl = oFL, fr = oFR, rr = oRR, rl = oRL;
      if (vMarginM > 0) {
        const nearY = oFL.y, farY = oRL.y, span = farY - nearY;
        const newNearY = nearY + vMarginM, newFarY = farY - vMarginM;
        if (newNearY >= newFarY) return { error: 'V meter margin too large' };
        const tN = span === 0 ? 0 : (newNearY - nearY) / span;
        const tF = span === 0 ? 1 : (newFarY  - nearY) / span;
        fl = { x: oFL.x + tN*(oRL.x-oFL.x), y: newNearY };
        fr = { x: oFR.x + tN*(oRR.x-oFR.x), y: newNearY };
        rl = { x: oFL.x + tF*(oRL.x-oFL.x), y: newFarY };
        rr = { x: oFR.x + tF*(oRR.x-oFR.x), y: newFarY };
      }
      if (hMarginM > 0) {
        fl = { x: fl.x+hMarginM, y: fl.y }; rl = { x: rl.x+hMarginM, y: rl.y };
        fr = { x: fr.x-hMarginM, y: fr.y }; rr = { x: rr.x-hMarginM, y: rr.y };
        if (fl.x >= fr.x || rl.x >= rr.x) return { error: 'H meter margin too large' };
      }
      corners = [fl, fr, rr, rl];
    }
    return { corners, farInfinite };
  }

  function polygonArea(pts) {
    if (pts.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return Math.abs(area) / 2;
  }

  function drawGrid() {
    ctx.save();
    ctx.lineWidth = dpr;
    ctx.strokeStyle = C.gridMinor;
    for (let x = WORLD_X_MIN; x <= WORLD_X_MAX; x++) {
      const [cx] = worldToCanvas(x, 0);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
    }
    for (let y = WORLD_Y_MIN; y <= WORLD_Y_MAX; y++) {
      const [,cy] = worldToCanvas(0, y);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
    }
    ctx.strokeStyle = C.gridMajor;
    for (let x = WORLD_X_MIN; x <= WORLD_X_MAX; x += 5) {
      const [cx] = worldToCanvas(x, 0);
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
    }
    for (let y = WORLD_Y_MIN; y <= WORLD_Y_MAX; y += 5) {
      const [,cy] = worldToCanvas(0, y);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
    }
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1.5 * dpr;
    const [ax0] = worldToCanvas(0, 0);
    ctx.beginPath(); ctx.moveTo(ax0, 0); ctx.lineTo(ax0, canvas.height); ctx.stroke();
    const [,ay0] = worldToCanvas(0, 0);
    ctx.beginPath(); ctx.moveTo(0, ay0); ctx.lineTo(canvas.width, ay0); ctx.stroke();
    ctx.fillStyle = C.axisLabel;
    ctx.font = (11 * dpr) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let x = WORLD_X_MIN; x <= WORLD_X_MAX; x += 5) {
      if (x === 0) continue;
      const [cx, cy] = worldToCanvas(x, 0);
      ctx.fillText(x + '', cx, cy + 2*dpr);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let y = WORLD_Y_MIN; y <= WORLD_Y_MAX; y += 5) {
      if (y === 0) continue;
      const [cx, cy] = worldToCanvas(0, y);
      ctx.fillText(y + '', cx - 4*dpr, cy);
    }
    ctx.restore();
  }

  function drawCameraMarker() {
    const [cx, cy] = worldToCanvas(0, 0);
    ctx.save();
    ctx.strokeStyle = C.camera;
    ctx.lineWidth = 2 * dpr;
    const r = 6 * dpr;
    ctx.beginPath();
    ctx.moveTo(cx-r, cy); ctx.lineTo(cx+r, cy);
    ctx.moveTo(cx, cy-r); ctx.lineTo(cx, cy+r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 4*dpr, 0, Math.PI*2);
    ctx.fillStyle = C.camera;
    ctx.fill();
    ctx.restore();
  }

  function drawCoverage() {
    if (!coverageCorners || coverageCorners.length < 3) return;
    ctx.save();
    ctx.beginPath();
    const [sx, sy] = worldToCanvas(coverageCorners[0].x, coverageCorners[0].y);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < coverageCorners.length; i++) {
      const [px, py] = worldToCanvas(coverageCorners[i].x, coverageCorners[i].y);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = C.coverage.fill;
    ctx.fill();
    ctx.strokeStyle = C.coverage.stroke;
    ctx.lineWidth = 2 * dpr;
    if (coverageFarInfinite) ctx.setLineDash([6*dpr, 4*dpr]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawStagePolygon() {
    if (stagePoints.length === 0) return;
    ctx.save();
    if (polygonClosed && stagePoints.length >= 3) {
      ctx.beginPath();
      const [sx, sy] = worldToCanvas(stagePoints[0].x, stagePoints[0].y);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < stagePoints.length; i++) {
        const [px, py] = worldToCanvas(stagePoints[i].x, stagePoints[i].y);
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = C.stage.fill;
      ctx.fill();
      ctx.strokeStyle = C.stage.stroke;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
    } else if (stagePoints.length >= 2) {
      ctx.beginPath();
      const [sx, sy] = worldToCanvas(stagePoints[0].x, stagePoints[0].y);
      ctx.moveTo(sx, sy);
      for (let i = 1; i < stagePoints.length; i++) {
        const [px, py] = worldToCanvas(stagePoints[i].x, stagePoints[i].y);
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = C.stage.stroke;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();
    }
    if (isDrawing && mouseSnap && stagePoints.length > 0) {
      const last = stagePoints[stagePoints.length - 1];
      const [lx, ly] = worldToCanvas(last.x, last.y);
      const [mx, my] = worldToCanvas(mouseSnap.x, mouseSnap.y);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(mx, my);
      ctx.strokeStyle = 'rgba(255, 160, 0, 0.35)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.setLineDash([4*dpr, 4*dpr]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (let i = 0; i < stagePoints.length; i++) {
      const [px, py] = worldToCanvas(stagePoints[i].x, stagePoints[i].y);
      ctx.beginPath();
      ctx.arc(px, py, 4*dpr, 0, Math.PI*2);
      ctx.fillStyle = C.stage.stroke;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSnapCursor() {
    if (!isDrawing || !mouseSnap) return;
    const [cx, cy] = worldToCanvas(mouseSnap.x, mouseSnap.y);
    ctx.save();
    let nearFirst = false;
    if (stagePoints.length >= 3) {
      const [fx, fy] = worldToCanvas(stagePoints[0].x, stagePoints[0].y);
      if (Math.hypot(cx-fx, cy-fy) < CLOSE_THRESHOLD_PX * dpr) nearFirst = true;
    }
    const col = nearFirst ? C.snapClose : C.snapNormal;
    ctx.beginPath();
    ctx.arc(cx, cy, (nearFirst ? 7 : 5)*dpr, 0, Math.PI*2);
    ctx.fillStyle = col.fill;
    ctx.fill();
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawCoverage();
    drawStagePolygon();
    drawSnapCursor();
    drawCameraMarker();
  }

  function recalculate() {
    const hInstall   = parseFloat(elHeight.value)   || 0;
    const margin     = parseFloat(elMargin.value)    || 0;
    const alphaDeg   = parseFloat(elAngle.value)     || 0;
    const hMarginDeg = parseFloat(elHMargin.value)   || 0;
    const vMarginDeg = parseFloat(elVMargin.value)   || 0;
    const hMarginM   = parseFloat(elHMarginM.value)  || 0;
    const vMarginM   = parseFloat(elVMarginM.value)  || 0;

    elAngleVal.textContent = alphaDeg.toFixed(1) + '°';
    elEffFov.textContent = 'Effective FOV: ' + (HFOV - 2*hMarginDeg).toFixed(0) + '° × ' + (VFOV - 2*vMarginDeg).toFixed(0) + '°';

    const result = computeCoverage(hInstall, margin, alphaDeg, hMarginDeg, vMarginDeg, hMarginM, vMarginM);
    if (result.error) {
      elWarning.textContent = result.error;
      elWarning.style.display = 'block';
      coverageCorners = null; coverageFarInfinite = false;
      elCoverageArea.textContent = '—';
    } else {
      elWarning.style.display = 'none';
      coverageCorners = result.corners; coverageFarInfinite = result.farInfinite;
      elCoverageArea.textContent = polygonArea(coverageCorners).toFixed(1) + ' m²';
    }
    updateStageArea(); render();
  }

  function updateStageArea() {
    elStageArea.textContent = (polygonClosed && stagePoints.length >= 3)
      ? polygonArea(stagePoints).toFixed(1) + ' m²' : '—';
  }

  [elHeight, elMargin, elAngle, elHMargin, elVMargin, elHMarginM, elVMarginM]
    .forEach(el => el.addEventListener('input', recalculate));

  function getMouseWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const [wx, wy] = canvasToWorld((e.clientX - rect.left)*dpr, (e.clientY - rect.top)*dpr);
    return { x: snapToGrid(wx), y: snapToGrid(wy) };
  }

  canvas.addEventListener('mousemove', function(e) {
    if (!isDrawing) { mouseSnap = null; render(); return; }
    mouseSnap = getMouseWorld(e); render();
  });

  canvas.addEventListener('click', function(e) {
    if (!isDrawing) return;
    const pt = getMouseWorld(e);
    if (stagePoints.length >= 3) {
      const [fx, fy] = worldToCanvas(stagePoints[0].x, stagePoints[0].y);
      const [cx, cy] = worldToCanvas(pt.x, pt.y);
      if (Math.hypot(cx-fx, cy-fy) < CLOSE_THRESHOLD_PX * dpr) {
        polygonClosed = true; isDrawing = false; mouseSnap = null;
        btnDraw.classList.remove('active'); btnDraw.textContent = 'Draw Stage';
        updateStageArea(); updateButtons(); render(); return;
      }
    }
    stagePoints.push(pt); updateButtons(); render();
  });

  canvas.addEventListener('dblclick', function(e) {
    if (!isDrawing || stagePoints.length < 3) return;
    e.preventDefault();
    polygonClosed = true; isDrawing = false; mouseSnap = null;
    btnDraw.classList.remove('active'); btnDraw.textContent = 'Draw Stage';
    updateStageArea(); updateButtons(); render();
  });

  document.addEventListener('keydown', function(e) {
    if (!isDrawing) return;
    if (e.key === 'Escape') {
      stagePoints = []; polygonClosed = false; isDrawing = false; mouseSnap = null;
      btnDraw.classList.remove('active'); btnDraw.textContent = 'Draw Stage';
      updateButtons(); render();
    } else if (e.key === 'Backspace' || (e.key === 'z' && (e.ctrlKey || e.metaKey))) {
      e.preventDefault();
      if (stagePoints.length > 0) { stagePoints.pop(); updateButtons(); render(); }
    }
  });

  function updateButtons() {
    btnUndo.disabled = !isDrawing || stagePoints.length === 0;
    btnClear.disabled = stagePoints.length === 0 && !polygonClosed;
  }

  btnDraw.addEventListener('click', function() {
    if (isDrawing) {
      isDrawing = false; mouseSnap = null;
      btnDraw.classList.remove('active'); btnDraw.textContent = 'Draw Stage';
      if (!polygonClosed) stagePoints = [];
    } else {
      stagePoints = []; polygonClosed = false; isDrawing = true;
      btnDraw.classList.add('active'); btnDraw.textContent = 'Stop Drawing';
    }
    updateButtons(); updateStageArea(); render();
  });

  btnUndo.addEventListener('click', function() {
    if (stagePoints.length > 0) { stagePoints.pop(); updateButtons(); render(); }
  });

  btnClear.addEventListener('click', function() {
    stagePoints = []; polygonClosed = false; isDrawing = false; mouseSnap = null;
    btnDraw.classList.remove('active'); btnDraw.textContent = 'Draw Stage';
    updateButtons(); updateStageArea(); render();
  });

  recalculate();
})();
