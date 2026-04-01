/* ══════════════════════════════════════════
   THE LIST — Auth & Firestore Logic (CDN Version)
   ══════════════════════════════════════════ */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// Generar código de boleto único (ej: TL-1234)
const generateTicketCode = () => `TL-${Math.floor(1000 + Math.random() * 9000)}`;

// ── REGISTRO ──
export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Validar si el correo es de Admin
    const isAdmin = email.toLowerCase() === "jawaclone@gmail.com";
    // Revisar Boletos Flotantes (Pre-asignados por el Admin antes de que existiera la cuenta)
    const preRef = doc(db, "preRegistros", email.toLowerCase());
    let initialTickets = [];
    try {
      const preSnap = await getDoc(preRef);
      if (preSnap.exists() && preSnap.data().tickets) {
        initialTickets = preSnap.data().tickets;
      }
    } catch(offlineErr) {
      console.warn("Modo offline: No se leyeron pre-registros.", offlineErr);
    }

    const finalTicketCode = isAdmin ? "ADMIN" : (initialTickets.length > 0 ? "ACTIVO" : "PENDIENTE");

    // Guardar perfil en Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: isAdmin ? "admin" : "user",
      ticketCode: finalTicketCode,
      tickets: initialTickets,
      createdAt: new Date()
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ── LOGIN ──
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    
    // Lógica secundaria de base de datos (no debe bloquear el login si falla la conexión)
    try {
      const docRef = doc(db, "users", uid);
      
      if (email.toLowerCase() === "jawaclone@gmail.com") {
        // MAGIA ADMIN
        await setDoc(docRef, {
          name: "MASTER ADMIN",
          email: email,
          role: "admin",
          ticketCode: "THE LIST (ADMIN)"
        }, { merge: true });
      } else {
        // ── AUTO-REPARACIÓN AVANZADA (Absorber boletos flotantes ocultos) ──
        try {
          const docSnap = await getDoc(docRef);
          
          let accountData = {
            name: "USUARIO (RECUPERADO)",
            email: email,
            role: "user",
            ticketCode: "PENDIENTE",
            tickets: [],
            createdAt: new Date()
          };

          if (docSnap.exists()) {
             accountData = docSnap.data();
          }

          // Buscar siempre si el admin le dejó boletos flotantes en preRegistros
          const preRef = doc(db, "preRegistros", email.toLowerCase());
          try {
            const preSnap = await getDoc(preRef);
            if (preSnap.exists() && preSnap.data().tickets && preSnap.data().tickets.length > 0) {
               // Tiene boletos flotantes! Absorberlos.
               const extraTickets = preSnap.data().tickets;
               accountData.tickets = [...(accountData.tickets || []), ...extraTickets];
               accountData.ticketCode = "ACTIVO";
               
               // Limpiar los boletos flotantes para no absorberlos dos veces
               await setDoc(preRef, { tickets: [] }, { merge:true });
            }
          } catch(subErr) { console.warn("Modo offline al leer pre-registros", subErr); }

          // Guardar perfil recuperado o fusionado
          await setDoc(docRef, {
            name: accountData.name || "USUARIO (RECUPERADO)",
            email: email,
            role: accountData.role || "user",
            ticketCode: accountData.ticketCode || "PENDIENTE",
            tickets: accountData.tickets || [],
          }, { merge: true });

        } catch(getErr) {
          console.warn("Offline fallback al obtener usuario en login.", getErr);
          // Actualizamos solo nombre para asegurar que la vista no explote, SIN SOBRESCRIBIR boletos
          await setDoc(docRef, {
            name: "USUARIO (RECONECTADO)",
            email: email,
            role: "user"
          }, { merge: true });
        }
      }
    } catch (dbError) {
      console.warn("Fallo secundario al escribir BD durante el login (posible modo offline):", dbError);
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ── LOGOUT ──
export const logoutUser = () => signOut(auth);

// ── OBTENER DATOS DE USUARIO EN TIEMPO REAL ──
export const listenToUser = (uid, callback) => {
  try {
    const unsubscribe = onSnapshot(doc(db, "users", uid), (docSnap) => {
      callback(docSnap.exists() ? docSnap.data() : null);
    }, (error) => {
      console.warn("Error offline o de permisos al leer la DB del usuario:", error);
      callback(null);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Fallo inicial en listenToUser:", err);
    callback(null);
  }
};

// ── OBTENER TODOS LOS TICKETS (SOLO ADMIN) ──
export const getAllTickets = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  const tickets = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.ticketCode) {
      tickets.push({ name: data.name, code: data.ticketCode });
    }
  });
  return tickets;
};

