/* ============================================================
   ميزانيتي | MIZANIYATI — التطبيق الرئيسي
   شاشات القفل/الإنشاء، القائمة، التوجيه، القفل التلقائي، المزامنة
   ============================================================ */
const App = (() => {
  const VERSION = '1.0.0';
  const VIEWS = {
    dashboard: ViewDashboard, tx: ViewTx, accounts: ViewAccounts,
    budget: ViewBudget, recurring: ViewRecurring, advisor: ViewAdvisor,
    reports: ViewReports, settings: ViewSettings,
  };
  const NAV = [
    { id: 'dashboard', icon: 'dashboard', key: 'navDashboard' },
    { id: 'tx', icon: 'tx', key: 'navTx' },
    { id: 'accounts', icon: 'accounts', key: 'navAccounts' },
    { id: 'budget', icon: 'budget', key: 'navBudget' },
    { id: 'recurring', icon: 'recurring', key: 'navRecurring' },
    { id: 'advisor', icon: 'advisor', key: 'navAdvisor' },
    { id: 'reports', icon: 'reports', key: 'navReports' },
    { id: 'settings', icon: 'settings', key: 'navSettings' },
  ];

  let current = 'dashboard';
  let lastActivity = Date.now();
  let currentPinValue = null;   // للجلسة فقط — يُستخدم لفك النسخة السحابية
  const data = () => Vault.data();

  /* ============================================================
     شاشات الدخول
     ============================================================ */
  function showAuth(mode = 'unlock') {
    U.$('#lock-screen').classList.remove('hidden');
    U.$('#app').classList.add('hidden');
    renderAuth(mode);
  }
  function hideAuth() {
    U.$('#lock-screen').classList.add('hidden');
    U.$('#app').classList.remove('hidden');
  }

  function renderAuth(mode) {
    const box = U.$('#lock-card');
    box.innerHTML = '';
    const logo = U.el('div', { class: 'auth-logo' },
      U.el('img', { src: 'assets/img/icon-192.png', alt: 'MIZANIYATI', width: 84, height: 84, onerror: 'this.style.display="none"' }),
      U.el('h1', {}, t('appName')),
      U.el('p', { class: 'muted' }, t('appTag')));

    /* مبدّل اللغة على شاشة القفل */
    const langBtn = U.el('button', {
      class: 'btn btn-ghost btn-sm lang-btn', title: t('language'),
      onclick: () => { I18n.setLang(I18n.lang() === 'ar' ? 'en' : 'ar'); renderAuth(mode); },
    }, I18n.lang() === 'ar' ? 'EN' : 'عربي');

    if (mode === 'setup') box.append(logo, setupForm(), langBtn);
    else if (mode === 'recover') box.append(logo, recoverForm(), langBtn);
    else box.append(logo, unlockForm(), langBtn);
    document.body.dataset.locked = '1';
  }

  /* ---------- إنشاء خزنة جديدة ---------- */
  function setupForm() {
    const form = U.el('form', { class: 'form auth-form' },
      U.el('h2', {}, t('setupTitle')),
      U.el('p', { class: 'muted small' }, t('setupSub')),
      U.el('label', { class: 'fld' }, t('yourName'),
        U.el('input', { class: 'input', name: 'name', required: true, autocomplete: 'name', placeholder: I18n.lang() === 'ar' ? 'الاسم الكامل' : 'Full name' })),
      U.el('label', { class: 'fld' }, t('currency'),
        U.el('select', { class: 'input', name: 'currency' },
          Object.entries(Data.CURRENCIES).map(([code, c]) =>
            U.el('option', { value: code, selected: code === 'YER' }, `${c.sym} — ${I18n.lang() === 'ar' ? c.ar : c.en}`)))),
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('setPin'),
          U.el('input', { class: 'input', name: 'pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]{4,8}', title: t('pinWeak'), required: true, autocomplete: 'new-password', placeholder: '••••' })),
        U.el('label', { class: 'fld' }, t('confirmPin'),
          U.el('input', { class: 'input', name: 'pin2', type: 'password', inputmode: 'numeric', required: true, autocomplete: 'new-password', placeholder: '••••' }))),
      U.el('p', { class: 'muted small' }, t('pinHint')),
      U.el('button', { class: 'btn btn-primary full', type: 'submit' }, icHTML('lock', 'btn-ic'), t('createVault')));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const pin = (fd.get('pin') || '').toString();
      const pin2 = (fd.get('pin2') || '').toString();
      if (!name) return U.toast(t('nameRequired'), 'err');
      if (!/^\d{4,8}$/.test(pin)) return U.toast(t('pinWeak'), 'err');
      if (pin !== pin2) return U.toast(t('pinMismatch'), 'err');
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = t('loading');
      try {
        const { recovery } = await Vault.create({ name, pin, currency: fd.get('currency') });
        currentPinValue = pin;
        await showRecovery(recovery);
        enterApp();
      } catch (err) { U.toast(`${t('error')}: ${err.message}`, 'err'); btn.disabled = false; }
    });
    return form;
  }

  function showRecovery(code) {
    return new Promise(res => {
      const codeEl = U.el('div', { class: 'recovery-code', id: 'recovery-code' }, code);
      U.modal({
        title: `${icHTML('shield')} ${t('emergencyTitle')}`,
        body: U.el('div', { class: 'confirm-body' },
          U.el('p', {}, t('emergencySub')), codeEl,
          U.el('button', {
            class: 'btn btn-ghost full', onclick: async () => {
              try { await navigator.clipboard.writeText(code); U.toast(t('copied')); }
              catch { U.toast(code, 'info', 8000); }
            },
          }, icHTML('copy', 'btn-ic'), t('copy'))),
        actions: [{ label: t('iSavedIt'), class: 'btn-primary', onClick: c => { c(); res(); } }],
        onClose: () => res(),
      });
    });
  }

  /* ---------- فتح الخزنة ---------- */
  function unlockForm() {
    const form = U.el('form', { class: 'form auth-form' },
      U.el('h2', {}, t('unlockTitle')),
      U.el('p', { class: 'muted small' }, t('unlockSub')),
      U.el('label', { class: 'fld' },
        U.el('input', {
          class: 'input input-pin', name: 'pin', type: 'password', inputmode: 'numeric',
          'aria-label': t('unlock'), required: true, autocomplete: 'current-password', placeholder: '••••',
        })),
      U.el('div', { class: 'auth-msg', id: 'auth-msg' }),
      U.el('button', { class: 'btn btn-primary full', type: 'submit' }, icHTML('unlock', 'btn-ic'), t('unlock')),
      U.el('button', { class: 'btn btn-ghost full', type: 'button', onclick: () => renderAuth('recover') }, icHTML('shield', 'btn-ic'), t('forgotPin')));
    let fails = 0, lockedUntil = 0;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (Date.now() < lockedUntil) return;
      const pin = (new FormData(form).get('pin') || '').toString();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      try {
        await Vault.unlock(pin);
        currentPinValue = pin;
        enterApp();
      } catch {
        fails++;
        const left = Math.max(0, 3 - fails);
        U.$('#auth-msg').textContent = left ? `${t('wrongPin')} — ${t('attemptsLeft', { n: left })}` : t('wrongPin');
        form.querySelector('[name=pin]').value = '';
        if (fails >= 3) {
          lockedUntil = Date.now() + 30000;
          U.$('#auth-msg').textContent = `${t('wrongPin')} — 30s`;
          setTimeout(() => { fails = 0; U.$('#auth-msg').textContent = ''; renderAuth('unlock'); }, 30000);
        }
        btn.disabled = false;
      }
    });
    return form;
  }

  /* ---------- الاستعادة ---------- */
  function recoverForm() {
    const form = U.el('form', { class: 'form auth-form' },
      U.el('h2', {}, t('recoverTitle')),
      U.el('p', { class: 'muted small' }, t('recoverSub')),
      U.el('label', { class: 'fld' }, t('recoveryCode'),
        U.el('input', { class: 'input', name: 'code', required: true, dir: 'ltr', placeholder: 'MZ-XXXX-XXXX-XXXX', autocomplete: 'off' })),
      U.el('label', { class: 'fld' }, t('newPin'),
        U.el('input', { class: 'input', name: 'pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]{4,8}', required: true, placeholder: '••••' })),
      U.el('div', { class: 'auth-msg', id: 'auth-msg' }),
      U.el('button', { class: 'btn btn-primary full', type: 'submit' }, icHTML('shield', 'btn-ic'), t('recover')),
      U.el('button', { class: 'btn btn-ghost full', type: 'button', onclick: () => renderAuth('unlock') }, icHTML('arrowL', 'btn-ic'), t('back')));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const code = (fd.get('code') || '').toString();
      const pin = (fd.get('pin') || '').toString();
      if (!/^\d{4,8}$/.test(pin)) return U.toast(t('pinWeak'), 'err');
      try {
        await Vault.recover(code, pin);
        currentPinValue = pin;
        U.toast(t('pinChanged'));
        enterApp();
      } catch (err) {
        U.$('#auth-msg').textContent = err.message === 'BAD_RECOVERY' ? t('wrongRecovery') : t('wrongPin');
      }
    });
    return form;
  }

  /* ---------- الدخول للتطبيق ---------- */
  async function enterApp() {
    const d = data();
    /* أول دخول: استعادة الإعدادات المحفوظة */
    I18n.setLang(d.settings.lang || I18n.lang());
    applyTheme();
    hideAuth();
    document.body.dataset.locked = '0';
    buildShell();
    navigate(current);
    Sync.setPinProvider(() => currentPinValue);
    resetIdle();
    if (d.sync?.enabled && d.sync.owner) {
      setTimeout(() => Sync.autoSync(), 1500);
    }
    /* تنفيذ تلقائي للفواتير المستحقة */
    await autoRunRecurring();
  }

  async function autoRunRecurring() {
    const d = data();
    const due = Recurring.dueList(d).filter(r => r.autoRun !== false);
    if (!due.length) return;
    due.forEach(r => Recurring.run(d, r.id));
    await save();
    setTimeout(() => U.toast(`${icHTML('recurring')} ${t('runAll')} (${due.length})`, 'info'), 900);
  }

  function lock() {
    Vault.lock();
    currentPinValue = null;
    document.body.dataset.locked = '1';
    U.$('#app').classList.add('hidden');
    U.$('#lock-screen').classList.remove('hidden');
    renderAuth('unlock');
  }

  /* ============================================================
     الهيكل: القائمة + الشريط العلوي
     ============================================================ */
  function buildShell() {
    const side = U.$('#sidebar');
    side.innerHTML = '';
    side.append(
      U.el('div', { class: 'brand' },
        U.el('img', { src: 'assets/img/icon-192.png', width: 34, height: 34, alt: '', onerror: 'this.style.display="none"' }),
        U.el('div', {}, U.el('b', {}, t('appName')), U.el('span', { class: 'muted small' }, `v${VERSION}`))),
      U.el('nav', { class: 'nav' }, NAV.map(n => U.el('button', {
        class: `nav-item ${n.id === current ? 'on' : ''}`, dataset: { id: n.id },
        onclick: () => { navigate(n.id); closeSidebar(); },
      }, ic(n.icon, 'nav-ic'), U.el('span', {}, t(n.key))))),
      U.el('div', { class: 'side-foot' },
        U.el('div', { class: 'sync-mini', id: 'sync-mini' }, ic('cloud', 'mini-ic'), U.el('span', {}, '—')),
        U.el('div', { class: 'side-user' },
          U.el('span', { class: 'avatar' }, (data().profile.name || 'M')[0]),
          U.el('span', { class: 'grow' }, data().profile.name),
          U.el('button', { class: 'icon-btn', title: t('lock'), onclick: () => lock() }, ic('lock')))));

    const top = U.$('#topbar');
    top.innerHTML = '';
    /* حقل البحث (يفلترة المعاملات) */
    const searchInput = U.el('input', {
      type: 'search', class: 'top-search-input', id: 'global-search',
      placeholder: t('searchPlaceholder'), autocomplete: 'off',
    });
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (current !== 'tx') navigate('tx');
      /* التنقل يُنفَّذ عبر hashchange غير متزامن ← ننتظر حتى يظهر حقل البحث */
      const apply = tries => {
        const box = U.$('#tx-search');
        if (box) { box.value = q; box.dispatchEvent(new Event('input')); return; }
        if (tries > 0) setTimeout(() => apply(tries - 1), 40);
      };
      apply(10);
    });
    top.append(
      U.el('button', { class: 'icon-btn menu-btn', 'aria-label': t('menu'), onclick: () => toggleSidebar() }, ic('menu')),
      U.el('h1', { class: 'top-title' }, t(NAV.find(n => n.id === current)?.key || 'navDashboard')),
      U.el('div', { class: 'grow' }),
      U.el('div', { class: 'top-search' }, ic('search', 'ts-ic'), searchInput),
      U.el('button', {
        class: 'icon-btn', title: t('language'),
        onclick: async () => {
          const nd = I18n.lang() === 'ar' ? 'en' : 'ar';
          I18n.setLang(nd); data().settings.lang = nd; await save(); buildShell(); navigate(current, true);
        },
      }, I18n.lang() === 'ar' ? 'EN' : 'ع'),
      U.el('button', {
        class: 'icon-btn', title: t('theme'),
        onclick: async () => {
          const order = ['light', 'dark', 'ocean', 'royal'];
          const cur = data().settings.theme || 'light';
          data().settings.theme = order[(order.indexOf(cur) + 1) % order.length];
          await save(); applyTheme();
        },
      }, ic('palette')),
      U.el('button', { class: 'icon-btn notif-btn', title: t('syncNow'), onclick: () => doSync() }, ic('bell'),
        U.el('span', { class: 'notif-dot hidden', id: 'notif-dot' })),
      U.el('div', { class: 'top-avatar', title: data().profile.name },
        U.el('span', { class: 'avatar' }, (data().profile.name || 'M')[0]),
        ic('arrowDown', 'ta-ic')),
      U.el('button', { class: 'icon-btn', title: t('lock'), onclick: () => lock() }, ic('lock')));
    updateSyncMini();
  }

  function toggleSidebar() { U.$('#app').classList.toggle('side-open'); }
  function closeSidebar() { U.$('#app').classList.remove('side-open'); }

  function navigate(route, force = false) {
    if (!VIEWS[route]) route = 'dashboard';
    if (route === current && !force) { /* يسمح بإعادة العرض */ }
    current = route;
    if (location.hash !== `#/${route}`) location.hash = `#/${route}`;
    U.$$('#sidebar .nav-item').forEach(b => b.classList.toggle('on', b.dataset.id === route));
    U.$('#topbar .top-title').textContent = t(NAV.find(n => n.id === route)?.key || 'navDashboard');
    render();
  }

  function render() {
    const view = VIEWS[current];
    const root = U.$('#view');
    if (!view) return;
    try { view.render(root, {}); } catch (e) { console.error(e); root.innerHTML = ''; root.append(UIX.empty(`${t('error')}: ${e.message}`, 'danger')); }
    updateSyncMini();
  }

  /* ============================================================
     الحفظ + المزامنة
     ============================================================ */
  async function save() {
    await Vault.save(data());
    if (data().sync?.enabled && data().sync.owner) Sync.autoSync();
    updateSyncMini();
  }
  async function replaceData(incoming) {
    await Vault.replaceData(incoming);
    I18n.setLang(incoming.settings?.lang || I18n.lang());
    applyTheme();
  }
  async function doSync() {
    if (!data().sync?.enabled) { navigate('settings'); setTimeout(() => { location.hash = '#/settings/sync'; }, 60); return; }
    U.toast(t('syncPushing'), 'info', 1500);
    try {
      const res = await Sync.run();
      if (res.action === 'conflict') { navigate('settings'); ViewSettings.conflictDialog(res, data()); return; }
      if (res.action === 'pulled') { buildShell(); }
      U.toast(res.action === 'up-to-date' ? t('syncOk', { t: U.relTime(Date.now()) }) : t('saved'));
      render();
    } catch (e) { U.toast(t('syncErr', { e: e.message }), 'err', 5000); }
    updateSyncMini();
  }
  function updateSyncMini() {
    const el = U.$('#sync-mini'); if (!el) return;
    const s = data()?.sync;
    const lbl = el.querySelector('span');
    const txt = (!s?.enabled || !s.owner) ? t('syncOff')
      : s.lastSync ? `${t('lastSync')}: ${U.relTime(s.lastSync)}` : t('syncNotConfigured');
    if (lbl) lbl.textContent = txt; else el.textContent = txt;
  }

  /* ============================================================
     المظهر + القفل التلقائي + التشغيل
     ============================================================ */
  function applyTheme() {
    const th = data()?.settings?.theme || localStorage.getItem('mizan.theme') || 'light';
    document.documentElement.dataset.theme = th;
    localStorage.setItem('mizan.theme', th);
    const meta = U.$('meta[name=theme-color]');
    if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0d1117';
    /* إعادة رسم الرسوم البيانية المفتوحة */
    if (Vault.isUnlocked()) render();
  }

  function resetIdle() { lastActivity = Date.now(); }
  function startIdleWatch() {
    ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'].forEach(ev =>
      window.addEventListener(ev, resetIdle, { passive: true }));
    setInterval(() => {
      if (!Vault.isUnlocked()) return;
      const limit = (data()?.settings?.autoLockMin ?? 15) * 60000;
      if (limit > 0 && Date.now() - lastActivity > limit) { lock(); U.toast(t('lock'), 'warn'); }
    }, 15000);
    /* مزامنة دورية كل دقيقة */
    setInterval(() => { if (Vault.isUnlocked()) Sync.autoSync(); }, 60000);
    window.addEventListener('online', () => { if (Vault.isUnlocked()) Sync.autoSync(); });
  }

  function boot() {
    /* وضع تجريبي في المتصفح فقط */
    if (!window.crypto?.subtle) {
      U.$('#lock-card').innerHTML = `<p class="muted">${icHTML('danger')} هذا المتصفح لا يدعم التشفير (Web Crypto). استخدم Chrome / Edge حديثاً.</p>`;
      return;
    }
    I18n.setLang(localStorage.getItem('mizan.lang') || 'ar');
    document.documentElement.dataset.theme = localStorage.getItem('mizan.theme') || 'light';
    startIdleWatch();
    window.addEventListener('hashchange', () => {
      if (!Vault.isUnlocked()) return;
      const r = location.hash.replace('#/', '').split('/')[0] || 'dashboard';
      if (VIEWS[r] && r !== current) navigate(r, true);
    });
    if (Vault.exists()) showAuth('unlock');
    else showAuth('setup');
    /* تسجيل PWA (يتجاهل الأخطاء محلياً) */
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  const api = {
    data, save, navigate, render, lock, applyTheme, replaceData, doSync, VERSION,
    openTx: tx => ViewTx.edit(tx),
    closeSidebar, buildShell,
  };
  document.addEventListener('DOMContentLoaded', boot);
  return api;
})();
