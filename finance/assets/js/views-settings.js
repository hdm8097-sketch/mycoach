/* ============================================================
   ميزان | Mizan — شاشة الإعدادات (ملف، مظهر، أمان، مزامنة، نسخ)
   ============================================================ */
const ViewSettings = {
  route: 'settings',
  render(root) {
    const data = App.data();
    root.innerHTML = '';
    root.append(UIX.page({ title: t('settingsTitle'), desc: t('privacyNote') }));

    const nav = U.el('div', { class: 'settings-nav' });
    const body = U.el('div', { class: 'settings-body' });
    const sections = [
      { id: 'profile', icon: 'user', label: t('profile') },
      { id: 'appearance', icon: 'palette', label: t('appearance') },
      { id: 'security', icon: 'lock', label: t('security') },
      { id: 'sync', icon: 'cloud', label: t('dataSync') },
      { id: 'backup', icon: 'doc', label: t('backup') },
      { id: 'about', icon: 'info', label: t('about') },
    ];
    const show = id => {
      nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
      body.innerHTML = '';
      ({ profile: this.profile, appearance: this.appearance, security: this.security, sync: this.sync, backup: this.backup, about: this.about })[id].call(this, body, data);
    };
    sections.forEach(s => nav.append(U.el('button', { class: 'set-tab', dataset: { id: s.id }, onclick: () => show(s.id) }, icHTML(s.icon, 'tab-ic'), ' ', s.label)));
    root.append(U.el('div', { class: 'settings-layout' }, nav, body));
    show(location.hash.split('/')[2] || 'profile');
  },

  /* ---------- الملف الشخصي ---------- */
  profile(body, data) {
    const form = U.el('form', { class: 'form' },
      U.el('label', { class: 'fld' }, t('yourName'),
        U.el('input', { class: 'input', name: 'name', value: data.profile.name || '' })),
      U.el('label', { class: 'fld' }, t('currency'),
        U.el('select', { class: 'input', name: 'currency' },
          Object.entries(Data.CURRENCIES).map(([code, c]) =>
            U.el('option', { value: code, selected: data.profile.currency === code }, `${c.sym} — ${I18n.lang() === 'ar' ? c.ar : c.en}`)))),
      U.el('label', { class: 'fld' }, t('savingsRate'),
        U.el('input', { class: 'input', name: 'target', type: 'number', min: '1', max: '90', value: data.profile.savingsTarget || 20 }),
        U.el('span', { class: 'muted small' }, t('weightsNote'))),
      U.el('button', { class: 'btn btn-primary', type: 'submit' }, t('save')));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      data.profile.name = (fd.get('name') || '').toString().trim() || data.profile.name;
      data.profile.currency = fd.get('currency');
      data.profile.savingsTarget = Math.min(90, Math.max(1, Number(fd.get('target')) || 20));
      await App.save(); U.toast(t('saved')); App.render();
    });
    body.append(UIX.card(`${icHTML('user')} ${t('profile')}`, form));
  },

  /* ---------- المظهر واللغة ---------- */
  appearance(body, data) {
    const themes = [
      { id: 'dark', icon: 'moon', label: t('themeDark') },
      { id: 'light', icon: 'sun', label: t('themeLight') },
      { id: 'ocean', icon: 'drop', label: t('themeOcean') },
      { id: 'royal', icon: 'crown', label: t('themeRoyal') },
    ];
    const cur = data.settings.theme || 'light';
    body.append(UIX.card(`${icHTML('palette')} ${t('theme')}`,
      U.el('div', { class: 'theme-grid' }, themes.map(th => U.el('button', {
        class: `theme-card ${th.id} ${cur === th.id ? 'on' : ''}`,
        onclick: async () => { data.settings.theme = th.id; await App.save(); App.applyTheme(); this.appearance(body, data); },
      }, U.el('span', { class: 'th-ic' }, ic(th.icon)), U.el('span', {}, th.label))))));

    body.append(UIX.card(`${icHTML('globe')} ${t('language')}`,
      U.el('div', { class: 'seg' },
        [['ar', 'العربية'], ['en', 'English']].map(([id, label]) => U.el('button', {
          class: `seg-btn ${I18n.lang() === id ? 'on' : ''}`,
          onclick: async () => { I18n.setLang(id); data.settings.lang = id; await App.save(); App.render(); },
        }, label)))));
  },

  /* ---------- الأمان ---------- */
  security(body, data) {
    const meta = Vault.meta();
    body.append(UIX.card(`${icHTML('lock')} ${t('security')}`,
      U.el('p', { class: 'muted' }, I18n.lang() === 'ar'
        ? 'بياناتك مشفّرة بـ AES-256 والمفتاح مشتق من رمزك السري عبر PBKDF2 (250,000 جولة). لا يُرسل أي شيء لأي خادم.'
        : 'Your data is AES-256 encrypted and the key is derived from your PIN via PBKDF2 (250,000 iterations). Nothing is sent to any server.'),
      U.el('div', { class: 'kv' },
        U.el('div', {}, U.el('span', {}, t('createdAt')), U.el('b', {}, U.fmtDate(new Date(meta.createdAt || Date.now()).toISOString().slice(0, 10)))),
        U.el('div', {}, U.el('span', {}, t('lastSync')), U.el('b', {}, data.sync?.lastSync ? U.relTime(data.sync.lastSync) : t('syncOff'))))));

    /* تغيير الرمز */
    const pinForm = U.el('form', { class: 'form' },
      U.el('label', { class: 'fld' }, t('currentPin'),
        U.el('input', { class: 'input', name: 'old', type: 'password', inputmode: 'numeric', autocomplete: 'current-password', required: true })),
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('enterNewPin'),
          U.el('input', { class: 'input', name: 'nw', type: 'password', inputmode: 'numeric', pattern: '[0-9]{4,8}', title: t('pinWeak'), required: true })),
        U.el('label', { class: 'fld' }, t('confirmPin'),
          U.el('input', { class: 'input', name: 'nw2', type: 'password', inputmode: 'numeric', required: true }))),
      U.el('button', { class: 'btn btn-primary', type: 'submit' }, t('changePin')));
    pinForm.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(pinForm);
      const nw = (fd.get('nw') || '').toString();
      if (!/^\d{4,8}$/.test(nw)) return U.toast(t('pinWeak'), 'err');
      if (nw !== (fd.get('nw2') || '').toString()) return U.toast(t('pinMismatch'), 'err');
      try {
        await Vault.changePin((fd.get('old') || '').toString(), nw);
        U.toast(t('pinChanged')); pinForm.reset();
      } catch { return U.toast(t('wrongPin'), 'err'); }
    });
    body.append(UIX.card(`${icHTML('unlock')} ${t('changePin')}`, pinForm));

    /* القفل التلقائي */
    const lockSel = U.el('select', { class: 'input' },
      [0, 1, 5, 15, 30, 60].map(m => U.el('option', { value: m, selected: (data.settings.autoLockMin ?? 15) === m },
        m === 0 ? t('never') : t('minutes', { n: m }))));
    lockSel.addEventListener('change', async () => { data.settings.autoLockMin = Number(lockSel.value); await App.save(); U.toast(t('saved')); });
    body.append(UIX.card(`${icHTML('recurring')} ${t('autoLock')}`, lockSel));

    /* رمز الطوارئ */
    body.append(UIX.card(`${icHTML('shield')} ${t('recoveryCode')}`,
      U.el('p', { class: 'muted small' }, I18n.lang() === 'ar'
        ? 'رمز الطوارئ يُعرض مرة واحدة فقط عند إنشاء الخزنة. احفظه في مكان آمن — بفقدانه وفقدان رمزك السري لن يمكن استعادة البيانات.'
        : 'The emergency code is shown only once when the vault is created. Keep it safe — without it and your PIN, data cannot be recovered.'),
      U.el('button', {
        class: 'btn btn-ghost', onclick: () => U.modal({
          title: `${icHTML('shield')} ${t('emergencyTitle')}`,
          body: U.el('div', { class: 'confirm-body' }, U.el('p', {}, t('emergencySub'))),
          actions: [{ label: t('ok'), class: 'btn-primary' }],
        }),
      }, t('showRecovery'))));
  },

  /* ---------- المزامنة ---------- */
  sync(body, data) {
    const s = data.sync || (data.sync = { enabled: false, owner: '', repo: 'mizan-vault', branch: 'main', pat: '', path: 'vault.enc.json', lastSync: 0, log: [] });
    const status = U.el('div', { class: 'sync-status' });
    const renderStatus = (kind, text) => {
      status.innerHTML = '';
      status.append(U.el('span', { class: `sync-pill ${kind}` },
        ic(kind === 'busy' ? 'refresh' : kind === 'ok' ? 'check' : kind === 'err' ? 'danger' : 'cloud', 'pill-ic'), ' ', text));
    };
    renderStatus(s.enabled && s.owner ? 'ok' : 'off',
      s.enabled && s.owner ? t('syncOk', { t: s.lastSync ? U.relTime(s.lastSync) : '—' }) : t('syncNotConfigured'));

    const form = U.el('form', { class: 'form' },
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('ghOwner'),
          U.el('input', { class: 'input', name: 'owner', value: s.owner || '', placeholder: 'your-username', dir: 'ltr' })),
        U.el('label', { class: 'fld' }, t('ghRepo'),
          U.el('input', { class: 'input', name: 'repo', value: s.repo || 'mizan-vault', dir: 'ltr' }))),
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('ghBranch'),
          U.el('input', { class: 'input', name: 'branch', value: s.branch || 'main', dir: 'ltr' })),
        U.el('label', { class: 'fld' }, `${t('ghToken')} ${icHTML('lock', 'lbl-ic')}`,
          U.el('input', { class: 'input', name: 'pat', type: 'password', value: s.pat || '', placeholder: 'ghp_…', dir: 'ltr', autocomplete: 'off' }))),
      U.el('p', { class: 'muted small' }, t('tokenHelpSub'), ' ',
        U.el('a', { href: 'https://github.com/settings/tokens', target: '_blank', rel: 'noopener' }, icHTML('arrowUR', 'lbl-ic'), ' ', t('tokenHelp'))),
      U.el('button', { class: 'btn btn-primary', type: 'submit' }, t('save')));

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      s.owner = (fd.get('owner') || '').toString().trim().replace(/^@/, '');
      s.repo = (fd.get('repo') || '').toString().trim() || 'mizan-vault';
      s.branch = (fd.get('branch') || '').toString().trim() || 'main';
      s.pat = (fd.get('pat') || '').toString().trim();
      await App.save();
      U.toast(t('saved'));
      this.sync(body, data);
    });

    const actions = U.el('div', { class: 'btn-row' },
      U.el('button', {
        class: 'btn btn-primary', onclick: async () => {
          s.enabled = true; await App.save(); U.toast(t('saved')); this.sync(body, data);
        },
      }, s.enabled ? `${icHTML('check', 'btn-ic')} ${t('syncEnable')}` : `${icHTML('cloud', 'btn-ic')} ${t('syncEnable')}`),
      U.el('button', {
        class: 'btn btn-ghost', onclick: async () => { s.enabled = false; await App.save(); this.sync(body, data); },
      }, t('syncDisable')),
      U.el('button', {
        class: 'btn btn-ghost', onclick: async () => {
          renderStatus('busy', t('syncPushing').replace('…', '…'));
          try { const name = await Sync.test(); renderStatus('ok', `${t('connOk')} — ${name}`); U.toast(t('connOk')); }
          catch (e) { renderStatus('err', t('connFail', { e: e.message })); U.toast(e.message, 'err'); }
        },
      }, `${icHTML('bolt', 'btn-ic')} ${t('testConn')}`),
      U.el('button', {
        class: 'btn btn-ghost', onclick: async () => {
          renderStatus('busy', '…');
          try {
            const full = await Sync.createRepoAuto();
            s.owner = full.split('/')[0]; s.repo = full.split('/')[1]; s.enabled = true;
            await App.save(); U.toast(t('repoCreated', { r: full })); this.sync(body, data);
          } catch (e) { renderStatus('err', e.message); U.toast(e.message, 'err'); }
        },
      }, `${icHTML('plus', 'btn-ic')} ${t('createRepo')}`),
      U.el('button', {
        class: 'btn btn-primary', onclick: async () => {
          renderStatus('busy', t('syncPushing'));
          try {
            const res = await Sync.run();
            if (res.action === 'conflict') { this.conflictDialog(res, data); return; }
            renderStatus('ok', t('syncOk', { t: U.relTime(Date.now()) }));
            U.toast(res.action === 'pulled' ? t('imported') : t('saved'));
            App.render();
          } catch (e) { renderStatus('err', t('syncErr', { e: e.message })); U.toast(e.message, 'err'); }
        },
      }, `${icHTML('refresh', 'btn-ic')} ${t('syncNow')}`));

    body.append(UIX.card(`${icHTML('cloud')} ${t('syncTitle')}`,
      U.el('p', { class: 'muted' }, t('syncSub')),
      U.el('ol', { class: 'steps' }, [
        t('syncHow1'), t('syncHow2'), t('syncHow3'), t('syncHow4'),
      ].map(x => U.el('li', {}, x))),
      status, form, actions));

    /* سجل المزامنة */
    body.append(UIX.card(`${icHTML('doc')} ${t('syncHistory')}`,
      (s.log || []).length
        ? U.el('div', { class: 'list' }, s.log.slice(0, 12).map(l => U.el('div', { class: 'log-row' },
          U.el('span', { class: l.ok ? 'income' : 'expense' }, ic(l.ok ? 'check' : 'close', 'log-ic')),
          U.el('span', {}, U.fmtDate(new Date(l.t).toISOString().slice(0, 10), 'short') + ' ' + new Date(l.t).toTimeString().slice(0, 5)),
          U.el('span', { class: 'muted small grow' }, l.msg))))
        : U.el('p', { class: 'muted' }, t('noData'))));

    /* مزامنة صامتة */
    if (s.enabled && s.owner) {
      body.append(U.el('p', { class: 'muted small center' }, icHTML('bell', 'lbl-ic'), ` ${I18n.lang() === 'ar' ? 'المزامنة التلقائية تعمل — عند كل إضافة أو كل دقيقة أثناء الفتح.' : 'Auto-sync is on — after every addition or every minute while open.'}`));
    }
  },
  conflictDialog(res, data) {
    U.modal({
      title: `${icHTML('refresh')} ${t('conflictTitle')}`,
      body: U.el('div', { class: 'confirm-body' },
        U.el('p', {}, t('conflictSub')),
        U.el('div', { class: 'kv' },
          U.el('div', {}, U.el('span', {}, t('conflictCloudTime', { t: U.relTime(res.remoteTime) })), U.el('b', { class: 'expense' }, ic('cloud', 'kv-ic'))),
          U.el('div', {}, U.el('span', {}, t('conflictLocalTime', { t: U.relTime(res.localTime) })), U.el('b', { class: 'income' }, ic('tech', 'kv-ic'))))),
      actions: [
        { label: t('pullFirst'), class: 'btn-ghost', onClick: async close => { close(); await this.afterSync('pull'); } },
        { label: t('pushLocal'), class: 'btn-primary', onClick: async close => { close(); await this.afterSync('push'); } },
      ],
    });
  },
  async afterSync(force) {
    try {
      const res = await Sync.run({ force });
      U.toast(res.action === 'pulled' ? t('imported') : t('saved'));
      App.render();
    } catch (e) { U.toast(t('syncErr', { e: e.message }), 'err'); }
  },

  /* ---------- النسخ الاحتياطي ---------- */
  backup(body, data) {
    body.append(UIX.card(`${icHTML('doc')} ${t('backup')}`,
      U.el('p', { class: 'muted' }, t('backupNote')),
      U.el('div', { class: 'btn-row' },
        U.el('button', {
          class: 'btn btn-primary', onclick: () => {
            const payload = { app: 'mizan', version: 1, exportedAt: new Date().toISOString(), data };
            U.download(`mizan-backup-${U.todayISO()}.json`, JSON.stringify(payload, null, 2));
            U.toast(t('saved'));
          },
        }, icHTML('download', 'btn-ic'), ' ', t('exportBackup')),
        U.el('button', {
          class: 'btn btn-ghost', onclick: async () => {
            const f = await U.pickFile('.json');
            if (!f) return;
            try {
              const txt = await U.readFileText(f);
              const parsed = JSON.parse(txt);
              const incoming = parsed.data || parsed;
              if (!incoming.profile || !Array.isArray(incoming.tx)) throw new Error('BAD_FILE');
              if (!(await U.confirmBox(t('importWarn'), { danger: true, okLabel: t('importExp') }))) return;
              await App.replaceData(incoming);
              U.toast(t('imported')); App.render();
            } catch (e) { U.toast(`${t('error')}: ${e.message}`, 'err'); }
          },
        }, icHTML('upload', 'btn-ic'), ' ', t('importBackup')))));

    /* منطقة الخطر */
    body.append(UIX.card(`${icHTML('danger')} ${t('dangerZone')}`, U.el('div', { class: 'danger-box' },
      U.el('p', { class: 'muted' }, t('wipeConfirm')),
      U.el('div', { class: 'btn-row' },
        U.el('input', { class: 'input grow', id: 'wipe-word', placeholder: t('wipeWord'), dir: 'ltr' }),
        U.el('button', {
          class: 'btn btn-danger', onclick: async () => {
            const w = U.$('#wipe-word').value.trim().toLowerCase();
            const expect = I18n.lang() === 'ar' ? 'مسح' : 'wipe';
            if (w !== expect && w !== 'wipe' && w !== 'مسح') return U.toast(t('wipeWord'), 'err');
            await Vault.lock(); localStorage.clear(); location.hash = '#/dashboard'; location.reload();
          },
        }, icHTML('trash', 'btn-ic'), ' ', t('wipe'))))));
  },

  /* ---------- عن البرنامج ---------- */
  about(body, data) {
    body.append(UIX.card(`${icHTML('info')} ${t('about')}`,
      U.el('div', { class: 'about' },
        U.el('img', { src: 'assets/img/icon-192.png', alt: 'Mizan', width: 72, height: 72, onerror: 'this.style.display="none"' }),
        U.el('h3', {}, `ميزان | Mizan`),
        U.el('p', { class: 'muted' }, t('appTag')),
        U.el('div', { class: 'kv' },
          U.el('div', {}, U.el('span', {}, t('version')), U.el('b', {}, '1.0.0')),
          U.el('div', {}, U.el('span', {}, t('owner')), U.el('b', {}, data.profile.name)),
          U.el('div', {}, U.el('span', {}, t('encryptedBadge')), U.el('b', {}, 'AES-256-GCM')),
          U.el('div', {}, U.el('span', {}, t('currency')), U.el('b', {}, `${data.profile.currency} — ${Data.curName(data.profile.currency)}`)))),
      U.el('p', { class: 'muted small' }, t('privacyNote'))));
  },
};
