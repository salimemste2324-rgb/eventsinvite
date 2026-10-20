/* =====================================================================
   invite-live.js — Firebase realtime loader for the GUEST invitation
   page (index.html). The private link is:  yoursite/?code=XXXX
   The code IS the Firestore document id, so knowing the link = access.
   onSnapshot() keeps the page live: the admin edits data on their phone,
   every open guest tab updates instantly — no backend server at all.
   ===================================================================== */
const bridge = window.__inviteBridge;
const code   = (new URLSearchParams(location.search).get("code") || "").trim();

/* resolve "asset:<slot>" markers → the JPEGs that the admin stores inside
   Firestore (weddings/<code>/assets/<slot>/photos/<id> — one document per
   picture, newest wins; older single-doc photos still work).
   No Storage bucket needed. Missing asset → "" so the bundled default
   photo shows instead. */
async function resolveAssets(fs, db, code, cfg){
  if (!cfg) return cfg;
  cfg.__photos__ = {};
  const slots = new Set();
  Object.values(cfg.photos || {}).forEach(v => {
    const s = String(v || ""); if (s.indexOf("asset:") === 0) slots.add(s.slice(6));
  });
  const vp = String(cfg.venue && cfg.venue.photoUrl || "");
  if (vp.indexOf("asset:") === 0) slots.add(vp.slice(6));
  await Promise.all([...slots].map(async s => {
    cfg.__photos__[s] = await slotPhotos(fs, db, code, s);
  }));
  const origPhotos = (cfg.photos && Object.assign({}, cfg.photos)) || {};
  const pick = key => {
    const def = String(origPhotos[key] || "");
    if (def.indexOf("asset:") !== 0) return def;           // plain URL / empty kept as-is
    const arr = cfg.__photos__[def.slice(6)];
    return (arr && arr.length) ? arr[arr.length - 1] : ""; // newest uploaded photo
  };
  cfg.photos.bride = pick("bride");
  cfg.photos.groom = pick("groom");
  cfg.photos.couple = pick("couple");
  cfg.photos.venue = pick("venue");
  if (String(cfg.venue && cfg.venue.photoUrl || "").indexOf("asset:") === 0)
    cfg.venue.photoUrl = pick("venue");
  delete cfg.__photos__;
  await resolveMusic(fs, db, code, cfg);
  return cfg;
}

/* fetch every photo of a slot: new collection layout first, then the
   legacy one-document layout as fallback. */
async function slotPhotos(fs, db, code, slot){
  const out = [];
  try {
    const a = await fs.getDoc(fs.doc(db, "weddings", code, "assets", slot));
    if (a.exists() && a.data().dataUrl) out.push(a.data().dataUrl);   // legacy single photo
  } catch (e) {}
  try {
    const q = await fs.getDocs(fs.query(fs.collection(db, "weddings", code, "assets", slot, "photos"),
                                        fs.orderBy(fs.documentId(), "asc")));
    q.forEach(d => { const u = d.data().dataUrl; if (u) out.push(u); });
  } catch (e) {}
  return out;
}

/* uploaded mp3 = chunked Firestore docs (assets/music + assets/music/chunks/<n>).
   Guests reassemble the base64 chunks into a normal blob audio URL — still
   100% Firestore, no Storage bucket, no card. */
async function resolveMusic(fs, db, code, cfg){
  const m = String(cfg && cfg.media && cfg.media.music || "");
  if (m.indexOf("asset:") !== 0) return;
  try {
    const man = await fs.getDoc(fs.doc(db, "weddings", code, "assets", "music"));
    if (!man.exists() || !man.data().chunks){ cfg.media.music = ""; return; }
    const atob2 = s => { const b = atob(s), u = new Uint8Array(b.length);
      for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
    const snaps = await Promise.all(Array.from({ length: man.data().chunks },
      (_, i) => fs.getDoc(fs.doc(db, "weddings", code, "assets", "music", "chunks", String(i)))));
    const parts = snaps.filter(s => s.exists())
      .map(s => atob2(String(s.data().durl || "").split(",")[1] || ""));
    cfg.media.music = parts.length
      ? URL.createObjectURL(new Blob(parts, { type: man.data().mime || "audio/mpeg" }))
      : "";
  } catch (e) { cfg.media.music = ""; }   // fallback: invitation uses its own music
}

async function start(){  /* ---- LOCAL DEMO MODE: codes starting with "demo-" read browser storage ---- */
  if (code.indexOf("demo-") === 0){
    const w = window.DEMO && window.DEMO.get(code);
    if (!w || w.status === "revoked"){
      bridge.fail("This demo invitation link is invalid or was deleted. Open the admin panel and copy the link again.");
      return;
    }
    bridge.data(w.config);
    /* live across tabs: admin saves in one tab → guest tab updates instantly */
    window.addEventListener("storage", e => {
      if (e.key !== window.DEMO.KEY) return;
      const n = window.DEMO.get(code);
      if (!n || n.status === "revoked")
        bridge.fail("This demo invitation link is invalid or was deleted. Open the admin panel and copy the link again.");
      else bridge.data(n.config);
    });
    return;
  }

  /* Firebase keys not pasted yet → local demo (no code) or setup notice (code) */
  if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()){
    if (code) bridge.fail("This invitation cannot be opened yet — the site owner still needs to finish the Firebase setup.");
    else bridge.demo();
    return;
  }

  if (!code){
    bridge.fail("Welcome! To open this wedding invitation you need the private link that was shared to you. If you are the organizer, sign in to the admin panel.");
    return;
  }

  try{
    const [{ initializeApp }, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]);

    const app  = initializeApp(window.FIREBASE_CONFIG);
    const db   = fs.getFirestore(app);
    const ref  = fs.doc(db, "weddings", code);

    /* 1 · fast existence check — invalid/revoked links fail immediately */
    const snap = await fs.getDoc(ref);
    if (!snap.exists() || snap.data().status === "revoked"){
      bridge.fail("This invitation link is invalid or has been revoked by the organizer. Please ask for a new link.");
      return;
    }
    bridge.data(await resolveAssets(fs, db, code, snap.data().config || snap.data()));

    /* 2 · realtime — admin edits update every open guest page instantly;
       delete / revoke locks every OPEN page instantly too */
    fs.onSnapshot(ref, {
      next: async s => {
        if (!s.exists() || s.data().status === "revoked"){
          bridge.fail(!s.exists()
            ? "This invitation is no longer available — the organizer has removed it."
            : "This invitation link has been revoked by the organizer. Please ask for a new link.");
          return;
        }
        bridge.data(await resolveAssets(fs, db, code, s.data().config || s.data()));
      },
      error(err){ console.warn("realtime listener:", err.message); }   // keep showing loaded data
    });
  }catch(err){
    console.error(err);
    bridge.fail("The invitation could not be loaded. Please reload the page.");
  }
}
start();
