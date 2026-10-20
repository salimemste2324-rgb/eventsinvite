/* =====================================================================
   invite-live.js — Firebase realtime loader for the GUEST invitation
   page (index.html). The private link is:  yoursite/?code=XXXX
   The code IS the Firestore document id, so knowing the link = access.
   onSnapshot() keeps the page live: the admin edits data on their phone,
   every open guest tab updates instantly — no backend server at all.
   ===================================================================== */
const bridge = window.__inviteBridge;
const code   = (new URLSearchParams(location.search).get("code") || "").trim();

async function start(){
  /* ---- LOCAL DEMO MODE: codes starting with "demo-" read browser storage ---- */
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
      if (n && n.status !== "revoked") bridge.data(n.config);
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
    bridge.data(snap.data().config || snap.data());

    /* 2 · realtime — admin edits update every open guest page instantly */
    fs.onSnapshot(ref, {
      next(s){
        if (!s.exists() || s.data().status === "revoked") return;
        bridge.data(s.data().config || s.data());
      },
      error(err){ console.warn("realtime listener:", err.message); }   // keep showing loaded data
    });
  }catch(err){
    console.error(err);
    bridge.fail("The invitation could not be loaded. Please reload the page.");
  }
}
start();
