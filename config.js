/* =====================================================================
   FIREBASE KEYS — Web App config for the "eventsinvie" project.
   These keys are PUBLIC by design — the security rules in firestore.rules
   and storage.rules are what protect the data. Never paste a service-account
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

/* helper shared by index.html and admin.html */
window.isFirebaseConfigured = function () {
  var c = window.FIREBASE_CONFIG || {};
  return !!(c.apiKey && c.projectId && String(c.apiKey).indexOf("PASTE") === -1);
};
