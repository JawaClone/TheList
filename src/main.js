
// ══════════════════════════════════════════
// THE LIST — Main JavaScript (with Auth & Sidebar)
// ══════════════════════════════════════════
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { registerUser, loginUser, logoutUser, listenToUser, listenToAllUsers, assignTicketToUser, preAssignTickets, removeTicketFromUser, preRemoveTickets, verifyTicket, fixGhostTickets, deleteUserFromSystem } from "./auth.js";


// ── MODAL SYSTEM ──
const showCustomModal = (type, message, defaultValue = "") => {
  return new Promise((resolve) => {
    const modalOverlay = document.getElementById('sysModalOverlay');
    const modalBox = document.getElementById('sysModalBox');
    const modalMessage = document.getElementById('sysModalMessage');
    const modalInput = document.getElementById('sysModalInput');
    const modalButtons = document.getElementById('sysModalButtons');
    
    if (!modalOverlay) return resolve(type === 'prompt' ? window.prompt(message, defaultValue) : type === 'confirm' ? window.confirm(message) : window.alert(message));

    modalMessage.innerHTML = message.replace(/\n/g, '<br>');
    modalInput.style.display = type === 'prompt' ? 'block' : 'none';
    if (type === 'prompt') {
      modalInput.value = defaultValue;
      setTimeout(() => modalInput.focus(), 100);
    }
    
    modalButtons.innerHTML = '';
    
    const btnStyle = "padding:12px 25px; font-family:'Space Grotesk', sans-serif; font-size:0.7rem; letter-spacing:0.1em; border:1px solid rgba(200,195,175,0.4); background:transparent; color:#c8c3af; cursor:pointer; transition:all 0.3s ease; text-transform:uppercase;";
    
    const closeAndResolve = (val) => {
      modalOverlay.style.opacity = '0';
      modalBox.style.transform = 'scale(0.95)';
      setTimeout(() => { modalOverlay.style.display = 'none'; }, 300);
      resolve(val);
    };

    const attachHover = (b) => {
      b.addEventListener('mouseenter', () => { const c = document.getElementById('cur'); if(c) c.classList.add('hover'); });
      b.addEventListener('mouseleave', () => { const c = document.getElementById('cur'); if(c) c.classList.remove('hover'); });
    };

    if (type === 'alert') {
      const btn = document.createElement('button');
      btn.innerHTML = 'ENTENDIDO';
      btn.style.cssText = btnStyle;
      btn.onmouseover = () => btn.style.background = 'rgba(200,195,175,0.1)';
      btn.onmouseout = () => btn.style.background = 'transparent';
      btn.onclick = () => closeAndResolve(true);
      attachHover(btn);
      modalButtons.appendChild(btn);
    } else if (type === 'confirm' || type === 'prompt') {
      const btnCancel = document.createElement('button');
      btnCancel.innerHTML = 'CANCELAR';
      btnCancel.style.cssText = btnStyle + " opacity:0.6; border-color:rgba(200,195,175,0.2);";
      btnCancel.onmouseover = () => btnCancel.style.background = 'rgba(255,255,255,0.05)';
      btnCancel.onmouseout = () => btnCancel.style.background = 'transparent';
      btnCancel.onclick = () => closeAndResolve(type === 'prompt' ? null : false);
      attachHover(btnCancel);
      modalButtons.appendChild(btnCancel);

      const btnOk = document.createElement('button');
      btnOk.innerHTML = type === 'prompt' ? 'CONFIRMAR' : 'ACEPTAR';
      btnOk.style.cssText = btnStyle + " background:rgba(200,195,175,0.1);";
      btnOk.onmouseover = () => btnOk.style.background = 'rgba(200,195,175,0.2)';
      btnOk.onmouseout = () => btnOk.style.background = 'rgba(200,195,175,0.1)';
      btnOk.onclick = () => closeAndResolve(type === 'prompt' ? modalInput.value : true);
      attachHover(btnOk);
      modalButtons.appendChild(btnOk);
    }

    modalOverlay.style.display = 'flex';
    setTimeout(() => {
      modalOverlay.style.opacity = '1';
      modalBox.style.transform = 'scale(1)';
    }, 10);
  });
};

