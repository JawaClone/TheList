

// ══════════════════════════════════════════
// THE LIST — Main JavaScript (with Auth & Sidebar)
// ══════════════════════════════════════════
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { registerUser, loginUser, logoutUser, listenToUser, listenToAllUsers, assignTicketToUser, preAssignTickets, removeTicketFromUser, preRemoveTickets, verifyTicket, fixGhostTickets } from "./auth.js";


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
  if(btnVerificar) btnVerificar.classList.remove('active');
  if(btnCorreos) btnCorreos.classList.remove('active');
  ticketArea.style.display = 'block';
  adminArea.style.display = 'none';
  if(verifyArea) verifyArea.style.display = 'none';
  if(correosArea) correosArea.style.display = 'none';
  userPortal.classList.remove('admin-mode');
});

btnAdmin.addEventListener('click', () => {
  btnAdmin.classList.add('active');
  btnBoletos.classList.remove('active');
  if(btnVerificar) btnVerificar.classList.remove('active');
  if(btnCorreos) btnCorreos.classList.remove('active');
  adminArea.style.display = 'block';
  ticketArea.style.display = 'none';
  if(verifyArea) verifyArea.style.display = 'none';
  if(correosArea) correosArea.style.display = 'none';
  userPortal.classList.add('admin-mode');
});

if (btnCorreos) {
  btnCorreos.addEventListener('click', () => {
    btnCorreos.classList.add('active');
    btnBoletos.classList.remove('active');
    btnAdmin.classList.remove('active');
    if(btnVerificar) btnVerificar.classList.remove('active');
    correosArea.style.display = 'block';
    adminArea.style.display = 'none';
    ticketArea.style.display = 'none';
    if(verifyArea) verifyArea.style.display = 'none';
    userPortal.classList.add('admin-mode');
  });
}

if (btnVerificar) {
  btnVerificar.addEventListener('click', () => {
    btnVerificar.classList.add('active');
    btnBoletos.classList.remove('active');
    btnAdmin.classList.remove('active');
    if(btnCorreos) btnCorreos.classList.remove('active');
    verifyArea.style.display = 'block';
    adminArea.style.display = 'none';
    ticketArea.style.display = 'none';
    if(correosArea) correosArea.style.display = 'none';
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
      alert("Error al intentar copiar.");
    }
  });
}

// ── LÓGICA DE ASIGNACIÓN MASIVA ──
if (bulkAssignBtn && bulkEmailInput && bulkTicketCount) {
  bulkAssignBtn.addEventListener('click', async () => {
    const rawEmails = bulkEmailInput.value;
    const count = parseInt(bulkTicketCount.value);
    
    if (!rawEmails.trim()) return alert("Por favor ingresa al menos un correo.");
    if (!count || isNaN(count) || count < 1) return alert("La cantidad de boletos debe ser al menos 1.");
    
    const emailArray = [...new Set(rawEmails.split(/[\n,]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes("@") && e.includes(".")))];
    
    if (emailArray.length === 0) return alert("No se detectaron correos válidos en la lista.");
    
    if (!confirm(`¿Admitir a ${emailArray.length} invitado(s) asignándoles ${count} boleto(s) a cada uno?`)) return;
    
    const originalText = bulkAssignBtn.innerHTML;
    bulkAssignBtn.innerHTML = "ENVIANDO BOLETOS...";
    bulkAssignBtn.disabled = true;
    
    let successCount = 0;
    
    for (const email of emailArray) {
      const foundUser = window.latestUsersCache.find(u => (u.email || "").toLowerCase() === email);
      
      if (!foundUser || foundUser.isGhost) {
         const res = await preAssignTickets(email, count);
         if(res.success) successCount++;
      } else {
         const res = await assignTicketToUser(foundUser.id, count);
         if(res.success) successCount++;
      }
    }
    
    alert(`¡PROCESO COMPLETADO!\n\nSe enviaron exitosamente correos/boletos a ${successCount} de ${emailArray.length} cuentas.`);
    bulkAssignBtn.innerHTML = originalText;
    bulkAssignBtn.disabled = false;
    bulkEmailInput.value = "";
  });
}

