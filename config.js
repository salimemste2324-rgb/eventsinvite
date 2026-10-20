/* =====================================================================
   FIREBASE KEYS — Web App config for the "eventsinvie" project.
   These keys are PUBLIC by design — the security rules in firestore.rules
   are what protect the data. Never paste a service-account
   JSON or the service_role secret key into this (or any frontend) file.
   ===================================================================== */
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyA6NkhtJ_lB5GxwjaeHGYC9qRi0sWZsiew",
  authDomain:        "eventsinvie.firebaseapp.com",
  projectId:         "eventsinvie",
  storageBucket:     "eventsinvie.firebasestorage.app",
  messagingSenderId: "736714754350",
  appId:             "1:736714754350:web:fbfa7ba535a81cf26e52bf"
};

/* =====================================================================
   CLOUDINARY — free photo/video/music hosting for the admin uploads
   (Firebase Storage would force a credit card; Cloudinary doesn't).
   1. Create a free account at cloudinary.com (no card).
   2. Dashboard → copy your CLOUD NAME.
   3. Settings (gear) → Upload tab → "Signing Requests" → Add upload
      preset → name it e.g. eventsinvite → Privacy: Unsigned → Save.
   4. Paste both below. Leave empty and uploads are skipped (URL
      paste still works) — everything else runs normally.
   These are PUBLIC values by design; the unsigned preset can only
   write into its own folder, never read anything.
   ===================================================================== */
window.CLOUDINARY = {
  cloudName:    "PASTE-CLOUD-NAME",
  uploadPreset: "PASTE-UNSIGNED-PRESET-NAME"
};

/* helper shared by index.html and admin.html */
window.isFirebaseConfigured = function () {
  var c = window.FIREBASE_CONFIG || {};
  return !!(c.apiKey && c.projectId && String(c.apiKey).indexOf("PASTE") === -1);
};
