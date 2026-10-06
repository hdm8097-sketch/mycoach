/* =========================================================
   MyCoach — المختبر ثلاثي الأبعاد (Three.js)
   1) نموذج العضلات التفاعلي   2) أنيميشن التمارين   3) حاسبة الأثقال
   ========================================================= */
const View3D = (() => {

  const $ = s => document.getElementById(s);
  const V3 = () => new THREE.Vector3();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  let active = false, tab = "anatomy", inited = false, ok = true, raf = null, last = 0;
  const S = {};            // stages: anatomy / anim / plates

  /* =========================================================
     أدوات مشتركة
     ========================================================= */
  function createStage(canvasId, opt) {
    const canvas = $(canvasId);
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { ok = false; return null; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
    const st = {
      canvas, renderer, scene, camera,
      orbit: {
        theta: opt.theta ?? 0.5, phi: opt.phi ?? 1.3, radius: opt.radius ?? 6.4,
        target: V3().fromArray(opt.target || [0, 1.7, 0]),
        home: V3().fromArray(opt.target || [0, 1.7, 0]),
        auto: false, min: opt.min ?? 3, max: opt.max ?? 14, speed: opt.rotSpeed ?? 0.25
      },
      focus: null,
      resize() {
        const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
        const h = canvas.clientHeight || canvas.parentElement.clientHeight || 420;
        if (!w || !h) return;
        if (canvas.width !== Math.round(w * renderer.getPixelRatio()) ||
            canvas.height !== Math.round(h * renderer.getPixelRatio())) {
          renderer.setSize(w, h, false);
          camera.aspect = w / h; camera.updateProjectionMatrix();
        }
      },
      applyCam() {
        const o = st.orbit;
        camera.position.set(
          o.target.x + o.radius * Math.sin(o.phi) * Math.sin(o.theta),
          o.target.y + o.radius * Math.cos(o.phi),
          o.target.z + o.radius * Math.sin(o.phi) * Math.cos(o.theta));
        camera.lookAt(o.target);
      },
      reset() {
        const o = st.orbit; st.focus = null;
        o.theta = opt.theta ?? 0.5; o.phi = opt.phi ?? 1.3; o.radius = opt.radius ?? 6.4;
        o.target.copy(o.home);
      }
    };
    return st;
  }

  function lights(scene, warm) {
    scene.add(new THREE.HemisphereLight(0x9fc3ff, 0x140f0a, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(4.5, 7.5, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const d = 6, c = key.shadow.camera;
    c.left = -d; c.right = d; c.top = d; c.bottom = -d; c.near = 0.5; c.far = 25;
    key.shadow.bias = -0.0012;
    scene.add(key);
    const rim = new THREE.DirectionalLight(warm ? 0xff8a4c : 0x5fb6ff, 0.55);
    rim.position.set(-5, 3.5, -4.5);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 0.22);
    fill.position.set(0, 2, -8);
    scene.add(fill);
  }

  function ground(scene, r, color) {
    const g = new THREE.Mesh(new THREE.CircleGeometry(r, 64),
      new THREE.MeshStandardMaterial({ color: color || 0x141c2b, roughness: 0.95, metalness: 0 }));
    g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
    scene.userData.groundMat = g.material;
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.07, r, 64),
      new THREE.MeshBasicMaterial({ color: 0xff6b35, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; scene.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(r * 0.55 - 0.02, r * 0.55, 64),
      new THREE.MeshBasicMaterial({ color: 0x2f3d57, side: THREE.DoubleSide }));
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.003; scene.add(ring2);
  }

  /* أدوات أشكال */
  const geo = {
    box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
    sph: (r, a = 18, b = 14) => new THREE.SphereGeometry(r, a, b),
    cyl: (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s)
  };
  function mesh(g, m, x = 0, y = 0, z = 0) {
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; return o;
  }
  const stdMat = (color, rough = 0.5, metal = 0.18, emissive = 0x000000) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive });

  /* مدخلات الفأرة/اللمس (تدوير + تقريب + ضغطة) */
  function pointer(st, h) {
    const c = st.canvas;
    let down = false, moved = 0, lx = 0, ly = 0, pinch = 0;
    c.addEventListener("pointerdown", e => {
      down = true; moved = 0; lx = e.clientX; ly = e.clientY;
      try { c.setPointerCapture(e.pointerId); } catch (_) {}
    });
    c.addEventListener("pointermove", e => {
      if (down) {
        const dx = e.clientX - lx, dy = e.clientY - ly;
        moved += Math.abs(dx) + Math.abs(dy);
        st.orbit.theta -= dx * 0.008;
        st.orbit.phi = clamp(st.orbit.phi - dy * 0.008, 0.35, 2.45);
        st.orbit.auto = false;
        lx = e.clientX; ly = e.clientY;
      } else if (h.hover) h.hover(e);
    });
    c.addEventListener("pointerup", e => {
      down = false;
      if (moved < 9 && h.click) h.click(e);
    });
    c.addEventListener("pointercancel", () => down = false);
    c.addEventListener("pointerleave", () => { if (h.leave) h.leave(); });
    c.addEventListener("wheel", e => {
      e.preventDefault();
      st.orbit.radius = clamp(st.orbit.radius * (1 + e.deltaY * 0.0011), st.orbit.min, st.orbit.max);
    }, { passive: false });
    // بوسчу على الموبايل (إصبعان للتقريب)
    c.addEventListener("touchmove", e => {
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY);
        if (pinch) st.orbit.radius = clamp(st.orbit.radius * (pinch / d), st.orbit.min, st.orbit.max);
        pinch = d;
      }
    }, { passive: true });
    c.addEventListener("touchend", () => pinch = 0);
  }

  function pick(st, e, objs) {
    const r = st.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1,
                                -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(p, st.camera);
    const hits = ray.intersectObjects(objs, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.muscle && o.parent) o = o.parent;
      if (o && o.userData.muscle) return o;
    }
    return null;
  }

  /* =========================================================
     1) نموذج العضلات
     ========================================================= */
  const MUSC_COL = 0x7d92bd, MUSC_HOV = 0xffa542, MUSC_SEL = 0xff6b35, BASE_COL = 0x39435c;
  const MUSC_COLORS = {
    chest:     0xef5b5b, back:      0x4a90d9, shoulders: 0xf0a13a,
    biceps:    0x5ec98c, triceps:   0x35b8a6, core:      0xe6c74a,
    legs:      0x9b76e0, calves:    0xdb7ab5, glutes:    0xf4784b,
    forearms:  0x7fb2d9, cardio:    0xff7aa2, full:      0x8ad1ff
  };
  const WHITE = new THREE.Color(0xffffff);

  function buildBody(st) {
    const parts = {}, meshes = {};
    const group = new THREE.Group();
    const base = stdMat(BASE_COL, 0.55, 0.2);
    const mkM = k => {
      const m = stdMat(MUSC_COLORS[k] || MUSC_COL, 0.5, 0.16);
      (parts[k] = parts[k] || []).push(m);
      (meshes[k] = meshes[k] || []);
      return m;
    };
    const put = (o, k) => {
      o.castShadow = true;
      o.userData.muscle = k || null;
      if (k) meshes[k].push(o);
      group.add(o); return o;
    };
    const B = (w, h, d, x, y, z, mat, k) => put(mesh(geo.box(w, h, d), mat, x, y, z), k);
    const S = (r, x, y, z, mat, k, sx = 1, sy = 1, sz = 1) => {
      const o = put(mesh(geo.sph(r), mat, x, y, z), k); o.scale.set(sx, sy, sz); return o;
    };
    const C = (rt, rb, h, x, y, z, mat, k) => put(mesh(geo.cyl(rt, rb, h), mat, x, y, z), k);

    // الرجلان
    B(0.22, 0.09, 0.46, -0.19, 0.045, 0.1, base);
    B(0.22, 0.09, 0.46, 0.19, 0.045, 0.1, base);
    C(0.10, 0.135, 0.86, -0.19, 0.5, 0.02, mkM("calves"), "calves");
    C(0.10, 0.135, 0.86, 0.19, 0.5, 0.02, mkM("calves"), "calves");
    S(0.115, -0.19, 0.94, 0.03, base);
    S(0.115, 0.19, 0.94, 0.03, base);
    C(0.15, 0.21, 0.86, -0.19, 1.43, 0.01, mkM("legs"), "legs");
    C(0.15, 0.21, 0.86, 0.19, 1.43, 0.01, mkM("legs"), "legs");

    // الحوض والأرداف
    B(0.5, 0.3, 0.3, 0, 1.97, 0, base);
    S(0.2, -0.15, 1.95, -0.16, mkM("glutes"), "glutes", 1, 1, 0.85);
    S(0.2, 0.15, 1.95, -0.16, mkM("glutes"), "glutes", 1, 1, 0.85);

    // الجذع
    B(0.52, 0.76, 0.3, 0, 2.5, 0, base);
    B(0.4, 0.52, 0.3, 0, 2.3, 0.045, mkM("core"), "core");      // البطن
    B(0.46, 0.56, 0.16, 0, 2.5, -0.17, mkM("back"), "back");    // اللاتس
    B(0.42, 0.2, 0.2, 0, 2.84, -0.1, mkM("back"), "back");      // الترابيس
    S(0.17, -0.14, 2.6, 0.14, mkM("chest"), "chest", 1.05, 0.8, 0.55);
    S(0.17, 0.14, 2.6, 0.14, mkM("chest"), "chest", 1.05, 0.8, 0.55);

    // الأكتاف والذراعان
    [-1, 1].forEach(s => {
      S(0.175, s * 0.44, 2.72, 0, mkM("shoulders"), "shoulders");
      C(0.105, 0.12, 0.6, s * 0.47, 2.38, 0, base);
      S(0.125, s * 0.47, 2.45, 0.075, mkM("biceps"), "biceps", 0.85, 1.3, 0.7);
      S(0.125, s * 0.47, 2.45, -0.075, mkM("triceps"), "triceps", 0.85, 1.3, 0.7);
      C(0.09, 0.11, 0.56, s * 0.47, 1.76, 0, mkM("forearms"), "forearms");
      S(0.1, s * 0.47, 1.42, 0, base);
    });

    // الرقبة والرأس
    C(0.09, 0.1, 0.16, 0, 2.95, 0, base);
    const head = put(mesh(geo.sph(0.25), base, 0, 3.17, 0));
    head.scale.set(0.92, 1.06, 0.96);

    // واجهة أمامية: عضلة مرسومة أمامية الرأس
    S(0.06, 0, 3.18, 0.23, stdMat(0x2a3348, 0.7, 0.1), null, 1.3, 1.6, 0.6);

    group.position.y = 0;
    st.scene.add(group);
    return { group, parts, meshes };
  }

  function initAnatomy() {
    const st = S.anatomy = createStage("cvAnatomy",
      { radius: 5.6, target: [0, 1.75, 0], min: 3.4, max: 13, theta: 0.45, phi: 1.32 });
    if (!st) return;
    lights(st.scene, true);
    ground(st.scene, 3.1, 0x141c2b);
    const body = st.body = buildBody(st);
    st.state = { sel: null, hov: null, t: 0 };

    const paint = () => {
      Object.keys(body.parts).forEach(k => {
        const on = k === st.state.sel, hov = k === st.state.hov && !on;
        const base = new THREE.Color(MUSC_COLORS[k] || MUSC_COL);
        body.parts[k].forEach(m => {
          const c = base.clone();
          if (on) c.lerp(WHITE, 0.18);
          if (hov) c.lerp(WHITE, 0.55);
          m.color.copy(c);
          if (on || hov) { m.emissive.copy(base); m.emissiveIntensity = on ? 0.7 : 0.28; }
          else { m.emissive.setHex(0x000000); m.emissiveIntensity = 1; }
        });
      });
      const badge = $("aBadge");
      if (badge) {
        const k = st.state.sel;
        badge.textContent = k ? (MUSCLES[k] || {}).ar || "" : "اضغط على عضلة";
        badge.style.color = k ? "#ffd9c4" : "";
      }
    };
    st.paint = paint;

    const onMove = e => {
      const o = pick(st, e, body.group.children);
      const k = o ? o.userData.muscle : null;
      if (k !== st.state.hov) { st.state.hov = k; paint(); st.canvas.style.cursor = k ? "pointer" : "grab"; }
    };
    const onClick = e => {
      const o = pick(st, e, body.group.children);
      selectMuscle(o ? o.userData.muscle : null);
    };
    pointer(st, { hover: onMove, click: onClick, leave: () => { st.state.hov = null; paint(); } });

    // أزرار العضلات
    const chips = $("aChips");
    if (chips) {
      chips.innerHTML = Object.keys(MUSCLES)
        .filter(k => body.meshes[k])
        .map(k => `<button class="chip" data-m="${k}">
          <span style="width:10px;height:10px;border-radius:3px;background:#${(MUSC_COLORS[k] || 0x7d92bd).toString(16).padStart(6, "0")};display:inline-block;margin-left:5px"></span>${MUSCLES[k].ar}</button>`).join("");
      chips.onclick = e => {
        const b = e.target.closest("[data-m]"); if (!b) return;
        selectMuscle(b.dataset.m);
      };
    }
    $("btnAutoRot").onclick = () => {
      st.orbit.auto = !st.orbit.auto;
      $("btnAutoRot").classList.toggle("btn-primary", st.orbit.auto);
      $("btnAutoRot").classList.toggle("btn-soft", !st.orbit.auto);
    };
    $("btnCamReset").onclick = () => { st.reset(); };
    paint();
  }

  function selectMuscle(k) {
    const st = S.anatomy; if (!st) return;
    st.state.sel = k;
    st.state.hov = null;
    st.paint();
    // تقريب الكاميرا على العضلة
    if (k && st.body.meshes[k]) {
      const c = V3();
      st.body.meshes[k].forEach(m => c.add(m.position));
      c.divideScalar(st.body.meshes[k].length);
      st.focus = c;
    } else st.focus = null;

    const info = $("aInfo"), title = $("aTitle");
    if (!info) return;
    if (!k) {
      title.textContent = "اختر عضلة من النموذج";
      info.innerHTML = `<p class="muted" style="margin-top:0">حرّك المجسم واضغط على أي مجموعة عضلية
        لتظهر قائمتها من التمارين مع إمكانية إضافتها مباشرة لأي خطة.</p>
        <div class="muscle-list" id="aChips"></div>`;
      const c = $("aChips");
      if (c) {
        c.innerHTML = Object.keys(MUSCLES).filter(x => st.body.meshes[x])
          .map(x => `<button class="chip" data-m="${x}">
            <span style="width:10px;height:10px;border-radius:3px;background:#${(MUSC_COLORS[x] || 0x7d92bd).toString(16).padStart(6, "0")};display:inline-block;margin-left:5px"></span>${MUSCLES[x].ar}</button>`).join("");
        c.onclick = e => { const b = e.target.closest("[data-m]"); if (b) selectMuscle(b.dataset.m); };
      }
      return;
    }
    const m = MUSCLES[k];
    title.innerHTML = `${m.ico} ${m.ar} <em>${m.en}</em>`;
    const list = Store.allExercises().filter(e => e.m === k || (e.ms || []).includes(k));
    const main = list.filter(e => e.m === k), aux = list.filter(e => e.m !== k);
    const card = e => `<div class="plate-row">
        <div><b>${UI.esc(e.ar)}</b><div class="en" style="font-size:11px;color:var(--muted)">${UI.esc(e.en)}</div>
          <span class="tag">${e.sets}×${UI.esc(e.reps)}</span>
          <span class="tag">${(LEVELS[e.lv] || {}).ar}</span></div>
        <div class="filters" style="gap:6px">
          <button class="btn btn-sm btn-ghost" data-view-ex="${e.id}">تفاصيل</button>
          <button class="btn btn-sm btn-primary" data-add-ex="${e.id}">＋ خطة</button>
        </div></div>`;
    info.innerHTML = `
      <div class="filters" style="margin-bottom:10px">
        ${UI.tag(list.length + " تمرين", "mus")}${UI.tag(main.length + " رئيسي", "ok")}
        ${UI.tag(aux.length + " مساعد", "info")}</div>
      ${main.length ? `<div class="sect-title">تمارين أساسية · PRIMARY</div>${main.map(card).join("")}` : ""}
      ${aux.length ? `<div class="sect-title">تمارين مساعدة · SECONDARY</div>${aux.map(card).join("")}` : ""}
      ${list.length ? "" : `<p class="muted">لا توجد تمارين مسجّلة لهذه المجموعة بعد.</p>`}`;
    info.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.viewEx) Exercises.open(b.dataset.viewEx);
      if (b.dataset.addEx) Exercises.addToPlan(b.dataset.addEx);
    };
  }

  /* =========================================================
     2) مختبر الحركة — أنيميشن التمارين
     ========================================================= */
  const MOVES = [
    { id: "squat", ex: "squat", ar: "سكوات بالبارا", en: "Barbell Back Squat", tempo: 2.6 },
    { id: "ohp", ex: "ohp", ar: "ضغط علوي بالبارا", en: "Overhead Press", tempo: 2.2 },
    { id: "curl", ex: "db-curl", ar: "باي سكواط بالدمبل", en: "Dumbbell Curl", tempo: 2.4 },
    { id: "lateral", ex: "lateral-raise", ar: "رفع جانبي", en: "Lateral Raise", tempo: 2.0 }
  ];
  let move = MOVES[0], playing = true, speed = 1, phase = 0, reps = 0;

  function buildDumbbell() {
    const g = new THREE.Group();
    const m = stdMat(0x2b3348, 0.4, 0.6);
    const shaft = mesh(geo.cyl(0.028, 0.028, 0.24, 12), stdMat(0xb9c2d4, 0.3, 0.85));
    shaft.rotation.z = Math.PI / 2; g.add(shaft);
    [-1, 1].forEach(s => {
      const p = mesh(geo.cyl(0.075, 0.075, 0.055, 20), m, s * 0.11, 0, 0);
      p.rotation.z = Math.PI / 2; g.add(p);
    });
    return g;
  }

  function buildBarbell(len) {
    const g = new THREE.Group();
    const shaft = mesh(geo.cyl(0.03, 0.03, len, 16), stdMat(0xc3ccdd, 0.28, 0.9));
    shaft.rotation.z = Math.PI / 2; g.add(shaft);
    [-1, 1].forEach(s => {
      const sleeve = mesh(geo.cyl(0.045, 0.045, len * 0.3, 16), stdMat(0x8f9bb3, 0.35, 0.85), s * len * 0.34, 0, 0);
      sleeve.rotation.z = Math.PI / 2; g.add(sleeve);
      const plate = mesh(geo.cyl(0.16, 0.16, 0.05, 28), stdMat(0xd5372f, 0.5, 0.3), s * len * 0.44, 0, 0);
      plate.rotation.z = Math.PI / 2; g.add(plate);
    });
    return g;
  }

  function buildFigure(st) {
    const matBody = stdMat(0x8fa3c8, 0.45, 0.2);
    const matJoint = stdMat(0x39435c, 0.6, 0.2);
    const matAcc = stdMat(0xff6b35, 0.4, 0.3, 0x2c0f06);
    const fig = new THREE.Group(), J = {};

    const root = new THREE.Group(); fig.add(root); J.root = root;
    const hips = new THREE.Group(); hips.position.set(0, 1.78, 0); root.add(hips); J.hips = hips;
    hips.add(mesh(geo.box(0.42, 0.26, 0.28), matBody));

    const spine = new THREE.Group(); spine.position.set(0, 0.12, 0); hips.add(spine); J.spine = spine;
    spine.add(mesh(geo.box(0.48, 0.62, 0.28), matBody, 0, 0.34, 0));
    spine.add(mesh(geo.box(0.34, 0.2, 0.12), matAcc, 0, 0.5, 0.16)); // شعار الصدر

    const neck = new THREE.Group(); neck.position.set(0, 0.66, 0); spine.add(neck); J.neck = neck;
    neck.add(mesh(geo.cyl(0.07, 0.08, 0.12, 12), matJoint, 0, 0.06, 0));
    const hd = mesh(geo.sph(0.2), matBody, 0, 0.28, 0); hd.scale.set(0.92, 1.05, 0.96); neck.add(hd);
    neck.add(mesh(geo.box(0.16, 0.05, 0.03), matAcc, 0, 0.3, 0.19)); // عينان

    [-1, 1].forEach(s => {
      const side = s < 0 ? "L" : "R";
      const sh = new THREE.Group(); sh.position.set(s * 0.3, 0.58, 0); spine.add(sh); J["shoulder" + side] = sh;
      sh.add(mesh(geo.sph(0.11), matAcc));
      sh.add(mesh(geo.cyl(0.075, 0.09, 0.5, 14), matBody, 0, -0.27, 0));
      const el = new THREE.Group(); el.position.set(0, -0.52, 0); sh.add(el); J["elbow" + side] = el;
      el.add(mesh(geo.sph(0.075), matJoint));
      el.add(mesh(geo.cyl(0.06, 0.075, 0.46, 14), matBody, 0, -0.24, 0));
      const hand = new THREE.Group(); hand.position.set(0, -0.5, 0); el.add(hand); J["hand" + side] = hand;
      hand.add(mesh(geo.sph(0.085), matJoint, 0, -0.04, 0));
      const db = buildDumbbell(); db.visible = false; hand.add(db); J["db" + side] = db;

      const th = new THREE.Group(); th.position.set(s * 0.15, -0.1, 0); hips.add(th); J["thigh" + side] = th;
      th.add(mesh(geo.cyl(0.1, 0.13, 0.66, 14), matBody, 0, -0.35, 0));
      const kn = new THREE.Group(); kn.position.set(0, -0.7, 0); th.add(kn); J["knee" + side] = kn;
      kn.add(mesh(geo.sph(0.09), matJoint));
      kn.add(mesh(geo.cyl(0.075, 0.1, 0.6, 14), matBody, 0, -0.32, 0));
      const ft = new THREE.Group(); ft.position.set(0, -0.64, 0); kn.add(ft); J["foot" + side] = ft;
      ft.add(mesh(geo.box(0.17, 0.1, 0.32), matJoint, 0, -0.05, 0.09));
    });

    st.scene.add(fig);
    return J;
  }

  function resetPose(J) {
    J.hips.position.set(0, 1.78, 0);
    J.hips.rotation.set(0, 0, 0);
    ["spine", "neck", "shoulderL", "shoulderR", "elbowL", "elbowR",
     "thighL", "thighR", "kneeL", "kneeR", "footL", "footR"].forEach(k => J[k].rotation.set(0, 0, 0));
  }

  function pose(J, id, p) {
    const s = (1 - Math.cos(p * Math.PI * 2)) / 2;
    resetPose(J);
    const dbl = (J.dbL && J.dbL.visible);
    if (id === "squat") {
      J.hips.position.set(0, 1.78 - 0.44 * s, -0.1 * s);
      J.spine.rotation.x = 0.3 * s;
      J.thighL.rotation.x = J.thighR.rotation.x = -0.95 * s;
      J.kneeL.rotation.x = J.kneeR.rotation.x = 0.62 * s;
      J.footL.rotation.x = J.footR.rotation.x = 0.3 * s;
      J.shoulderL.rotation.set(-0.2 * s, 0, -0.62);
      J.shoulderR.rotation.set(-0.2 * s, 0, 0.62);
      J.elbowL.rotation.x = J.elbowR.rotation.x = 1.5;
    } else if (id === "ohp") {
      const th = 1.5 + 1.55 * s, eb = 1.2 - 1.1 * s;
      J.shoulderL.rotation.z = -th; J.shoulderR.rotation.z = th;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -0.3 + 0.3 * s;
      J.elbowL.rotation.z = eb; J.elbowR.rotation.z = -eb;
      J.spine.rotation.x = -0.07 * s;
      J.thighL.rotation.x = J.thighR.rotation.x = -0.07 * s;
      J.kneeL.rotation.x = J.kneeR.rotation.x = 0.1 * s;
    } else if (id === "curl") {
      J.shoulderL.rotation.set(0, 0, -0.14); J.shoulderR.rotation.set(0, 0, 0.14);
      J.elbowL.rotation.x = J.elbowR.rotation.x = -2.25 * s;
      J.spine.rotation.x = -0.05 * s;
      J.thighL.rotation.x = J.thighR.rotation.x = -0.05;
    } else if (id === "lateral") {
      J.shoulderL.rotation.z = -1.62 * s; J.shoulderR.rotation.z = 1.62 * s;
      J.shoulderL.rotation.x = J.shoulderR.rotation.x = -0.12;
      J.elbowL.rotation.z = 0.2; J.elbowR.rotation.z = -0.2;
      J.spine.rotation.x = 0.05 * s;
    }
    if (dbl) J.spine.rotation.z = 0;
  }

  function initAnim() {
    const st = S.anim = createStage("cvAnim",
      { radius: 5.4, target: [0, 1.35, 0], min: 3, max: 11, theta: 0.55, phi: 1.35 });
    if (!st) return;
    lights(st.scene, true);
    ground(st.scene, 2.7, 0x131a28);
    st.J = buildFigure(st);
    st.barBack = buildBarbell(1.5);
    st.barBack.visible = false;
    st.J.spine.add(st.barBack);
    st.barBack.position.set(0, 0.5, -0.24);
    st.barBack.rotation.z = Math.PI / 2;
    st.barHand = buildBarbell(1.15);
    st.barHand.visible = false;
    st.scene.add(st.barHand);

    pointer(st, {});

    // أزرار الحركات
    const chips = $("animChips");
    chips.innerHTML = MOVES.map(m =>
      `<button class="chip ${m.id === move.id ? "active" : ""}" data-move="${m.id}">${m.ar}</button>`).join("");
    chips.onclick = e => {
      const b = e.target.closest("[data-move]"); if (!b) return;
      move = MOVES.find(m => m.id === b.dataset.move);
      phase = 0; reps = 0;
      chips.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c.dataset.move === move.id));
      showMoveInfo();
    };

    $("btnPlay").onclick = () => {
      playing = !playing;
      $("btnPlay").textContent = playing ? "⏸ إيقاف مؤقت" : "▶ تشغيل";
    };
    $("rngSpeed").oninput = e => {
      speed = +e.target.value;
      $("speedVal").textContent = speed.toFixed(1) + "×";
    };
    showMoveInfo();
  }

  function showMoveInfo() {
    const e = Store.getEx(move.ex) || {};
    $("anTitle").innerHTML = `${UI.esc(move.ar)} <em>${UI.esc(move.en)}</em>`;
    $("anInfo").innerHTML = `
      <div class="filters" style="margin-bottom:10px">
        ${UI.tag((MUSCLES[e.m] || {}).ar || "", "mus")}${UI.tag(`${e.sets || "-"} × ${e.reps || "-"}`, "ok")}
        ${UI.tag("راحة " + (e.rest || "-") + "ث")}</div>
      ${e.steps && e.steps.length ? `<div class="sect-title">طريقة التنفيذ · FORM</div>
        <ol style="padding-inline-start:20px;line-height:1.85;font-size:14px;margin:0">
        ${e.steps.map(s => `<li>${UI.esc(s)}</li>`).join("")}</ol>` : ""}
      ${e.tips ? `<div class="sect-title">نصيحة المدرب</div>
        <div class="panel"><div class="panel-bd" style="font-size:13.5px;line-height:1.8">💡 ${UI.esc(e.tips)}</div></div>` : ""}
      <div class="filters" style="margin-top:12px">
        <button class="btn btn-sm btn-primary" data-add="${move.ex}">＋ أضف إلى خطة</button>
        <button class="btn btn-sm btn-ghost" data-open="${move.ex}">تفاصيل التمرين</button>
      </div>`;
    $("anInfo").onclick = ev => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.add) Exercises.addToPlan(b.dataset.add);
      if (b.dataset.open) Exercises.open(b.dataset.open);
    };
    const rc = $("repCount"); if (rc) rc.textContent = "0";
  }

  function updateAnim(st, dt) {
    if (playing) {
      const prev = phase;
      phase += dt * speed / move.tempo;
      if (phase >= 1) { phase -= 1; reps++; const rc = $("repCount"); if (rc) rc.textContent = reps; }
      if (prev > phase && phase > 0) { /* wrap */ }
    }
    pose(st.J, move.id, phase);
    const bar = $("repBar"); if (bar) bar.style.width = (phase * 100).toFixed(1) + "%";

    // إظهار الأدوات حسب الحركة
    st.barBack.visible = move.id === "squat";
    st.barHand.visible = move.id === "ohp";
    st.J.dbL.visible = st.J.dbR.visible = (move.id === "curl" || move.id === "lateral");

    if (st.barHand.visible) {
      const a = V3(), b = V3();
      st.J.handL.getWorldPosition(a); st.J.handR.getWorldPosition(b);
      st.barHand.position.copy(a).add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      if (dir.lengthSq() > 0.0001) {
        st.barHand.quaternion.setFromUnitVectors(V3().set(1, 0, 0), dir.normalize());
      }
    }
  }

  /* =========================================================
     3) حاسبة الأثقال
     ========================================================= */
  const PLATES = [
    { w: 25, r: 0.225, t: 0.038, c: 0xd5372f, n: "أحمر" },
    { w: 20, r: 0.225, t: 0.033, c: 0x2d6cdf, n: "أزرق" },
    { w: 15, r: 0.225, t: 0.029, c: 0xf2c400, n: "أصفر" },
    { w: 10, r: 0.225, t: 0.026, c: 0x2fa84f, n: "أخضر" },
    { w: 5, r: 0.19, t: 0.019, c: 0xe8eef7, n: "أبيض" },
    { w: 2.5, r: 0.145, t: 0.016, c: 0xd5372f, n: "أحمر صغير" },
    { w: 1.25, r: 0.11, t: 0.014, c: 0xa9b3c4, n: "فضي" }
  ];
  let total = 60, barW = 20, plateT = 0;

  function platesFor(perSide) {
    const out = [];
    let w = Math.round(perSide * 100) / 100;
    for (const p of PLATES) {
      while (w >= p.w - 0.001) { out.push(p); w = Math.round((w - p.w) * 100) / 100; }
    }
    return { list: out, left: Math.round(w * 100) / 100 };
  }

  function initPlates() {
    const st = S.plates = createStage("cvPlates",
      { radius: 3.4, target: [0, 0.45, 0], min: 1.8, max: 7, theta: 0.35, phi: 1.32, rotSpeed: 0.3 });
    if (!st) return;
    lights(st.scene, false);
    ground(st.scene, 2.2, 0x111827);

    const g = new THREE.Group();
    const metal = stdMat(0xc3ccdd, 0.25, 0.92);
    const shaft = mesh(geo.cyl(0.022, 0.022, 2.2, 20), metal, 0, 0.5, 0);
    shaft.rotation.z = Math.PI / 2; g.add(shaft);
    [-1, 1].forEach(s => {
      const sleeve = mesh(geo.cyl(0.036, 0.036, 0.68, 20), stdMat(0x9aa5bb, 0.3, 0.9), s * 0.76, 0.5, 0);
      sleeve.rotation.z = Math.PI / 2; g.add(sleeve);
      const collar = mesh(geo.cyl(0.05, 0.05, 0.05, 18), stdMat(0x59647c, 0.4, 0.8), s * 0.44, 0.5, 0);
      collar.rotation.z = Math.PI / 2; g.add(collar);
      // حامل البارا
      const post = mesh(geo.box(0.09, 0.56, 0.09), stdMat(0x38445f, 0.6, 0.5), s * 1.16, 0.28, 0);
      g.add(post);
      const foot = mesh(geo.box(0.4, 0.05, 0.6), stdMat(0x232b3d, 0.7, 0.4), s * 1.16, 0.025, 0);
      g.add(foot);
    });
    st.scene.add(g);
    st.group = g;
    st.plateMeshes = [];

    pointer(st, {});
    $("rngPlates").oninput = e => { total = +e.target.value; $("plateTotal").textContent = total; rebuild(); };
    document.querySelectorAll("[data-bar]").forEach(b => b.onclick = () => {
      barW = +b.dataset.bar;
      document.querySelectorAll("[data-bar]").forEach(x => {
        x.classList.toggle("btn-soft", +x.dataset.bar === barW);
        x.classList.toggle("btn-ghost", +x.dataset.bar !== barW);
      });
      rebuild();
    });
    rebuild();
  }

  function rebuild() {
    const st = S.plates; if (!st) return;
    st.plateMeshes.forEach(m => { st.group.remove(m); m.geometry.dispose(); m.material.dispose(); });
    st.plateMeshes = [];

    const perSide = Math.max(0, (total - barW) / 2);
    const { list, left } = platesFor(perSide);
    let x = 0.47;
    let idx = 0;
    [-1, 1].forEach(s => {
      let xx = x;
      list.forEach(p => {
        const m = mesh(geo.cyl(p.r, p.r, p.t, 40), stdMat(p.c, 0.5, 0.35), s * (xx + p.t / 2), 0.5, 0);
        m.rotation.z = Math.PI / 2;
        m.userData.delay = idx * 0.045;
        m.scale.set(0.001, 0.001, 0.001);
        st.group.add(m);
        st.plateMeshes.push(m);
        xx += p.t + 0.004;
        idx++;
      });
      // المشبك
      const col = mesh(geo.cyl(0.055, 0.055, 0.04, 18), stdMat(0x59647c, 0.4, 0.8), s * (xx + 0.03), 0.5, 0);
      col.rotation.z = Math.PI / 2;
      col.userData.delay = idx * 0.045; col.scale.set(0.001, 0.001, 0.001);
      st.group.add(col); st.plateMeshes.push(col); idx++;
    });
    plateT = 0;

    // لوحة المعلومات
    const counts = {};
    list.forEach(p => counts[p.w] = (counts[p.w] || 0) + 1);
    const rows = Object.keys(counts).map(Number).sort((a, b) => b - a)
      .map(w => {
        const p = PLATES.find(q => q.w === w);
        return `<div class="plate-row">
          <span class="legend"><i style="background:#${p.c.toString(16).padStart(6, "0")}"></i>
            <b>${w} كجم</b> <span class="muted">${p.n}</span></span>
          <span>× ${counts[w]} <span class="muted">لكل جانب</span></span></div>`;
      }).join("");
    $("plateInfo").innerHTML = `
      <div class="kv"><span>البارا</span><b>${barW} كجم</b></div>
      <div class="kv"><span>وزن كل جانب</span><b style="color:var(--brand2)">${perSide.toFixed(2)} كجم</b></div>
      <div class="kv"><span>إجمالي الكتلتين</span><b>${(perSide * 2 + barW).toFixed(2)} كجم</b></div>
      ${left > 0.001 ? `<div class="kv"><span>فرق غير مغطى</span>
        <b style="color:var(--yellow)">${left} كجم</b></div>` : ""}
      <div class="sect-title">الأثقال على كل جانب</div>
      ${rows || `<p class="muted">بارا فارغة (${barW} كجم).</p>`}
      <div class="filters" style="margin-top:12px">
        <button class="btn btn-sm btn-soft" id="btnCopyPlates">📋 نسخ التوزيع</button>
      </div>`;
    $("btnCopyPlates").onclick = () => {
      const txt = `الوزن ${total} كجم (${barW} كجم بارا) — كل جانب: ` +
        (Object.keys(counts).map(Number).sort((a, b) => b - a).map(w => `${counts[w]}×${w}`).join(" + ") || "بدون أثقال");
      const legacy = () => {
        try {
          const ta = document.createElement("textarea");
          ta.value = txt; ta.style.cssText = "position:fixed;opacity:0";
          document.body.appendChild(ta); ta.select();
          const ok2 = document.execCommand("copy");
          document.body.removeChild(ta);
          return ok2;
        } catch (_) { return false; }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(
          () => UI.toast("تم نسخ التوزيع ✓"),
          () => UI.toast(legacy() ? "تم نسخ التوزيع ✓" : "تعذّر النسخ — انسخ يدوياً"));
      } else {
        UI.toast(legacy() ? "تم نسخ التوزيع ✓" : "تعذّر النسخ — انسخ يدوياً");
      }
    };
  }

  /* =========================================================
     الحلقة والتوجيه
     ========================================================= */
  function initOnce() {
    if (inited || typeof THREE === "undefined") { if (typeof THREE === "undefined") ok = false; }
    if (!ok || inited) return;
    inited = true;
    try {
      initAnatomy(); initAnim(); initPlates();
    } catch (err) {
      console.error(err); ok = false;
    }
    if (!ok) {
      ["stageAnatomy", "stageAnim", "stagePlates"].forEach(id => {
        const el = $(id); if (el) el.innerHTML = `<div class="webgl-err">😕 لا يدعم متصفحك رسوم Three.js WebGL.<br>جرّب Chrome أو Edge.</div>`;
      });
    }
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (!active) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;

    if (tab === "anatomy" && S.anatomy) {
      const st = S.anatomy;
      st.resize();
      if (st.orbit.auto) st.orbit.theta += dt * st.orbit.speed;
      if (st.focus) st.orbit.target.lerp(st.focus, 0.07);
      else st.orbit.target.lerp(st.orbit.home, 0.07);
      if (st.state.sel) {
        const pulse = 0.55 + 0.45 * Math.sin(ts * 0.004);
        (st.body.parts[st.state.sel] || []).forEach(m => m.emissiveIntensity = pulse);
      }
      st.applyCam();
      st.renderer.render(st.scene, st.camera);
    } else if (tab === "anim" && S.anim) {
      const st = S.anim;
      st.resize();
      if (st.orbit.auto) st.orbit.theta += dt * st.orbit.speed;
      updateAnim(st, dt);
      st.applyCam();
      st.renderer.render(st.scene, st.camera);
    } else if (tab === "plates" && S.plates) {
      const st = S.plates;
      st.resize();
      if (st.orbit.auto) st.orbit.theta += dt * st.orbit.speed;
      plateT += dt;
      st.plateMeshes.forEach(m => {
        const k = clamp((plateT - (m.userData.delay || 0)) / 0.28, 0, 1);
        const e = 1 - Math.pow(1 - k, 3);
        m.scale.set(e, e, e);
      });
      st.applyCam();
      st.renderer.render(st.scene, st.camera);
    }
  }

  function init() {
    // أزرار التبويبات
    $("threeTabs").onclick = e => {
      const t = e.target.closest(".tab"); if (!t) return;
      setTab(t.dataset.tab);
    };
    // تدوير تلقائي لبقية المشاهد عبر النقر المطول: زر الدوران يعمل للنموذج فقط
  }

  function setTab(t) {
    tab = t;
    document.querySelectorAll("#threeTabs .tab").forEach(x => x.classList.toggle("active", x.dataset.tab === t));
    document.querySelectorAll("#view-three .tab-pane").forEach(p =>
      p.classList.toggle("active", p.id === "tp-" + t));
    // إعادة تدوير تلقائي لمشهد الأثقال عند فتحه
    if (t === "plates" && S.plates) { S.plates.orbit.auto = true; }
    if (t === "anatomy" && S.anatomy) { S.anatomy.orbit.auto = true; setTimeout(() => { if (S.anatomy) S.anatomy.orbit.auto = false; }, 4200); }
    const st = S[t];
    if (st) st.resize();
  }

  function render() {
    active = true;
    initOnce();
    if (!ok) return;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    const st = S[tab];
    if (st) st.resize();
  }

  function pause() { active = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* تلوين أرضية المشاهد حسب الثيم الحالي */
  function applyTheme() {
    const gv = (getComputedStyle(document.documentElement).getPropertyValue("--3d-ground") || "").trim();
    if (!gv) return;
    Object.values(S).forEach(st => {
      const gm = st && st.scene && st.scene.userData ? st.scene.userData.groundMat : null;
      if (gm) gm.color.set(gv);
    });
  }

  window.addEventListener("resize", () => Object.values(S).forEach(s => s && s.resize()));

  return { init, render, pause, setTab, selectMuscle, applyTheme };
})();