const sysAlert = (msg) => showCustomModal('alert', msg);
const sysConfirm = (msg) => showCustomModal('confirm', msg);
const sysPrompt = (msg, def = "") => showCustomModal('prompt', msg, def);


// ── LOADER LOGIC ──
const removeLoader = () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('out');
    initHeroAnimations();
  }, 1000);
};

if (document.readyState === 'complete') {
  removeLoader();
} else {
  window.addEventListener('load', removeLoader);
}

// ── MODAL ELEMENTS ──
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const closeAuth = document.getElementById('closeAuth');
const ctaBtn = document.getElementById('ctaBtn');

// ── PORTAL (SIDEBAR) ELEMENTS ──
const navTrigger = document.getElementById('navTrigger');
const userPortal = document.getElementById('userPortal');
const closePortal = document.getElementById('closePortal');
const ticketArea = document.getElementById('ticketArea');
const adminArea = document.getElementById('adminArea');
const adminList = document.getElementById('adminList');
const logOutBtn = document.getElementById('logOut');
const portalUser = document.getElementById('portalUser');
const dashNav = document.getElementById('dashNav');
const btnBoletos = document.getElementById('btnBoletos');
const btnAdmin = document.getElementById('btnAdmin');
const btnCorreos = document.getElementById('btnCorreos');
const correosArea = document.getElementById('correosArea');
const correosList = document.getElementById('correosList');
const copyEmailsBtn = document.getElementById('copyEmailsBtn');

const bulkEmailInput = document.getElementById('bulkEmailInput');
const bulkTicketCount = document.getElementById('bulkTicketCount');
const bulkAssignBtn = document.getElementById('bulkAssignBtn');

let isUserLoggedIn = false;
window.latestUsersCache = [];

// Abrir Modal/Sidebar
ctaBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (isUserLoggedIn) {
    userPortal.classList.add('open');
  } else {
    authModal.style.display = 'flex';
  }
});

// Cerrar Modal
closeAuth.addEventListener('click', () => { authModal.style.display = 'none'; });

// Cerrar Sidebar
closePortal.addEventListener('click', () => { userPortal.classList.remove('open'); });

// Abrir desde botón de esquina
navTrigger.addEventListener('click', () => { userPortal.classList.add('open'); });

// Tabs Admin vs User
const btnVerificar = document.getElementById('btnVerificar');
const verifyArea = document.getElementById('verifyArea');
const verifyInput = document.getElementById('verifyInput');
const verifyBtn = document.getElementById('verifyBtn');
const verifyResult = document.getElementById('verifyResult');

btnBoletos.addEventListener('click', () => {
  btnBoletos.classList.add('active');
  btnAdmin.classList.remove('active');
  if (btnVerificar) btnVerificar.classList.remove('active');
  if (btnCorreos) btnCorreos.classList.remove('active');
  ticketArea.style.display = 'block';
  adminArea.style.display = 'none';
  if (verifyArea) verifyArea.style.display = 'none';
  if (correosArea) correosArea.style.display = 'none';
  userPortal.classList.remove('admin-mode');
});

btnAdmin.addEventListener('click', () => {
  btnAdmin.classList.add('active');
  btnBoletos.classList.remove('active');
  if (btnVerificar) btnVerificar.classList.remove('active');
  if (btnCorreos) btnCorreos.classList.remove('active');
  adminArea.style.display = 'block';
  ticketArea.style.display = 'none';
  if (verifyArea) verifyArea.style.display = 'none';
  if (correosArea) correosArea.style.display = 'none';
  userPortal.classList.add('admin-mode');
});

