/* =========================================================
   MyCoach — إدارة الحالة والتخزين المحلي
   ========================================================= */
const KEY = "mycoach.v1";

const Store = (() => {
  let state = null;

  const defaults = () => ({
    settings: { trainer: "", gym: "", phone: "", theme: "dark", created: Date.now() },
    customExercises: [],
    favoriteEx: [],
    plans: [],
    clients: [],
    customFoods: [],
    dayPlan: null,
    activity: [],
    auth: null
  });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      state = parsed ? Object.assign(defaults(), parsed) : defaults();
      if (!state.plans.length && !state.clients.length) seed();
    } catch (e) { state = defaults(); warned = true; }
    return state;
  }

  let warned = false;
  function save() {
    /* حارس الصلاحيات: المستخدم بصلاحية «قراءة فقط» لا يستطيع حفظ أي تعديل */
    if (window.Auth && !Auth.saveAllowed()) { Auth.blocked(); return; }
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      if (!warned) { warned = true; UI.toast("تنبيه: التخزين غير متاح في هذا المتصفح — لن تُحفظ البيانات بعد إغلاق الصفحة", "warn"); }
    }
  }

  function uid(p) { return p + "-" + Math.random().toString(36).slice(2, 9); }

  function log(text) {
    state.activity.unshift({ t: text, d: Date.now() });
    state.activity = state.activity.slice(0, 25);
    save();
  }

  /* ---- بيانات تجريبية أولى عند أول تشغيل ---- */
  function seed() {
    const ex = id => EXERCISES.find(e => e.id === id);
    const mkPlan = (tpl) => ({
      id: uid("plan"),
      name: tpl.ar, nameEn: tpl.en, kind: tpl.kind, goal: tpl.goal, level: tpl.level,
      from: tpl.id, createdAt: Date.now(),
      notes: tpl.desc,
      days: tpl.dayList.map((d, i) => ({
        id: uid("day"), name: d.ar, nameEn: d.en,
        items: d.items.map(it => ({
          ex: it[0], sets: it[1], reps: it[2], rest: it[3],
          note: (ex(it[0]) || {}).tips ? "" : ""
        }))
      }))
    });
    state.plans = [mkPlan(PLAN_TEMPLATES[0]), mkPlan(PLAN_TEMPLATES[3]), mkPlan(PLAN_TEMPLATES[5])];

    const planId = state.plans[0].id;
    const p1 = state.plans[1].id;
    const now = Date.now(), D = 86400000;
    state.clients = [
      { id: uid("c"), name: "أحمد سالم", phone: "0501234567", goal: "bulk", level: "intermediate",
        joined: now - 60 * D, planId, notes: "يريد زيادة 6 كجم خلال 4 أشهر.",
        measurements: [
          { date: now - 60 * D, weight: 74, fat: 18, chest: 98, arm: 33, waist: 84, thigh: 55 },
          { date: now - 30 * D, weight: 77, fat: 17.5, chest: 100, arm: 34, waist: 83, thigh: 56 },
          { date: now - 5 * D, weight: 79.5, fat: 17, chest: 101, arm: 34.6, waist: 83.5, thigh: 57 }
        ],
        attendance: [
          { date: now - 12 * D, note: "تمرين ظهر — أداء ممتاز" },
          { date: now - 10 * D, note: "أرجل" },
          { date: now - 7 * D, note: "صدر — زاد 2.5 كجم" },
          { date: now - 3 * D, note: "دفع" }
        ] },
      { id: uid("c"), name: "سارة محمد", phone: "0559876543", goal: "cut", level: "beginner",
        joined: now - 30 * D, planId: p1, notes: "خسارة 5 كجم + رفع مستوى اللياقة.",
        measurements: [
          { date: now - 30 * D, weight: 68, fat: 30, chest: 92, arm: 30, waist: 78, thigh: 58 },
          { date: now - 15 * D, weight: 66.2, fat: 28.5, chest: 91, arm: 29.8, waist: 76, thigh: 57 },
          { date: now - 2 * D, weight: 64.8, fat: 27, chest: 90.5, arm: 29.9, waist: 74.5, thigh: 56.5 }
        ],
        attendance: [
          { date: now - 9 * D, note: "أول تمرين — تعافٍ جيد" },
          { date: now - 6 * D, note: "كامل الجسم" },
          { date: now - 4 * D, note: "كارديو 25 دقيقة" }
        ] }
    ];
    state.activity = [
      { t: "أنشأت خطة «دفع · سحب · أرجل — 3 أيام»", d: now - 4 * D },
      { t: "سنّدت كورس التضخيم لأحمد سالم", d: now - 3 * D },
      { t: "سجّلت قياساً جديداً لسارة محمد: 64.8 كجم", d: now - 2 * D },
      { t: "سجّلت حضور أحمد سالم", d: now - 1 * D }
    ];
    save();
  }

  return {
    get: () => state,
    load, save, uid, log,
    export: () => JSON.stringify(state, null, 2),
    import(obj) {
      if (!obj || typeof obj !== "object") throw new Error("ملف غير صالح");
      if (!("plans" in obj) && !("clients" in obj)) throw new Error("ملف نسخة احتياطية غير صحيح");
      state = Object.assign(defaults(), obj);
      save();
    },
    reset() { state = defaults(); save(); },

    /* ---- مساعدات عامة ---- */
    allExercises() { return state.customExercises.concat(EXERCISES); },
    getEx(id) { return this.allExercises().find(e => e.id === id); },
    allFoods() { return state.customFoods.concat(FOODS); },
    getPlan(id) { return state.plans.find(p => p.id === id); },
    getClient(id) { return state.clients.find(c => c.id === id); },
    isFav(id) { return state.favoriteEx.includes(id); },
    toggleFav(id) {
      const i = state.favoriteEx.indexOf(id);
      i > -1 ? state.favoriteEx.splice(i, 1) : state.favoriteEx.push(id);
      save(); return i === -1;
    }
  };
})();
