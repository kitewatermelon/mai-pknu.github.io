/* =========================================================
   Hero background — 3D 뉴런 뇌 애니메이션 (Canvas)
   - 뇌 모양(대뇌 + 소뇌 + 뇌간) 안에 뉴런 점들을 배치
   - 천천히 회전 + 숨쉬듯 흔들림
   - 연결선을 따라 신경 신호(pulse)가 흐름
   - 마우스 위치에 따라 살짝 기울어짐
   ========================================================= */
(function () {
  const canvas = document.getElementById("brainCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  // Windows '애니메이션 효과 끄기' 상태에서도 멈추지 않도록, 속도만 살짝 낮춤
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPEED = reduceMotion ? 0.6 : 1;

  const CFG = {
    nodeCount: 520,        // 뇌 안의 뉴런 개수
    bgCount: 70,           // 배경에 떠다니는 입자
    neighbors: 3,          // 각 뉴런이 연결되는 이웃 수
    maxLinkDist: 0.32,     // 연결 최대 거리 (정규화 좌표)
    pulseRate: 0.25,       // 프레임당 새 신호 발생 확률 계수
    rotateSpeed: 0.0022,   // 회전 속도
    colorNode: [17, 45, 78],
    colorLink: [150, 158, 168],
    colorPulse: [63, 114, 175],
  };

  let W, H, DPR, cx, cy, scale;
  let nodes = [], links = [], adj = [], pulses = [], bg = [];
  let angle = 0, tiltX = 0, tiltTarget = 0, yawOffset = 0, yawTarget = 0;
  let spin = 0;                                  // 드래그/클릭으로 생기는 회전 관성
  const mouse = { x: -9999, y: -9999, inside: false, down: false, lastX: 0, moved: 0 };
  let ripples = [];                              // 클릭 시 퍼지는 원

  /* ---------- 뇌 모양 판정 (옆에서 본 뇌, x: 앞(-)~뒤(+), y: 위(-)~아래(+), z: 좌우) ---------- */
  function insideBrain(x, y, z) {
    // 대뇌: 큰 타원체 (좌우 반구 사이에 얕은 홈)
    const cerebrum = (x * x) / (1.0 * 1.0) + ((y + 0.08) ** 2) / (0.68 * 0.68) + (z * z) / (0.78 * 0.78);
    const fissure = Math.abs(z) < 0.035 && y < -0.2; // 대뇌 종렬
    // 측두엽 아래로 살짝 볼록
    const temporal = ((x + 0.15) ** 2) / (0.55 * 0.55) + ((y - 0.28) ** 2) / (0.3 * 0.3) + (z * z) / (0.75 * 0.75);
    // 소뇌: 뒤쪽 아래
    const cerebellum = ((x - 0.55) ** 2) / (0.36 * 0.36) + ((y - 0.5) ** 2) / (0.22 * 0.22) + (z * z) / (0.55 * 0.55);
    // 뇌간
    const stem = ((x - 0.2) ** 2) / (0.12 * 0.12) + (z * z) / (0.12 * 0.12);
    const inStem = stem < 1 && y > 0.3 && y < 0.95;
    return ((cerebrum < 1 || temporal < 1) && !fissure && y < 0.55) || cerebellum < 1 || inStem;
  }

  function makeBrain() {
    nodes = [];
    let guard = 0;
    while (nodes.length < CFG.nodeCount && guard++ < 200000) {
      const x = Math.random() * 2.2 - 1.1;
      const y = Math.random() * 2.0 - 0.8;
      const z = Math.random() * 1.8 - 0.9;
      if (!insideBrain(x, y, z)) continue;
      // 표면(피질) 쪽에 더 많이 분포시키기: 바깥쪽 점을 우대
      const r = Math.sqrt(x * x / 1.0 + (y + 0.08) ** 2 / 0.46 + z * z / 0.6);
      if (r < 0.75 && Math.random() < 0.6) continue;
      nodes.push({
        x, y, z,
        ox: x, oy: y, oz: z,
        phase: Math.random() * Math.PI * 2,
        amp: 0.006 + Math.random() * 0.012,
        glow: 0,
        sx: 0, sy: 0, sz: 0, depth: 0,
      });
    }

    // 가까운 이웃끼리 연결
    links = [];
    adj = nodes.map(() => []);
    const seen = new Set();
    nodes.forEach((a, i) => {
      const d = [];
      nodes.forEach((b, j) => {
        if (i === j) return;
        const dist = Math.hypot(a.ox - b.ox, a.oy - b.oy, a.oz - b.oz);
        if (dist < CFG.maxLinkDist) d.push([dist, j]);
      });
      d.sort((p, q) => p[0] - q[0]);
      d.slice(0, CFG.neighbors).forEach(([, j]) => {
        const key = i < j ? i + "-" + j : j + "-" + i;
        if (seen.has(key)) return;
        seen.add(key);
        const li = links.push({ a: i, b: j }) - 1;
        adj[i].push(li);
        adj[j].push(li);
      });
    });
  }

  function makeBackground() {
    bg = Array.from({ length: CFG.bgCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.4,
      a: Math.random() * 0.4 + 0.1,
    }));
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const mobile = W < 860;
    if (canvas.parentElement.classList.contains("page-banner")) {
      // 서브 페이지 배너: 오른쪽에 작게
      cx = mobile ? W * 0.78 : W * 0.75;
      cy = H * 0.56;
      scale = mobile ? H * 0.3 : H * 0.42;
      makeBackground();
      return;
    }
    cx = mobile ? W * 0.5 : W * 0.68;
    cy = mobile ? H * 0.27 : H * 0.5;
    scale = mobile ? Math.min(W, H) * 0.36 : Math.min(W * 0.3, H * 0.42);
    makeBackground();
  }

  /* ---------- 신경 신호 ---------- */
  function spawnPulse(fromNode, depthLeft) {
    const opts = adj[fromNode];
    if (!opts || !opts.length) return;
    const li = opts[(Math.random() * opts.length) | 0];
    const l = links[li];
    const to = l.a === fromNode ? l.b : l.a;
    pulses.push({ from: fromNode, to, t: 0, speed: 0.01 + Math.random() * 0.012, hops: depthLeft });
  }

  /* ---------- 투영 ---------- */
  function project() {
    const cosY = Math.cos(angle + yawOffset), sinY = Math.sin(angle + yawOffset);
    const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
    const t = performance.now() * 0.001;
    const fov = 3.2;
    for (const n of nodes) {
      // 숨쉬듯 미세하게 흔들림
      const b = Math.sin(t * 1.3 + n.phase) * n.amp;
      const x = n.ox * (1 + b), y = n.oy * (1 + b), z = n.oz * (1 + b);
      // Y축 회전
      let rx = x * cosY + z * sinY;
      let rz = -x * sinY + z * cosY;
      // X축 기울기
      let ry = y * cosX - rz * sinX;
      rz = y * sinX + rz * cosX;
      const p = fov / (fov + rz);
      n.sx = cx + rx * scale * p;
      n.sy = cy + ry * scale * p;
      n.depth = (1 - rz) / 2; // 0(뒤) ~ 1(앞)
      n.p = p;
    }
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 배경 입자
    for (const s of bg) {
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
      if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
      ctx.fillStyle = `rgba(17,45,78,${s.a * 0.35})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    // 뇌 주변 은은한 빛
    const halo = ctx.createRadialGradient(cx, cy, scale * 0.1, cx, cy, scale * 1.3);
    halo.addColorStop(0, "rgba(17,45,78,0.04)");
    halo.addColorStop(1, "rgba(17,45,78,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    // 연결선
    const [lr, lg, lb] = CFG.colorLink;
    ctx.lineWidth = 0.6;
    for (const l of links) {
      const a = nodes[l.a], b = nodes[l.b];
      const d = (a.depth + b.depth) / 2;
      ctx.strokeStyle = `rgba(${lr},${lg},${lb},${0.05 + d * 0.28})`;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }

    // 뉴런
    const [nr, ng, nb] = CFG.colorNode;
    for (const n of nodes) {
      n.glow *= 0.94;
      const r = (0.7 + n.depth * 1.6) * n.p + n.glow * 2.5;
      const a = 0.25 + n.depth * 0.65 + n.glow * 0.5;
      if (n.glow > 0.05) {
        const g = ctx.createRadialGradient(n.sx, n.sy, 0, n.sx, n.sy, r * 5);
        g.addColorStop(0, `rgba(63,114,175,${0.5 * n.glow})`);
        g.addColorStop(1, "rgba(63,114,175,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.sx, n.sy, r * 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = `rgba(${nr},${ng},${nb},${Math.min(a, 1)})`;
      ctx.beginPath(); ctx.arc(n.sx, n.sy, r, 0, Math.PI * 2); ctx.fill();
    }

    // 마우스 주변 뉴런과 커서를 잇는 선
    if (mouse.inside) {
      const R = 150;
      for (const n of nodes) {
        const d = Math.hypot(n.sx - mouse.x, n.sy - mouse.y);
        if (d < R) {
          ctx.strokeStyle = `rgba(17,45,78,${(1 - d / R) * 0.3})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.sx, n.sy); ctx.stroke();
        }
      }
      const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 40);
      cg.addColorStop(0, "rgba(63,114,175,0.35)");
      cg.addColorStop(1, "rgba(63,114,175,0)");
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2); ctx.fill();
    }

    // 클릭 파동
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += 6; r.a *= 0.94;
      if (r.a < 0.02) { ripples.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(63,114,175,${r.a})`;
      ctx.lineWidth = 2;
      if (r.r > 0) { ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke(); }
    }

    // 신호 펄스
    const [pr, pg, pb] = CFG.colorPulse;
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.t += p.speed;
      const a = nodes[p.from], b = nodes[p.to];
      if (p.t >= 1) {
        b.glow = Math.min(1, b.glow + 0.8);
        if (p.hops > 0) {
          spawnPulse(p.to, p.hops - 1);
          if (Math.random() < 0.08) spawnPulse(p.to, p.hops - 1); // 가끔 분기
        }
        pulses.splice(i, 1);
        continue;
      }
      const x = a.sx + (b.sx - a.sx) * p.t;
      const y = a.sy + (b.sy - a.sy) * p.t;
      const d = a.depth + (b.depth - a.depth) * p.t;
      // 꼬리
      const tx = a.sx + (b.sx - a.sx) * Math.max(0, p.t - 0.35);
      const ty = a.sy + (b.sy - a.sy) * Math.max(0, p.t - 0.35);
      const grad = ctx.createLinearGradient(tx, ty, x, y);
      grad.addColorStop(0, `rgba(${pr},${pg},${pb},0)`);
      grad.addColorStop(1, `rgba(${pr},${pg},${pb},${0.4 + d * 0.6})`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = `rgba(${pr},${pg},${pb},${0.6 + d * 0.4})`;
      ctx.beginPath(); ctx.arc(x, y, 1.3 + d * 1.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  function tick() {
    angle += CFG.rotateSpeed * SPEED + spin;
    spin *= 0.95;
    hoverEffect();
    tiltX += (tiltTarget - tiltX) * 0.04;
    yawOffset += (yawTarget - yawOffset) * 0.04;

    // 새 신호 발생 (최대 개수 제한)
    if (pulses.length < 35 && Math.random() < CFG.pulseRate) {
      spawnPulse((Math.random() * nodes.length) | 0, 2 + ((Math.random() * 3) | 0));
    }
    project();
    draw();
    requestAnimationFrame(tick);
  }

  /* ---------- 마우스 / 터치 인터랙션 ---------- */
  const hero = canvas.parentElement;

  function toLocal(e) {
    const rect = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    return { x: pt.clientX - rect.left, y: pt.clientY - rect.top };
  }

  // 커서 근처 뉴런이 빛나고, 가끔 신호를 쏨
  function hoverEffect() {
    if (!mouse.inside) return;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const d = Math.hypot(n.sx - mouse.x, n.sy - mouse.y);
      if (d < 150) {
        n.glow = Math.max(n.glow, (1 - d / 150) * 0.9);
        if (Math.random() < 0.001 && pulses.length < 60) spawnPulse(i, 3);
      }
    }
  }

  function burst(x, y) {
    ripples.push({ x, y, r: 6, a: 0.9 });
    ripples.push({ x, y, r: -20, a: 0.6 });
    nodes.forEach((n, i) => {
      const d = Math.hypot(n.sx - x, n.sy - y);
      if (d < 200) {
        n.glow = 1;
        if (Math.random() < 0.15) spawnPulse(i, 4);
      }
    });
    spin += 0.04; // 클릭하면 뇌가 한 번 휙 돎
  }

  hero.addEventListener("mousemove", (e) => {
    const p = toLocal(e);
    mouse.x = p.x; mouse.y = p.y; mouse.inside = true;
    // 커서 위치에 따라 뇌가 기울어짐
    tiltTarget = (p.y / H - 0.5) * 0.7;
    yawTarget = (p.x / W - 0.5) * 1.0;
    // 드래그하면 직접 회전
    if (mouse.down) {
      const dx = p.x - mouse.lastX;
      spin = dx * 0.0025;
      mouse.moved += Math.abs(dx);
      mouse.lastX = p.x;
    }
  });
  hero.addEventListener("mouseleave", () => {
    mouse.inside = false; mouse.down = false;
    tiltTarget = 0; yawTarget = 0;
  });
  hero.addEventListener("mousedown", (e) => {
    if (e.target.closest("a, button")) return;
    mouse.down = true; mouse.moved = 0; mouse.lastX = toLocal(e).x;
    hero.style.cursor = "grabbing";
  });
  window.addEventListener("mouseup", (e) => {
    if (mouse.down && mouse.moved < 6 && !e.target.closest("a, button")) {
      const p = toLocal(e);
      burst(p.x, p.y); // 드래그가 아니라 클릭이면 신호 폭발
    }
    mouse.down = false;
    hero.style.cursor = "";
  });

  // 모바일 터치
  hero.addEventListener("touchstart", (e) => {
    if (e.target.closest("a, button")) return;
    const p = toLocal(e);
    mouse.x = p.x; mouse.y = p.y; mouse.inside = true;
    burst(p.x, p.y);
  }, { passive: true });
  hero.addEventListener("touchend", () => { mouse.inside = false; }, { passive: true });

  window.addEventListener("resize", resize);
  // 화면 밖에 있을 땐 rAF가 자동으로 느려지므로 별도 처리 불필요

  resize();
  makeBrain();
  angle = -0.6;
  tick();
})();
