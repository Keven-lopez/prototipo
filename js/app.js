/* =========================================================
   SIGH — Prototipo navegable — lógica compartida (js/app.js)
   Cargado por las 10 páginas. La sesión (rol activo) y la
   Bitácora se guardan en localStorage solo para que la demo
   se sienta continua al navegar entre archivos; en el sistema
   real esto vive en el servidor (ver Arquitectura y seguridad).
========================================================= */

/* ---------------------------------------------------------
   1. DATOS DE REFERENCIA
--------------------------------------------------------- */

// Roles — Tabla 6.9 del documento de Arquitectura y Seguridad (Yourgen)
const ROLES = {
  administrador: { label: "Administrador", user: "admin.rrhh" },
  medico:        { label: "Médico",        user: "lsay" },
  enfermeria:    { label: "Enfermería",    user: "acoy" },
  admision:      { label: "Admisión",      user: "jmontufar" },
  farmacia:      { label: "Farmacia",      user: "kixchop" },
  laboratorio:   { label: "Laboratorio",   user: "rchoc" },
  bodega:        { label: "Bodega",        user: "wchen" },
  mantenimiento: { label: "Mantenimiento", user: "epirir" },
  auditor:       { label: "Auditor",       user: "auditoria01" },
};

// Pantallas: id de archivo, ícono, título de topbar, subtítulo y roles permitidos
// (Tabla 6.10 — funciones por rol, y Tabla 6.9)
const SCREENS = [
  { id: "pacientes",      file: "pacientes.html",      ico: "🧑‍⚕️", label: "Pacientes",
    title: "Pacientes", sub: "Módulo Admisión y pacientes — UC-01, UC-02",
    roles: ["medico","enfermeria","admision","auditor"] },
  { id: "admision",       file: "admision.html",       ico: "📋", label: "Admisión",
    title: "Admisión", sub: "Registro de paciente y episodio — UC-01, UC-02 · Responsable: Admisión",
    roles: ["admision","enfermeria"] },
  { id: "camas",          file: "camas.html",          ico: "🛏️", label: "Encamamiento",
    title: "Encamamiento", sub: "Camas y asignación — UC-03, UC-04 · Estados: Disponible → Reservada/Ocupada → En limpieza → Disponible",
    roles: ["enfermeria","admision","auditor"] },
  { id: "consulta",       file: "consulta.html",       ico: "🩺", label: "Consulta",
    title: "Consulta", sub: "Triage y órdenes clínicas — UC-05, UC-06 · Enfermería: triage · Médico: órdenes",
    roles: ["medico","enfermeria"] },
  { id: "farmacia",       file: "farmacia.html",       ico: "💊", label: "Farmacia",
    title: "Farmacia", sub: "Validación, dispensación e inventario de lotes — UC-07, UC-10 · Responsable: Farmacia",
    roles: ["farmacia"] },
  { id: "laboratorio",    file: "laboratorio.html",    ico: "🧪", label: "Laboratorio",
    title: "Laboratorio", sub: "Muestras y resultados — UC-08, UC-09 · Responsable: Laboratorio",
    roles: ["laboratorio"] },
  { id: "inventario",     file: "inventario.html",     ico: "📦", label: "Inventario",
    title: "Inventario", sub: "Bodega, productos y lotes — UC-10 · Responsable: Bodega (Farmacia gestiona sus propios lotes)",
    roles: ["bodega","farmacia"] },
  { id: "reportes",       file: "reportes.html",       ico: "📊", label: "Reportes",
    title: "Reportes y auditoría", sub: "Tableros e indicadores — UC-13 · Responsable: Auditor (Administrador consulta)",
    roles: ["auditor","administrador"] },
  { id: "administracion", file: "administracion.html", ico: "⚙️", label: "Administración",
    title: "Administración", sub: "Empleados, roles y catálogos — UC-12 · Responsable: Administrador",
    roles: ["administrador","mantenimiento"] },
];

const PACIENTES_SEED = [
  { nombre:"Juan Pérez López", dpi:"2145 xxxxx 0101", episodio:"EP-2026-0417", servicio:"Medicina Interna", ingreso:"22/09/2026", alergias:"Penicilina", dx:"Neumonía adquirida en comunidad" },
  { nombre:"María Xitumul Son", dpi:"2451 xxxxx 0801", episodio:"EP-2026-0431", servicio:"Pediatría", ingreso:"24/09/2026", alergias:"Ninguna registrada", dx:"Control de diabetes tipo 1" },
  { nombre:"NN — Emergencia 08", dpi:"Sin identificar", episodio:"EP-2026-0433", servicio:"Emergencias", ingreso:"24/09/2026", alergias:"—", dx:"Politraumatismo, en evaluación" },
  { nombre:"Carlos Ramírez Ical", dpi:"1897 xxxxx 1502", episodio:"EP-2026-0402", servicio:"Medicina Interna", ingreso:"18/09/2026", alergias:"Ninguna registrada", dx:"Infección de vías urinarias" },
];

const CAMAS_SEED = [
  {code:"HAB-101-C1", serv:"Medicina Interna", estado:"disponible", ubic:"Edificio A · Piso 1 · Hab. 101", actualizado:"24/09 06:10"},
  {code:"HAB-101-C2", serv:"Medicina Interna", estado:"ocupada", pac:"Juan Pérez López", ubic:"Edificio A · Piso 1 · Hab. 101", actualizado:"22/09 09:40"},
  {code:"HAB-102-C1", serv:"Medicina Interna", estado:"limpieza", ubic:"Edificio A · Piso 1 · Hab. 102", actualizado:"24/09 07:15"},
  {code:"HAB-102-C2", serv:"Medicina Interna", estado:"bloqueada", nota:"Aislamiento", ubic:"Edificio A · Piso 1 · Hab. 102", actualizado:"20/09 11:00"},
  {code:"HAB-103-C1", serv:"Medicina Interna", estado:"mantenimiento", nota:"Cambio de colchón programado", ubic:"Edificio A · Piso 1 · Hab. 103", actualizado:"23/09 15:20"},
  {code:"EMER-E1", serv:"Emergencias", estado:"ocupada", pac:"NN — Emergencia 08", ubic:"Edificio A · Planta baja · Emergencias", actualizado:"24/09 08:05"},
  {code:"EMER-E2", serv:"Emergencias", estado:"disponible", ubic:"Edificio A · Planta baja · Emergencias", actualizado:"24/09 06:00"},
  {code:"EMER-E3", serv:"Emergencias", estado:"fuera", nota:"Fuera de servicio", ubic:"Edificio A · Planta baja · Emergencias", actualizado:"19/09 10:30"},
  {code:"PED-201-C1", serv:"Pediatría", estado:"reservada", ubic:"Edificio B · Piso 2 · Hab. 201", actualizado:"24/09 07:50"},
  {code:"PED-201-C2", serv:"Pediatría", estado:"ocupada", pac:"María Xitumul Son", ubic:"Edificio B · Piso 2 · Hab. 201", actualizado:"24/09 08:00"},
  {code:"PED-202-C1", serv:"Pediatría", estado:"disponible", ubic:"Edificio B · Piso 2 · Hab. 202", actualizado:"24/09 06:30"},
];