// Switch Login/Register
document.getElementById('toRegister').onclick = () => { loginForm.style.display = 'none'; registerForm.style.display = 'block'; };
document.getElementById('toLogin').onclick = () => { registerForm.style.display = 'none'; loginForm.style.display = 'block'; };

// ── LÓGICA DE REGISTRO ──
document.getElementById('doRegister').onclick = async () => {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;

  if (!name || !email || !pass) return alert("LLENA TODOS LOS CAMPOS");

  const res = await registerUser(email, pass, name);
  if (res.success) {
    alert("¡REGISTRO EXITOSO! BIENVENIDO A THE LIST.");
    authModal.style.display = 'none';
  } else {
    alert("ERROR: " + res.error);
  }
};

// ── LÓGICA DE LOGIN ──
document.getElementById('doLogin').onclick = async () => {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  if (!email || !pass) return alert("LLENA EMAIL Y CONTRASEÑA");

  const res = await loginUser(email, pass);
  if (res.success) {
    authModal.style.display = 'none';
  } else {
    alert("ERROR: " + res.error);
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
    users.sort((a,b) => ((a.ticketCode||"") === "PENDIENTE" ? -1 : 1));

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

        const cant = prompt(`¿Cuántos boletos ASIGNAREMOS para ${emailLabel}?`, "1");
        if(!cant || isNaN(cant) || cant <= 0) return;

        let res;
        if(isGhost) {
           res = await preAssignTickets(emailLabel, parseInt(cant));
        } else {
           res = await assignTicketToUser(uid, parseInt(cant));
        }

        if(!res.success) { alert("ERROR: " + res.error); }
      };
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.onclick = async () => {
        const uid = btn.dataset.uid;
        const emailLabel = btn.dataset.email;
        const isGhost = users.find(u => u.id === uid)?.isGhost;

        const cant = prompt(`¿Cuántos boletos QUEREMOS QUITAR a ${emailLabel}?`, "1");
        if(!cant || isNaN(cant) || cant <= 0) return;

        let res;
        if(isGhost) {
           res = await preRemoveTickets(emailLabel, parseInt(cant));
        } else {
           res = await removeTicketFromUser(uid, parseInt(cant));
        }

        if(!res.success) { alert("ERROR: " + res.error); }
      };
    });


    const mBtn = document.getElementById('manualAssignBtn');
    if(mBtn) {
       mBtn.onclick = async () => {
         const mEmail = document.getElementById('manualEmail').value.trim();
         if(!mEmail) return alert("Escribe un correo válido");
         
         const targetEmail = mEmail.toLowerCase();
         const foundUser = users.find(u => (u.email || "").toLowerCase() === targetEmail);
         
         const cant = prompt(`¿Cuántos boletos asignaremos a ${mEmail}?`, "1");
         if(!cant || isNaN(cant) || cant <= 0) return;

         if(!foundUser || foundUser.isGhost) {
           // Pre-asignar boleto flotante
           const confirmPre = confirm("Este usuario es invitado o aún no se ha registrado.\n\n¿Quieres generarle sus boletos de todas formas? (Se le asignarán automáticamente en cuanto se registre).");
           if(!confirmPre) return;

           const res = await preAssignTickets(mEmail, parseInt(cant));
           if(res.success) {
              alert("¡BOLETOS ASIGNADOS CON ÉXITO A " + mEmail + "! Los tendrá listos en su cuenta.");
              document.getElementById('manualEmail').value = "";
           } else {
              alert("ERROR: " + res.error);
           }
         } else {
           // Asignación normal a usuario de Firestore
           const res = await assignTicketToUser(foundUser.id, parseInt(cant));
           if(res.success) {
              alert("¡BOLETOS ASIGNADOS CON ÉXITO A " + mEmail + "!");
              document.getElementById('manualEmail').value = "";
           } else {
              alert("ERROR: " + res.error);
           }
         }
       };
    }
  });
};

