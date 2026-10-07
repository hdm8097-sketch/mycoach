/* =========================================================
   MyCoach — المصادقة والصلاحيات
   قفل الدخول · حسابات المستخدمين · الأدوار · سجل محاولات الدخول
   ملاحظة: لا يوجد خادم — كل شيء محلي داخل متصفحك (Local Storage).
   ========================================================= */
const Auth = (() => {
  const $ = s => document.querySelector(s);

  /* ================= SHA-256 محلي (بدون إنترنت) ================= */
  const K = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  function sha256(str) {
    const bytes = new TextEncoder().encode(String(str));
    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const len = bytes.length;
    const pad = Math.ceil((len + 9) / 64) * 64;
    const buf = new Uint8Array(pad);
    buf.set(bytes);
    buf[len] = 0x80;
    const bits = len * 8;
    const dv = new DataView(buf.buffer);
    dv.setUint32(pad - 8, Math.floor(bits / 4294967296));
    dv.setUint32(pad - 4, bits >>> 0);
    const w = new Uint32Array(64);
    for (let off = 0; off < pad; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15] >>> 3);
        const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2] >>> 10);
        w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
      }
      let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) >>> 0;
        h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }

  /* ================= أدوات ================= */
  const rndBytes = n => {
    const arr = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(arr);
    else for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  };
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const newToken = n => Array.from(rndBytes(n)).map(b => ALPHA[b % ALPHA.length]).join("");
  const newSalt = () => Array.from(rndBytes(8)).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashPass = (pass, salt) => sha256(salt + "·" + pass);
  const dt = t => new Date(t).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  const esc = s => UI.esc(s == null ? "" : s);

  const ROLES = {
    owner:      { ar: "👑 المالك", en: "Owner",      cls: "r-owner" },
    supervisor: { ar: "🛡️ مشرف",   en: "Supervisor", cls: "r-sup" },
    viewer:     { ar: "👤 مستخدم",  en: "User",       cls: "r-view" }
  };

  function device() {
    const ua = navigator.userAgent || "";
    const b = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera"
            : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox"
            : /Safari\//.test(ua) ? "Safari" : "متصفح آخر";
    const o = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android"
            : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS"
            : /Linux/.test(ua) ? "Linux" : "—";
    const k = /Mobi|Android|iPhone|iPad/.test(ua) ? "جوال" : "حاسوب";
    return { b, o, k };
  }

  /* ================= الحالة ================= */
  let current = null, booted = false, nextFn = null, mode = "login",
      bypassN = 0, cdIv = null, blockAt = 0;

  const st = () => Store.get();
  function blank() {
    return { users: [], session: null, logs: [], fails: 0, lockUntil: 0,
             recovery: "", deviceId: newToken(4) };
  }
  function a() {
    const s = st();
    if (!s.auth || !Array.isArray(s.auth.users)) s.auth = blank();
    const A = s.auth;
    if (!Array.isArray(A.logs)) A.logs = [];
    if (!A.deviceId) A.deviceId = newToken(4);
    return A;
  }

  /* حفظ داخلي يتجاوز حارس الصلاحيات (لبيانات المصادقة نفسها) */
  function bypass(fn) { bypassN++; try { return fn(); } finally { bypassN--; } }
  const allow = fn => bypass(fn || (() => Store.save()));
  function saveAllowed() { return bypassN > 0 || can("edit"); }

  /* حارس آخر خط: أي محاولة تعديل بصلاحية «قراءة فقط» تُرفض وتُرجَع الحالة */
  function blocked() {
    if (Date.now() - blockAt < 1800) return;
    blockAt = Date.now();
    UI.toast("🔒 صلاحيتك «قراءة فقط» — التعديل موقوف", "err");
    try {
      Store.load();
      const el = document.querySelector(".view.active");
      if (el && typeof App !== "undefined") App.render(el.id.replace("view-", ""));
    } catch (e) {}
  }

  /* ================= الصلاحيات ================= */
  function user() { return current; }
  function role() { return current ? current.role : null; }
  function can(what) {
    const u = current; if (!u) return false;
    switch (what) {
      case "users":    return u.role === "owner";
      case "edit":     return u.role === "owner" || u.role === "supervisor";
      case "settings": return u.role === "owner";
      default:         return false;
    }
  }

  function applyRole() {
    const r = role();
    document.body.classList.toggle("no-edit", !!current && !can("edit"));
    document.body.classList.toggle("role-owner", r === "owner");
    document.body.classList.toggle("role-sup", r === "supervisor");
    document.body.classList.toggle("role-view", r === "viewer");
    const chip = $("#userChip");
    if (chip) {
      chip.innerHTML = current
        ? `<span class="chip-av">${esc(UI.initials(current.name))}</span>
           <span class="chip-tx">${esc(current.name)}<em>${(ROLES[current.role] || ROLES.viewer).ar}</em></span>`
        : "";
      chip.hidden = !current;
    }
    const lockBtn = $("#btnLock"); if (lockBtn) lockBtn.hidden = !current;
    ["#btnRestore", "#btnImport2"].forEach(s => { const e = $(s); if (e) e.style.display = can("settings") ? "" : "none"; });
  }

  /* ================= سجل محاولات الدخول ================= */
  function addLog(ok, uname, name, why) {
    const A = a(), d = device();
    A.logs.unshift({
      t: Date.now(), user: uname || "—", name: name || "—", ok: !!ok,
      why: why || "", b: d.b, o: d.o, k: d.k, dev: A.deviceId
    });
    A.logs = A.logs.slice(0, 300);
  }
  const failCount24 = () => a().logs.filter(l => !l.ok && l.t > Date.now() - 86400000).length;
  const okCount24 = () => a().logs.filter(l => l.ok && l.t > Date.now() - 86400000).length;
  const lockRemain = () => Math.max(0, (a().lockUntil || 0) - Date.now());

  /* ================= شاشة القفل ================= */
  function show(m) {
    mode = m;
    UI.closeModal(); UI.closeDrawer();
    const el = $("#lockScreen");
    if (!el) return;
    if (cdIv) { clearInterval(cdIv); cdIv = null; }
    el.hidden = false;
    document.body.classList.add("auth-locked");
    document.body.style.overflow = "hidden";
    renderForm();
  }
  function hide() {
    const el = $("#lockScreen");
    if (el) el.hidden = true;
    document.body.classList.remove("auth-locked");
    document.body.style.overflow = "";
  }
  function err(msg) { const e = $("#lkErr"); if (e) { e.hidden = false; e.textContent = msg; } }
  function clearErr() { const e = $("#lkErr"); if (e) e.hidden = true; }

  function renderForm() {
    const box = $("#lockForm"), foot = $("#lockFoot");
    if (!box) return;
    if (mode === "setup") {
      box.innerHTML = `
        <h2 class="lock-h">إنشاء حساب المالك 👑</h2>
        <p class="lock-sub">هذا البرنامج محمي برمز — أنشئ حسابك أولاً لتفتح كل بياناتك.</p>
        <label>الاسم الكامل<input id="lkName" placeholder="مثال: أحمد الشريف" autocomplete="off"></label>
        <label>اسم المستخدم (للجخول)<input id="lkUser" placeholder="admin" autocomplete="off" autocapitalize="off"></label>
        <label>الرمز السري<input id="lkPass" type="password" placeholder="6 خانات على الأقل"></label>
        <label>تأكيد الرمز السري<input id="lkPass2" type="password"></label>
        <button class="btn btn-primary lock-btn" id="lkGo">إنشاء الحساب والدخول</button>
        <p class="lock-err" id="lkErr" hidden></p>`;
      foot.innerHTML = `<p class="lock-note">🔐 لا يوجد خادم — كل شيء يُحفظ في متصفحك فقط، وستُعطيك رمز استعادة لحسابك.</p>`;
    } else if (mode === "recovery") {
      box.innerHTML = `
        <h2 class="lock-h">استعادة الحساب ♻️</h2>
        <p class="lock-sub">أدخل رمز الاستعادة الذي ظهر لك عند إنشاء الحساب، ثم اختر رمزاً جديداً لحساب المالك.</p>
        <label>رمز الاستعادة<input id="lkRec" placeholder="MC-XXXX-XXXX" autocomplete="off" autocapitalize="characters"></label>
        <label>الرمز السري الجديد<input id="lkPass" type="password" placeholder="6 خانات على الأقل"></label>
        <label>تأكيد الرمز الجديد<input id="lkPass2" type="password"></label>
        <button class="btn btn-primary lock-btn" id="lkGo">استعادة وإعادة تعيين</button>
        <p class="lock-err" id="lkErr" hidden></p>
        <button class="lock-link" id="lkBack">↩ رجوع إلى تسجيل الدخول</button>`;
      foot.innerHTML = `<p class="lock-note">لم تحصل على رمز استعادة؟ اطلب من المالك إعادة تعيين رمزك.</p>`;
    } else {
      const A = a();
      const only = A.users.length === 1 ? ` value="${esc(A.users[0].user)}"` : "";
      box.innerHTML = `
        <h2 class="lock-h">تسجيل الدخول 🔐</h2>
        <p class="lock-sub">أدخل اسم المستخدم والرمز السري للمتابعة.</p>
        <label>اسم المستخدم<input id="lkUser" autocomplete="off" autocapitalize="off" placeholder="اسم الدخول"${only}></label>
        <label>الرمز السري<input id="lkPass" type="password" placeholder="••••••"></label>
        <button class="btn btn-primary lock-btn" id="lkGo">دخول</button>
        <p class="lock-err" id="lkErr" hidden></p>
        <div class="lock-row">
          <button class="lock-link" id="lkShow">👁 إظهار الرمز</button>
          <button class="lock-link" id="lkForgot">نسيت الرمز السري؟</button>
        </div>`;
      const last = A.users.filter(u => u.last).sort((x, y) => y.last - x.last)[0];
      foot.innerHTML = `<p class="lock-note">🔒 البرنامج مقفل — ${A.users.length} حساب مسجّل${last ? " · آخر دخول: " + esc(last.name) + " · " + dt(last.last) : ""}</p>`;
    }

    const go = $("#lkGo"); if (go) go.onclick = submit;
    const back = $("#lkBack"); if (back) back.onclick = () => show("login");
    const forgot = $("#lkForgot"); if (forgot) forgot.onclick = () => show("recovery");
    const showBtn = $("#lkShow");
    if (showBtn) showBtn.onclick = () => {
      const p = $("#lkPass");
      const on = p.type === "password";
      p.type = on ? "text" : "password";
      showBtn.textContent = on ? "🙈 إخفاء الرمز" : "👁 إظهار الرمز";
    };
    box.querySelectorAll("input").forEach(i => i.onkeydown = e => {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
    });
    const first = box.querySelector("input");
    if (first) setTimeout(() => first.focus(), 60);
    if (mode === "login" && lockRemain()) startCooldown();
  }

  function startCooldown() {
    if (cdIv) clearInterval(cdIv);
    cdIv = setInterval(() => {
      const r = lockRemain();
      if (!r) {
        clearInterval(cdIv); cdIv = null;
        clearErr();
        const b = $("#lkGo"); if (b) b.disabled = false;
        return;
      }
      err("⌛ محاولات كثيرة — أعد المحاولة بعد " + Math.ceil(r / 1000) + " ثانية");
    }, 1000);
  }

  /* ================= تقديم النموذج ================= */
  function submit() {
    if (mode === "setup") return doSetup();
    if (mode === "recovery") return doRecovery();
    return doLogin();
  }

  function validPass(p) { return typeof p === "string" && p.length >= 6; }

  function doSetup() {
    const name = ($("#lkName").value || "").trim();
    const uname = ($("#lkUser").value || "").trim();
    const pass = $("#lkPass").value || "";
    const pass2 = $("#lkPass2").value || "";
    clearErr();
    if (name.length < 3) return err("اكتب اسمك الكامل (3 أحرف على الأقل).");
    if (!/^[a-z0-9._\- ]{3,24}$/i.test(uname)) return err("اسم المستخدم: حروف وأرقام ومسافات فقط (3–24).");
    if (!validPass(pass)) return err("الرمز السري: 6 خانات على الأقل.");
    if (pass !== pass2) return err("الرمزان غير متطابقين.");
    const A = a();
    const u = {
      id: Store.uid("u"), name, user: uname.toLowerCase(), salt: newSalt(),
      pass: "", role: "owner", active: true, created: Date.now(), last: null
    };
    u.pass = hashPass(pass, u.salt);
    u.last = Date.now();
    A.users.push(u);
    A.session = { uid: u.id, t: Date.now() };
    A.fails = 0; A.lockUntil = 0;
    addLog(true, u.user, u.name, "إنشاء حساب المالك");
    allow();
    unlock(u);
    showRecoveryCode(true);
  }

  function doLogin() {
    const uname = ($("#lkUser").value || "").trim().toLowerCase();
    const pass = $("#lkPass").value || "";
    const A = a();
    clearErr();
    if (lockRemain()) {
      startCooldown();
      return err("⌛ محاولات كثيرة — أعد المحاولة بعد " + Math.ceil(lockRemain() / 1000) + " ثانية");
    }
    const u = A.users.find(x => String(x.user || "").toLowerCase() === uname);
    const okUser = !!u;
    const okPass = okUser && u.pass === hashPass(pass, u.salt);
    if (!okUser || !okPass) {
      A.fails = (A.fails || 0) + 1;
      addLog(false, uname || "—", u ? u.name : "غير معروف", okUser ? "رمز سري خاطئ" : "مستخدم غير موجود");
      if (A.fails >= 3) { A.lockUntil = Date.now() + 30000; A.fails = 0; allow(); show("login");
        const e = $("#lkErr"); e.hidden = false;
        e.textContent = "⚠️ رمز خاطئ 3 مرات — الإيقاف 30 ثانية للحماية.";
        startCooldown(); return; }
      allow();
      return err("❌ بيانات الدخول غير صحيحة (محاولة " + A.fails + " من 3).");
    }
    if (!u.active) {
      addLog(false, u.user, u.name, "حساب معطّل");
      allow();
      return err("⛔ هذا الحساب معطّل — تواصل مع المالك.");
    }
    A.fails = 0; A.lockUntil = 0;
    u.last = Date.now();
    A.session = { uid: u.id, t: Date.now() };
    addLog(true, u.user, u.name, "تسجيل دخول ناجح");
    allow();
    unlock(u);
  }

  function doRecovery() {
    const code = ($("#lkRec").value || "").trim().toUpperCase();
    const pass = $("#lkPass").value || "";
    const pass2 = ($("#lkPass2").value || "");
    clearErr();
    const A = a();
    const owner = A.users.find(u => u.role === "owner");
    if (!A.recovery) return err("لا يوجد رمز استعادة — اطلب من المالك توليد رمز جديد.");
    if (sha256(code) !== A.recovery) {
      addLog(false, "—", "استعادة", "رمز استعادة خاطئ");
      allow();
      return err("❌ رمز الاستعادة غير صحيح.");
    }
    if (!owner) return err("لا يوجد حساب مالك لاستعادته.");
    if (!validPass(pass)) return err("الرمز الجديد: 6 خانات على الأقل.");
    if (pass !== pass2) return err("الرمزان غير متطابقين.");
    owner.salt = newSalt();
    owner.pass = hashPass(pass, owner.salt);
    owner.last = Date.now();
    A.session = { uid: owner.id, t: Date.now() };
    A.fails = 0; A.lockUntil = 0;
    addLog(true, owner.user, owner.name, "استعادة الحساب برمز الاستعادة");
    allow();
    unlock(owner);
    UI.toast("تمت إعادة تعيين رمز المالك ✓");
  }

  /* ================= فتح القفل ================= */
  function unlock(u) {
    current = u;
    applyRole();
    hide();
    if (!nextFn) return;
    if (!booted) { booted = true; nextFn(); }
    else {
      App.refreshSidebar();
      const el = document.querySelector(".view.active");
      if (el) App.render(el.id.replace("view-", ""));
    }
  }

  function lock() {
    const A = a();
    addLog(true, current ? current.user : "—", current ? current.name : "—", "تسجيل خروج / قفل");
    A.session = null;
    current = null;
    applyRole();
    allow();
    show("login");
    UI.toast("تم قفل البرنامج 🔒");
  }

  /* حساب المالك الوحيد المضمّن في الكود (الرمز مخزّن مجزّأاً فقط — لا يظهر نصاً) */
  const OWNER = {
    name: "Emad Al-Deen",
    user: "Emad Al-Deen",
    salt: "mycoach-emad-1995-salt",
    pass: "433e564dcec06e127220335a347cdec358d0de0fe1b092533b3712f2d14faef0"
  };

  /* بذور حساب المالك تلقائياً عند أول فتح — لا توجد شاشة إنشاء هنا */
  function seedOwner() {
    const A = a();
    if (A.users.length) return;
    A.users.push({
      id: Store.uid("u"), name: OWNER.name, user: OWNER.user,
      salt: OWNER.salt, pass: OWNER.pass,
      role: "owner", active: true, created: Date.now(), last: null
    });
    allow();
  }

  /* نقطة الدخول — تُستدعى من تهيئة التطبيق */
  function gate(startApp) {
    nextFn = startApp;
    seedOwner();
    const A = a();
    if (!A.users.length) return show("setup");
    const s = A.session;
    const u = s && A.users.find(x => x.id === s.uid && x.active);
    if (!u) return show("login");
    u.last = Date.now();
    allow();
    unlock(u);
  }

  /* ================= رمز الاستعادة ================= */
  function newRecoveryCode() {
    const code = "MC-" + newToken(4) + "-" + newToken(4);
    const A = a();
    A.recovery = sha256(code);
    allow();
    return code;
  }
  function showRecoveryCode(first) {
    const code = newRecoveryCode();
    UI.modal({
      title: first ? "✅ تم إنشاء حساب المالك" : "♻️ رمز استعادة جديد",
      hideSave: true,
      body: `
        <p style="font-size:14px;line-height:1.8;margin-bottom:10px">
          ${first ? "احتفظ بهذا الرمز في مكان آمن — به تستعيد رمزك إذا نسيته." : "احتفظ بالرمز الجديد واحذف القديم."}
        </p>
        <div class="code-box"><code id="recCode">${esc(code)}</code>
          <button class="btn btn-soft" id="btnCopyCode">📋 نسخ</button></div>
        <p class="muted" style="font-size:12.5px;margin-top:10px">
          ⚠️ لن يظهر هذا الرمز مرة أخرى. لا تشاركه مع أحد، وبياناتك تبقى محلياً في متصفحك.
        </p>`
    });
    const b = $("#btnCopyCode");
    if (b) b.onclick = async () => {
      const txt = $("#recCode").textContent;
      try { await navigator.clipboard.writeText(txt); UI.toast("نُسخ الرمز ✓"); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents($("#recCode"));
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        try { document.execCommand("copy"); UI.toast("نُسخ الرمز ✓"); }
        catch (e2) { UI.toast("انسخ الرمز يدوياً", "warn"); }
      }
    };
  }

  /* ================= إدارة المستخدمين ================= */
  function fmtRole(r) {
    const x = ROLES[r] || ROLES.viewer;
    return `<span class="badge ${x.cls}">${x.ar}</span>`;
  }

  function renderUsers() {
    if (!can("users")) return;
    const A = a();
    const bAdd = $("#btnAddUser"); if (bAdd) bAdd.onclick = () => userForm(null);
    const bRec = $("#btnRecovery"); if (bRec) bRec.onclick = () => showRecoveryCode(false);
    const bLog = $("#btnClearLog"); if (bLog) bLog.onclick = clearLog;
    const last = A.users.reduce((m, u) => Math.max(m, u.last || 0), 0);

    const stats = $("#uStats");
    if (stats) stats.innerHTML = `
      <div class="card"><div class="k">المستخدمون</div><div class="v">${A.users.length}</div>
        <div class="s">${A.users.filter(u => u.active).length} مُفعّل</div></div>
      <div class="card i2"><div class="k">دخول ناجح (24 س)</div><div class="v">${okCount24()}</div>
        <div class="s">السجل يحتفظ بآخر ${A.logs.length} محاولة</div></div>
      <div class="card i3"><div class="k">محاولات فاشلة (24 س)</div><div class="v">${failCount24()}</div>
        <div class="s">${lockRemain() ? "⌛ الإيقاف فعّال الآن" : "لا توجد مهلة حالية"}</div></div>
      <div class="card i4"><div class="k">آخر دخول</div><div class="v" style="font-size:15px">${last ? esc(dt(last)) : "—"}</div>
        <div class="s">معرّف هذا الجهاز: <b>${esc(A.deviceId)}</b></div></div>`;

    const list = $("#userList");
    if (list) {
      list.innerHTML = `
        <p class="muted" style="margin-bottom:12px">
          🔑 <b>أنت المسؤول الوحيد</b> بإضافة المستخدمين والمشرفين — المشرف يعدّل البيانات، والمستخدم العادي يشاهد فقط.
        </p>
        <div class="u-table"><div class="u-head">
          <span>الاسم</span><span>اسم الدخول</span><span>الدور</span><span>الحالة</span><span>آخر دخول</span><span></span>
        </div>
        ${A.users.map(u => `
          <div class="u-row ${u.id === current.id ? "me" : ""}">
            <span><b>${esc(u.name)}</b>${u.id === current.id ? ' <i class="me-tag">أنت</i>' : ""}</span>
            <span class="mono">${esc(u.user)}</span>
            <span>${fmtRole(u.role)}</span>
            <span>${u.active ? '<b class="ok-t">مُفعّل</b>' : '<b class="bad-t">معطّل</b>'}</span>
            <span class="mono">${u.last ? esc(dt(u.last)) : "لم يدخل بعد"}</span>
            <span class="u-act">
              <button class="btn btn-sm btn-ghost" data-edit="${u.id}">✏️ تعديل</button>
              <button class="btn btn-sm btn-ghost" data-pass="${u.id}">🔑 رمز</button>
              ${u.id !== current.id ? `<button class="btn btn-sm btn-ghost" data-del="${u.id}">🗑️</button>` : ""}
            </span>
          </div>`).join("")}
        </div>`;
      list.onclick = e => {
        const ed = e.target.closest("[data-edit]"), ps = e.target.closest("[data-pass]"), dl = e.target.closest("[data-del]");
        if (ed) userForm(ed.dataset.edit);
        if (ps) passForm(ps.dataset.pass);
        if (dl) delUser(dl.dataset.del);
      };
    }

    const log = $("#loginLog");
    if (log) log.innerHTML = A.logs.length ? `
      <div class="u-table logs"><div class="u-head">
        <span>الوقت</span><span>المستخدم</span><span>النتيجة</span><span>الجهاز</span><span>معرّف</span>
      </div>
      ${A.logs.slice(0, 60).map(l => `
        <div class="u-row">
          <span class="mono">${esc(dt(l.t))}</span>
          <span><b>${esc(l.name)}</b><br><i class="mono muted">${esc(l.user)}</i></span>
          <span>${l.ok ? '<b class="ok-t">✓ ' + esc(l.why || "دخول ناجح") + "</b>"
                       : '<b class="bad-t">✗ ' + esc(l.why || "فشل") + "</b>"}</span>
          <span>${esc(l.b || "—")} · ${esc(l.o || "—")} · ${esc(l.k || "—")}</span>
          <span class="mono">${esc(l.dev || "—")}</span>
        </div>`).join("")}
      </div>
      <p class="muted" style="font-size:12px;margin-top:10px">
        📌 السجل محفوظ محلياً في هذا الجهاز (وليس على خادم) — يُصدَّر مع النسخة الاحتياطية JSON.
      </p>`
      : UI.empty("📋", "لا توجد محاولات دخول بعد", "سيظهر هنا كل دخول وفشل مع الوقت والجهاز.");
  }

  function userForm(id) {
    if (!can("users")) return;
    const A = a();
    const u = id ? A.users.find(x => x.id === id) : null;
    UI.modal({
      title: u ? "تعديل المستخدم" : "مستخدم جديد",
      body: `
        <div class="form-grid">
          <label>الاسم الكامل<input id="uName" placeholder="اسم المستخدم" value="${esc(u ? u.name : "")}"></label>
          <label>اسم المستخدم (دخول)<input id="uLogin" autocomplete="off" value="${esc(u ? u.user : "")}"></label>
          <label>الرمز السري<input id="uPass" type="password" placeholder="${u ? "اتركه فارغاً لعدم التغيير" : "6 خانات على الأقل"}"></label>
          <label>الدور / Role
            <select id="uRole">
              <option value="supervisor" ${u && u.role === "supervisor" ? "selected" : ""}>🛡️ مشرف — يعدّل البيانات ولا يدير المستخدمين</option>
              <option value="viewer" ${u && u.role === "viewer" ? "selected" : ""}>👤 مستخدم — قراءة فقط</option>
            </select>
          </label>
          <label class="chk"><input type="checkbox" id="uActive" ${!u || u.active ? "checked" : ""}> الحساب مُفعّل (يسمح بالدخول)</label>
        </div>
        <p class="muted" style="font-size:12.5px;margin-top:6px">
          👑 حساب المالك واحد ولا يمكن تعديل دوره من هنا — أنت المالك.
        </p>`,
      saveText: u ? "حفظ التعديل" : "إضافة المستخدم",
      onSave: () => {
        const name = $("#uName").value.trim();
        const uname = $("#uLogin").value.trim().toLowerCase();
        const pass = $("#uPass").value;
        const role = $("#uRole").value;
        const active = $("#uActive").checked;
        if (name.length < 3) return UI.toast("اكتب الاسم الكامل", "err");
        if (!/^[a-z0-9._\- ]{3,24}$/.test(uname)) return UI.toast("اسم المستخدم: حروف وأرقام ومسافات (3–24)", "err");
        if (A.users.some(x => x.user === uname && (!u || x.id !== u.id))) return UI.toast("اسم الدخول مستخدم بالفعل", "err");
        if (!u && !validPass(pass)) return UI.toast("الرمز السري: 6 خانات على الأقل", "err");
        if (u && pass && !validPass(pass)) return UI.toast("الرمز الجديد: 6 خانات على الأقل", "err");
        if (u) {
          u.name = name; u.user = uname; u.role = role; u.active = active;
          if (pass) { u.salt = newSalt(); u.pass = hashPass(pass, u.salt); }
          Store.log(`عدّل المستخدم «${name}» (${ROLES[role].en})`);
        } else {
          const salt = newSalt();
          const nu = { id: Store.uid("u"), name, user: uname, salt,
                       pass: hashPass(pass, salt), role, active, created: Date.now(), last: null };
          A.users.push(nu);
          Store.log(`أضاف مستخدماً جديداً «${name}» — ${ROLES[role].ar}`);
        }
        allow();
        UI.closeModal();
        renderUsers();
        UI.toast(u ? "حُفظت التعديلات ✓" : "أُضيف المستخدم ✓");
      }
    });
  }

  function passForm(id) {
    if (!can("users") && (!current || current.id !== id)) return;
    const A = a();
    const u = A.users.find(x => x.id === id);
    if (!u) return;
    const self = current && current.id === u.id;
    UI.modal({
      title: self ? "تغيير رمزك السري" : `تغيير رمز «${u.name}»`,
      body: `
        <div class="form-grid">
          ${self ? `<label>الرمز الحالي<input id="pOld" type="password" placeholder="رمزك الحالي"></label>` : ""}
          <label>الرمز الجديد<input id="pNew" type="password" placeholder="6 خانات على الأقل"></label>
          <label>تأكيد الرمز الجديد<input id="pNew2" type="password"></label>
        </div>`,
      saveText: "تحديث الرمز",
      onSave: () => {
        const old = $("#pOld") ? $("#pOld").value : "";
        const nw = $("#pNew").value, nw2 = $("#pNew2").value;
        if (self && u.pass !== hashPass(old, u.salt)) return UI.toast("الرمز الحالي غير صحيح", "err");
        if (!validPass(nw)) return UI.toast("الرمز الجديد: 6 خانات على الأقل", "err");
        if (nw !== nw2) return UI.toast("الرمزان غير متطابقين", "err");
        u.salt = newSalt();
        u.pass = hashPass(nw, u.salt);
        Store.log(`غيّر رمز الدخول لـ «${u.name}»`);
        allow();
        UI.closeModal();
        renderUsers();
        UI.toast("تم تحديث الرمز ✓");
      }
    });
  }

  function delUser(id) {
    if (!can("users")) return;
    const A = a();
    const u = A.users.find(x => x.id === id);
    if (!u) return;
    if (u.role === "owner") return UI.toast("لا يمكن حذف حساب المالك", "err");
    if (current && u.id === current.id) return UI.toast("لا يمكنك حذف حسابك أنت", "err");
    UI.confirm(`حذف المستخدم <b>${esc(u.name)}</b> نهائياً؟ لن يستطيع الدخول بعد الآن.`, () => {
      A.users = A.users.filter(x => x.id !== id);
      Store.log(`حذف المستخدم «${u.name}»`);
      allow();
      renderUsers();
      UI.toast("حُذف المستخدم", "warn");
    });
  }

  function clearLog() {
    if (!can("users")) return;
    UI.confirm("مسح <b>كل</b> سجل محاولات الدخول؟", () => {
      a().logs = [];
      allow();
      renderUsers();
      UI.toast("مُسح السجل", "warn");
    });
  }

  /* ================= الواجهة العامة ================= */
  return {
    gate, can, role, user, lock, applyRole, renderUsers,
    saveAllowed, blocked, bypass, allow,
    sha256, hashPass, userForm, passForm, clearLog, showRecoveryCode, addLog
  };
})();

/* التصدير إلى window كي تعمل حارات الصلاحيات (window.Auth) في بقية ملفات التطبيق */
window.Auth = Auth;