const ESPERA_SEED = [
  {id:"LE-01", nombre:"Ricardo Tzul Vail", servicio:"Medicina Interna", motivo:"Ingreso programado — cirugía de vesícula", prioridad:1, desde:"24/09 06:20"},
  {id:"LE-02", nombre:"Sofía Pérez Cano", servicio:"Pediatría", motivo:"Ingreso programado — control postquirúrgico", prioridad:2, desde:"24/09 07:05"},
];

const BITACORA_SEED = [
  {id:"B-006", t:"24/09 08:12", u:"lsay (Médico)", a:"Emitir orden clínica", d:"OC-3381 · Amoxicilina · Juan Pérez López", r:"ok", origen:"10.20.4.31", sensible:true, revelado:false},
  {id:"B-005", t:"24/09 07:58", u:"kixchop (Farmacia)", a:"Intento de dispensación", d:"OC-3375 · Insulina glargina · lote vencido", r:"denied", origen:"10.20.4.52", sensible:true, revelado:false},
  {id:"B-004", t:"24/09 07:40", u:"rchoc (Laboratorio)", a:"Validar resultado crítico", d:"OL-1246 · Glucosa 380 mg/dL · María Xitumul Son", r:"ok", origen:"10.20.4.18", sensible:true, revelado:false},
  {id:"B-003", t:"23/09 22:05", u:"acoy (Enfermería)", a:"Acceso de emergencia", d:"Consulta paciente fuera de su servicio — justificación registrada", r:"ok", origen:"10.20.4.09", sensible:false, revelado:false},
  {id:"B-002", t:"23/09 21:40", u:"desconocido", a:"Inicio de sesión", d:"5 intentos fallidos — cuenta bloqueada temporalmente", r:"denied", origen:"10.20.9.114", sensible:false, revelado:false},
  {id:"B-001", t:"23/09 16:12", u:"admin.rrhh (Administrador)", a:"Intento de acceso", d:"Módulo Consulta — sin permiso de función (nivel 1)", r:"denied", origen:"10.20.4.02", sensible:false, revelado:false},
];
let bitacoraCounter = 7;

/* ---------------------------------------------------------
   2. PERSISTENCIA LIGERA (solo para esta demo local)
--------------------------------------------------------- */
function loadJSON(key, seed){
  try {
    const raw = localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
  } catch(e){}
  localStorage.setItem(key, JSON.stringify(seed));
  return JSON.parse(JSON.stringify(seed));
}
function saveJSON(key, data){
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e){}
}

let PACIENTES = loadJSON('sigh_pacientes', PACIENTES_SEED);
let CAMAS     = loadJSON('sigh_camas', CAMAS_SEED);
let BITACORA  = loadJSON('sigh_bitacora', BITACORA_SEED);
let ESPERA    = loadJSON('sigh_espera', ESPERA_SEED);

function getRole(){ return localStorage.getItem('sigh_role'); }
function setRole(key){ localStorage.setItem('sigh_role', key); }
function clearSession(){ localStorage.removeItem('sigh_role'); }
function getSessionIP(){
  let ip = sessionStorage.getItem('sigh_ip');
  if(!ip){
    ip = '10.' + (20 + Math.floor(Math.random()*40)) + '.' + Math.floor(Math.random()*255) + '.' + Math.floor(Math.random()*255);
    sessionStorage.setItem('sigh_ip', ip);
  }
  return ip;
}

/* ---------------------------------------------------------
   2b. CIERRE DE SESIÓN POR INACTIVIDAD (RNF-01, 6.4.1 del
   documento de Arquitectura: sesiones seguras con expiración
   por inactividad — 15 minutos).
--------------------------------------------------------- */
const IDLE_LIMIT_MS = 15 * 60 * 1000;
let idleTimer = null;
function resetIdleTimer(){
  if(!getRole()) return;
  if(idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    logAudit('Cierre de sesión por inactividad', 'Se alcanzó el límite de 15 minutos sin actividad (RNF-01)', 'ok');
    alert('Su sesión se cerró por inactividad (15 minutos, RNF-01).');
    logout();
  }, IDLE_LIMIT_MS);
}
function initIdleTimeout(){
  ['click','keydown','mousemove','scroll','touchstart'].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer, {passive:true}));
  resetIdleTimer();
}

function el(id){ return document.getElementById(id); }

/* ---------------------------------------------------------
   3. CONSTRUCCIÓN DEL SHELL (sidebar + topbar) EN CADA PÁGINA
--------------------------------------------------------- */
function initShell(screenId){
  const role = getRole();
  if(!role){
    window.location.href = 'index.html';
    return;
  }
  initIdleTimeout();
  const meta = SCREENS.find(s => s.id === screenId);
  const allowed = meta.roles.includes(role);

  // Guardar el contenido original de la página (viene ya en el HTML)
  const original = el('page-content');
  const originalHTML = original ? original.innerHTML : '';

  // Reconstruir el documento como app-shell
  document.body.innerHTML = `
    <div class="app-shell">
      <div class="sidebar-backdrop" id="sidebarBackdrop" onclick="toggleSidebar()"></div>
      <aside class="sidebar" id="sidebar"></aside>
      <div class="main-col">
        <div class="topbar">
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="menu-toggle btn btn-sm btn-outline-secondary" onclick="toggleSidebar()" aria-label="Abrir menú">☰</button>
            <div>
              <div class="screen-title">${meta.title}</div>
              <div class="screen-sub">${meta.sub}</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="env-flag" id="envFlag" onclick="toggleContingencia()">Contingencia: apagado</span>
            <span class="badge-state st-ocupada">${ROLES[role].label}</span>
          </div>
        </div>
        <div class="contingency-banner" id="contingencyBanner" style="display:none;">
          <span>⚠ Modo de contingencia activo — registre en papel según el flujo AS-IS (BPMN) y capture en el SIGH al restablecer el servicio.</span>
          <button class="btn btn-sm btn-outline-dark" onclick="toggleContingencia()">Desactivar</button>
        </div>
        <div class="content-area" id="page-content">
          ${allowed ? originalHTML : lockedMarkup(meta.label, role)}
        </div>
      </div>
    </div>
    ${MODAL_EMERGENCIA_HTML}
    ${MODAL_CRITICO_HTML}
    ${TOAST_HTML}
  `;

  buildSidebar(screenId, role);
  applyContingenciaUI();

  if(!allowed){
    logAudit('Intento de acceso', `Módulo ${meta.label} — sin permiso de función (nivel 1, RN-10)`, 'denied');
  }
  return allowed;
}

