/* =========================================================
   MyCoach — قسم اللاعبين (Squad / Players)
   قائمة اللاعبين + خطة كل لاعب + تقرير الفريق القابل للطباعة
   ========================================================= */
const Players = (() => {
  const f = { q: "", pos: "", group: "" };

  /* ---------- أدوات مساعدة ---------- */
  function ageOf(p) {
    if (p.dob) {
      const d = new Date(p.dob);
      if (!isNaN(d)) {
        const a = Math.floor((Date.now() - d.getTime()) / 31557600000);
        if (a >= 0 && a < 100) return a;
      }
    }
    const a = parseInt(p.age, 10);
    return isNaN(a) ? null : a;
  }
  function bmiOf(p) {
    if (!p.h || !p.w) return null;
    return Math.round((p.w / Math.pow(p.h / 100, 2)) * 10) / 10;
  }
  function bmiCat(b) {
    if (b == null) return "";
    if (b < 18.5) return "نقص وزن";
    if (b < 25) return "طبيعي";
    if (b < 30) return "زيادة وزن";
    return "سمنة";
  }
  const posOf = p => POSITIONS[p.pos] || { ar: "—", en: "-", cls: "", ico: "", abbr: "-" };
  const grpOf = p => AGE_GROUPS[p.group] || { ar: "—", en: "-" };
  const planOf = p => Store.getPlan(p.planId);

  function filtered() {
    const st = Store.get();
    const q = (f.q || "").toLowerCase();
    return (st.players || []).filter(p =>
      (!f.pos || p.pos === f.pos) &&
      (!f.group || p.group === f.group) &&
      (!q || (p.name || "").toLowerCase().indexOf(q) > -1 || String(p.num || "").indexOf(q) > -1));
  }

  /* ---------- العرض ---------- */
  function render() {
    const st = Store.get();
    const all = st.players || [];
    const list = filtered();
    const withPlan = all.filter(p => planOf(p)).length;
    const ages = all.map(ageOf).filter(a => a != null);
    const avgAge = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : null;
    const bmis = all.map(bmiOf).filter(b => b != null);
    const avgBmi = bmis.length ? Math.round(bmis.reduce((a, b) => a + b, 0) / bmis.length * 10) / 10 : null;

    UI.$("#playerStats").innerHTML = `
      <div class="card"><div class="k">اللاعبون</div><div class="v">${all.length}</div>
        <div class="s">${list.length} مطابق للفلتر الحالي</div></div>
      <div class="card i2"><div class="k">مع خطة تدريبية</div><div class="v">${withPlan}</div>
        <div class="s">${all.length - withPlan} بدون خطة بعد</div></div>
      <div class="card i3"><div class="k">متوسط العمر</div><div class="v">${avgAge != null ? avgAge : "—"}</div>
        <div class="s">${avgAge != null ? "سنة" : "لا توجد أعمار"}${avgBmi != null ? " · متوسط BMI " + avgBmi : ""}</div></div>
      <div class="card i4"><div class="k">المراكز المشغولة</div><div class="v">${new Set(all.map(p => p.pos)).size}</div>
        <div class="s">من ${Object.keys(POSITIONS).length} مراكز</div></div>`;

    const grid = UI.$("#playerGrid");
    if (!all.length) {
      grid.innerHTML = UI.empty("⚽", "لا يوجد لاعبون بعد",
        "أضف لاعبيك لتخزين خططهم التدريبية ومتابعة مركزهم وفئتهم وقياساتهم.",
        `<button class="btn btn-primary" id="btnEmptyPlayer">+ لاعب جديد</button>`);
      UI.$("#btnEmptyPlayer").onclick = () => form();
      return;
    }
    if (!list.length) {
      grid.innerHTML = UI.empty("🔍", "لا نتائج مطابقة", "غيّر كلمة البحث أو أعد ضبط المراكز والفئات.");
      return;
    }
    grid.innerHTML = list.map(card).join("");
  }

  function card(p) {
    const pos = posOf(p), age = ageOf(p), bmi = bmiOf(p), plan = planOf(p);
    return `<div class="item player-card" data-id="${p.id}">
      <div class="item-hd">
        <div style="display:flex;gap:10px;align-items:center;min-width:0">
          <div class="avatar ${UI.grad(p.id)}">${p.num !== "" && p.num != null ? p.num : UI.initials(p.name)}</div>
          <div style="min-width:0">
            <h3>${UI.esc(p.name)}</h3>
            <div class="en">${UI.esc(pos.ar)}${p.num ? " · #" + p.num : ""}</div>
          </div>
        </div>
        <span class="pos-badge ${pos.cls}">${pos.ico} ${pos.abbr}</span>
      </div>
      <div class="item-bd">
        ${UI.tag(grpOf(p).ar, "info")}
        ${age != null ? UI.tag(age + " سنة", "warn") : ""}
        ${bmi != null ? UI.tag("BMI " + bmi, bmi < 25 ? "ok" : "bad") : ""}
        <div class="kv"><span>الطول / الوزن</span><b>${p.h ? p.h + " سم" : "—"} · ${p.w ? p.w + " كجم" : "—"}</b></div>
        <div class="kv"><span>الخطة الحالية</span><b>${plan ? UI.esc(plan.name) : "بدون خطة"}</b></div>
        ${p.notes ? `<p class="muted" style="font-size:12.5px;margin:9px 0 0;line-height:1.6">${UI.esc(p.notes)}</p>` : ""}
      </div>
      <div class="item-ft">
        <button class="btn btn-sm btn-soft" data-act="open">فتح</button>
        <button class="btn btn-sm btn-soft" data-act="assign">📋 خطة</button>
        <button class="btn btn-sm btn-soft" data-act="edit">تعديل</button>
        <button class="btn btn-sm btn-danger" data-act="del">حذف</button>
      </div>
    </div>`;
  }

  /* ---------- إضافة / تعديل لاعب ---------- */
  function form(p) {
    const st = Store.get();
    const editing = !!p;
    const v = p || { name: "", pos: "mf", group: "senior", num: "", dob: "", age: "", h: "", w: "", planId: "", notes: "" };
    const planOpts = st.plans.map(pl =>
      `<option value="${pl.id}" ${v.planId === pl.id ? "selected" : ""}>${UI.esc(pl.name)} · ${typeof pl.freeText === "string" ? "✍️ نصي" : pl.days.length + " أيام"}</option>`).join("");

    UI.modal({
      title: editing ? `تعديل بيانات «${p.name}»` : "إضافة لاعب جديد",
      body: `<div class="form-grid">
        <label>اسم اللاعب / Player name
          <input type="text" id="plName" value="${UI.esc(v.name)}" placeholder="مثال: محمد صلاح"></label>
        <label>رقم القميص / Shirt number
          <input type="number" id="plNum" min="0" max="99" value="${v.num === "" ? "" : v.num}" placeholder="9"></label>
        <label>المركز / Position
          <select id="plPos">${Object.entries(POSITIONS).map(([k, o]) =>
            `<option value="${k}" ${v.pos === k ? "selected" : ""}>${o.ico} ${o.ar} · ${o.en}</option>`).join("")}</select></label>
        <label>الفئة العمرية / Age group
          <select id="plGroup">${Object.entries(AGE_GROUPS).map(([k, o]) =>
            `<option value="${k}" ${v.group === k ? "selected" : ""}>${o.ar} · ${o.en}</option>`).join("")}</select></label>
        <label>تاريخ الميلاد / Date of birth
          <input type="date" id="plDob" value="${UI.esc(v.dob || "")}"></label>
        <label>العمر / Age (سنوات)
          <input type="number" id="plAge" min="8" max="60" value="${v.age === "" ? "" : v.age}" placeholder="يُحسب من الميلاد"></label>
        <label>الطول / Height (سم)
          <input type="number" id="plH" min="120" max="230" value="${v.h === "" ? "" : v.h}" placeholder="175"></label>
        <label>الوزن / Weight (كجم)
          <input type="number" id="plW" min="35" max="200" value="${v.w === "" ? "" : v.w}" placeholder="72"></label>
        <label style="grid-column:1/-1">الخطة التدريبية / Training plan
          <select id="plPlan"><option value="">— بدون خطة —</option>${planOpts}</select></label>
      </div>
      <label style="margin-top:12px">ملاحظات المدرب / Notes
        <textarea id="plNotes" placeholder="نقاط القوة والضعف، إصابات، تعليمات خاصة…">${UI.esc(v.notes || "")}</textarea></label>`,
      saveText: editing ? "حفظ التعديلات" : "إضافة اللاعب",
      onSave() {
        const name = UI.$("#plName").value.trim();
        if (!name) { UI.toast("أدخل اسم اللاعب", "err"); UI.$("#plName").focus(); return; }
        const data = {
          name,
          num: UI.$("#plNum").value,
          pos: UI.$("#plPos").value,
          group: UI.$("#plGroup").value,
          dob: UI.$("#plDob").value,
          age: UI.$("#plAge").value,
          h: UI.$("#plH").value,
          w: UI.$("#plW").value,
          planId: UI.$("#plPlan").value,
          notes: UI.$("#plNotes").value.trim()
        };
        if (editing) Object.assign(p, data);
        else st.players.push(Object.assign({ id: Store.uid("pl") }, data));
        Store.log(editing ? `عدّلت بيانات اللاعب ${name}` : `أضفت اللاعب «${name}» إلى الفريق`);
        Store.save(); UI.closeModal(); render(); App.refreshSidebar();
        UI.toast(editing ? "تم حفظ التعديلات ✓" : `تمت إضافة «${name}» ✓`);
      }
    });
  }

  /* ---------- درج بيانات اللاعب ---------- */
  function open(p) {
    const pos = posOf(p), age = ageOf(p), bmi = bmiOf(p), plan = planOf(p);
    UI.drawer(
      `${UI.esc(p.name)} <span style="font-size:12px;color:var(--muted)">${UI.esc(pos.ar)}${p.num ? " · #" + p.num : ""}</span>`,
      `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
        <div class="avatar ${UI.grad(p.id)}" style="width:54px;height:54px;font-size:20px;flex:0 0 54px">${p.num !== "" && p.num != null ? p.num : UI.initials(p.name)}</div>
        <div style="min-width:0">
          <div style="font-weight:700;font-size:14.5px">${UI.esc(grpOf(p).ar)}${age != null ? " · " + age + " سنة" : ""}</div>
          <div class="muted" style="font-size:12.5px">${pos.ico} ${pos.en} · ${UI.esc(pos.ar)}${p.h ? " · " + p.h + " سم" : ""}${p.w ? " · " + p.w + " كجم" : ""}</div>
        </div>
      </div>
      <span class="pos-badge ${pos.cls}">${pos.ico} ${pos.abbr} — ${UI.esc(pos.ar)}</span>

      <div class="sect-title">البيانات الشخصية · Profile</div>
      <div class="kv"><span>الفئة العمرية</span><b>${UI.esc(grpOf(p).ar)}</b></div>
      <div class="kv"><span>العمر</span><b>${age != null ? age + " سنة" : "—"}</b></div>
      <div class="kv"><span>تاريخ الميلاد</span><b>${p.dob ? UI.esc(p.dob) : "—"}</b></div>
      <div class="kv"><span>الطول</span><b>${p.h ? p.h + " سم" : "—"}</b></div>
      <div class="kv"><span>الوزن</span><b>${p.w ? p.w + " كجم" : "—"}</b></div>
      <div class="kv"><span>مؤشر كتلة الجسم</span><b>${bmi != null ? bmi + " — " + bmiCat(bmi) : "—"}</b></div>

      <div class="sect-title">الخطة التدريبية · Program</div>
      ${plan ? `<div class="kv"><span>${UI.esc(plan.name)}</span><b>${typeof plan.freeText === "string" ? "✍️ خطة نصية" : plan.days.length + " أيام"}</b></div>
        ${typeof plan.freeText === "string"
          ? `<div class="free-preview">${UI.esc(plan.freeText)}</div>`
          : `<div class="stat-line">${plan.days.map(d => `<i>• ${UI.esc(d.name)}</i>`).join("")}</div>`}`
      : `<p class="muted" style="font-size:13.5px;margin:0">لا توجد خطة معيّنة لهذا اللاعب بعد — اضغط «تعيين خطة».</p>`}

      ${p.notes ? `<div class="sect-title">ملاحظات المدرب · Notes</div>
        <p style="font-size:13.5px;line-height:1.75;margin:0">${UI.esc(p.notes)}</p>` : ""}

      <div class="form-actions">
        <button class="btn btn-soft" data-pl="edit">✏️ تعديل</button>
        <button class="btn btn-soft" data-pl="assign">📋 تعيين خطة</button>
        ${plan ? `<button class="btn btn-primary" data-pl="print">🖨️ طباعة خطة اللاعب</button>` : ""}
        <button class="btn btn-danger" data-pl="del">🗑️ حذف</button>
      </div>`);

    UI.$$("#drawerBody [data-pl]").forEach(b => b.onclick = () => {
      const a = b.dataset.pl;
      UI.closeDrawer();
      if (a === "edit") form(p);
      else if (a === "assign") assign(p);
      else if (a === "print") printPlayer(p);
      else if (a === "del") del(p);
    });
  }

  /* ---------- تعيين خطة للاعب ---------- */
  function assign(p) {
    const st = Store.get();
    if (!st.plans.length) { UI.toast("أنشئ خطة تدريبية أولاً", "warn"); App.go("plans"); return; }
    UI.modal({
      title: `تعيين خطة لـ «${p.name}»`,
      body: `<label>الخطة التدريبية / Training plan
        <select id="plAssign"><option value="">— بدون خطة —</option>
        ${st.plans.map(pl => `<option value="${pl.id}" ${p.planId === pl.id ? "selected" : ""}>${UI.esc(pl.name)} · ${typeof pl.freeText === "string" ? "✍️ نصي" : pl.days.length + " أيام"}</option>`).join("")}
        </select></label>
      <p class="muted" style="font-size:13px">ستظهر الخطة في بطاقة اللاعب وفي تقرير الفريق المطبوع.</p>`,
      saveText: "تعيين الخطة",
      onSave() {
        p.planId = UI.$("#plAssign").value;
        const np = planOf(p);
        Store.log(np ? `سنّدت خطة «${np.name}» للاعب ${p.name}` : `أزلت خطة اللاعب ${p.name}`);
        Store.save(); UI.closeModal(); render();
        UI.toast(np ? `تم تعيين «${np.name}» ✓` : "تم إزالة الخطة ✓");
      }
    });
  }

  /* ---------- حذف ---------- */
  function del(p) {
    UI.confirm(`حذف اللاعب «${p.name}» نهائياً من الفريق؟`, () => {
      const st = Store.get();
      st.players = st.players.filter(x => x.id !== p.id);
      Store.log(`حذفت اللاعب «${p.name}»`);
      Store.save(); render(); App.refreshSidebar();
      UI.toast("تم حذف اللاعب");
    });
  }

  /* ---------- كتلة برنامج قابلة للطباعة ---------- */
  function planBlock(pl) {
    if (typeof pl.freeText === "string") return `<div class="p-text">${UI.esc(pl.freeText)}</div>`;
    let h = "";
    pl.days.forEach((d, i) => {
      h += `<div class="p-day"><h3>اليوم ${i + 1} — ${UI.esc(d.name)}</h3>
        <table><thead><tr><th style="width:30px">#</th><th>التمرين / Exercise</th>
        <th style="width:70px">مجموعات</th><th style="width:90px">تكرارات</th>
        <th style="width:80px">راحة (ث)</th></tr></thead><tbody>`;
      d.items.forEach((it, j) => {
        const e = Store.getEx(it.ex) || { ar: "—", en: "" };
        h += `<tr><td>${j + 1}</td>
          <td>${UI.esc(e.ar)}<br><span style="color:#666;font-size:11px">${UI.esc(e.en)}</span></td>
          <td>${it.sets}</td><td>${UI.esc(it.reps)}</td><td>${it.rest || "-"}</td></tr>`;
      });
      h += `</tbody></table></div>`;
    });
    return h;
  }

  /* ---------- طباعة كشف الفريق + البرامج ---------- */
  function printSquad() {
    const st = Store.get();
    const list = st.players || [];
    if (!list.length) { UI.toast("لا يوجد لاعبون لطباعة قائمتهم", "warn"); return; }

    const order = ["gk", "df", "mf", "fw"];
    const sorted = list.slice().sort((a, b) =>
      (order.indexOf(a.pos) - order.indexOf(b.pos)) || ((a.num || 0) - (b.num || 0)));

    let html = `<h1>قائمة الفريق — Squad List</h1>
      <div class="p-sub">${list.length} لاعب
      ${st.settings.gym ? " · " + UI.esc(st.settings.gym) : ""}
      ${st.settings.trainer ? " · المدرب: " + UI.esc(st.settings.trainer) : ""}
      · ${new Date().toLocaleDateString("ar-EG")}</div>
      <table><thead><tr>
        <th style="width:34px">#</th><th style="width:56px">القميص</th><th>الاسم / Name</th>
        <th>المركز / Position</th><th style="width:70px">الفئة</th><th style="width:52px">العمر</th>
        <th style="width:58px">الطول</th><th style="width:58px">الوزن</th><th>الخطة التدريبية</th>
      </tr></thead><tbody>`;
    sorted.forEach((p, i) => {
      const plan = planOf(p), age = ageOf(p), pos = posOf(p);
      html += `<tr><td>${i + 1}</td><td>${p.num || "—"}</td><td>${UI.esc(p.name)}</td>
        <td>${UI.esc(pos.ar)} (${pos.abbr})</td><td>${UI.esc(grpOf(p).ar)}</td>
        <td>${age != null ? age : "—"}</td><td>${p.h || "—"}</td><td>${p.w || "—"}</td>
        <td>${plan ? UI.esc(plan.name) : "—"}</td></tr>`;
    });
    html += `</tbody></table>`;

    /* البرامج المعيّنة للفريق */
    const ids = [];
    list.forEach(p => { if (planOf(p) && ids.indexOf(p.planId) < 0) ids.push(p.planId); });
    ids.forEach(id => {
      const pl = Store.getPlan(id);
      const names = list.filter(p => p.planId === id).map(p => p.name).join("، ");
      html += `<div class="p-day"><h3>برنامج الفريق: ${UI.esc(pl.name)}</h3>
        <p style="font-size:12px;color:#555;margin:4px 0 0">اللاعبون المُسنَدون: ${UI.esc(names)}</p></div>`;
      html += planBlock(pl);
    });

    html += UI.printFooter();
    UI.print(html);
    Store.log(`اطلعت كشف الفريق (${list.length} لاعب)`);
  }

  /* ---------- طباعة ملف لاعب واحد ---------- */
  function printPlayer(p) {
    const plan = planOf(p), pos = posOf(p), age = ageOf(p), bmi = bmiOf(p);
    let html = `<h1>${UI.esc(p.name)}${p.num ? " — #" + p.num : ""}</h1>
      <div class="p-sub">${UI.esc(pos.ar)} · ${pos.en} · ${UI.esc(grpOf(p).ar)}
      ${age != null ? " · " + age + " سنة" : ""}
      ${p.dob ? " · الميلاد: " + UI.esc(p.dob) : ""}</div>
      <div class="p-grid">
        <div class="p-box"><b>القياسات</b>
          <div class="kv"><span>الطول</span><b>${p.h ? p.h + " سم" : "—"}</b></div>
          <div class="kv"><span>الوزن</span><b>${p.w ? p.w + " كجم" : "—"}</b></div>
          <div class="kv"><span>مؤشر كتلة الجسم</span><b>${bmi != null ? bmi + " — " + bmiCat(bmi) : "—"}</b></div>
        </div>
        <div class="p-box"><b>ملاحظات المدرب</b>
          <p style="margin:6px 0 0;font-size:13px">${p.notes ? UI.esc(p.notes) : "—"}</p>
        </div>
      </div>`;
    if (plan) {
      html += `<div class="p-day"><h3>البرنامج التدريبي — ${UI.esc(plan.name)}</h3>
        <p style="font-size:12px;color:#555;margin:4px 0 0">${typeof plan.freeText === "string" ? "خطة نصية حرّة" : plan.days.length + " أيام"} · ${UI.esc(plan.nameEn || "")}</p></div>`;
      html += planBlock(plan);
    }
    html += UI.printFooter();
    UI.print(html);
  }

  /* ---------- التهية ---------- */
  function init() {
    UI.$("#btnAddPlayer").onclick = () => form();
    UI.$("#btnPrintSquad").onclick = printSquad;
    UI.$("#playerSearch").oninput = e => { f.q = e.target.value.trim(); render(); };

    const posSel = UI.$("#playerPos");
    Object.entries(POSITIONS).forEach(([k, o]) =>
      posSel.insertAdjacentHTML("beforeend", `<option value="${k}">${o.ico} ${o.ar} · ${o.en}</option>`));
    posSel.onchange = e => { f.pos = e.target.value; render(); };

    const grpSel = UI.$("#playerGroup");
    Object.entries(AGE_GROUPS).forEach(([k, o]) =>
      grpSel.insertAdjacentHTML("beforeend", `<option value="${k}">${o.ar} · ${o.en}</option>`));
    grpSel.onchange = e => { f.group = e.target.value; render(); };

    UI.$("#playerGrid").addEventListener("click", e => {
      const item = e.target.closest(".player-card");
      if (!item) return;
      const p = Store.getPlayer(item.dataset.id);
      if (!p) return;
      const btn = e.target.closest("[data-act]");
      const act = btn ? btn.dataset.act : "open";
      if (act === "open") open(p);
      else if (act === "edit") form(p);
      else if (act === "assign") assign(p);
      else if (act === "del") del(p);
    });
  }

  return { init, render, form };
})();