// ── OBSERVAR ESTADO DE USUARIO ──
let userUnsubscribe = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    isUserLoggedIn = true;
    navTrigger.style.display = 'block'; // Mostrar botón en esquina
    userPortal.classList.add('open');
    ctaBtn.textContent = "VER MI BOLETO";

    if (userUnsubscribe) userUnsubscribe();
    
    // Auto rescate de boletos: Si el admin le asignó boletos por correo antes o después de que entrara
    fixGhostTickets(user.uid, user.email);
    
    userUnsubscribe = listenToUser(user.uid, (data) => {
      if (data) {
        portalUser.textContent = (data.name || "Usuario").toUpperCase();

        // View para el Boleto
        if (data.ticketCode === "PENDIENTE" && (!data.tickets || data.tickets.length === 0)) {
          ticketArea.innerHTML = `
            <p class="ticket-sub" style="color:rgba(180,0,0,0.8); margin-bottom:20px;">PENDIENTE DE PAGO</p>
            <div style="font-size:0.6rem; color:rgba(255,255,255,0.4);">Tu cuenta está bajo revisión.<br><br> Envía tu comprobante de compra y activaremos tu código.</div>
          `;

          // Auto rescate asíncrono removido, delegando a la montura del Hook principal


        } else if (data.tickets && data.tickets.length > 0) {
          const usedTks = data.usedTickets || [];
          let ticketsHTML = data.tickets.map(code => {
            const isUsed = usedTks.includes(code);
            if (isUsed) {
              return `
                <div style="border: 1px solid rgba(255,0,0,0.3); padding: 20px; margin-bottom: 15px; background: rgba(255,0,0,0.05); opacity: 0.6;">
                   <p class="ticket-sub" style="margin-bottom:10px; color: #f55; letter-spacing:0.1em;">BOLETO USADO</p>
                   <h3 class="ticket-code" style="font-size:1.5rem; text-decoration: line-through; margin:0; color: #f55;">${code}</h3>
                   <p style="font-size: 0.6rem; margin-top: 10px; color: #f55;">Este boleto ya ha sido escaneado y no puede volver a usarse.</p>
                </div>
              `;
            } else {
              return `
                <div style="border: 1px solid rgba(0,255,100,0.3); padding: 20px; margin-bottom: 15px; background: rgba(0,255,100,0.05); position: relative; overflow: hidden;">
                   <div style="position:absolute; top: -15px; right: -25px; background: rgba(0,255,100,0.2); color: #0f0; font-size: 0.5rem; transform: rotate(45deg); padding: 25px 25px 5px 25px; letter-spacing: 0.1em; border-bottom: 1px solid rgba(0,255,100,0.3);">UN SOLO USO</div>
                   <p class="ticket-sub" style="margin-bottom:10px; color: #0f0; letter-spacing:0.1em;">CÓDIGO DE ACCESO ÚNICO</p>
                   <h3 class="ticket-code" style="font-size:2.5rem; margin:0; color: #fff; letter-spacing: 0.1em; text-shadow: 0 0 10px rgba(0,255,100,0.5);">${code}</h3>
                   <p style="font-size: 0.5rem; margin-top: 15px; opacity: 0.8; line-height:1.4;">Este es tu boleto electrónico.<br>Válido para <b>1 persona</b>. Será invalidado tras ser escaneado.</p>
                </div>
              `;
            }
          }).join('');

          ticketArea.innerHTML = `
            <p class="ticket-sub" style="margin-bottom:20px; color:#fff;">TUS BOLETOS</p>
            ${ticketsHTML}
            <p class="ticket-sub" style="margin-top:20px;">PRESÉNTALOS EN LA ENTRADA</p>
          `;
        } else {
          ticketArea.innerHTML = `
            <p class="ticket-sub">CÓDIGO EXCLUSIVO</p>
            <h3 class="ticket-code">${data.ticketCode || "--"}</h3>
            <p class="ticket-sub">PRESÉNTALO EN LA ENTRADA</p>
          `;
        }

        // View para el Admin
        if (data.role === "admin") {
          dashNav.style.display = 'flex';
          startAdminRealtime();
        } else {
          dashNav.style.display = 'none';
          adminArea.style.display = 'none';
          ticketArea.style.display = 'block';
        }
      } else {
        ticketArea.innerHTML = `
          <p class="ticket-msg">INFORMACIÓN NO ENCONTRADA.<br><span style="font-size:0.5rem">Tu boleto podría estar alojado bajo otro correo o en la bóveda de pre-registro.</span></p>
          <button id="forceSyncBtn" class="action-btn" style="margin-top:20px; padding: 15px; width: 100%; font-size:0.8rem; border:1px solid rgba(255,255,255,0.3); background:rgba(0,0,0,0.8); cursor:pointer;">RESCATAR MIS BOLETOS</button>
        `;
        
        setTimeout(() => {
           const btnSync = document.getElementById("forceSyncBtn");
           if(btnSync && user) {
              btnSync.onclick = async () => {
                 btnSync.textContent = "SINCRONIZANDO...";
                 await fixGhostTickets(user.uid, user.email);
                 alert("Proceso de sincronización finalizado. Tu cuenta ha sido reparada. Haz click para continuar.");
                 location.reload();
              };
           }
        }, 100);
      }
    });

  } else {
    isUserLoggedIn = false;
    navTrigger.style.display = 'none'; // Esconder botón superior
    ctaBtn.textContent = "SOLICITAR ACCESO";
    userPortal.classList.remove('open');
    if(userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }
  }
});


