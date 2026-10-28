/* ============================================================
   ميزانيتي | MIZANIYATI — المزامنة عبر مستودع GitHub خاص
   المحتوى المُرفع = ظرف الخزنة المشفّر (AES-256-GCM) — المستودع
   لا يحمل أي بيانات مقروءة. المفتاح محفوظ في الخزنة فقط.
   ============================================================ */
const Sync = (() => {
  const API = 'https://api.github.com';
  let busy = false;

  const cfg = () => Vault.data()?.sync || null;

  function headers(pat, extra = {}) {
    return {
      Authorization: `Bearer ${pat}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...extra,
    };
  }
  async function gh(method, path, pat, body) {
    const res = await fetch(API + path, { method, headers: headers(pat), body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) {
      let msg = `${res.status}`;
      try { const j = await res.json(); msg = j.message || msg; } catch {}
      if (res.status === 401) msg = I18n.lang() === 'ar' ? 'رمز الوصول غير صالح أو منتهي (401)' : 'Invalid or expired token (401)';
      if (res.status === 404) msg = I18n.lang() === 'ar' ? 'لم يُعثر على المستودع — تأكد من الاسم (404)' : 'Repository not found — check the name (404)';
      if (res.status === 403) msg = I18n.lang() === 'ar' ? 'صلاحيات غير كافية — امنح الرمز نطاق contents (403)' : 'Insufficient permissions — grant contents scope (403)';
      const e = new Error(msg); e.status = res.status; throw e;
    }
    return res.status === 204 ? null : res.json();
  }

  const pathOf = c => `/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${c.path || 'vault.enc.json'}`;
  const b64encode = str => btoa(unescape(encodeURIComponent(str)));
  const b64decode = str => decodeURIComponent(escape(atob(str)));

  async function getStatus(c) {
    return gh('GET', `/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}`, c.pat);
  }
  async function createRepo(c, desc) {
    const r = await gh('POST', '/user/repos', c.pat, { name: c.repo, private: true, description: desc || 'Mizaniyati encrypted vault' });
    return r.full_name;
  }
  async function ensureBranch(c) {
    /* الفرع الافتراضي main — نتحقق من وجوده وإلا ننشئه عبر initial commit */
    try { await gh('GET', `/repos/${c.owner}/${c.repo}/branches/${encodeURIComponent(c.branch || 'main')}`, c.pat); }
    catch (e) {
      if (e.status === 404) {
        await gh('PUT', pathOf(c), c.pat, {
          message: 'chore: init mizaniyati vault',
          content: b64encode('[]'),
          branch: c.branch || 'main',
        });
      } else throw e;
    }
  }

  /* جلب النسخة السحابية (قد تكون فارغة) */
  async function fetchRemote(c) {
    try {
      const r = await gh('GET', pathOf(c), c.pat);
      if (!r || !r.content) return { env: null, sha: r?.sha || null };
      const json = JSON.parse(b64decode(r.content.replace(/\n/g, '')));
      return { env: json, sha: r.sha };
    } catch (e) {
      if (e.status === 404) return { env: null, sha: null };
      throw e;
    }
  }

  /* رفع الظرف المشفّر (يستعيد SHA تلقائياً عند تعارض 409) */
  async function pushRemote(c, env, sha, message) {
    const body = {
      message: message || `mizaniyati: sync ${new Date().toISOString().slice(0, 19)}`,
      content: b64encode(JSON.stringify(env)),
      branch: c.branch || 'main',
    };
    if (sha) body.sha = sha;
    try {
      await gh('PUT', pathOf(c), c.pat, body);
    } catch (e) {
      if (e.status === 409) {
        const fresh = await fetchRemote(c);
        body.sha = fresh.sha || undefined;
        await gh('PUT', pathOf(c), c.pat, body);
      } else throw e;
    }
  }

  function logSync(ok, msg) {
    const d = Vault.data(); if (!d) return;
    d.sync.log = d.sync.log || [];
    d.sync.log.unshift({ t: Date.now(), ok, msg: String(msg || '').slice(0, 140) });
    d.sync.log = d.sync.log.slice(0, 25);
  }

  /* اختبار الاتصال بالمستودع */
  async function test() {
    const c = cfg(); if (!c?.owner || !c?.pat) throw new Error(I18n.t('syncNotConfigured'));
    const repo = await getStatus(c);
    return repo.full_name;
  }

  /* إنشاء مستودع خاص */
  async function createRepoAuto() {
    const c = cfg(); if (!c?.owner || !c?.pat) throw new Error(I18n.t('syncNotConfigured'));
    const full = await createRepo(c);
    await ensureBranch(c);
    return full;
  }

  /* ============================================================
     المزامنة الكاملة — تقارن الطوابع الزمنية وتحل التعارض
     returns: { action: 'pushed'|'pulled'|'up-to-date'|'conflict'|'created', ... }
     ============================================================ */
  async function run({ force = null } = {}) {
    if (busy) return { action: 'busy' };
    const d = Vault.data();
    if (!d?.sync?.enabled) return { action: 'disabled' };
    const c = d.sync;
    if (!c.owner || !c.pat) return { action: 'unconfigured' };
    busy = true;
    try {
      await ensureBranch(c);
      const { env: remote, sha } = await fetchRemote(c);

      /* المستودع فارغ → رفع النسخة الحالية */
      if (!remote) {
        const localEnv = await Vault.exportEnvelope();
        await pushRemote(c, localEnv, null, 'mizaniyati: initial push');
        c.lastSync = Date.now(); logSync(true, 'initial push');
        await Vault.save(d);
        return { action: 'created' };
      }

      const localTime = Vault.updatedAt();
      const remoteTime = remote.updatedAt || 0;

      /* النسختان متطابقتان */
      if (remoteTime <= localTime) {
        if (remoteTime === localTime) { c.lastSync = Date.now(); logSync(true, 'up-to-date'); await Vault.save(d); return { action: 'up-to-date' }; }
        /* المحلية أحدث → رفع */
        if (force === 'pull') return await doPull(remote, sha);
        const localEnv = await Vault.exportEnvelope();
        await pushRemote(c, localEnv, sha);
        c.lastSync = Date.now(); logSync(true, 'pushed');
        await Vault.save(d);
        return { action: 'pushed' };
      }

      /* السحابة أحدث */
      if (force === 'push') {
        const localEnv = await Vault.exportEnvelope();
        await pushRemote(c, localEnv, sha, 'mizaniyati: force push (local newer kept)');
        c.lastSync = Date.now(); logSync(true, 'force pushed');
        await Vault.save(d);
        return { action: 'pushed' };
      }
      if (force === 'pull') return await doPull(remote, sha);

      /* محلي معدّل أيضاً بعد آخر مزامنة؟ → تعارض */
      const lastSync = c.lastSync || 0;
      if (localTime > lastSync) {
        logSync(false, 'conflict');
        await Vault.save(d);
        return { action: 'conflict', remote, remoteTime, localTime, sha };
      }
      /* المحلية لم تتغير → جلب */
      return await doPull(remote, sha);
    } finally { busy = false; }
  }

  async function doPull(remote, sha) {
    const d = Vault.data();
    try {
      /* الظرف السحابي يُفكّ بنفس رمز الخزنة (نفس الخزنة على جهاز آخر) —
         نجرب الرمز الحالي المخزّن في الجلسة، وإلا يطلبه المزوّد من الواجهة */
      const pin = currentPin();
      if (!pin) throw new Error('NO_PIN');
      const data = await Vault.decryptCloud(remote, pin);
      await Vault.replaceData(data);
      data.sync = data.sync || d.sync;
      data.sync.lastSync = Date.now();
      logSyncIn(data, true, 'pulled');
      await Vault.save(data);
      return { action: 'pulled', data };
    } catch (e) {
      const d2 = Vault.data();
      logSyncIn(d2, false, 'pull failed: ' + e.message);
      await Vault.save(d2);
      throw new Error(I18n.t('wrongCloudPin'));
    }
  }

  /* رمز السري الحالي يُطلب من الواجهة عند الحاجة */
  let pinProvider = null;
  const setPinProvider = fn => { pinProvider = fn; };
  const currentPin = () => (pinProvider ? pinProvider() : null);

  function logSyncIn(data, ok, msg) {
    data.sync.log = data.sync.log || [];
    data.sync.log.unshift({ t: Date.now(), ok, msg: String(msg || '').slice(0, 140) });
    data.sync.log = data.sync.log.slice(0, 25);
  }

  /* مزامنة صامتة دورية (تُستدعى من التطبيق) */
  const autoSync = U.debounce(async () => {
    const d = Vault.data();
    if (!d?.sync?.enabled || busy) return;
    try { await run(); } catch (e) { console.warn('auto-sync:', e.message); }
  }, 4000);

  return { run, test, createRepoAuto, fetchRemote, autoSync, setPinProvider, isBusy: () => busy, cfg };
})();