if (btnCorreos) {
  btnCorreos.addEventListener('click', () => {
    btnCorreos.classList.add('active');
    btnBoletos.classList.remove('active');
    btnAdmin.classList.remove('active');
    if (btnVerificar) btnVerificar.classList.remove('active');
    correosArea.style.display = 'block';
    adminArea.style.display = 'none';
    ticketArea.style.display = 'none';
    if (verifyArea) verifyArea.style.display = 'none';
    userPortal.classList.add('admin-mode');
  });
}

if (btnVerificar) {
  btnVerificar.addEventListener('click', () => {
    btnVerificar.classList.add('active');
    btnBoletos.classList.remove('active');
    btnAdmin.classList.remove('active');
    if (btnCorreos) btnCorreos.classList.remove('active');
    verifyArea.style.display = 'block';
    adminArea.style.display = 'none';
    ticketArea.style.display = 'none';
    if (correosArea) correosArea.style.display = 'none';
    userPortal.classList.add('admin-mode');
    setTimeout(() => verifyInput.focus(), 100);
  });
}

// ── LÓGICA DE VERIFICACIÓN ──
if (verifyBtn && verifyInput && verifyResult) {
  verifyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyBtn.click();
  });

  verifyBtn.addEventListener('click', async () => {
    const code = verifyInput.value.trim();
    if (!code) {
      verifyResult.innerHTML = `<span style="color:#ffcc00;">POR FAVOR INGRESA UN CÓDIGO</span>`;
      return;
    }
    verifyResult.innerHTML = `<span style="color:#aaa;">Verificando...</span>`;

    const res = await verifyTicket(code);
    if (res.success) {
      verifyResult.innerHTML = `
         <div style="background:rgba(0, 200, 100, 0.1); border:1px solid rgba(0, 255, 100, 0.2); padding: 20px;">
           <h3 style="color:#0f0; margin:0 0 10px 0; font-size:1.5rem;">CÓDIGO VÁLIDO</h3>
           <p style="font-size:0.8rem; margin:0;">El boleto pertenece a:<br><b>${res.user.toUpperCase()}</b><br><span style="opacity:0.6; font-size:0.6rem;">${res.email}</span></p>
           <p style="font-size:0.6rem; color:#aaa; margin-top:10px;">SE HA MARCADO COMO USADO</p>
         </div>
       `;
      verifyInput.value = "";
    } else {
      verifyResult.innerHTML = `
         <div style="background:rgba(255, 0, 0, 0.1); border:1px solid rgba(255, 0, 0, 0.2); padding: 20px;">
           <h3 style="color:#f00; margin:0 0 10px 0; font-size:1.2rem;">ACCESO DENEGADO</h3>
           <p style="font-size:0.8rem; margin:0; color:#fff;">${res.error}</p>
           ${res.user ? `<p style="font-size:0.6rem; opacity:0.6; margin-top:10px;">Intentaron escanear el boleto de: ${res.user}</p>` : ""}
         </div>
       `;
    }
  });
}

// ── LÓGICA DE CORREOS (COPIAR) ──
if (copyEmailsBtn && correosList) {
  copyEmailsBtn.addEventListener('click', () => {
    correosList.select();
    correosList.setSelectionRange(0, 99999);
    try {
      navigator.clipboard.writeText(correosList.value);
      const originalText = copyEmailsBtn.innerHTML;
      copyEmailsBtn.innerHTML = "<span style='color:#0f0'>¡COPIADOS!</span>";
      setTimeout(() => { copyEmailsBtn.innerHTML = originalText; }, 2000);
    } catch (err) {
      sysAlert("Error al intentar copiar.");
    }
  });
}