// ══════════════════════════════════════════
// CUSTOM CURSOR (lagged follow)
// ══════════════════════════════════════════
const cur = document.getElementById('cur');
const cdot = document.getElementById('cdot');
let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cdot.style.cssText = `left:${mx}px;top:${my}px`;
});

(function curLoop() {
  cx += (mx - cx) * .12;
  cy += (my - cy) * .12;
  cur.style.cssText = `left:${cx}px;top:${cy}px`;
  requestAnimationFrame(curLoop);
})();

document.querySelectorAll('a, button, .cta').forEach(el => {
  el.addEventListener('mouseenter', () => cur.classList.add('hover'));
  el.addEventListener('mouseleave', () => cur.classList.remove('hover'));
});

// ══════════════════════════════════════════
// PARTICLES (dust in hero)
// ══════════════════════════════════════════
const canvas = document.getElementById('pc');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener('resize', resize);

function newPt() {
  return {
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * .8 + .1,
    vx: (Math.random() - .5) * .1,
    vy: -Math.random() * .18 - .04,
    a: Math.random() * .18 + .03,
    life: Math.random() * 400 + 120,
    max: 0,
  };
}

const pts = Array.from({ length: 38 }, () => newPt());
pts.forEach(p => { p.max = p.life; p.life = Math.random() * p.max; });

function tickParts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pts.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0 || p.y < -5) {
      Object.assign(p, newPt());
      p.max = p.life;
      p.y = canvas.height + 5;
    }
    const alpha = (p.life / p.max) * p.a;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  requestAnimationFrame(tickParts);
}
tickParts();

// ══════════════════════════════════════════
// SCROLL REVEAL (.r elements)
// ══════════════════════════════════════════
const revs = document.querySelectorAll('.r');
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('on');
  });
}, { threshold: .1 });

revs.forEach(el => io.observe(el));

// ══════════════════════════════════════════
// ANIMATION 1 — HAIRLINES DRAW FROM CENTER
// ANIMATION 2 — CORNER LABELS STAGGERED
// ANIMATION 3 — TAGLINE CHAR-BY-CHAR SCRAMBLE
// ══════════════════════════════════════════
function initHeroAnimations() {

  // 1. Hairlines draw
  setTimeout(() => {
    document.querySelectorAll('.hero-rule').forEach(r => r.classList.add('drawn'));
  }, 200);

  // 2. Corner labels — stagger TL → TR → BL → BR
  const corners = ['hero-corner-tl', 'hero-corner-tr', 'hero-corner-bl', 'hero-corner-br'];
  corners.forEach((cls, i) => {
    setTimeout(() => {
      const el = document.querySelector('.' + cls);
      if (el) el.classList.add('shown');
    }, 600 + i * 220);
  });

  // 3. Tagline char-by-char scramble reveal
  const tag = document.querySelector('.hero-tag');
  if (!tag) return;

  const original = tag.textContent;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·';
  const len = original.length;
  let revealed = 0;

  tag.textContent = '';
  tag.style.opacity = '1'; // override CSS animation

  function revealChar() {
    if (revealed >= len) return;
    let scrambles = 0;

    const iv = setInterval(() => {
      let display = '';
      for (let i = 0; i < len; i++) {
        if (i < revealed) display += original[i];
        else if (i === revealed) display += chars[Math.floor(Math.random() * chars.length)];
        else display += '\u00a0';
      }
      tag.textContent = display;
      scrambles++;

      if (scrambles >= 3) {
        clearInterval(iv);
        // Commit real character before moving on
        let committed = '';
        for (let i = 0; i <= revealed; i++) committed += original[i];
        for (let i = revealed + 1; i < len; i++) committed += '\u00a0';
        tag.textContent = committed;
        revealed++;
        setTimeout(revealChar, 12);
      }
    }, 16);
  }

  setTimeout(revealChar, 800);
}

