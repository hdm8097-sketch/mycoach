/* =========================================================
   MyCoach — عرض قاعدة التمارين
   ========================================================= */
const Exercises = (() => {
  const f = { q: "", muscle: "", equip: "", level: "", type: "", fav: false };

  function init() {
    UI.$("#exSearch").addEventListener("input", e => { f.q = e.target.value.trim(); render(); });
    UI.$("#exMuscle").addEventListener("change", e => { f.muscle = e.target.value; render(); });
    UI.$("#exEquip").addEventListener("change", e => { f.equip = e.target.value; render(); });
    UI.$("#exLevel").addEventListener("change", e => { f.level = e.target.value; render(); });
    UI.$("#exType").addEventListener("change", e => { f.type = e.target.value; render(); });
    UI.$("#btnExToggleFav").addEventListener("click", () => {
      f.fav = !f.fav;
      UI.$("#btnExToggleFav").classList.toggle("btn-primary", f.fav);
      UI.$("#btnExToggleFav").classList.toggle("btn-soft", !f.fav);
      render();
    });
    UI.$("#btnAddEx").addEventListener("click", () => form());
    fillSelects();
  }

  function fillSelects() {
    const m = UI.$("#exMuscle");
    Object.entries(MUSCLES).forEach(([k, v]) =>
      m.insertAdjacentHTML("beforeend", `<option value="${k}">${v.ico} ${v.ar} · ${v.en}</option>`));
    const q = UI.$("#exEquip");
    Object.entries(EQUIPMENT).forEach(([k, v]) =>
      q.insertAdjacentHTML("beforeend", `<option value="${k}">${v.ar} · ${v.en}</option>`));
    const l = UI.$("#exLevel");
    Object.entries(LEVELS).forEach(([k, v]) =>
      l.insertAdjacentHTML("beforeend", `<option value="${k}">${v.ar} · ${v.en}</option>`));
    const t = UI.$("#exType");
    Object.entries(TYPES).forEach(([k, v]) =>
      t.insertAdjacentHTML("beforeend", `<option value="${k}">${v.ar} · ${v.en}</option>`));
  }

  function chips() {
    const counts = {};
    Store.allExercises().forEach(e => counts[e.m] = (counts[e.m] || 0) + 1);
    UI.$("#exChips").innerHTML =
      `<button class="chip ${!f.muscle ? "active" : ""}" data-m="">الكل (${Store.allExercises().length})</button>` +
      Object.entries(MUSCLES).filter(([k]) => counts[k])
        .map(([k, v]) => `<button class="chip ${f.muscle === k ? "active" : ""}" data-m="${k}">
          ${v.ico} ${v.ar} (${counts[k]})</button>`).join("");
    UI.$$("#exChips .chip").forEach(c => c.onclick = () => {
      f.muscle = c.dataset.m; UI.$("#exMuscle").value = f.muscle; render();
    });
  }

  function list() {
    return Store.allExercises().filter(e => {
      if (f.fav && !Store.isFav(e.id)) return false;
      if (f.muscle && e.m !== f.muscle && !(e.ms || []).includes(f.muscle)) return false;
      if (f.equip && e.eq !== f.equip) return false;
      if (f.level && e.lv !== f.level) return false;
      if (f.type && e.t !== f.type) return false;
      if (f.q) {
        const s = (e.ar + " " + e.en + " " + (MUSCLES[e.m] || {}).ar).toLowerCase();
        if (!s.includes(f.q.toLowerCase())) return false;
      }
      return true;
    });
  }

  function render() {
    chips();
    const items = list();
    const custom = id => (Store.get().customExercises || []).some(x => x.id === id);
    if (!items.length) {
      UI.$("#exGrid").innerHTML = UI.empty("🔍", "لا توجد نتائج", "جرّب تغيير الفلاتر أو أضف تمريناً مخصصاً",
        `<button class="btn btn-primary" onclick="document.getElementById('btnAddEx').click()">+ تمرين مخصص</button>`);
      return;
    }
    UI.$("#exGrid").innerHTML = items.map(e => `
      <article class="item">
        <div class="item-hd">
          <div>
            <h3>${MUSCLES[e.m] ? MUSCLES[e.m].ico : "🏋️"} ${UI.esc(e.ar)}</h3>
            <div class="en">${UI.esc(e.en)}</div>
          </div>
          <button class="btn btn-sm btn-ghost" data-fav="${e.id}" title="مفضلة">${Store.isFav(e.id) ? "★" : "☆"}</button>
        </div>
        <div class="item-bd">
          <div>${UI.tag((MUSCLES[e.m] || {}).ar || "", "mus")}${UI.tag((EQUIPMENT[e.eq] || {}).ar || "")}
            ${UI.tag((LEVELS[e.lv] || {}).ar || "", e.lv === "beginner" ? "ok" : e.lv === "advanced" ? "bad" : "warn")}
            ${custom(e.id) ? UI.tag("مخصص", "info") : ""}</div>
          <div class="meta">
            <i>sets <b>${e.sets}</b></i><i>reps <b>${UI.esc(e.reps)}</b></i>
            ${e.rest ? `<i>rest <b>${e.rest}s</b></i>` : ""}
          </div>
        </div>
        <div class="item-ft">
          ${custom(e.id) ? `<button class="btn btn-sm btn-ghost" data-edit="${e.id}">✏️ تعديل</button>
            <button class="btn btn-sm btn-danger" data-del="${e.id}">حذف</button>` : ""}
          <button class="btn btn-sm btn-soft" data-add="${e.id}">＋ خطة</button>
          <button class="btn btn-sm btn-primary" data-open="${e.id}">التفاصيل</button>
        </div>
      </article>`).join("");

    UI.$$("#exGrid").forEach(g => {
      g.onclick = ev => {
        const t = ev.target.closest("button"); if (!t) return;
        if (t.dataset.open) open(t.dataset.open);
        else if (t.dataset.fav) { const on = Store.toggleFav(t.dataset.fav); UI.toast(on ? "أُضيف للمفضلة ★" : "أُزيل من المفضلة"); render(); }
        else if (t.dataset.add) addToPlan(t.dataset.add);
        else if (t.dataset.edit) form(Store.getEx(t.dataset.edit));
        else if (t.dataset.del) del(t.dataset.del);
      };
    });
  }

  /* ---------- التفاصيل (Drawer) ---------- */
  function open(id) {
    const e = Store.getEx(id); if (!e) return;
    const custom = (Store.get().customExercises || []).some(x => x.id === id);
    UI.drawer(
      `${UI.esc(e.ar)} <span class="en" style="font-size:12px;color:var(--muted)">${UI.esc(e.en)}</span>`,
      `
      <div class="panel"><div class="panel-bd">
        <div class="kv"><span>العضلة الرئيسية</span><b>${(MUSCLES[e.m] || {}).ico || ""} ${(MUSCLES[e.m] || {}).ar}</b></div>
        <div class="kv"><span>العضلات المساعدة</span><b>${(e.ms || []).map(k => (MUSCLES[k] || {}).ar).join(" · ")}</b></div>
        <div class="kv"><span>الجهاز</span><b>${(EQUIPMENT[e.eq] || {}).ar}</b></div>
        <div class="kv"><span>المستوى</span><b>${(LEVELS[e.lv] || {}).ar}</b></div>
        <div class="kv"><span>النوع</span><b>${(TYPES[e.t] || {}).ar}</b></div>
        <div class="kv"><span>المجموعات × التكرارات</span><b>${e.sets} × ${UI.esc(e.reps)}</b></div>
        ${e.rest ? `<div class="kv"><span>راحة بين المجموعات</span><b>${e.rest} ثانية</b></div>` : ""}
      </div></div>

      <div class="sect-title">طريقة التنفيذ · HOW TO</div>
      <ol style="padding-inline-start:20px;line-height:1.9;font-size:14px;margin:0">
        ${(e.steps || []).map(s => `<li>${UI.esc(s)}</li>`).join("")}
      </ol>

      ${e.tips ? `<div class="sect-title">نصيحة المدرب · COACH TIP</div>
        <div class="panel"><div class="panel-bd" style="font-size:14px;line-height:1.8">💡 ${UI.esc(e.tips)}</div></div>` : ""}

      <div class="filters" style="margin-top:14px">
        <button class="btn btn-primary" data-act="add">＋ أضف إلى خطة</button>
        <button class="btn btn-soft" data-act="fav">${Store.isFav(e.id) ? "★ في المفضلة" : "☆ أضف للمفضلة"}</button>
        ${custom ? `<button class="btn btn-ghost" data-act="edit">✏️ تعديل</button>` : ""}
      </div>`);
    UI.$("#drawerBody").onclick = ev => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.act === "add") addToPlan(e.id);
      if (b.dataset.act === "fav") { Store.toggleFav(e.id); UI.closeDrawer(); render(); }
      if (b.dataset.act === "edit") { UI.closeDrawer(); form(e); }
    };
  }

  /* ---------- إضافة تمرين إلى خطة ---------- */
  function addToPlan(exId) {
    const plans = Store.get().plans.filter(p => typeof p.freeText !== "string");
    if (!plans.length) {
      UI.toast("لا توجد خطط منظمة بعد — أنشئ خطة أولاً", "warn");
      App.go("plans"); return;
    }
    const opts = plans.map(p => `<option value="${p.id}">${UI.esc(p.name)}</option>`).join("");
    const dayOpts = p => (p.days || []).map((d, i) =>
      `<option value="${d.id}">${UI.esc(d.name)} — اليوم ${i + 1}</option>`).join("");
    UI.modal({
      title: "إضافة إلى خطة",
      body: `<div class="form-grid">
        <label>الخطة / Plan<select id="aPlan">${opts}</select></label>
        <label>اليوم / Day<select id="aDay">${dayOpts(plans[0])}</select></label>
        <label>المجموعات / Sets<input type="number" id="aSets" value="3" min="1" max="10"></label>
        <label>التكرارات / Reps<input type="text" id="aReps" value="${UI.esc((Store.getEx(exId) || {}).reps || "10")}"></label>
        <label>راحة (ث) / Rest<input type="number" id="aRest" value="${(Store.getEx(exId) || {}).rest || 60}" min="0" max="300"></label>
      </div>`,
      saveText: "إضافة",
      onSave() {
        const p = Store.getPlan(UI.$("#aPlan").value);
        const d = p.days.find(x => x.id === UI.$("#aDay").value);
        d.items.push({ ex: exId, sets: +UI.$("#aSets").value || 3, reps: UI.$("#aReps").value, rest: +UI.$("#aRest").value || 60 });
        Store.log(`أضاف ${Store.getEx(exId).ar} إلى خطة ${p.name}`);
        Store.save(); UI.closeModal(); UI.closeDrawer();
        UI.toast(`أُضيف إلى «${p.name}» — ${d.name}`);
        Plans.render();
      }
    });
    UI.$("#aPlan").onchange = e => {
      const p = Store.getPlan(e.target.value);
      UI.$("#aDay").innerHTML = dayOpts(p);
    };
  }

  /* ---------- نموذج التمرين المخصص ---------- */
  function form(ex) {
    const editing = !!ex;
    const msOpts = Object.entries(MUSCLES).map(([k, v]) =>
      `<option value="${k}" ${ex && ex.ms && ex.ms.includes(k) ? "selected" : ""}>${v.ar}</option>`).join("");
    UI.modal({
      title: editing ? "تعديل التمرين" : "تمرين مخصص جديد",
      wide: true,
      body: `<div class="form-grid">
        <label>الاسم بالعربي *<input type="text" id="fAr" value="${UI.esc(ex ? ex.ar : "")}" placeholder="مثال: ضغط صدر مائل"></label>
        <label>الاسم بالإنجليزي *<input type="text" id="fEn" value="${UI.esc(ex ? ex.en : "")}" placeholder="Incline Press"></label>
        <label>العضلة الرئيسية *<select id="fM">${msOpts}</select></label>
        <label>العضلات المساعدة (امسح لتحديد أكثر)
          <select id="fMs" multiple size="5">${msOpts}</select></label>
        <label>الجهاز / Equipment<select id="fEq">
          ${Object.entries(EQUIPMENT).map(([k, v]) => `<option value="${k}" ${ex && ex.eq === k ? "selected" : ""}>${v.ar}</option>`).join("")}
        </select></label>
        <label>المستوى / Level<select id="fLv">
          ${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}" ${ex && ex.lv === k ? "selected" : ""}>${v.ar}</option>`).join("")}
        </select></label>
        <label>النوع / Type<select id="fT">
          ${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${ex && ex.t === k ? "selected" : ""}>${v.ar}</option>`).join("")}
        </select></label>
        <label>المجموعات / Sets<input type="number" id="fSets" value="${ex ? ex.sets : 3}" min="1" max="10"></label>
        <label>التكرارات / Reps<input type="text" id="fReps" value="${UI.esc(ex ? ex.reps : "8-12")}"></label>
        <label>راحة (ث) / Rest<input type="number" id="fRest" value="${ex ? ex.rest : 60}" min="0" max="300"></label>
      </div>
      <div class="sep"></div>
      <label>خطوات التنفيذ (كل خطوة في سطر)<textarea id="fSteps" rows="4">${UI.esc(ex ? (ex.steps || []).join("\n") : "")}</textarea></label>
      <label style="margin-top:12px">نصيحة المدرب<textarea id="fTips" rows="2">${UI.esc(ex ? ex.tips : "")}</textarea></label>`,
      saveText: editing ? "حفظ التعديلات" : "إضافة التمرين",
      onSave() {
        const ar = UI.$("#fAr").value.trim(), en = UI.$("#fEn").value.trim();
        if (!ar || !en) return UI.toast("أدخل الاسم بالعربي والإنجليزي", "err");
        const ms = Array.from(UI.$("#fMs").selectedOptions).map(o => o.value);
        const obj = {
          id: ex ? ex.id : Store.uid("ex"),
          ar, en,
          m: UI.$("#fM").value,
          ms: ms.length ? ms : [UI.$("#fM").value],
          eq: UI.$("#fEq").value, lv: UI.$("#fLv").value, t: UI.$("#fT").value,
          sets: +UI.$("#fSets").value || 3, reps: UI.$("#fReps").value || "8-12",
          rest: +UI.$("#fRest").value || 60,
          steps: UI.$("#fSteps").value.split("\n").map(s => s.trim()).filter(Boolean),
          tips: UI.$("#fTips").value.trim()
        };
        const arr = Store.get().customExercises;
        if (editing) { const i = arr.findIndex(x => x.id === ex.id); if (i > -1) arr[i] = obj; }
        else arr.push(obj);
        Store.log(`${editing ? "عدّل" : "أضاف"} تمريناً مخصصاً: ${ar}`);
        Store.save(); UI.closeModal(); render(); App.refreshSidebar();
        UI.toast(editing ? "تم حفظ التعديلات ✓" : "أُضيف التمرين ✓");
      }
    });
    if (ex && ex.m) UI.$("#fM").value = ex.m;
  }

  function del(id) {
    const e = Store.getEx(id);
    UI.confirm(`حذف التمرين «${UI.esc(e.ar)}»؟ لا يمكن التراجع.`, () => {
      const arr = Store.get().customExercises;
      const i = arr.findIndex(x => x.id === id);
      if (i > -1) arr.splice(i, 1);
      Store.save(); render(); App.refreshSidebar();
      UI.toast("تم الحذف", "warn");
    });
  }

  return { init, render, open, addToPlan, form };
})();
