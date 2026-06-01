/* ═══════════════════════════════════════════════════════════
   EUREKA — app.js
   Firebase init + router de pantallas + SW
═══════════════════════════════════════════════════════════ */

import { initializeApp }             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }               from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ── CONFIG FIREBASE ── */
const firebaseConfig = {
  apiKey:            "AIzaSyCw4QhQ5fGYSv_QgfY-waAZuOhkfv1ej1s",
  authDomain:        "vanti-app-br.firebaseapp.com",
  projectId:         "vanti-app-br",
  storageBucket:     "vanti-app-br.firebasestorage.app",
  messagingSenderId: "1028700458017",
  appId:             "1:1028700458017:web:6011fd81d09010e4f1e760"
};

/* ── INICIALIZAR ── */
const app = initializeApp(firebaseConfig);

/* Exponer en window para que auth.js los use sin necesidad de importar */
window._eurekaAuth = getAuth(app);
window._eurekaDb   = getFirestore(app);


/* ── ROUTER DE PANTALLAS ── */
window.mostrarPantalla = function(de, para) {
  const anterior  = document.getElementById(de);
  const siguiente = document.getElementById(para);
  if (!anterior || !siguiente) return;

  anterior.classList.add("saliendo");
  anterior.classList.remove("visible");

  setTimeout(() => {
    anterior.classList.add("oculto");
    anterior.classList.remove("saliendo");
    siguiente.classList.remove("oculto");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => siguiente.classList.add("visible"));
    });
  }, 560);
};


/* ── FLUJO: Splash → Comecar o Home ── */
onAuthStateChanged(window._eurekaAuth, (user) => {
  if (user) {
    window.location.href = "home.html";
  } else {
    setTimeout(() => window.mostrarPantalla("splash", "comecar"), 1500);
  }
});


/* ── NAVEGACIÓN GLOBAL ── */
window.irParaLogin = function() {
  window.mostrarPantalla("comecar", "login");
  setTimeout(() => {
    const f = document.getElementById("cadastro-float");
    if (f) f.classList.add("visivel");
  }, 400);
};


/* ── SERVICE WORKER ── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("[SW] Registrado ✅"))
      .catch(err => console.warn("[SW] Error:", err));
  });
}
