/* ============================================================
   ميزان | Mizan — نموذج البيانات العملياتي
   حسابات، حركات، ميزانية، فواتير متكررة — حسابات مشتقة
   ============================================================ */
const Model = (() => {
  const now = () => Date.now();
  const uid = p => U.uid(p);

  /* ---------- الحسابات ---------- */
  const Accounts = {
    balances(data) {
      const b = {};
      data.accounts.forEach(a => b[a.id] = Number(a.opening) || 0);
      data.tx.forEach(x => {
        if (b[x.accId] == null) b[x.accId] = Number(data.accounts.find(a => a.id === x.accId)?.opening) || 0;
        b[x.accId] += x.type === 'income' ? Number(x.amount) : -Number(x.amount);
      });
      return b;
    },
    balanceOf(data, accId) {
      const a = data.accounts.find(x => x.id === accId);
      let v = a ? Number(a.opening) || 0 : 0;
      data.tx.forEach(x => { if (x.accId === accId) v += x.type === 'income' ? Number(x.amount) : -Number(x.amount); });
      return v;
    },
    totalBalance(data) {
      return Object.values(Accounts.balances(data)).reduce((s, v) => s + v, 0);
    },
    /* صافي المركز = الأصول - الالتزامات (بطاقات ائتمان برصيد سالب) */
    netWorth(data) {
      const b = Accounts.balances(data);
      let assets = 0, liab = 0;
      data.accounts.forEach(a => {
        const v = b[a.id] || 0;
        if (a.type === 'credit' && v < 0) liab += -v; else assets += v;
      });
      return { assets, liab, net: assets - liab };
    },
    add(data, acc) {
      const a = { id: uid('acc'), createdAt: now(), opening: 0, type: 'cash', ...acc };
      data.accounts.push(a); return a;
    },
    update(data, id, patch) {
      const a = data.accounts.find(x => x.id === id); if (a) Object.assign(a, patch); return a;
    },
    remove(data, id) {
      const n = data.tx.filter(x => x.accId === id).length;
      if (n > 0) throw new Error('HAS_TX');
      data.accounts = data.accounts.filter(x => x.id !== id);
    },
    nameOf(data, id, lang) {
      const a = data.accounts.find(x => x.id === id);
      if (!a) return '—';
      return (lang || I18n.lang()) === 'ar' ? (a.nameAr || a.nameEn) : (a.nameEn || a.nameAr);
    },
  };

  /* ---------- الحركات ---------- */
  const Tx = {
    add(data, tx) {
      const t = { id: uid('tx'), createdAt: now(), note: '', ...tx };
      if (!t.date) t.date = U.todayISO();
      data.tx.push(t); Tx.sort(data); return t;
    },
    update(data, id, patch) {
      const x = data.tx.find(v => v.id === id); if (x) Object.assign(x, patch, { updatedAt: now() });
      Tx.sort(data); return x;
    },
    remove(data, id) { data.tx = data.tx.filter(x => x.id !== id); },
    sort(data) { data.tx.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0)); },
    month(data, mk) { return data.tx.filter(x => U.monthOf(x.date) === mk); },
    filter(data, { q = '', type = 'all', catId = 'all', accId = 'all', from = '', to = '', month = '' } = {}) {
      const s = q.trim().toLowerCase();
      return data.tx.filter(x => {
        if (month && U.monthOf(x.date) !== month) return false;
        if (type !== 'all' && x.type !== type) return false;
        if (catId !== 'all' && x.catId !== catId) return false;
        if (accId !== 'all' && x.accId !== accId) return false;
        if (from && x.date < from) return false;
        if (to && x.date > to) return false;
        if (s) {
          const hay = `${x.note || ''} ${Data.catName(Data.catById(x.catId))} ${Accounts.nameOf(data, x.accId)}`.toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      });
    },
    totals(list) {
      let inc = 0, exp = 0;
      list.forEach(x => x.type === 'income' ? inc += Number(x.amount) : exp += Number(x.amount));
      return { inc, exp, net: inc - exp };
    },
  };

  /* ---------- الميزانية ---------- */
  const Budget = {
    limitOf(data, catId) { return Number(data.budgets?.[catId]) || 0; },
    set(data, catId, limit) {
      data.budgets = data.budgets || {};
      if (limit > 0) data.budgets[catId] = limit; else delete data.budgets[catId];
    },
    usage(data, mk) {
      const spent = {};
      Tx.month(data, mk).filter(x => x.type === 'expense').forEach(x => spent[x.catId] = (spent[x.catId] || 0) + Number(x.amount));
      const rows = Object.entries(data.budgets || {}).map(([catId, limit]) => {
        const used = spent[catId] || 0;
        const pct = limit > 0 ? (used / limit) * 100 : 0;
        return { catId, limit, used, pct, left: limit - used, state: pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : 'good' };
      }).sort((a, b) => b.pct - a.pct);
      /* تصنيفات تجاوزت بلا حد */
      Object.entries(spent).forEach(([catId, used]) => {
        if (!data.budgets?.[catId]) rows.push({ catId, limit: 0, used, pct: 0, left: -used, state: 'nolimit' });
      });
      const totalLimit = rows.reduce((s, r) => s + r.limit, 0);
      const totalUsed = rows.filter(r => r.limit > 0).reduce((s, r) => s + r.used, 0);
      return { rows, totalLimit, totalUsed, totalPct: totalLimit ? (totalUsed / totalLimit) * 100 : 0 };
    },
  };

  /* ---------- الفواتير المتكررة ---------- */
  const Recurring = {
    add(data, r) {
      const item = { id: uid('rec'), active: true, freq: 'monthly', autoRun: true, createdAt: now(), ...r };
      item.nextDue = Recurring.computeNext(item);
      data.recurring.push(item); return item;
    },
    update(data, id, patch) {
      const r = data.recurring.find(x => x.id === id); if (r) Object.assign(r, patch);
      r.nextDue = Recurring.computeNext(r); return r;
    },
    remove(data, id) { data.recurring = data.recurring.filter(x => x.id !== id); },
    /* حساب الاستحقاق القادم بناءً على آخر تنفيذ */
    computeNext(r, from = new Date()) {
      const step = { weekly: 7, monthly: 30, quarterly: 91, yearly: 365 }[r.freq] || 30;
      const iso = d => `${d.getFullYear()}-${U.pad2(d.getMonth() + 1)}-${U.pad2(d.getDate())}`;
      const base = r.lastRun ? new Date(r.lastRun) : new Date(Math.max(+from, r.createdAt || 0));
      const d = new Date(Math.max(base.getTime(), from.getTime()));
      if (r.freq === 'monthly') {
        const day = r.day || Math.min(new Date(base).getDate() || 1, U.daysInMonth(`${d.getFullYear()}-${U.pad2(d.getMonth() + 1)}`));
        let nd = new Date(d.getFullYear(), d.getMonth(), day);
        if (nd <= from) nd = new Date(d.getFullYear(), d.getMonth() + 1, day);
        return iso(nd);
      }
      const nd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step);
      return iso(nd);
    },
    dueList(data, upto = U.todayISO()) {
      return data.recurring.filter(r => r.active !== false && r.nextDue && r.nextDue <= upto);
    },
    /* تنفيذ فاتورة → حركة */
    run(data, id) {
      const r = data.recurring.find(x => x.id === id); if (!r) return null;
      const accId = r.accId && data.accounts.some(a => a.id === r.accId) ? r.accId : data.accounts[0]?.id;
      const tx = Tx.add(data, { type: r.type, amount: Number(r.amount), accId, catId: r.catId, date: r.nextDue || U.todayISO(), note: r.name, recurringId: r.id });
      r.lastRun = U.todayISO();
      r.nextDue = Recurring.computeNext(r, new Date());
      return tx;
    },
    /* التصنيف الشهري المكافئ للعرض */
    monthlyEquivalent(r) {
      const n = { weekly: 4.33, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }[r.freq] || 1;
      return Number(r.amount) * n;
    },
  };

  return { Accounts, Tx, Budget, Recurring };
})();
const Accounts = Model.Accounts, Tx = Model.Tx, Budget = Model.Budget, Recurring = Model.Recurring;
