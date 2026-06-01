/* ═══════════════════════════════════════════════════════════
   EUREKA — app.js v3
   Firebase init + router de pantallas + SW
═══════════════════════════════════════════════════════════ */

import { initializeApp }              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }                from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
window._eurekaAuth = getAuth(app);
window._eurekaDb   = getFirestore(app);

/* ── ROUTER: transición entre pantallas ── */
window.mostrarPantalla = function(de, para) {
  const anterior  = document.getElementById(de);
  const siguiente = document.getElementById(para);
  if (!anterior || !siguiente) return;

  // Ocultar la pantalla actual
  anterior.classList.remove("visible");
  anterior.classList.add("oculto");

  // Mostrar la siguiente
  siguiente.classList.remove("oculto");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      siguiente.classList.add("visible");
    });
  });
};

/* ── FLUJO PRINCIPAL ──
   1. Splash se muestra inmediatamente (class="screen visible" en HTML)
   2. Después de 1.5s: si logado → home.html, si no → comecar
   3. Botón Continuar → login
── */
onAuthStateChanged(window._eurekaAuth, (user) => {
  if (user) {
    // Ya logado — saltar todo y ir a home
    window.location.href = "home.html";
  } else {
    // Sin sesión — esperar 1.5s y mostrar comecar
    setTimeout(() => {
      window.mostrarPantalla("splash", "comecar");
    }, 1500);
  }
});

/* ── NAVEGACIÓN ── */
window.irParaLogin = function() {
  window.mostrarPantalla("comecar", "login");
  // Botón flotante de cadastro aparece con delay
  setTimeout(() => {
    const f = document.getElementById("cadastro-float");
    if (f) f.classList.add("visivel");
  }, 400);
};

/* ── SERVICE WORKER ── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("[SW] ✅"))
      .catch(err => console.warn("[SW] Error:", err));
  });
}
