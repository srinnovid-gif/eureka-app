/* ═══════════════════════════════════════════════════════════
   EUREKA — auth.js
   Login, registro y helpers de UI.
   Depende de window._eurekaAuth y window._eurekaDb
   inicializados por app.js
═══════════════════════════════════════════════════════════ */

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* Esperar a que app.js haya inicializado Firebase */
function getAuth() { return window._eurekaAuth; }
function getDb()   { return window._eurekaDb; }

const providerGoogle = new GoogleAuthProvider();


/* ═══ LOGIN ═══ */

window.loginGoogle = async function() {
  setCarregando(true);
  try {
    await signInWithPopup(getAuth(), providerGoogle);
    window.location.href = "home.html";
  } catch(err) { mostrarErro(traduzir(err.code)); }
  finally { setCarregando(false); }
};

window.loginApple = async function() {
  const p = new OAuthProvider("apple.com");
  setCarregando(true);
  try {
    await signInWithPopup(getAuth(), p);
    window.location.href = "home.html";
  } catch(err) { mostrarErro(traduzir(err.code)); }
  finally { setCarregando(false); }
};

window.loginEmail = async function(e) {
  e.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value;
  if (!email || !senha) { mostrarErro("Preencha seu email e senha."); return; }
  setCarregando(true);
  try {
    await signInWithEmailAndPassword(getAuth(), email, senha);
    window.location.href = "home.html";
  } catch(err) { mostrarErro(traduzir(err.code)); }
  finally { setCarregando(false); }
};


/* ═══ CELULAR / SMS ═══ */

window.abrirModalCelular = function() {
  document.getElementById("modal-celular")?.classList.add("ativo");
  if (!window._recaptcha) {
    window._recaptcha = new RecaptchaVerifier(getAuth(), "recaptcha-container", { size: "invisible" });
  }
};

window.fecharModalCelular = function() {
  document.getElementById("modal-celular")?.classList.remove("ativo");
  document.getElementById("etapa-numero").style.display  = "block";
  document.getElementById("etapa-codigo").style.display  = "none";
  document.getElementById("campo-numero").value = "";
  document.getElementById("campo-codigo").value = "";
};

window.enviarSMS = async function() {
  const n = document.getElementById("campo-numero")?.value.trim();
  if (!n) { mostrarErro("Digite seu número."); return; }
  const fmt = n.startsWith("+") ? n : "+55" + n.replace(/\D/g, "");
  try {
    window._confirmSMS = await signInWithPhoneNumber(getAuth(), fmt, window._recaptcha);
    document.getElementById("etapa-numero").style.display = "none";
    document.getElementById("etapa-codigo").style.display = "block";
  } catch(err) { mostrarErro(traduzir(err.code)); }
};

window.verificarCodigo = async function() {
  const c = document.getElementById("campo-codigo")?.value.trim();
  if (!c || c.length < 6) { mostrarErro("Digite o código de 6 dígitos."); return; }
  try {
    await window._confirmSMS.confirm(c);
    window.location.href = "home.html";
  } catch { mostrarErro("Código incorreto. Tente novamente."); }
};


/* ═══ RECUPERAR SENHA ═══ */

window.esqueceuSenha = function() {
  const email = document.getElementById("email")?.value.trim();
  if (!email) { mostrarErro("Digite seu email primeiro."); document.getElementById("email")?.focus(); return; }
  window.location.href = "recuperar-senha.html?email=" + encodeURIComponent(email);
};


/* ═══ HELPERS UI ═══ */

window.toggleSenha = function(inputId, iconoId) {
  const input = document.getElementById(inputId);
  const icono = document.getElementById(iconoId);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
  if (icono) icono.style.opacity = input.type === "text" ? "0.35" : "1";
};

window.fecharSeClicarFora = function(e) {
  if (e.target === document.getElementById("modal-celular")) fecharModalCelular();
};

function setCarregando(v) {
  const btn  = document.getElementById("btn-entrar");
  const spin = document.getElementById("spinner");
  if (btn)  btn.disabled        = v;
  if (spin) spin.style.display  = v ? "block" : "none";
}

function mostrarErro(msg) {
  const el = document.getElementById("msg-erro");
  if (!el) return;
  el.textContent   = msg;
  el.style.display = "block";
  setTimeout(() => el.style.display = "none", 4500);
}

window.mostrarErro = mostrarErro;

function traduzir(code) {
  return ({
    "auth/user-not-found":         "Não encontramos uma conta com este email.",
    "auth/wrong-password":         "Senha incorreta. Tente novamente.",
    "auth/invalid-email":          "Email inválido.",
    "auth/too-many-requests":      "Muitas tentativas. Aguarde um momento.",
    "auth/network-request-failed": "Sem conexão. Verifique sua internet.",
    "auth/popup-closed-by-user":   "Login cancelado.",
    "auth/invalid-credential":     "Credenciais inválidas. Tente novamente.",
    "auth/email-already-in-use":   "Este email já está cadastrado.",
    "auth/user-disabled":          "Esta conta foi desativada.",
  })[code] || "Algo deu errado. Tente novamente.";
}


/* ═══ MASKS — inicializar al cargar DOM ═══ */

document.addEventListener("DOMContentLoaded", () => {
  /* Enter email → senha */
  document.getElementById("email")?.addEventListener("keydown", e => {
    if (e.key === "Enter") document.getElementById("senha")?.focus();
  });

  /* Enter senha → login */
  document.getElementById("senha")?.addEventListener("keydown", e => {
    if (e.key === "Enter") loginEmail(e);
  });

  /* Máscara celular */
  document.getElementById("campo-numero")?.addEventListener("input", function() {
    let v = this.value.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    this.value = v.slice(0, 15);
  });
});
