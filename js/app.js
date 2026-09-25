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
    title: "Consulta", sub: "Órdenes clínicas y prescripción — UC-05, UC-06 · Responsable: Médico",
    roles: ["medico"] },
  { id: "farmacia",       file: "farmacia.html",       ico: "💊", label: "Farmacia",
    title: "Farmacia", sub: "Validación, dispensación e inventario de lotes — UC-07, UC-10 · Responsable: Farmacia",
    roles: ["farmacia","enfermeria"] },
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
  {code:"HAB-101-C1", serv:"Medicina Interna", estado:"disponible"},
  {code:"HAB-101-C2", serv:"Medicina Interna", estado:"ocupada", pac:"Juan Pérez López"},
  {code:"HAB-102-C1", serv:"Medicina Interna", estado:"limpieza"},
  {code:"HAB-102-C2", serv:"Medicina Interna", estado:"bloqueada", nota:"Aislamiento"},
  {code:"EMER-E1", serv:"Emergencias", estado:"ocupada", pac:"NN — Emergencia 08"},
  {code:"EMER-E2", serv:"Emergencias", estado:"disponible"},
  {code:"EMER-E3", serv:"Emergencias", estado:"fuera", nota:"Fuera de servicio"},
  {code:"PED-201-C1", serv:"Pediatría", estado:"reservada"},
  {code:"PED-201-C2", serv:"Pediatría", estado:"ocupada", pac:"María Xitumul Son"},
  {code:"PED-202-C1", serv:"Pediatría", estado:"disponible"},
];

const BITACORA_SEED = [
  {t:"24/09 08:12", u:"lsay (Médico)", a:"Emitir orden clínica", d:"OC-3381 · Amoxicilina · Juan Pérez López", r:"ok"},
  {t:"24/09 07:58", u:"kixchop (Farmacia)", a:"Intento de dispensación", d:"OC-3375 · Insulina glargina · lote vencido", r:"denied"},
  {t:"24/09 07:40", u:"rchoc (Laboratorio)", a:"Validar resultado crítico", d:"OL-1246 · Glucosa 380 mg/dL · María Xitumul Son", r:"ok"},
  {t:"23/09 22:05", u:"acoy (Enfermería)", a:"Acceso de emergencia", d:"Consulta paciente fuera de su servicio — justificación registrada", r:"ok"},
  {t:"23/09 21:40", u:"desconocido", a:"Inicio de sesión", d:"5 intentos fallidos — cuenta bloqueada temporalmente", r:"denied"},
  {t:"23/09 16:12", u:"admin.rrhh (Administrador)", a:"Intento de acceso", d:"Módulo Consulta — sin permiso de función (nivel 1)", r:"denied"},
];

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

function getRole(){ return localStorage.getItem('sigh_role'); }
function setRole(key){ localStorage.setItem('sigh_role', key); }
function clearSession(){ localStorage.removeItem('sigh_role'); }

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
            <span class="env-flag">Contingencia: apagado</span>
            <span class="badge-state st-ocupada">${ROLES[role].label}</span>
          </div>
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

function logAudit(accion, detalle, resultado){
  const role = getRole();
  const who = role ? (ROLES[role].user + ' (' + ROLES[role].label + ')') : 'desconocido';
  BITACORA.unshift({t:'24/09 ahora', u: who, a:accion, d:detalle, r:resultado});
  saveJSON('sigh_bitacora', BITACORA);
}