// ── LÓGICA DE ASIGNACIÓN MASIVA ──
if (bulkAssignBtn && bulkEmailInput && bulkTicketCount) {
  bulkAssignBtn.addEventListener('click', async () => {
    const rawEmails = bulkEmailInput.value;
    const count = parseInt(bulkTicketCount.value);

    if (!rawEmails.trim()) { await sysAlert("Por favor ingresa al menos un correo."); return; }
    if (!count || isNaN(count) || count < 1) { await sysAlert("La cantidad de boletos debe ser al menos 1."); return; }

    const emailArray = [...new Set(rawEmails.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@") && e.includes(".")))];

    if (emailArray.length === 0) { await sysAlert("No se detectaron correos válidos en la lista."); return; }

    const confirmBulk = await sysConfirm(`¿Admitir a ${emailArray.length} invitado(s) asignándoles ${count} boleto(s) a cada uno?`);
    if (!confirmBulk) return;

    const originalText = bulkAssignBtn.innerHTML;
    bulkAssignBtn.innerHTML = "ENVIANDO BOLETOS...";
    bulkAssignBtn.disabled = true;

    let successCount = 0;

    for (const email of emailArray) {
      const foundUser = window.latestUsersCache.find(u => (u.email || "").toLowerCase() === email);

      if (!foundUser || foundUser.isGhost) {
        const res = await preAssignTickets(email, count);
        if (res.success) successCount++;
      } else {
        const res = await assignTicketToUser(foundUser.id, count);
        if (res.success) successCount++;
      }
    }

    await sysAlert(`¡PROCESO COMPLETADO!\n\nSe enviaron exitosamente correos/boletos a ${successCount} de ${emailArray.length} cuentas.`);
    bulkAssignBtn.innerHTML = originalText;
    bulkAssignBtn.disabled = false;
    bulkEmailInput.value = "";
  });
}

// Switch Login/Register
document.getElementById('toRegister').onclick = () => { loginForm.style.display = 'none'; registerForm.style.display = 'block'; };
document.getElementById('toLogin').onclick = () => { registerForm.style.display = 'none'; loginForm.style.display = 'block'; };

// ── MOSTRAR/OCULTAR CONTRASEÑA ──
const setupPassToggle = (btnId, inputId, slashId) => {
  const btn = document.getElementById(btnId);
  const input = document.getElementById(inputId);
  const slash = document.getElementById(slashId);
  if (!btn || !input || !slash) return;

  btn.onclick = () => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    slash.style.display = isPass ? 'block' : 'none';
    btn.style.color = isPass ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
  };
};

setupPassToggle('toggleLoginPass', 'loginPass', 'eyeSlashLogin');
setupPassToggle('toggleRegPass', 'regPass', 'eyeSlashReg');

// Asegurar que el cursor reaccione a los iconos de ojo
setTimeout(() => {
  document.querySelectorAll('#toggleLoginPass, #toggleRegPass').forEach(el => {
    el.addEventListener('mouseenter', () => { const c = document.getElementById('cur'); if(c) c.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { const c = document.getElementById('cur'); if(c) c.classList.remove('hover'); });
  });
}, 500);

// ── LÓGICA DE TRADUCCIÓN DE ERRORES ──
const getFriendlyError = (err) => {
  const msg = err.toString().toLowerCase();
  if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
    return "Email o contraseña incorrectos. Inténtalo de nuevo.";
  }
  if (msg.includes('email-already-in-use')) {
    return "Este correo ya está registrado en The List.";
  }
  if (msg.includes('weak-password') || msg.includes('password should be at least')) {
    return "La contraseña es muy corta. Debe tener al menos 6 caracteres.";
  }
  if (msg.includes('invalid-email')) {
    return "El formato del correo no es válido.";
  }
  return "Ocurrió un error inesperado. Inténtalo más tarde.";
};

// ── LÓGICA DE REGISTRO ──
document.getElementById('doRegister').onclick = async () => {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPass').value;

  if (!name || !email || !pass) { await sysAlert("LLENA TODOS LOS CAMPOS"); return; }
  if (pass.length < 6) { await sysAlert("TU CONTRASEÑA ES DEMASIADO CORTA.\n\nDebe tener al menos 6 caracteres por seguridad."); return; }

  const res = await registerUser(email, pass, name);
  if (res.success) {
    await sysAlert("¡REGISTRO EXITOSO! BIENVENIDO A THE LIST.");
    authModal.style.display = 'none';
  } else {
    await sysAlert("ERROR DE REGISTRO\n\n" + getFriendlyError(res.error));
  }
};

// ── LÓGICA DE LOGIN ──
document.getElementById('doLogin').onclick = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;

  if (!email || !pass) { await sysAlert("LLENA EMAIL Y CONTRASEÑA"); return; }

  const res = await loginUser(email, pass);
  if (res.success) {
    authModal.style.display = 'none';
  } else {
    await sysAlert("DATOS INCORRECTOS\n\n" + getFriendlyError(res.error));
  }
};