// ── ASIGNAR BOLETO(S) (SOLO ADMIN) ──
export const assignTicketToUser = async (uid, amount = 1) => {
  try {
    const userDocRef = doc(db, "users", uid);
    
    const newTickets = [];
    for(let i=0; i<amount; i++) {
       newTickets.push(generateTicketCode());
    }

    // Usamos arrayUnion y merge para que si la red parpadea no truene leyendo
    await setDoc(userDocRef, {
      ticketCode: "ACTIVO",
      tickets: arrayUnion(...newTickets)
    }, { merge: true });

    return { success: true, tickets: newTickets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ── OBTENER TODOS LOS USUARIOS (DASHBOARD) ──
export const listenToAllUsers = (callback) => {
  let latestUsers = [];
  let latestPre = [];

  const triggerCallback = () => {
    // Combinar usuarios oficiales y fantasmas (pre-registros que aún no completan su cuenta)
    const combined = [...latestUsers];
    
    // Si un email ya está en users, no lo mostramos de nuevo desde preRegistros
    latestPre.forEach(pre => {
      if(!combined.find(u => (u.email||"").toLowerCase() === (pre.email||"").toLowerCase())) {
        combined.push(pre);
      }
    });
    
    callback(combined);
  };

  const unsubUsers = onSnapshot(collection(db, "users"), (querySnapshot) => {
    const users = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let tCode = data.ticketCode || "PENDIENTE";
      let tks = data.tickets || [];

      if (tCode === "ACTIVO" && tks.length === 0) {
        const newCode = generateTicketCode();
        tks = [newCode];
        updateDoc(docSnap.ref, { tickets: tks }).catch(()=>{});
      }

      if (tCode !== "PENDIENTE" && tCode !== "ACTIVO" && tCode !== "ADMIN" && tCode !== "THE LIST (ADMIN)" && tks.length === 0) {
        tks = [tCode];
        tCode = "ACTIVO";
        updateDoc(docSnap.ref, { tickets: tks, ticketCode: "ACTIVO" }).catch(()=>{});
      }

      users.push({
        id: docSnap.id,
        name: data.name,
        email: data.email,
        ticketCode: tCode,
        tickets: tks,
        role: data.role,
        createdAt: data.createdAt
      });
    });
    latestUsers = users;
    triggerCallback();
  });

  const unsubPre = onSnapshot(collection(db, "preRegistros"), (querySnapshot) => {
    const pres = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      pres.push({
        id: docSnap.id, // el id aquí es el correo en minusculas
        name: "INVITADO PENDIENTE DE REGISTRO",
        email: data.email,
        ticketCode: (data.tickets && data.tickets.length > 0) ? "ACTIVO" : "FLOTANTE",
        tickets: data.tickets || [],
        isGhost: true, // bandera para saber que aún no completan registro
        createdAt: data.createdAt
      });
    });
    latestPre = pres;
    triggerCallback();
  });

  return () => { unsubUsers(); unsubPre(); };
};

// ── PRE-ASIGNAR BOLETO A CUENTAS QUE NO EXISTEN (AUN) EN LA DB ──
export const preAssignTickets = async (email, amount = 1) => {
  try {
    const docRef = doc(db, "preRegistros", email.toLowerCase());
    
    const newTickets = [];
    for(let i=0; i<amount; i++) {
       newTickets.push(generateTicketCode());
    }

    // arrayUnion evita llamadas de lectura getDoc() que pueden tronar si estás offline momentaneamente
    await setDoc(docRef, {
      email: email.toLowerCase(),
      tickets: arrayUnion(...newTickets),
      createdAt: new Date()
    }, { merge: true });

    return { success: true, tickets: newTickets };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ── VERIFICAR Y ESCANEAR BOLETO ──
export const verifyTicket = async (ticketCode) => {
  try {
     const code = ticketCode.trim().toUpperCase();
     if (!code) return { success: false, error: "CÓDIGO VACÍO" };

     const q = query(collection(db, "users"), where("tickets", "array-contains", code));
     const snap = await getDocs(q);
     
     if (snap.empty) {
        return { success: false, error: "CÓDIGO INVÁLIDO O INEXISTENTE" };
     }

     const userDoc = snap.docs[0];
     const data = userDoc.data();

     if (data.usedTickets && data.usedTickets.includes(code)) {
        return { success: false, error: "ESTE BOLETO YA FUE USADO PARA ENTRAR", user: data.name };
     }

     // Marcar boleto como usado para evitar multiclonación
     await setDoc(doc(db, "users", userDoc.id), {
        usedTickets: arrayUnion(code)
     }, { merge: true });

     return { success: true, user: data.name, email: data.email };
  } catch (error) {
     return { success: false, error: "Conexión Inestable al Verificar: " + error.message };
  }
};