let pendingCritical = null;
function confirmCriticalAction(texto){
  pendingCritical = texto;
  el('critico-texto').textContent = texto + '.';
  new bootstrap.Modal(el('modalCritico')).show();
}
function confirmCriticalYes(){
  logAudit('Acción crítica confirmada', pendingCritical, 'ok');
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
    logAudit('Consulta de dato Sensible', `Alergias de ${p.nombre} · Justificación: ${justif}`, 'ok');
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

/* ---------------------------------------------------------
   8. PANTALLA: ENCAMAMIENTO / CAMAS
--------------------------------------------------------- */
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
  visibles.forEach(({c, idx}) => {
    const div = document.createElement('div');
    div.className = 'bed-card b-' + c.estado;
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    const stLabel = {disponible:'Disponible',ocupada:'Ocupada',reservada:'Reservada',limpieza:'En limpieza',bloqueada:'Bloqueada',fuera:'Fuera de servicio'}[c.estado];
    div.setAttribute('aria-label', `Cama ${c.code}, ${c.serv}, estado ${stLabel}`);
    div.innerHTML = `
      <div class="bed-code mono">${c.code}</div>
      <div class="bed-serv">${c.serv}</div>
      <div class="mt-2"><span class="badge-state st-${c.estado}">${stLabel}</span></div>
      ${c.pac ? `<div class="helper-text mt-1">${c.pac}</div>` : ''}
      ${c.nota ? `<div class="helper-text mt-1">${c.nota}</div>` : ''}
    `;
    div.onclick = () => handleBedClick(idx);
    div.onkeydown = (ev) => { if(ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); handleBedClick(idx); } };
    grid.appendChild(div);
  });
}
function filterCamas(){
  renderCamas();
}
function handleBedClick(idx){
  const role = getRole();
  const c = CAMAS[idx];
  if(!['enfermeria','admision'].includes(role)){
    logAudit('Intento de cambio de estado', c.code + ' — sin permiso', 'denied');
    showToast(`Acceso denegado: su rol no puede modificar el estado de ${c.code}. Registrado en Bitácora.`, 'deny');
    return;
  }
  if(c.estado === 'disponible'){
    if(confirm(`¿Asignar la cama ${c.code} al siguiente paciente en espera?`)){
      c.estado = 'ocupada'; c.pac = 'Paciente en espera — asignado';
      saveJSON('sigh_camas', CAMAS);
      logAudit('Asignar cama', c.code + ' — RN-01: cama estaba Disponible', 'ok');
      renderCamas();
      showToast(`Cama ${c.code} asignada. Se creó OcupacionCama.`, 'ok');
    }
  } else if(c.estado === 'ocupada'){
    if(confirm(`¿Registrar alta y liberar la cama ${c.code}? Pasará a "En limpieza" (RN-02), no directo a Disponible.`)){
      logAudit('Alta y liberación', c.code + ' — pasa a En limpieza (RN-02)', 'ok');
      c.estado = 'limpieza'; delete c.pac;
      saveJSON('sigh_camas', CAMAS);
      renderCamas();
      showToast(`Cama ${c.code} en limpieza. Solo Enfermería puede aprobar el paso a Disponible.`, 'ok');
    }
  } else if(c.estado === 'limpieza'){
    if(role !== 'enfermeria'){
      logAudit('Intento de aprobar limpieza', c.code + ' — sin permiso (solo Enfermería)', 'denied');
      showToast(`Solo Enfermería puede aprobar la limpieza de ${c.code}. Registrado en Bitácora.`, 'deny');
      return;
    }
    if(confirm(`¿Aprobar limpieza y dejar ${c.code} como Disponible?`)){
      c.estado = 'disponible';
      saveJSON('sigh_camas', CAMAS);
      logAudit('Aprobar limpieza', c.code + ' — pasa a Disponible (RN-02)', 'ok');
      renderCamas();
      showToast(`Cama ${c.code} disponible nuevamente.`, 'ok');
    }
  } else if(c.estado === 'bloqueada' || c.estado === 'fuera'){
    showToast(`Cama ${c.code} no puede asignarse: estado "${c.estado === 'bloqueada' ? 'Bloqueada' : 'Fuera de servicio'}" (RN-01/RN-09).`, 'info');
  } else if(c.estado === 'reservada'){
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
function emitirOrden(){
  const detEl = el('orden-detalle'), warnEl = el('allergy-warning');
  const detalle = (detEl && detEl.value.trim()) || 'orden clínica sin detalle';
  const risky = warnEl && warnEl.style.display !== 'none';
  if(risky){
    confirmCriticalAction(`Emitir la orden clínica de ${detalle} a pesar de la alergia registrada`);
  } else {
    logAudit('Emitir orden clínica', detalle, 'ok');
    showToast(`Orden clínica de ${detalle} emitida y registrada en Bitácora.`, 'ok');
  }
}

/* ---------------------------------------------------------
   10. PANTALLA: REPORTES (Bitácora + KPIs)
--------------------------------------------------------- */
function renderBitacora(){
  const tbody = el('tbl-bitacora');
  if(!tbody) return;
  tbody.innerHTML = '';
  BITACORA.slice(0,12).forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'audit-row' + (row.r === 'denied' ? ' denied' : '');
    tr.innerHTML = `<td class="mono">${row.t}</td><td>${row.u}</td><td>${row.a}</td><td>${row.d}</td><td>${row.r==='denied' ? '⛔ Denegado' : '✔ Autorizado'}</td>`;
    tbody.appendChild(tr);
  });
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

function dispensarOrden(codigo, medicamento, paciente, notaExtra){
  const detalle = `${codigo} · ${medicamento} · ${paciente}` + (notaExtra ? ` · ${notaExtra}` : '');
  logAudit('Dispensar medicamento', detalle, 'ok');
  showToast(`Dispensación de ${medicamento} registrada en Bitácora.`, 'ok');
}

function registrarResultado(codigo, estudio, paciente){
  const detalle = `${codigo} · ${estudio} · ${paciente} · versión sin validar`;
  logAudit('Registrar resultado de laboratorio', detalle, 'ok');
  showToast(`Resultado de ${estudio} registrado como versión sin validar. Registrado en Bitácora.`, 'ok');
}

function solicitarRepeticion(codigo, estudio, paciente){
  const detalle = `${codigo} · ${estudio} · ${paciente}`;
  logAudit('Solicitar repetición de muestra', detalle, 'ok');
  showToast(`Repetición de ${estudio} solicitada. Registrado en Bitácora.`, 'ok');
}

function nuevoEmpleado(){
  showToast('El alta de empleados no está implementada en este prototipo navegable.', 'info');
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
    if(screenId === 'consulta')   checkAllergy();
  }
};