// ── LÓGICA DE SALIR ──
logOutBtn.onclick = () => {
  logoutUser();
  userPortal.classList.remove('open');
  location.reload();
};

// ── RENDER ADMIN LIST (REAL TIME) ──
let adminUnsubscribe = null;

const startAdminRealtime = () => {
  if (adminUnsubscribe) return; // ya escuchando
  adminUnsubscribe = listenToAllUsers((users) => {
    // Save to cache for bulk assign
    window.latestUsersCache = users;

    // Ordenar por pendientes 
    users.sort((a, b) => ((a.ticketCode || "") === "PENDIENTE" ? -1 : 1));

    // Llenar lista de correos
    if (correosList) {
      const allEmails = users.map(u => u.email).filter(e => e && e.trim() !== "");
      // Usar Set para evitar duplicados si los hubiera
      const uniqueEmails = [...new Set(allEmails)];
      correosList.value = uniqueEmails.join(", ");
    }

    // Agregar un panel de búsqueda manual encima de la lista por si falla la vista
    const searchPanel = `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 20px; margin-bottom: 30px; display:flex; gap:15px; align-items:flex-end;">
        <div style="flex:1;">
          <p style="font-size:0.6rem; letter-spacing:0.2em; color:rgba(255,255,255,0.5); margin-bottom:10px;">HABILITAR BOLETO POR CORREO (BUSCADOR)</p>
          <input type="email" id="manualEmail" placeholder="correo@ejemplo.com" style="width:100%; background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.2); color:#fff; padding:10px 0; font-family:'Space Grotesk', sans-serif; font-size:0.8rem; outline:none;" />
        </div>
        <button id="manualAssignBtn" class="action-btn" style="padding:12px 20px; font-size:0.6rem;">ASIGNAR</button>
      </div>
      <div class="admin-grid-users">
    `;

    const gridHtml = users.map(u => {
      const CodeActual = u.ticketCode || "PENDIENTE";
      const isP = CodeActual === "PENDIENTE";
      let ticketsDesc = CodeActual;
      if (u.tickets && u.tickets.length > 0) {
        const usedCount = u.usedTickets ? u.usedTickets.length : 0;
        const totalCount = u.tickets.length;
        const availableCount = totalCount - usedCount;
        if (availableCount > 0) {
          ticketsDesc = `${availableCount}/${totalCount} DISPONIBLE(S)`;
        } else {
          ticketsDesc = `<span style="color:#f55;">AGOTADOS (${totalCount} USADOS)</span>`;
        }
      }

      return `
        <div class="admin-item">
          <div style="margin-bottom: 10px; width: 100%;">
             <p style="font-size:0.8rem; font-weight:bold; letter-spacing:0.1em; margin-bottom:5px;">${(u.name || "Usuario Desconocido").toUpperCase()}</p>
             <span style="font-weight:normal; font-size:0.5rem; opacity:0.6;">${u.email || "Sin correo"}</span>
          </div>
          <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.05);">
             ${isP
          ? `<span style="color:rgba(180,0,0,0.8); font-size:0.5rem; letter-spacing:0.1em;">PENDIENTE DE PAGO</span>`
          : `<span style="font-size:0.5rem; color:#fff; letter-spacing:0.1em;">${ticketsDesc}</span>`}
             <div style="display:flex; gap:5px;">
               ${isP || u.role === "admin"
          ? ``
          : `<button class="action-btn remove-btn" data-uid="${u.id}" data-email="${u.email}" style="padding: 5px 10px; font-size:0.6rem; min-width:30px; border-color:rgba(255,0,0,0.3); color:#f55;">-</button>`}
               ${isP || u.role === "admin"
          ? `<button class="action-btn add-btn" data-uid="${u.id}" data-email="${u.email}">ACTIVAR</button>`
          : `<button class="action-btn add-btn" data-uid="${u.id}" data-email="${u.email}" style="padding: 5px 10px; font-size:0.6rem; min-width:30px;">+</button>`}
               <button class="action-btn delete-user-btn" data-uid="${u.id}" data-email="${u.email}" data-ghost="${u.isGhost || false}" style="padding: 5px 10px; font-size: 0.6rem; min-width: 30px; background:rgba(200,30,30,0.1); color:#f55; border-color:rgba(200,30,30,0.3);" title="ELIMINAR USUARIO">
                  <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="pointer-events:none;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
               </button>
             </div>
          </div>
        </div>
      `;
    }).join('');

    adminList.innerHTML = searchPanel + gridHtml + `</div>`;

    document.querySelectorAll('.add-btn').forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const emailLabel = btn.dataset.email;
        const isGhost = users.find(u => u.id === uid)?.isGhost;

        const cant = await sysPrompt(`¿Cuántos boletos ASIGNAREMOS para ${emailLabel}?`, "1");
        if (!cant || isNaN(cant) || cant <= 0) return;

        let res;
        if (isGhost) {
          res = await preAssignTickets(emailLabel, parseInt(cant));
        } else {
          res = await assignTicketToUser(uid, parseInt(cant));
        }

        if (!res.success) { await sysAlert("ERROR: " + res.error); }
      };
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const emailLabel = btn.dataset.email;
        const isGhost = users.find(u => u.id === uid)?.isGhost;

        const cant = await sysPrompt(`¿Cuántos boletos QUEREMOS QUITAR a ${emailLabel}?`, "1");
        if (!cant || isNaN(cant) || cant <= 0) return;

        let res;
        if (isGhost) {
          res = await preRemoveTickets(emailLabel, parseInt(cant));
        } else {
          res = await removeTicketFromUser(uid, parseInt(cant));
        }

        if (!res.success) { await sysAlert("ERROR: " + res.error); }
      };
    });

    const mBtn = document.getElementById('manualAssignBtn');
    if (mBtn) {
      mBtn.onclick = async () => {
        const mEmail = document.getElementById('manualEmail').value.trim();
        if (!mEmail) { await sysAlert("Escribe un correo válido"); return; }

        const targetEmail = mEmail.toLowerCase();
        const foundUser = users.find(u => (u.email || "").toLowerCase() === targetEmail);

        const cant = await sysPrompt(`¿Cuántos boletos asignaremos a ${mEmail}?`, "1");
        if (!cant || isNaN(cant) || cant <= 0) return;

        if (!foundUser || foundUser.isGhost) {
          const confirmPre = await sysConfirm("Este usuario es invitado o aún no se ha registrado.\n\n¿Quieres generarle sus boletos de todas formas? (Se le asignarán automáticamente en cuanto se registre).");
          if (!confirmPre) return;

          const res = await preAssignTickets(mEmail, parseInt(cant));
          if (res.success) {
            await sysAlert("¡BOLETOS ASIGNADOS CON ÉXITO A " + mEmail + "! Los tendrá listos en su cuenta.");
            document.getElementById('manualEmail').value = "";
          } else {
            await sysAlert("ERROR: " + res.error);
          }
        } else {
          const res = await assignTicketToUser(foundUser.id, parseInt(cant));
          if (res.success) {
            await sysAlert("¡BOLETOS ASIGNADOS CON ÉXITO A " + mEmail + "!");
            document.getElementById('manualEmail').value = "";
          } else {
            await sysAlert("ERROR: " + res.error);
          }
        }
      };
    }

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const email = btn.dataset.email;
        const isGhost = btn.dataset.ghost === 'true';

        const confirmDel = await sysConfirm(`¿ELIMINAR POR COMPLETO A ${email}?\n\nEsta acción no se puede deshacer y borrará sus boletos asociados.`);
        if (!confirmDel) return;

        const res = await deleteUserFromSystem(uid, isGhost);
        if (res.success) {
           // Firestore actualizará automáticamente
        } else {
          await sysAlert("ERROR AL ELIMINAR: " + res.error);
        }
      };
    });

    document.querySelectorAll('.delete-user-btn, .add-btn, .remove-btn').forEach(b => {
      b.addEventListener('mouseenter', () => { const c = document.getElementById('cur'); if(c) c.classList.add('hover'); });
      b.addEventListener('mouseleave', () => { const c = document.getElementById('cur'); if(c) c.classList.remove('hover'); });
    });
  });
};