function lockedMarkup(label, role){
  const first = SCREENS.find(s => s.roles.includes(role));
  const href = first ? first.file : 'index.html';
  const linkLabel = first ? `Volver a ${first.label}` : 'Volver al inicio de sesión';
  return `
    <div class="panel">
      <div class="panel-body text-center py-5">
        <div style="font-size:2rem;">🔒</div>
        <h2 class="mt-2">Acceso denegado</h2>
        <p class="helper-text" style="max-width:420px; margin:.5rem auto 0;">
          Su rol no tiene permiso para abrir «${label}» (RN-10, autorización por función).
          Este intento quedó registrado en la Bitácora.
        </p>
        <a href="${href}" class="btn btn-sm mt-3" style="background:var(--sigh-teal-700); color:#fff;">${linkLabel}</a>
      </div>
    </div>`;
}

function toggleSidebar(){
  el('sidebar').classList.toggle('open');
  el('sidebarBackdrop').classList.toggle('open');
}

function buildSidebar(activeId, role){
  const sidebar = el('sidebar');
  const items = SCREENS.map(s => {
    const ok = s.roles.includes(role);
    const cls = 'nav-item-btn' + (activeId === s.id ? ' active' : '') + (ok ? '' : ' locked');
    return `<li><a class="${cls}" href="${s.file}">
              <span class="ico">${s.ico}</span><span>${s.label}</span>
              ${ok ? '' : '<span class="lock-mark">🔒</span>'}
            </a></li>`;
  }).join('');
  sidebar.innerHTML = `
    <div class="brand">
      <div class="name">SIGH</div>
      <div class="role">${ROLES[role].label} · ${ROLES[role].user}</div>
    </div>
    <ul class="nav-list">${items}</ul>
    <div class="sidebar-foot">
      <button class="btn btn-sm btn-outline-light" onclick="logout()">Cerrar sesión</button>
    </div>`;
}

function logout(){
  clearSession();
  window.location.href = 'index.html';
}

/* Nota: <a> normal en vez de botón con JS, para que cada módulo sea
   una página real y navegable — así el prototipo funciona incluso
   si alguien entra directo por URL o marcador (bookmark). */

/* ---------------------------------------------------------
   4. MODALES Y TOAST (se inyectan en cada página desde initShell)
--------------------------------------------------------- */
const MODAL_EMERGENCIA_HTML = `
<div class="modal fade" id="modalEmergencia" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">Acceso de emergencia fuera de su servicio</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <p class="helper-text">RN-10 · Este acceso queda registrado en la Bitácora y será revisado por el Auditor.</p>
        <label class="form-label mb-1">Justificación <span class="required-star">*</span></label>
        <textarea class="form-control form-control-sm" id="emergencia-justificacion" rows="3" placeholder="Ej. Cobertura de turno nocturno en Emergencias por ausencia de personal"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-sm btn-danger" onclick="grantEmergencyAccess()">Confirmar acceso</button>
      </div>
    </div>
  </div>
</div>`;

const MODAL_CRITICO_HTML = `
<div class="modal fade" id="modalCritico" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">Confirmación requerida</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body">
        <p style="font-size:.88rem;" id="critico-texto">—</p>
        <p class="helper-text mb-0">RN-11 · Las acciones críticas requieren confirmación explícita antes de ejecutarse.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button class="btn btn-sm" style="background:var(--sigh-teal-700); color:#fff;" onclick="confirmCriticalYes()">Confirmar</button>
      </div>
    </div>
  </div>
</div>`;

const TOAST_HTML = `
<div class="toast-perm">
  <div id="permToast" class="toast align-items-center border-0" role="alert">
    <div class="d-flex">
      <div class="toast-body" id="permToastBody">—</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  </div>
</div>`;

/* ---------------------------------------------------------
   5. UTILIDADES COMUNES
--------------------------------------------------------- */
function showToast(msg, kind){
  const body = el('permToastBody');
  const toastEl = el('permToast');
  body.textContent = msg;
  toastEl.classList.remove('text-bg-success','text-bg-danger','text-bg-dark');
  toastEl.classList.add(kind === 'deny' ? 'text-bg-danger' : (kind === 'ok' ? 'text-bg-success' : 'text-bg-dark'));
  new bootstrap.Toast(toastEl, {delay: 4200}).show();
}

function logAudit(accion, detalle, resultado, opts){
  opts = opts || {};
  const role = getRole();
  const who = opts.actor || (role ? (ROLES[role].user + ' (' + ROLES[role].label + ')') : 'desconocido');
  BITACORA.unshift({
    id: 'B-' + (bitacoraCounter++),
    t: '24/09 ahora',
    u: who,
    a: accion,
    d: detalle,
    r: resultado,
    origen: getSessionIP(),
    sensible: !!opts.sensible,
    revelado: false
  });
  saveJSON('sigh_bitacora', BITACORA);
}

