/* ═══════════════════════════════════════════════════════════
   EUREKA — app.js
   Responsabilidades:
   - Inicializar Firebase
   - Detectar sesión activa (onAuthStateChanged)
   - Controlar el flujo de pantallas (splash → comecar → login)
   - Exportar instancias de auth y db para otros módulos

   NO contiene lógica de autenticación (eso va en auth.js)
   NO contiene lógica de UI específica (eso va en auth.js)
═══════════════════════════════════════════════════════════ */

import { initializeApp }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ─────────────────────────────────────────
   CONFIGURACIÓN FIREBASE
   Proyecto: vanti-app-br (= Eureka)
───────────────────────────────────────── */
const firebaseConfig = {
  apiKey:            "AIzaSyCw4QhQ5fGYSv_QgfY-waAZuOhkfv1ej1s",
  authDomain:        "vanti-app-br.firebaseapp.com",
  projectId:         "vanti-app-br",
  storageBucket:     "vanti-app-br.firebasestorage.app",
  messagingSenderId: "1028700458017",
  appId:             "1:1028700458017:web:6011fd81d09010e4f1e760"
};

/* ─────────────────────────────────────────
   INICIALIZAR FIREBASE
   Las instancias se exportan para que
   auth.js y futuros módulos las usen.
───────────────────────────────────────── */
const app  = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);


/* ─────────────────────────────────────────
   ROUTER DE PANTALLAS
   Controla qué pantalla se muestra.
   Todas las transiciones pasan por aquí.
───────────────────────────────────────── */

/**
 * Transición suave entre dos pantallas.
 * @param {string} de    - ID de la pantalla actual
 * @param {string} para  - ID de la pantalla destino
 */
export function mostrarPantalla(de, para) {
  const anterior  = document.getElementById(de);
  const siguiente = document.getElementById(para);

  if (!anterior || !siguiente) {
    console.warn(`[router] Pantalla no encontrada: ${de} → ${para}`);
    return;
  }

  anterior.classList.add("saliendo");
  anterior.classList.remove("visible");

  setTimeout(() => {
    anterior.classList.add("oculto");
    anterior.classList.remove("saliendo");
    siguiente.classList.remove("oculto");

    // doble rAF para garantizar que el CSS transicione correctamente
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        siguiente.classList.add("visible");
      });
    });
  }, 560);
}


/* ─────────────────────────────────────────
   FLUJO PRINCIPAL
   Splash (1.5s) → verifica sesión →
     Si logado: home.html
     Si no:     comecar → login
───────────────────────────────────────── */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuario ya autenticado — saltar splash y login
    window.location.href = "home.html";
  } else {
    // Sin sesión — mostrar splash y luego comecar
    setTimeout(() => mostrarPantalla("splash", "comecar"), 1500);
  }
});


/* ─────────────────────────────────────────
   NAVEGACIÓN GLOBAL
   Funciones expuestas al HTML como onclick.
   Se asignan a window para que sean accesibles
   desde el HTML sin necesidad de importar.
───────────────────────────────────────── */

/**
 * Botón "Continuar" en la pantalla comecar.
 * Muestra el login + el botón flotante de cadastro.
 */
window.irParaLogin = function () {
  mostrarPantalla("comecar", "login");

  // El botón flotante aparece con un leve delay
  setTimeout(() => {
    const flotante = document.getElementById("cadastro-float");
    if (flotante) flotante.classList.add("visivel");
  }, 400);
};


/* ─────────────────────────────────────────
   SERVICE WORKER (PWA)
   Registra el SW para funcionamiento offline.
───────────────────────────────────────── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then(() => console.log("[SW] Registrado correctamente"))
      .catch((err) => console.warn("[SW] Error al registrar:", err));
  });
}