// ── OBSERVAR ESTADO DE USUARIO ──
let userUnsubscribe = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    isUserLoggedIn = true;
    navTrigger.style.display = 'block'; 
    userPortal.classList.add('open');
    ctaBtn.textContent = "VER MI BOLETO";

    if (userUnsubscribe) userUnsubscribe();

    fixGhostTickets(user.uid, user.email);

    userUnsubscribe = listenToUser(user.uid, (data) => {
      if (data) {
        portalUser.textContent = (data.name || "Usuario").toUpperCase();

        if (data.ticketCode === "PENDIENTE" && (!data.tickets || data.tickets.length === 0)) {
          ticketArea.innerHTML = `
            <p class="ticket-sub" style="color:rgba(180,0,0,0.8); margin-bottom:20px;">PENDIENTE DE PAGO</p>
            <div style="font-size:0.6rem; color:rgba(255,255,255,0.4);">Tu cuenta está bajo revisión.<br><br> Envía tu comprobante de compra y activaremos tu código.</div>
          `;
        } else if (data.tickets && data.tickets.length > 0) {
          const usedTks = data.usedTickets || [];
          let ticketsHTML = data.tickets.map((code, idx) => {
            const isUsed = usedTks.includes(code);
            const numLabel = (idx + 1).toString().padStart(2, '0');

            if (isUsed) {
              return `
                <div style="position: relative; border: 1px solid rgba(255,0,0,0.3); padding: 30px; margin-bottom: 25px; background: #050505; opacity: 0.6; overflow: hidden; font-family: 'Space Grotesk', sans-serif;">
                   <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-15deg); font-family:'Cormorant Garamond', serif; font-size:4rem; color:rgba(255,0,0,0.05); font-weight:bold; white-space:nowrap; pointer-events:none;">INVALIDATED</div>
                   <p style="margin:0 0 10px 0; color: #f55; letter-spacing:0.2em; font-size:0.6rem;">DOC NO. ${numLabel} // TICKET USADO</p>
                   <h3 style="font-size:2rem; text-decoration: line-through; margin:10px 0; color: #f55; font-family:'Cormorant Garamond', serif; font-weight: 300; letter-spacing:0.1em;">${code}</h3>
                </div>
              `;
            } else {
              return `
                <div style="position: relative; border: 1px solid rgba(200,195,175,0.4); padding: 30px; margin-bottom: 25px; background: linear-gradient(135deg, rgba(15,15,15,1) 0%, rgba(0,0,0,1) 100%); overflow: hidden; font-family: 'Space Grotesk', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                   <div style="position:absolute; top:10px; left:10px; width:10px; height:10px; border-top:1px solid rgba(200,195,175,0.5); border-left:1px solid rgba(200,195,175,0.5);"></div>
                   <div style="position:absolute; top:10px; right:10px; width:10px; height:10px; border-top:1px solid rgba(200,195,175,0.5); border-right:1px solid rgba(200,195,175,0.5);"></div>
                   <div style="position:absolute; bottom:10px; left:10px; width:10px; height:10px; border-bottom:1px solid rgba(200,195,175,0.5); border-left:1px solid rgba(200,195,175,0.5);"></div>
                   <div style="position:absolute; bottom:10px; right:10px; width:10px; height:10px; border-bottom:1px solid rgba(200,195,175,0.5); border-right:1px solid rgba(200,195,175,0.5);"></div>
                   <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(200,195,175,0.15); padding-bottom:10px; margin-bottom:15px;">
                     <p style="margin:0; color:rgba(200,195,175,0.6); letter-spacing:0.2em; font-size:0.5rem;">REGISTRO OFFICIAL</p>
                     <p style="margin:0; color:rgba(200,195,175,0.6); letter-spacing:0.2em; font-size:0.5rem;">NO. ${numLabel}</p>
                   </div>
                   <div style="text-align:center; padding: 10px 0;">
                     <h3 style="font-size:2.8rem; margin:0; color:rgba(200,195,175,1); font-family:'Cormorant Garamond', serif; font-weight: 300; letter-spacing: 0.15em;">${code}</h3>
                     <div style="margin-top:20px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code)}&color=050505&bgcolor=c8c3af" alt="QR" style="width:120px; height:120px; background:#c8c3af; padding:10px;" />
                     </div>
                   </div>
                </div>
              `;
            }
          }).join('');

          ticketArea.innerHTML = `
            <p class="ticket-sub" style="margin-bottom:30px; color:rgba(200,195,175,0.8); letter-spacing:0.2em; text-align:center; font-size:0.7rem;">EL DOCUMENTO HA SIDO AUTORIZADO</p>
            ${ticketsHTML}
          `;
        } else {
          ticketArea.innerHTML = `<h3 class="ticket-code">${data.ticketCode || "--"}</h3>`;
        }

        if (data.role === "admin") {
          dashNav.style.display = 'flex';
          startAdminRealtime();
        } else {
          dashNav.style.display = 'none';
          adminArea.style.display = 'none';
          ticketArea.style.display = 'block';
        }
      }
    });

  } else {
    isUserLoggedIn = false;
    navTrigger.style.display = 'none'; 
    ctaBtn.textContent = "SOLICITAR ACCESO";
    userPortal.classList.remove('open');
    if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
  }
});