/* ---------------------------------------------------------
   5b. MODO DE CONTINGENCIA (RNF-12 / 6.4.2 del doc. de
   Arquitectura: si el sistema no está disponible, se sigue
   el flujo AS-IS con registro en papel y se captura después).
--------------------------------------------------------- */
function getContingencia(){ return localStorage.getItem('sigh_contingencia') === '1'; }
function setContingencia(on){ localStorage.setItem('sigh_contingencia', on ? '1' : '0'); }
function toggleContingencia(){
  const on = !getContingencia();
  setContingencia(on);
  logAudit('Cambiar modo de contingencia',
    on ? 'Activado — registro manual en papel (BPMN AS-IS)' : 'Desactivado — servicio restablecido, pendiente de regularización (RF-22)',
    'ok');
  applyContingenciaUI();
  showToast(on
    ? 'Modo de contingencia activado. Registre en papel y capture en el SIGH al restablecer el servicio.'
    : 'Modo de contingencia desactivado.', on ? 'deny' : 'ok');
}
function applyContingenciaUI(){
  const flag = el('envFlag');
  const banner = el('contingencyBanner');
  const on = getContingencia();
  if(flag){
    flag.textContent = on ? 'Contingencia: ACTIVA' : 'Contingencia: apagado';
    flag.classList.toggle('on', on);
  }
  if(banner) banner.style.display = on ? 'flex' : 'none';
}

let pendingCritical = null;
function confirmCriticalAction(texto){
  pendingCritical = texto;
  el('critico-texto').textContent = texto + '.';
  new bootstrap.Modal(el('modalCritico')).show();
}
function confirmCriticalYes(){
  logAudit('Acción crítica confirmada', pendingCritical, 'ok', {sensible:true});
  bootstrap.Modal.getInstance(el('modalCritico')).hide();
  showToast('Acción confirmada y registrada en Bitácora.', 'ok');
  pendingCritical = null;
}

function openEmergencyAccess(){
  new bootstrap.Modal(el('modalEmergencia')).show();
}
function grantEmergencyAccess(){
  const txt = el('emergencia-justificacion').value.trim();
  if(!txt){
    alert('La justificación es obligatoria para este tipo de acceso.');
    return;
  }
  logAudit('Acceso de emergencia', 'Fuera de servicio asignado — Justificación: ' + txt, 'ok');
  bootstrap.Modal.getInstance(el('modalEmergencia')).hide();
  showToast('Acceso de emergencia concedido. Justificación registrada en Bitácora para revisión del Auditor.', 'ok');
  el('emergencia-justificacion').value = '';
}

