/* ═══════════════════════════════════════════════════════════
   EUREKA — auth.js
   Responsabilidades:
   - Login con Google, Apple, Celular (SMS), Email+Senha
   - Registro de nuevos usuarios (createUserWithEmailAndPassword)
   - Helpers de UI: mostrarErro, setCarregando, toggleSenha
   - Máscaras de input: celular, fecha de nacimiento
   - Validaciones de formulario

   NOTA: Este archivo se carga con <script defer> en index.html,
   NO como módulo, para poder acceder a window.auth y window.db
   exportados por app.js.
═══════════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────
   IMPORTS FIREBASE AUTH
   Se importan directamente aquí porque
   auth.js también necesita usar los SDKs.
───────────────────────────────────────── */
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

/* Reusar la instancia de Firebase ya inicializada en app.js */
const existingApp = getApps()[0];
const auth = getAuth(existingApp);
const db   = getFirestore(existingApp);

const providerGoogle = new GoogleAuthProvider();


/* ═══════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════ */

/**
 * Login con Google OAuth
 */
window.loginGoogle = async function () {
  setCarregando(true);
  try {
    await signInWithPopup(auth, providerGoogle);
    window.location.href = "home.html";
  } catch (err) {
    mostrarErro(traduzirErro(err.code));
  } finally {
    setCarregando(false);
  }
};

/**
 * Login con Apple ID
 * Requiere configuración de Apple en Firebase Console.
 */
window.loginApple = async function () {
  const provider = new OAuthProvider("apple.com");
  setCarregando(true);
  try {
    await signInWithPopup(auth, provider);
    window.location.href = "home.html";
  } catch (err) {
    mostrarErro(traduzirErro(err.code));
  } finally {
    setCarregando(false);
  }
};

/**
 * Login con Email + Senha
 * @param {Event} e - evento del botón
 */
window.loginEmail = async function (e) {
  e.preventDefault();

  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value;

  if (!email || !senha) {
    mostrarErro("Preencha seu email e senha.");
    return;
  }

  setCarregando(true);
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "home.html";
  } catch (err) {
    mostrarErro(traduzirErro(err.code));
  } finally {
    setCarregando(false);
  }
};


/* ═══════════════════════════════════════════════════════════
   LOGIN POR CELULAR (SMS)
═══════════════════════════════════════════════════════════ */

/**
 * Abre el modal de login por celular.
 * Inicializa el reCAPTCHA invisible si no existe.
 */
window.abrirModalCelular = function () {
  const modal = document.getElementById("modal-celular");
  if (modal) modal.classList.add("ativo");

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  }
};

/**
 * Cierra el modal y resetea los campos.
 */
window.fecharModalCelular = function () {
  const modal = document.getElementById("modal-celular");
  if (modal) modal.classList.remove("ativo");

  const etapaN = document.getElementById("etapa-numero");
  const etapaC = document.getElementById("etapa-codigo");
  const campoN = document.getElementById("campo-numero");
  const campoC = document.getElementById("campo-codigo");

  if (etapaN) etapaN.style.display = "block";
  if (etapaC) etapaC.style.display = "none";
  if (campoN) campoN.value = "";
  if (campoC) campoC.value = "";
};

/**
 * Envía el código SMS al número ingresado.
 */
window.enviarSMS = async function () {
  const numero = document.getElementById("campo-numero")?.value.trim();

  if (!numero) {
    mostrarErro("Digite seu número de celular.");
    return;
  }

  // Formatear al estándar E.164 para Brasil (+55)
  const formatado = numero.startsWith("+")
    ? numero
    : "+55" + numero.replace(/\D/g, "");

  try {
    window.confirmationResult = await signInWithPhoneNumber(
      auth,
      formatado,
      window.recaptchaVerifier
    );

    // Avanzar a la etapa de código
    const etapaN = document.getElementById("etapa-numero");
    const etapaC = document.getElementById("etapa-codigo");
    if (etapaN) etapaN.style.display = "none";
    if (etapaC) etapaC.style.display = "block";

    setTimeout(() => document.getElementById("campo-codigo")?.focus(), 100);

  } catch (err) {
    mostrarErro(traduzirErro(err.code));
  }
};

/**
 * Verifica el código SMS ingresado.
 */
window.verificarCodigo = async function () {
  const codigo = document.getElementById("campo-codigo")?.value.trim();

  if (!codigo || codigo.length < 6) {
    mostrarErro("Digite o código de 6 dígitos.");
    return;
  }

  try {
    await window.confirmationResult.confirm(codigo);
    window.location.href = "home.html";
  } catch (err) {
    mostrarErro("Código incorreto. Tente novamente.");
  }
};