// ── CUSTOM CURSOR ──
const cur = document.getElementById('cur');
const cdot = document.getElementById('cdot');
let mx = 0, my = 0, cx = 0, cy = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; cdot.style.cssText = `left:${mx}px;top:${my}px`; });
(function curLoop() { cx += (mx - cx) * .12; cy += (my - cy) * .12; cur.style.cssText = `left:${cx}px;top:${cy}px`; requestAnimationFrame(curLoop); })();

// ── PARTICLES ──
const canvas = document.getElementById('pc');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
addEventListener('resize', resize);
function newPt() { return { x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * .8 + .1, vx: (Math.random() - .5) * .1, vy: -Math.random() * .18 - .04, a: Math.random() * .18 + .03, life: Math.random() * 400 + 120, max: 0 }; }
const pts = Array.from({ length: 38 }, () => newPt());
pts.forEach(p => { p.max = p.life; p.life = Math.random() * p.max; });
function tickParts() { ctx.clearRect(0, 0, canvas.width, canvas.height); pts.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0 || p.y < -5) { Object.assign(p, newPt()); p.max = p.life; p.y = canvas.height + 5; } ctx.save(); ctx.globalAlpha = (p.life / p.max) * p.a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }); requestAnimationFrame(tickParts); }
tickParts();

// ── SCROLL REVEAL ──
const revs = document.querySelectorAll('.r');
const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }); }, { threshold: 0.15 });
revs.forEach(r => io.observe(r));

// ── MAGNETIC CTA ──
if (ctaBtn) {
  ctaBtn.addEventListener('mousemove', e => {
    const rect = ctaBtn.getBoundingClientRect();
    const xRel = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const yRel = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    ctaBtn.style.transform = `perspective(500px) rotateX(${-yRel * 6}deg) rotateY(${xRel * 8}deg) translateY(-2px)`;
  });
  ctaBtn.addEventListener('mouseleave', () => { ctaBtn.style.transform = 'perspective(500px) rotateX(0) rotateY(0) translateY(0)'; });
}