// ══════════════════════════════════════════
// ANIMATION 4 — LOGO PARALLAX on mouse
// ══════════════════════════════════════════
const logo = document.querySelector('.hero-logo');

document.addEventListener('mousemove', e => {
  if (!logo || window.scrollY > window.innerHeight * 0.6) return;
  const xPct = e.clientX / window.innerWidth - 0.5;
  const yPct = e.clientY / window.innerHeight - 0.5;
  logo.style.transform = `translate(${xPct * -10}px, ${yPct * -7}px)`;
});

// ══════════════════════════════════════════
// ANIMATION 5 — COUNTDOWN with SCRAMBLE + FLIP
// ══════════════════════════════════════════
const cdIds = ['cdD', 'cdH', 'cdM', 'cdS'];
const prevVals = { cdD: '', cdH: '', cdM: '', cdS: '' };
const cdChars = '0123456789';

function scrambleNum(el, target) {
  let ticks = 0;
  const iv = setInterval(() => {
    el.textContent =
      cdChars[Math.floor(Math.random() * cdChars.length)] +
      cdChars[Math.floor(Math.random() * cdChars.length)];
    ticks++;
    if (ticks >= 4) {
      clearInterval(iv);
      el.textContent = target;
    }
  }, 40);
}

function flipNum(el) {
  el.classList.remove('flip');
  void el.offsetWidth; // force reflow
  el.classList.add('flip');
}

function tickCountdown() {
  const evt = new Date('2025-05-29T20:00:00');
  const diff = evt - new Date();
  if (diff <= 0) return;

  const pad = n => String(n).padStart(2, '0');
  const vals = [
    pad(Math.floor(diff / 864e5)),
    pad(Math.floor(diff % 864e5 / 36e5)),
    pad(Math.floor(diff % 36e5 / 6e4)),
    pad(Math.floor(diff % 6e4 / 1e3)),
  ];

  cdIds.forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.textContent === '--') {
      scrambleNum(el, vals[i]);           // first render → scramble in
    } else if (vals[i] !== prevVals[id]) {
      flipNum(el);                        // changed → flip
      setTimeout(() => { el.textContent = vals[i]; }, 175);
    }
    prevVals[id] = vals[i];
  });
}

tickCountdown();
setInterval(tickCountdown, 1000);

// ══════════════════════════════════════════
// ANIMATION 6 — DET-CELL STAGGER on scroll
// ══════════════════════════════════════════
const cells = document.querySelectorAll('.det-cell');
const cellObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const idx = Array.from(cells).indexOf(e.target);
      setTimeout(() => e.target.classList.add('in'), idx * 110);
      cellObs.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });

cells.forEach(c => cellObs.observe(c));


// ══════════════════════════════════════════
// ANIMATION 7 — MAGNETIC CTA BUTTON TILT
// ══════════════════════════════════════════
if (ctaBtn) {
  ctaBtn.addEventListener('mousemove', e => {
    const rect = ctaBtn.getBoundingClientRect();
    const xRel = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const yRel = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    ctaBtn.style.transform =
      `perspective(500px) rotateX(${-yRel * 6}deg) rotateY(${xRel * 8}deg) translateY(-2px)`;
  });

  ctaBtn.addEventListener('mouseleave', () => {
    ctaBtn.style.transform = 'perspective(500px) rotateX(0) rotateY(0) translateY(0)';
  });
}