/* ═══════════════════════════════════════════════════════════
   RECUPERAR SENHA
═══════════════════════════════════════════════════════════ */

/**
 * Redirige a la página de recuperación de contraseña.
 * Si el campo email ya tiene valor, lo pasa como parámetro.
 */
window.esqueceuSenha = function () {
  const email = document.getElementById("email")?.value.trim();

  if (!email) {
    mostrarErro("Digite seu email primeiro.");
    document.getElementById("email")?.focus();
    return;
  }

  window.location.href = "recuperar-senha.html?email=" + encodeURIComponent(email);
};


/* ═══════════════════════════════════════════════════════════
   HELPERS DE UI
═══════════════════════════════════════════════════════════ */

/**
 * Muestra/oculta el texto de la contraseña.
 * @param {string} inputId - ID del campo password
 * @param {string} iconoId - ID del ícono del ojo
 */
window.toggleSenha = function (inputId, iconoId) {
  const input = document.getElementById(inputId);
  const icono = document.getElementById(iconoId);

  if (!input) return;

  const oculta = input.type === "password";
  input.type = oculta ? "text" : "password";
  if (icono) icono.style.opacity = oculta ? "0.35" : "1";
};

/**
 * Cierra el modal al hacer clic fuera (en el overlay).
 * @param {Event} e
 */
window.fecharSeClicarFora = function (e) {
  const modal = document.getElementById("modal-celular");
  if (e.target === modal) fecharModalCelular();
};

/**
 * Activa/desactiva el estado de carga en el botón principal.
 * @param {boolean} ativo
 */
function setCarregando(ativo) {
  const btn    = document.getElementById("btn-entrar");
  const spin   = document.getElementById("spinner");

  if (btn)  btn.disabled       = ativo;
  if (spin) spin.style.display = ativo ? "block" : "none";
}

/**
 * Muestra un mensaje de error que desaparece automáticamente.
 * @param {string} msg
 */
function mostrarErro(msg) {
  const el = document.getElementById("msg-erro");
  if (!el) return;

  el.textContent   = msg;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 4500);
}

// Exponer para uso desde otros contextos
window.mostrarErro = mostrarErro;


/* ═══════════════════════════════════════════════════════════
   TRADUCCIONES DE ERRORES FIREBASE
═══════════════════════════════════════════════════════════ */

/**
 * Convierte códigos de error de Firebase en mensajes en portugués.
 * @param {string} code - código de error Firebase
 * @returns {string} mensaje en portugués
 */
function traduzirErro(code) {
  const mensagens = {
    "auth/user-not-found":          "Não encontramos uma conta com este email.",
    "auth/wrong-password":          "Senha incorreta. Tente novamente.",
    "auth/invalid-email":           "Email inválido.",
    "auth/too-many-requests":       "Muitas tentativas. Aguarde um momento.",
    "auth/network-request-failed":  "Sem conexão. Verifique sua internet.",
    "auth/popup-closed-by-user":    "Login cancelado.",
    "auth/invalid-credential":      "Credenciais inválidas. Tente novamente.",
    "auth/user-disabled":           "Esta conta foi desativada.",
    "auth/email-already-in-use":    "Este email já está cadastrado. Tente fazer login.",
    "auth/weak-password":           "Senha muito fraca. Use pelo menos 6 caracteres.",
    "auth/operation-not-allowed":   "Método de login não habilitado.",
  };

  return mensagens[code] || "Algo deu errado. Tente novamente.";
}


/* ═══════════════════════════════════════════════════════════
   MÁSCARAS Y VALIDACIONES DE INPUT
   Se inicializan cuando el DOM está listo.
═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {

  /* Enter en email → foco en senha */
  const campoEmail = document.getElementById("email");
  const campoSenha = document.getElementById("senha");

  if (campoEmail) {
    campoEmail.addEventListener("keydown", (e) => {
      if (e.key === "Enter") campoSenha?.focus();
    });
  }

  /* Enter en senha → submit login */
  if (campoSenha) {
    campoSenha.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginEmail(e);
    });
  }

  /* Máscara de celular: (11) 99999-9999 */
  const campoCelular = document.getElementById("campo-numero");
  if (campoCelular) {
    campoCelular.addEventListener("input", function () {
      let v = this.value.replace(/\D/g, "");
      v = v.replace(/^(\d{2})(\d)/, "($1) $2");
      v = v.replace(/(\d{5})(\d)/, "$1-$2");
      this.value = v.slice(0, 15);
    });
  }

});