/* ---------------------------------------------------------
   6. PANTALLA: PACIENTES
--------------------------------------------------------- */
function canSeeSensible(){
  const role = getRole();
  return ['medico','enfermeria'].includes(role);
}
function maskDpi(dpi){
  const digits = dpi.replace(/\D/g,'');
  return '•••• •••• ' + digits.slice(-4);
}
function renderPacientes(){
  const tbody = el('tbl-pacientes');
  if(!tbody) return;
  const role = getRole();
  tbody.innerHTML = '';
  const textoEl = el('pac-filtro-texto');
  const servEl = el('pac-filtro-servicio');
  const texto = textoEl ? textoEl.value.trim().toLowerCase() : '';
  const servicio = servEl ? servEl.value : '';
  const lista = PACIENTES
    .map((p, idx) => ({ p, idx }))
    .filter(({p}) => {
      const matchTexto = !texto || p.nombre.toLowerCase().includes(texto) || p.dpi.toLowerCase().includes(texto);
      const matchServicio = !servicio || p.servicio === servicio;
      return matchTexto && matchServicio;
    });
  if(lista.length === 0){
    tbody.innerHTML = `<tr><td colspan="8" class="helper-text text-center py-3">Sin resultados para el filtro aplicado.</td></tr>`;
    return;
  }
  lista.forEach(({p, idx}) => {
    const masked = role === 'auditor' || role === 'admision';
    const dpi = masked ? maskDpi(p.dpi) : p.dpi;
    const alergiaCell = canSeeSensible() ? p.alergias
      : (role === 'auditor'
          ? `<span class="sensitive-mask">enmascarado</span> <a href="#" onclick="revealSensitive(event,this,${idx})" class="small">ver con justificación</a>`
          : `<span class="field-lock">sin acceso</span>`);
    const dxCell = canSeeSensible() ? p.dx
      : (role === 'auditor'
          ? `<span class="sensitive-mask">enmascarado</span>`
          : `<span class="field-lock">sin acceso</span>`);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.nombre}</td>
      <td class="mono">${dpi}</td>
      <td class="mono">${p.episodio}</td>
      <td>${p.servicio}</td>
      <td>${p.ingreso}</td>
      <td>${alergiaCell}</td>
      <td>${dxCell}</td>
      <td><button class="btn btn-sm btn-outline-secondary" onclick="showToast('Ficha de ${p.nombre.split(' ')[0]} abierta (solo lectura en este prototipo).','info')">Ver ficha</button></td>
    `;
    tbody.appendChild(tr);
  });
}
function filterPacientes(){
  renderPacientes();
}
function revealSensitive(ev, linkEl, idx){
  ev.preventDefault();
  const p = PACIENTES[idx];
  const justif = prompt('Justificación para ver el dato Sensible (se registra en Bitácora):');
  if(justif && justif.trim().length > 0){
    logAudit('Consulta de dato Sensible', `Alergias de ${p.nombre} · Justificación: ${justif}`, 'ok', {sensible:true});
    showToast('Dato revelado. Consulta registrada en Bitácora con su justificación.', 'ok');
    linkEl.closest('td').innerHTML = p.alergias;
  }
}

/* ---------------------------------------------------------
   7. PANTALLA: ADMISIÓN
--------------------------------------------------------- */
function toggleIdentificado(){
  const on = el('chk-identificado').checked;
  el('adm-nombre').value = on ? 'María Xitumul Son' : 'NN';
  el('adm-nombre').disabled = !on;
}
function renderEspera(){
  const tbody = el('tbl-espera');
  if(!tbody) return;
  const ordenada = [...ESPERA].sort((a,b)=>a.prioridad-b.prioridad);
  tbody.innerHTML = '';
  if(ordenada.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" class="helper-text text-center py-3">Sin pacientes en espera.</td></tr>`;
    return;
  }
  ordenada.forEach((w, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${i+1}</td>
      <td>${w.nombre}</td>
      <td>${w.servicio}</td>
      <td class="helper-text">${w.motivo}</td>
      <td class="helper-text">${w.desde}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary" onclick="subirPrioridad('${w.id}')" ${i===0?'disabled':''} aria-label="Subir prioridad">▲</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="bajarPrioridad('${w.id}')" ${i===ordenada.length-1?'disabled':''} aria-label="Bajar prioridad">▼</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function subirPrioridad(id){
  const ordenada = [...ESPERA].sort((a,b)=>a.prioridad-b.prioridad);
  const i = ordenada.findIndex(w => w.id === id);
  if(i <= 0) return;
  const a = ESPERA.find(w=>w.id===ordenada[i].id), b = ESPERA.find(w=>w.id===ordenada[i-1].id);
  const tmp = a.prioridad; a.prioridad = b.prioridad; b.prioridad = tmp;
  saveJSON('sigh_espera', ESPERA);
  logAudit('Repriorizar lista de espera', `${a.nombre} sube de prioridad`, 'ok');
  renderEspera();
}
function bajarPrioridad(id){
  const ordenada = [...ESPERA].sort((a,b)=>a.prioridad-b.prioridad);
  const i = ordenada.findIndex(w => w.id === id);
  if(i === -1 || i >= ordenada.length - 1) return;
  const a = ESPERA.find(w=>w.id===ordenada[i].id), b = ESPERA.find(w=>w.id===ordenada[i+1].id);
  const tmp = a.prioridad; a.prioridad = b.prioridad; b.prioridad = tmp;
  saveJSON('sigh_espera', ESPERA);
  logAudit('Repriorizar lista de espera', `${a.nombre} baja de prioridad`, 'ok');
  renderEspera();
}

/* ---------------------------------------------------------
   8. PANTALLA: ENCAMAMIENTO / CAMAS
--------------------------------------------------------- */
function stLabelOf(estado){
  return {disponible:'Disponible',ocupada:'Ocupada',reservada:'Reservada',limpieza:'En limpieza',
          bloqueada:'Bloqueada',fuera:'Fuera de servicio',mantenimiento:'En mantenimiento'}[estado] || estado;
}
function nowStamp(){
  const d = new Date();
  return '24/09 ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}
function renderCamas(){
  const grid = el('bed-grid');
  if(!grid) return;
  grid.innerHTML = '';
  const servEl = el('camas-filtro-servicio');
  const servicio = servEl ? servEl.value : '';
  const visibles = CAMAS
    .map((c, idx) => ({ c, idx }))
    .filter(({c}) => !servicio || c.serv === servicio);
  if(visibles.length === 0){
    grid.innerHTML = `<p class="helper-text">Sin camas para el servicio seleccionado.</p>`;
    return;
  }
  const role = getRole();
  const puedeModificar = ['enfermeria','admision'].includes(role);
  visibles.forEach(({c, idx}) => {
    const div = document.createElement('div');
    div.className = 'bed-card b-' + c.estado;
    const stLabel = stLabelOf(c.estado);
    div.innerHTML = `
      <div class="bed-code mono">${c.code}</div>
      <div class="bed-serv">${c.serv}</div>
      <div class="helper-text">${c.ubic || ''}</div>
      <div class="mt-2"><span class="badge-state st-${c.estado}">${stLabel}</span></div>
      ${c.pac ? `<div class="helper-text mt-1">${c.pac}</div>` : ''}
      ${c.nota ? `<div class="helper-text mt-1">${c.nota}</div>` : ''}
      <div class="helper-text mt-1">Actualizado: ${c.actualizado || '—'}</div>
      <div class="bed-actions"></div>
    `;
    grid.appendChild(div);
    const actions = div.querySelector('.bed-actions');
    const addBtn = (label, fn, extraClass) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-sm ' + (extraClass || 'btn-outline-secondary');
      b.textContent = label;
      b.onclick = (ev) => { ev.stopPropagation(); fn(idx); };
      actions.appendChild(b);
    };
    if(c.estado === 'disponible'){
      addBtn('Asignar', assignBed);
      if(puedeModificar) addBtn('Bloquear', blockBed, 'btn-outline-danger');
    } else if(c.estado === 'ocupada'){
      addBtn('Alta', dischargeBed);
      addBtn('Trasladar', startTransfer);
    } else if(c.estado === 'limpieza'){
      addBtn('Aprobar limpieza', approveCleaning);
    } else if(c.estado === 'bloqueada'){
      if(puedeModificar) addBtn('Desbloquear', unblockBed);
    } else if(c.estado === 'reservada' && c.reservadoPara){
      addBtn('Confirmar traslado', confirmTransfer);
    }
    div.onclick = () => infoBed(idx);
  });
}
function filterCamas(){
  renderCamas();
}
function requierePermisoCama(idx, accion){
  const role = getRole();
  const c = CAMAS[idx];
  if(!['enfermeria','admision'].includes(role)){
    logAudit('Intento de ' + accion, c.code + ' — sin permiso', 'denied');
    showToast(`Acceso denegado: su rol no puede modificar el estado de ${c.code}. Registrado en Bitácora.`, 'deny');
    return false;
  }
  return true;
}
function assignBed(idx){
  if(!requierePermisoCama(idx, 'asignación de cama')) return;
  const c = CAMAS[idx];
  const candidatos = ESPERA.filter(w => w.servicio === c.serv).sort((a,b)=>a.prioridad-b.prioridad);
  const siguiente = candidatos[0];
  const nombrePac = siguiente ? siguiente.nombre : 'Paciente en espera — asignado';
  if(confirm(`¿Asignar la cama ${c.code} a ${nombrePac}?`)){
    c.estado = 'ocupada'; c.pac = nombrePac; c.actualizado = nowStamp();
    saveJSON('sigh_camas', CAMAS);
    if(siguiente){
      ESPERA = ESPERA.filter(w => w.id !== siguiente.id);
      saveJSON('sigh_espera', ESPERA);
      logAudit('Asignar cama desde lista de espera', `${c.code} — ${nombrePac} (${siguiente.id})`, 'ok');
      renderEspera();
    } else {
      logAudit('Asignar cama', c.code + ' — RN-01: cama estaba Disponible', 'ok');
    }
    renderCamas();
    showToast(`Cama ${c.code} asignada a ${nombrePac}. Se creó OcupacionCama.`, 'ok');
  }
}
function dischargeBed(idx){
  if(!requierePermisoCama(idx, 'alta y liberación')) return;
  const c = CAMAS[idx];
  if(confirm(`¿Registrar alta y liberar la cama ${c.code}? Pasará a "En limpieza" (RN-02), no directo a Disponible.`)){
    logAudit('Alta y liberación', c.code + ' — pasa a En limpieza (RN-02)', 'ok');
    c.estado = 'limpieza'; delete c.pac; c.actualizado = nowStamp();
    saveJSON('sigh_camas', CAMAS);
    renderCamas();
    showToast(`Cama ${c.code} en limpieza. Solo Enfermería puede aprobar el paso a Disponible.`, 'ok');
  }
}
function approveCleaning(idx){
  const role = getRole();
  const c = CAMAS[idx];
  if(role !== 'enfermeria'){
    logAudit('Intento de aprobar limpieza', c.code + ' — sin permiso (solo Enfermería)', 'denied');
    showToast(`Solo Enfermería puede aprobar la limpieza de ${c.code}. Registrado en Bitácora.`, 'deny');
    return;
  }
  if(confirm(`¿Aprobar limpieza y dejar ${c.code} como Disponible?`)){
    c.estado = 'disponible'; c.actualizado = nowStamp();
    saveJSON('sigh_camas', CAMAS);
    logAudit('Aprobar limpieza', c.code + ' — pasa a Disponible (RN-02)', 'ok');
    renderCamas();
    showToast(`Cama ${c.code} disponible nuevamente.`, 'ok');
  }
}
function blockBed(idx){
  if(!requierePermisoCama(idx, 'bloqueo de cama')) return;
  const c = CAMAS[idx];
  const motivo = prompt(`Motivo del bloqueo de ${c.code} (ej. aislamiento, riesgo biológico):`);
  if(!motivo || !motivo.trim()) return;
  c.estado = 'bloqueada'; c.nota = motivo.trim(); c.actualizado = nowStamp();
  saveJSON('sigh_camas', CAMAS);
  logAudit('Bloquear cama', `${c.code} · Motivo: ${motivo.trim()}`, 'ok');
  renderCamas();
  showToast(`Cama ${c.code} bloqueada. Registrado en Bitácora.`, 'ok');
}
function unblockBed(idx){
  if(!requierePermisoCama(idx, 'desbloqueo de cama')) return;
  const c = CAMAS[idx];
  if(confirm(`¿Desbloquear ${c.code} y dejarla Disponible?`)){
    c.estado = 'disponible'; delete c.nota; c.actualizado = nowStamp();
    saveJSON('sigh_camas', CAMAS);
    logAudit('Desbloquear cama', c.code, 'ok');
    renderCamas();
    showToast(`Cama ${c.code} desbloqueada.`, 'ok');
  }
}
function startTransfer(idx){
  if(!requierePermisoCama(idx, 'traslado de paciente')) return;
  const c = CAMAS[idx];
  const destServicio = prompt(`Trasladar a ${c.pac} de ${c.code} (${c.serv}) a qué servicio?`,
    c.serv === 'Pediatría' ? 'Medicina Interna' : 'Pediatría');
  if(!destServicio || !destServicio.trim()) return;
  const destino = CAMAS.find(x => x.serv.toLowerCase() === destServicio.trim().toLowerCase() && x.estado === 'disponible');
  if(!destino){
    showToast(`No hay camas disponibles en ${destServicio}. Considere agregar al paciente a la lista de espera (Admisión).`, 'info');
    return;
  }
  destino.estado = 'reservada';
  destino.reservadoPara = { origenIdx: idx, pac: c.pac };
  destino.nota = `Reservada para traslado desde ${c.code}`;
  destino.actualizado = nowStamp();
  saveJSON('sigh_camas', CAMAS);
  logAudit('Reservar cama para traslado', `${destino.code} (${destino.serv}) reservada para ${c.pac} · origen ${c.code} (${c.serv})`, 'ok');
  renderCamas();
  showToast(`Cama ${destino.code} reservada para el traslado. Confírmelo desde esa cama cuando el paciente llegue.`, 'ok');
}
function confirmTransfer(idx){
  const destino = CAMAS[idx];
  const info = destino.reservadoPara;
  if(!info) return;
  if(!requierePermisoCama(idx, 'confirmación de traslado')) return;
  const origen = CAMAS[info.origenIdx];
  if(confirm(`¿Confirmar traslado de ${info.pac} a ${destino.code}? La cama ${origen.code} pasará a "En limpieza".`)){
    destino.estado = 'ocupada'; destino.pac = info.pac; delete destino.reservadoPara; delete destino.nota;
    destino.actualizado = nowStamp();
    origen.estado = 'limpieza'; delete origen.pac; origen.actualizado = nowStamp();
    saveJSON('sigh_camas', CAMAS);
    logAudit('Confirmar traslado', `${info.pac} · ${origen.code} (${origen.serv}) → ${destino.code} (${destino.serv}) · RN-03: historial de ubicación conservado`, 'ok');
    renderCamas();
    showToast(`Traslado completado. ${destino.code} ocupada; ${origen.code} en limpieza.`, 'ok');
  }
}
function infoBed(idx){
  const c = CAMAS[idx];
  if(c.estado === 'bloqueada' || c.estado === 'fuera' || c.estado === 'mantenimiento'){
    showToast(`Cama ${c.code} no puede asignarse: estado "${stLabelOf(c.estado)}" (RN-01/RN-09).`, 'info');
  } else if(c.estado === 'reservada' && !c.reservadoPara){
    showToast(`Cama ${c.code} reservada. Confirme el ingreso desde Admisión para ocuparla.`, 'info');
  }
}

/* ---------------------------------------------------------
   9. PANTALLA: CONSULTA (alerta de alergia)
--------------------------------------------------------- */
function checkAllergy(){
  const tipoEl = el('orden-tipo'), detEl = el('orden-detalle'), warnEl = el('allergy-warning');
  if(!tipoEl || !detEl || !warnEl) return;
  const tipo = tipoEl.value;
  const detalle = detEl.value.toLowerCase();
  const risky = tipo.includes('medicamento') && (detalle.includes('amoxi') || detalle.includes('penicilina'));
  warnEl.style.display = risky ? 'block' : 'none';
}
function applyConsultaRoleView(){
  const role = getRole();
  const ordenPanel = el('panel-orden');
  const triagePanel = el('panel-triage');
  if(ordenPanel) ordenPanel.style.display = (role === 'medico') ? '' : 'none';
  if(triagePanel) triagePanel.style.display = (role === 'enfermeria') ? '' : 'none';
}
function registrarTriage(){
  const prioridadEl = el('triage-prioridad');
  const signosEl = el('triage-signos');
  const motivoEl = el('triage-motivo');
  const motivo = motivoEl ? motivoEl.value.trim() : '';
  if(!motivo){
    alert('El motivo de consulta es obligatorio.');
    return;
  }
  const prioridad = prioridadEl ? prioridadEl.value : '';
  const signos = signosEl ? signosEl.value.trim() : '';
  logAudit('Registrar triage', `Prioridad ${prioridad} · Motivo: ${motivo}` + (signos ? ` · Signos: ${signos}` : ''), 'ok', {sensible:true});
  showToast('Triage registrado. Visible para el Médico en el expediente.', 'ok');
  motivoEl.value = '';
  if(signosEl) signosEl.value = '';
}
function emitirOrden(){
  const detEl = el('orden-detalle'), warnEl = el('allergy-warning');
  const detalle = (detEl && detEl.value.trim()) || 'orden clínica sin detalle';
  const risky = warnEl && warnEl.style.display !== 'none';
  if(risky){
    confirmCriticalAction(`Emitir la orden clínica de ${detalle} a pesar de la alergia registrada`);
  } else {
    logAudit('Emitir orden clínica', detalle, 'ok', {sensible:true});
    showToast(`Orden clínica de ${detalle} emitida y registrada en Bitácora.`, 'ok');
  }
}

/* ---------------------------------------------------------
   10. PANTALLA: REPORTES (Bitácora + KPIs)
--------------------------------------------------------- */
function renderBitacora(){
  const tbody = el('tbl-bitacora');
  if(!tbody) return;
  const role = getRole();
  const textoEl = el('bit-filtro-texto');
  const resEl = el('bit-filtro-resultado');
  const texto = textoEl ? textoEl.value.trim().toLowerCase() : '';
  const resultado = resEl ? resEl.value : '';
  const filtradas = BITACORA.filter(row => {
    const matchTexto = !texto || (row.u + ' ' + row.a + ' ' + row.d).toLowerCase().includes(texto);
    const matchRes = !resultado || row.r === resultado;
    return matchTexto && matchRes;
  }).slice(0, 50);
  tbody.innerHTML = '';
  if(filtradas.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" class="helper-text text-center py-3">Sin resultados para el filtro aplicado.</td></tr>`;
    return;
  }
  filtradas.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'audit-row' + (row.r === 'denied' ? ' denied' : '');
    let detalleCell = row.d;
    // RNF-02 / 6.6.7: el Administrador nunca ve información clínica; el Auditor la ve
    // enmascarada y solo la revela dejando una justificación (mismo patrón que Pacientes).
    if(row.sensible && role === 'administrador'){
      detalleCell = `<span class="field-lock">dato clínico oculto — el Administrador no tiene acceso a información clínica (RNF-02)</span>`;
    } else if(row.sensible && role === 'auditor' && !row.revelado){
      detalleCell = `<span class="sensitive-mask">enmascarado</span> <a href="#" onclick="revealBitacora(event,'${row.id}')" class="small">ver con justificación</a>`;
    }
    tr.innerHTML = `<td class="mono">${row.t}</td><td>${row.u}</td><td class="mono">${row.origen || '—'}</td><td>${row.a}</td><td>${detalleCell}</td><td>${row.r==='denied' ? '⛔ Denegado' : '✔ Autorizado'}</td>`;
    tbody.appendChild(tr);
  });
}
function revealBitacora(ev, id){
  ev.preventDefault();
  const row = BITACORA.find(r => r.id === id);
  if(!row) return;
  const justif = prompt('Justificación para ver este dato clínico en la Bitácora (se registra):');
  if(justif && justif.trim()){
    row.revelado = true;
    saveJSON('sigh_bitacora', BITACORA);
    logAudit('Consulta de dato clínico en Bitácora', `Registro ${row.id} · Justificación: ${justif.trim()}`, 'ok');
    showToast('Dato revelado con justificación. Consulta registrada en Bitácora.', 'ok');
    renderBitacora();
  }
}
// Normaliza el texto para el CSV: quita tildes decorativas de puntuación (·, —, emojis)
// que Excel muestra mal en algunas configuraciones regionales; conserva acentos y ñ.
function csvSafe(v){
  const cleaned = String(v)
    .normalize('NFC')
    .replace(/[·•]/g, '-')
    .replace(/[—–]/g, '-')
    .replace(/[⛔✔⚠🔒]/g, '')
    .replace(/…/g, '...')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return `"${cleaned.replace(/"/g, '""')}"`;
}
function exportarBitacora(){
  const role = getRole();
  if(role !== 'auditor' && role !== 'administrador'){
    logAudit('Intento de exportar Bitácora', 'sin permiso (solo Auditor/Administrador)', 'denied');
    showToast('Solo Auditor o Administrador pueden exportar la Bitácora (RF-20). Registrado en Bitácora.', 'deny');
    return;
  }
  const esAdmin = role === 'administrador';
  const encabezado = ['Fecha/hora','Usuario','Origen (IP)','Accion','Detalle','Resultado'];
  const filas = [encabezado].concat(BITACORA.map(r => [
    r.t,
    r.u,
    r.origen || '-',
    r.a,
    (r.sensible && esAdmin) ? 'Dato clinico oculto (RNF-02)' : r.d,
    r.r === 'denied' ? 'Denegado' : 'Autorizado'
  ]));
  // BOM UTF-8 al inicio para que Excel interprete correctamente acentos y ñ;
  // los caracteres decorativos (·, —, emojis) ya se normalizaron en csvSafe().
  const csv = '\uFEFF' + filas.map(f => f.map(csvSafe).join(',')).join('\r\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sigh_bitacora.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  logAudit('Exportar bitácora', 'Exportación CSV (RF-20)' + (esAdmin ? ' — datos clínicos excluidos' : ''), 'ok');
  showToast('Bitácora exportada como CSV. Registrado en Bitácora.', 'ok');
}
function renderKPIs(){
  const ocupEl = el('kpi-ocupacion');
  if(ocupEl){
    const total = CAMAS.length;
    const ocupadas = CAMAS.filter(c => c.estado === 'ocupada').length;
    const pct = total ? Math.round((ocupadas / total) * 100) : 0;
    ocupEl.textContent = pct + '%';
    const subEl = el('kpi-ocupacion-sub');
    if(subEl) subEl.textContent = `${ocupadas} de ${total} camas ocupadas`;
  }
  const denegEl = el('kpi-denegados');
  if(denegEl){
    denegEl.textContent = BITACORA.filter(b => b.r === 'denied').length;
  }
}

/* ---------------------------------------------------------
   12. ACCIONES QUE ANTES SOLO MOSTRABAN UN TOAST SIN REGISTRAR
   NADA EN LA BITÁCORA (ahora sí registran, para que el mensaje
   "registrado" que ve el usuario sea verdad).
--------------------------------------------------------- */
let episodioContador = 432;
function crearEpisodio(){
  const nombreEl = el('adm-nombre');
  const nombre = (nombreEl && nombreEl.value.trim()) || 'paciente sin nombre';
  const id = `EP-2026-0${episodioContador++}`;
  logAudit('Crear episodio', `${id} · ${nombre}`, 'ok');
  showToast(`Episodio ${id} creado para ${nombre}. Registrado en Bitácora.`, 'ok');
}

function medicamentoConflictaAlergia(medicamento, alergias){
  if(!alergias || alergias === 'Ninguna registrada' || alergias === '—' || alergias === 'Sin registro') return false;
  const med = (medicamento || '').toLowerCase();
  const alerg = alergias.toLowerCase();
  if(alerg.includes('penicilina') && (med.includes('amoxi') || med.includes('penicilina'))) return true;
  return false;
}
function renderFarmaciaAlergias(){
  document.querySelectorAll('[data-alergia-cell]').forEach(td => {
    const tr = td.closest('tr');
    const nombre = tr.getAttribute('data-paciente');
    const medicamento = tr.getAttribute('data-medicamento') || '';
    const p = PACIENTES.find(x => x.nombre === nombre);
    const alergias = p ? p.alergias : 'Sin registro';
    const conflicto = medicamentoConflictaAlergia(medicamento, alergias);
    td.innerHTML = conflicto ? `<span class="text-danger fw-semibold">⚠ ${alergias}</span>` : alergias;
  });
}
function dispensarOrden(codigo, medicamento, paciente, notaExtra){
  const p = PACIENTES.find(x => x.nombre === paciente);
  const alergias = p ? p.alergias : null;
  if(medicamentoConflictaAlergia(medicamento, alergias)){
    confirmCriticalAction(`Dispensar ${medicamento} a ${paciente} a pesar de su alergia registrada (${alergias}) — RN-11`);
    return;
  }
  const detalle = `${codigo} · ${medicamento} · ${paciente}` + (notaExtra ? ` · ${notaExtra}` : '');
  logAudit('Dispensar medicamento', detalle, 'ok', {sensible:true});
  showToast(`Dispensación de ${medicamento} registrada en Bitácora.`, 'ok');
}

function registrarResultado(codigo, estudio, paciente){
  const detalle = `${codigo} · ${estudio} · ${paciente} · versión sin validar`;
  logAudit('Registrar resultado de laboratorio', detalle, 'ok', {sensible:true});
  showToast(`Resultado de ${estudio} registrado como versión sin validar. Registrado en Bitácora.`, 'ok');
}

function solicitarRepeticion(codigo, estudio, paciente){
  const detalle = `${codigo} · ${estudio} · ${paciente}`;
  logAudit('Solicitar repetición de muestra', detalle, 'ok', {sensible:true});
  showToast(`Repetición de ${estudio} solicitada. Registrado en Bitácora.`, 'ok');
}

function nuevoEmpleado(){
  showToast('El alta de empleados no está implementada en este prototipo navegable.', 'info');
}
function applyAdministracionRoleView(){
  const role = getRole();
  if(role !== 'mantenimiento') return;
  const nuevoBtn = el('btn-nuevo-empleado');
  if(nuevoBtn){
    nuevoBtn.disabled = true;
    nuevoBtn.title = 'Solo Administrador puede dar de alta empleados (Tabla 6.11)';
    nuevoBtn.style.opacity = '.5';
  }
  document.querySelectorAll('.btn-editar-rol').forEach(btn => {
    btn.disabled = true;
    btn.textContent = 'Solo lectura';
    btn.title = 'Mantenimiento tiene acceso de solo lectura a Empleado (Tabla 6.11)';
  });
  const nota = el('nota-solo-lectura');
  if(nota) nota.style.display = 'block';
}

/* ---------------------------------------------------------
   13. PANTALLA: FARMACIA — devolución de medicamento
--------------------------------------------------------- */
function devolverMedicamento(){
  const sel = el('dev-orden');
  const motivoEl = el('dev-motivo');
  if(!sel || !motivoEl) return;
  const motivo = motivoEl.value.trim();
  if(!motivo){
    alert('El motivo de la devolución es obligatorio (RN-06).');
    return;
  }
  const [codigo, medicamento, paciente] = sel.value.split('|');
  const role = getRole();
  const responsable = role ? ROLES[role].user : 'desconocido';
  logAudit('Devolución de medicamento',
    `${codigo} · ${medicamento} · Paciente: ${paciente} · Responsable: ${responsable} · Motivo: ${motivo} · Documento soporte: ${codigo}`,
    'ok', {sensible:true});
  showToast(`Devolución de ${medicamento} registrada en Bitácora (RN-06).`, 'ok');
  motivoEl.value = '';
}

/* ---------------------------------------------------------
   11. INICIALIZACIÓN POR PÁGINA
   Cada página de módulo llama a: SIGH.boot('idDePantalla')
   después de que su contenido estático ya está en #page-content.
--------------------------------------------------------- */
window.SIGH = {
  boot(screenId){
    const allowed = initShell(screenId);
    if(!allowed) return; // el contenido ya fue reemplazado por el mensaje de acceso denegado
    if(screenId === 'pacientes')  renderPacientes();
    if(screenId === 'camas')      renderCamas();
    if(screenId === 'reportes'){  renderBitacora(); renderKPIs(); }
    if(screenId === 'consulta'){  checkAllergy(); applyConsultaRoleView(); }
    if(screenId === 'admision')   renderEspera();
    if(screenId === 'farmacia')   renderFarmaciaAlergias();
    if(screenId === 'administracion') applyAdministracionRoleView();
  }
};
