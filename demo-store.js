/* =====================================================================
   demo-store.js — LOCAL DEMO MODE (no Firebase needed)
   Lets you test the whole flow on localhost right now:
   admin signs in locally → creates wedding → fills all info →
   gets a private link (code starts with "demo-") → guest page reads
   the same browser storage and updates live across tabs.
   Everything is saved in localStorage of THIS browser only.
   Once real Firebase keys are pasted in config.js, the site
   automatically uses the online database instead.
   ===================================================================== */
window.DEMO = (function () {
  const KEY = "weddingDemoData";

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveAll(o) {
    try { localStorage.setItem(KEY, JSON.stringify(o)); return true; }
    catch (e) { alert("Local storage is full — use smaller photos in demo mode. (Online Firebase mode has no such limit.)"); return false; }
  }

  return {
    KEY,
    get(code) { return all()[code] || null; },
    list() {
      const a = all();
      return Object.keys(a).map(c => ({ code: c, ...a[c] }))
        .sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0));
    },
    put(code, w) { const a = all(); a[code] = Object.assign({}, a[code], w, { updatedAt: Date.now() }); return saveAll(a); },
    del(code) { const a = all(); delete a[code]; saveAll(a); }
  };
})();

/* shrink an uploaded image to a data: URL so demo mode fits in localStorage */
window.demoShrink = function (file, maxDim) {
  maxDim = maxDim || 1400;
  return new Promise((resolve, reject) => {
    if (!file.type || file.type.indexOf("image/") !== 0) {
      /* video / audio: object URL works only in this browser session */
      return resolve(URL.createObjectURL(file));
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * sc);
      c.height = Math.round(img.height * sc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read the image file")); };
    img.src = url;
  });
};
