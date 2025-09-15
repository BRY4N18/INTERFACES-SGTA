// SGTA - Módulo Estudiante (frontend estático con LocalStorage)

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ---------------------------- Datos simulados ----------------------------
const STORAGE_KEYS = {
  solicitudes: 'sgta.solicitudes',
  preferencias: 'sgta.pref.estudiante',
  seed: 'sgta.seedLoaded'
};

const docentes = [
  {
    id: 'doc1',
    nombre: 'Doc. Juan Pérez',
    modalidades: ['presencial', 'virtual'],
    asignaturas: ['POO', 'Algoritmos'],
    disponibilidad: {
      // formato estándar dd/mm/aaaa – hh:mm (24h) en hora local
      // Slots de 30 min a modo de ejemplo
      '15/09/2025': ['09:00', '09:30', '10:00', '14:00', '15:30'],
      '16/09/2025': ['08:00', '08:30', '14:00']
    }
  },
  {
    id: 'doc2',
    nombre: 'Dra. María López',
    modalidades: ['virtual'],
    asignaturas: ['Bases de Datos', 'Algoritmos'],
    disponibilidad: {
      '15/09/2025': ['11:00', '11:30', '16:00'],
      '17/09/2025': ['10:00', '10:30']
    }
  }
];

const asignaturas = [
  { id: 'POO', nombre: 'Programación Orientada a Objetos' },
  { id: 'Algoritmos', nombre: 'Algoritmos y Lógicas de Programación' },
  { id: 'BD', nombre: 'Bases de Datos' }
];

// ---------------------------- Utilidades ----------------------------
function toKey(date) {
  // Date -> dd/mm/aaaa
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function showToast(msg, type = 'info') {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  el.style.background = type === 'error' ? '#b91c1c' : type === 'success' ? '#065f46' : '#111827';
  setTimeout(() => el.classList.add('hidden'), 2200);
}

function openModal(title, bodyHTML, footerHTML = '') {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  $('#modal-footer').innerHTML = footerHTML;
  $('#modal').classList.remove('hidden');
}
function closeModal() { $('#modal').classList.add('hidden'); }

function toRangoFin(horaInicio, duracionMin = 30) {
  // '15:30' + 30 -> '16:00'
  if (!/^\d{2}:\d{2}$/.test(horaInicio)) return horaInicio;
  const [H, M] = horaInicio.split(':').map(n=>parseInt(n,10));
  const date = new Date();
  date.setHours(H, M, 0, 0);
  date.setMinutes(date.getMinutes() + duracionMin);
  const hh = String(date.getHours()).padStart(2,'0');
  const mm = String(date.getMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

// ---------------------------- Estado ----------------------------
function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function saveLS(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

function seedIfNeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.seed)) {
    const demoSolicitudes = [
      {
        id: crypto.randomUUID(),
        estudiante: 'Ana García',
        asignatura: 'POO',
        docenteId: 'doc1',
        tema: 'Repaso de herencia y polimorfismo',
        tipo: 'individual',
        modalidad: 'presencial',
        fecha: '15/09/2025',
        hora: '15:30',
        estado: 'pendiente',
        adjunto: null,
        historial: []
      },
      {
        id: crypto.randomUUID(),
        estudiante: 'Ana García',
        asignatura: 'Algoritmos',
        docenteId: 'doc1',
        tema: 'Listas enlazadas - preparatorio de examen',
        tipo: 'grupal',
        modalidad: 'virtual',
        fecha: '16/09/2025',
        hora: '14:00',
        estado: 'aceptada',
        adjunto: null,
        historial: []
      },
    ];
    saveLS(STORAGE_KEYS.solicitudes, demoSolicitudes);
    saveLS(STORAGE_KEYS.seed, true);
  }
}

// Inserta una solicitud DEMO en estado reprogramada para pruebas (solo si no existe)
function ensureDemoReprogramada() {
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  const exists = solicitudes.some(s => s.tema === 'DEMO Reprogramada' && s.estado === 'reprogramada');
  if (exists) return;
  const d = new Date(); d.setDate(d.getDate() + 1); // mañana para asegurar que no esté vencida
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const demo = {
    id: crypto.randomUUID(),
    estudiante: 'Estudiante Demo',
    asignatura: 'POO',
    docenteId: 'doc1',
    tema: 'DEMO Reprogramada',
    tipo: 'individual',
    modalidad: 'virtual',
    fecha: `${dd}/${mm}/${yyyy}`,
    hora: '10:00',
    estado: 'reprogramada',
    adjunto: null,
    historial: [{ ts: Date.now(), evento: 'reprogramada por docente' }]
  };
  solicitudes.push(demo);
  saveLS(STORAGE_KEYS.solicitudes, solicitudes);
}

// ---------------------------- Render helpers ----------------------------
function docenteById(id) { return docentes.find(d => d.id === id); }
function asignaturaName(id) { return asignaturas.find(a => a.id === id)?.nombre ?? id; }

function renderStats() {
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  const count = (s) => solicitudes.filter(x => x.estado === s).length;
  $('#stat-pendientes').textContent = count('pendiente');
  $('#stat-aceptadas').textContent = count('aceptada');
  $('#stat-reprogramadas').textContent = count('reprogramada');
  $('#stat-realizadas').textContent = count('realizada');

  // En la nueva versión, el inicio ya no muestra próximas tutorías, sino la tabla de solicitudes.
}

function renderCombosSolicitud() {
  // Asignaturas
  const selAsig = $('#asignatura');
  selAsig.innerHTML = '<option value="" disabled selected>Seleccione...</option>' +
    asignaturas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');

  // Docentes
  const selDoc = $('#docente');
  selDoc.innerHTML = '<option value="" disabled selected>Seleccione...</option>' +
    docentes.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
}

function refreshHorasDisponibles() {
  const docenteId = $('#docente').value;
  const fecha = $('#fecha').value; // yyyy-mm-dd
  const selectHora = $('#hora');
  selectHora.innerHTML = '';

  if (!docenteId || !fecha) return;
  const key = toKey(fecha);
  const d = docenteById(docenteId);
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);

  // obtener horarios base del docente
  const base = d?.disponibilidad?.[key] ?? [];
  // excluir horarios ya ocupados por tutorías aceptadas/reprogramadas/realizadas
  const ocupados = new Set(
    solicitudes
      .filter(s => s.docenteId === docenteId && s.fecha === key)
      .filter(s => ['aceptada', 'reprogramada', 'realizada', 'pendiente'].includes(s.estado))
      .map(s => s.hora)
  );
  const libres = base.filter(h => !ocupados.has(h));

  if (libres.length === 0) {
    selectHora.innerHTML = '<option value="" disabled>No hay horarios disponibles</option>';
  } else {
    selectHora.innerHTML = '<option value="" disabled selected>Seleccione...</option>' + libres.map(h => `<option value="${h}">${h}</option>`).join('');
  }
}

function syncModalidadHelper() {
  const docId = $('#docente').value; const sel = $('#modalidad'); const help = $('#modalidad-help');
  const d = docenteById(docId);
  if (!d) { help.textContent = ''; return; }
  // Filtrar opciones según modalidades del docente
  $$('#modalidad option').forEach(o => { o.disabled = !d.modalidades.includes(o.value); });
  const current = sel.value;
  if (!d.modalidades.includes(current)) sel.value = d.modalidades[0];
  help.textContent = `Este docente atiende: ${d.modalidades.join(' y ')}`;
}

// ---------------------------- Acciones ----------------------------
function handleSubmitSolicitud(e) {
  e.preventDefault();
  const estudiante = 'Ana García';
  const asignatura = $('#asignatura').value;
  const docenteId = $('#docente').value;
  const tema = $('#tema').value.trim();
  const tipo = $('#tipo').value;
  const modalidad = $('#modalidad').value;
  const fechaKey = toKey($('#fecha').value);
  const hora = $('#hora').value;
  const file = $('#archivo').files[0] || null;

  if (!asignatura || !docenteId || !tema || !tipo || !modalidad || !hora) {
    showToast('Completa todos los campos requeridos', 'error');
    return;
  }

  // Validar que el horario esté dentro de la disponibilidad del docente y no esté ocupado.
  const d = docenteById(docenteId);
  const base = d?.disponibilidad?.[fechaKey] ?? [];
  if (!base.includes(hora)) {
    showToast('El horario seleccionado ya no está disponible', 'error');
    return;
  }

  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  const ocupado = solicitudes.some(s => s.docenteId === docenteId && s.fecha === fechaKey && s.hora === hora && ['pendiente','aceptada','reprogramada','realizada'].includes(s.estado));
  if (ocupado) {
    showToast('Ese horario está ocupado por otra tutoría', 'error');
    refreshHorasDisponibles();
    return;
  }

  const nueva = {
    id: crypto.randomUUID(),
    estudiante,
    asignatura,
    docenteId,
    tema,
    tipo,
    modalidad,
    fecha: fechaKey,
    hora,
    estado: 'pendiente',
    adjunto: file ? { name: file.name, size: file.size } : null,
    historial: []
  };

  solicitudes.push(nueva);
  saveLS(STORAGE_KEYS.solicitudes, solicitudes);
  showToast('Solicitud enviada correctamente', 'success');
  $('#archivo-info').textContent = file ? `${file.name} (${Math.round(file.size/1024)} KB)` : '';
  e.target.reset();
  renderAll();
  // navegar al inicio, donde está la tabla de solicitudes
  navigate('inicio');
}

function renderTablaSolicitudes() {
  const tbody = $('#tabla-solicitudes tbody');
  const filtroEl = document.getElementById('filtro-estado');
  const buscarEl = document.getElementById('buscar-solicitud');
  const filtro = filtroEl ? filtroEl.value : '';
  const q = buscarEl ? buscarEl.value.toLowerCase() : '';
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  // excluir tutorías vencidas (fecha+hora+duración ya pasaron)
  const ahora = new Date();
  const noVencida = (s)=>{
    // fecha dd/mm/yyyy, hora HH:MM, duración por defecto 30
    const [d,m,y] = s.fecha.split('/').map(Number);
    const [hh,mm] = (s.hora||'00:00').split(':').map(Number);
    const fin = new Date(y, (m||1)-1, d||1, hh||0, (mm||0) + (s.duracion||30));
    return fin >= ahora || ['rechazada','realizada'].includes(s.estado);
  };
  const fil = solicitudes.filter(s => noVencida(s) && (!filtro || s.estado === filtro) && (
    (s.tema||'').toLowerCase().includes(q) || asignaturaName(s.asignatura).toLowerCase().includes(q) || (docenteById(s.docenteId)?.nombre.toLowerCase().includes(q))
  ));
  tbody.innerHTML = '';
  if (fil.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">Sin registros.</td></tr>';
    return;
  }

  fil.sort((a,b)=>{
    const ad = a.fecha.split('/').reverse().join('') + a.hora.replace(':','');
    const bd = b.fecha.split('/').reverse().join('') + b.hora.replace(':','');
    return bd.localeCompare(ad); // recientes primero
  });

  fil.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${asignaturaName(s.asignatura)}</td>
      <td>${s.tema || '-'}</td>
      <td>${s.fecha} ${s.hora}</td>
      <td>${s.tipo}</td>
      <td>${s.modalidad}</td>
      <td><span class="badge ${s.estado}">${s.estado}</span></td>
      <td><button class="btn" data-action="ver" data-id="${s.id}">Ver detalles</button></td>`;
    tbody.appendChild(tr);
  });
}

function fillHistorialCombos() {
  // llenar combos de filtros avanzados con opciones disponibles
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  const asigs = Array.from(new Set(solicitudes.map(s=>s.asignatura)));
  const temas = Array.from(new Set(solicitudes.map(s=>s.tema).filter(Boolean)));
  const asigSel = document.getElementById('fh-asignatura');
  const temaSel = document.getElementById('fh-tema');
  if (asigSel) asigSel.innerHTML = '<option value="">Todos</option>' + asigs.map(a=>`<option value="${a}">${asignaturaName(a)}</option>`).join('');
  if (temaSel) temaSel.innerHTML = '<option value="">Todos</option>' + temas.map(t=>`<option value="${t}">${t}</option>`).join('');
}

function getHistorialFilters() {
  const q = (document.getElementById('buscar-historial')?.value || '').toLowerCase();
  const fa = (id)=>document.getElementById(id)?.value || '';
  return {
    q,
    vista: fa('vista-historial') || 'realizadas',
    asignatura: fa('fh-asignatura'),
    tipo: fa('fh-tipo'),
    tema: fa('fh-tema'),
    modalidad: fa('fh-modalidad')
  };
}

function passesHistorialFilters(s, f) {
  if (f.asignatura && s.asignatura !== f.asignatura) return false;
  if (f.tipo && s.tipo !== f.tipo) return false;
  if (f.tema && s.tema !== f.tema) return false;
  if (f.modalidad && s.modalidad !== f.modalidad) return false;
  const texto = `${asignaturaName(s.asignatura)} ${s.tema || ''} ${docenteById(s.docenteId)?.nombre || ''}`.toLowerCase();
  if (f.q && !texto.includes(f.q)) return false;
  return true;
}

function renderHistorial() {
  const tbody = $('#tabla-historial tbody');
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  const f = getHistorialFilters();
  // filtro base según vista
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth() - 1, ahora.getDate());
  const inicioSemestre = new Date(ahora.getFullYear(), ahora.getMonth() - 6, ahora.getDate());
  const enRango = (s, desde) => {
    // fechas en formato dd/mm/yyyy
    const [d,m,y] = s.fecha.split('/').map(Number);
    const fechaS = new Date(y, m-1, d);
    return fechaS >= desde;
  };
  let base = solicitudes;
  switch (f.vista) {
    case 'realizadas':
      base = solicitudes.filter(s => s.estado === 'realizada');
      break;
    case 'canceladas':
      base = solicitudes.filter(s => s.estado === 'rechazada');
      break;
    case 'ultimo-mes':
      base = solicitudes.filter(s => enRango(s, inicioMes));
      break;
    case 'ultimo-semestre':
      base = solicitudes.filter(s => enRango(s, inicioSemestre));
      break;
    case 'todas':
    default:
      base = solicitudes;
  }
  const datos = base.filter(s => passesHistorialFilters(s, f))
    .sort((a,b)=>{
      const ad = a.fecha.split('/').reverse().join('') + a.hora.replace(':','');
      const bd = b.fecha.split('/').reverse().join('') + b.hora.replace(':','');
      return bd.localeCompare(ad);
    });
  tbody.innerHTML = '';
  if (datos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">Sin resultados.</td></tr>';
    return;
  }
  datos.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.fecha}</td>
      <td>${s.hora}</td>
      <td>${asignaturaName(s.asignatura)}</td>
      <td>${docenteById(s.docenteId)?.nombre ?? ''}</td>
      <td>${s.tipo}</td>
      <td>${s.modalidad}</td>
      <td><span class="badge ${s.estado}">${s.estado}</span></td>
      <td>${s.duracion ?? '-'} min</td>
      <td>${s.observaciones ?? '-'}</td>`;
    tbody.appendChild(tr);
  });
}

// (Estudiante) Sin exportaciones en Historial.

// ---------------------------- Navegación ----------------------------
function navigate(id) {
  $$('.view').forEach(v => v.classList.remove('active'));
  $$('.menu-item').forEach(m => m.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  $(`.menu-item[data-target="${id}"]`).classList.add('active');
  const titleMap = {
    'inicio': 'Inicio',
    'nueva-solicitud': 'Solicitar tutorías',
    'historial': 'Historial',
    'preferencias': 'Configuración'
  };
  $('#page-title').textContent = titleMap[id] ?? id;

  // renders por vista
  if (id === 'inicio') { renderStats(); renderTablaSolicitudes(); }
  if (id === 'historial') { fillHistorialCombos(); renderHistorial(); }
}

// ---------------------------- Preferencias ----------------------------
function cargarPreferencias() {
  const pref = loadLS(STORAGE_KEYS.preferencias, { canal: 'correo', frecuencia: 'inmediata', contacto: '' });
  $('#canal').value = pref.canal;
  $('#frecuencia').value = pref.frecuencia;
  $('#contacto').value = pref.contacto;
}
function guardarPreferencias(e) {
  e.preventDefault();
  const canal = $('#canal').value; const frecuencia = $('#frecuencia').value; const contacto = $('#contacto').value.trim();
  // Validación simple de disponibilidad del canal
  if (canal === 'correo' && !/^[\w.+-]+@\w+\.[\w.-]+$/.test(contacto)) return showToast('Ingresa un correo institucional válido', 'error');
  if (canal === 'whatsapp' && !/^\+?\d{10,15}$/.test(contacto)) return showToast('Ingresa un número válido con código de país', 'error');
  saveLS(STORAGE_KEYS.preferencias, { canal, frecuencia, contacto });
  showToast('Preferencias guardadas', 'success');
}

// ---------------------------- Detalles y acciones de solicitudes ----------------------------
function onTablaClick(e) {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id; const action = btn.dataset.action;
  const solicitudes = loadLS(STORAGE_KEYS.solicitudes, []);
  const s = solicitudes.find(x => x.id === id);
  if (!s) return;

  if (action === 'ver') {
    const docente = docenteById(s.docenteId)?.nombre ?? '';
    const horaRango = `${s.hora} - ${toRangoFin(s.hora, s.duracion ?? 30)}`;
    let body = `
      <div class="field"><div class="label">Asignatura</div><div class="value">${asignaturaName(s.asignatura)}</div></div>
      <div class="field"><div class="label">Docente</div><div class="value">${docente}</div></div>
      <div class="field"><div class="label">Tema/Motivo</div><div class="value">${s.tema}</div></div>
      <div class="field"><div class="label">Descripción</div><div class="value">${s.descripcion || '—'}</div></div>

      <div class="divider"></div>

      <div class="kv-plain">
        <div class="item"><div class="label">Fecha</div><div class="value">${s.fecha}</div></div>
        <div class="item"><div class="label">Hora</div><div class="value">${s.hora}</div></div>
        <div class="item"><div class="label">Modalidad</div><div class="value">${s.modalidad}</div></div>
        <div class="item"><div class="label">Tipo de sesión</div><div class="value">${s.tipo}</div></div>
      </div>

      <div class="field" style="margin-top:10px"><div class="label">Estado</div><div class="value"><span class="badge ${s.estado}">${s.estado}</span></div></div>
    `;

    // Bloque de acciones estilo solicitado
    const muestraAccionesRepro = s.estado === 'reprogramada';
    const muestraAccionesGrupal = (s.tipo === 'grupal' && (s.estado === 'pendiente' || s.estado === 'reprogramada'));
    if (muestraAccionesRepro || muestraAccionesGrupal) {
      body += `
        <div class="divider" style="margin-top:12px;"></div>
        <div class="actions-row" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:8px;">
          ${muestraAccionesRepro ? `<button class="btn primary" id="btn-aceptar-repro">Aceptar tutoría</button>` : ''}
          ${muestraAccionesGrupal && !muestraAccionesRepro ? `<button class="btn primary" id="btn-aceptar-grupal">Aceptar tutoría</button>` : ''}
          <button class="btn danger" id="btn-rechazar-toggle">Rechazar tutoría</button>
          <button class="btn ghost" id="btn-reprogramar" disabled>Reprogramar solicitud</button>
        </div>
        <div id="rechazo-section" style="display:none; margin-top:12px;">
          <div style="display:grid; grid-template-columns: 220px 1fr; gap:12px; align-items:start;">
            <div style="font-weight:600; color:#555;">Motivo del rechazo</div>
            <textarea id="motivo-rechazo" rows="3" placeholder="Explique el motivo..." style="width:100%; resize:vertical;"></textarea>
          </div>
          <div style="margin-top:10px;">
            <button class="btn danger" id="btn-confirmar-rechazo">Confirmar rechazo</button>
          </div>
        </div>
      `;
    }

    openModal('Detalles de Tutoría', body, '');
    // listeners de acciones en body
    const box = document.getElementById('rechazo-section');
    const toggleRechazo = document.getElementById('btn-rechazar-toggle');
    if (toggleRechazo && box) toggleRechazo.addEventListener('click', ()=>{ box.style.display = box.style.display==='none' ? 'block' : 'none'; });
    const aceptarRepro = document.getElementById('btn-aceptar-repro');
    if (aceptarRepro) aceptarRepro.addEventListener('click', ()=>{
      s.estado = 'aceptada';
      s.historial.push({ ts: Date.now(), evento: 'reprogramación aceptada por estudiante' });
      saveLS(STORAGE_KEYS.solicitudes, solicitudes);
      showToast('Reprogramación aceptada', 'success');
      closeModal();
      renderTablaSolicitudes(); renderStats();
    });
    const aceptarGrupal = document.getElementById('btn-aceptar-grupal');
    if (aceptarGrupal) aceptarGrupal.addEventListener('click', ()=>{
      s.estado = 'aceptada';
      s.historial.push({ ts: Date.now(), evento: 'solicitud grupal aceptada por estudiante' });
      saveLS(STORAGE_KEYS.solicitudes, solicitudes);
      showToast('Solicitud aceptada', 'success');
      closeModal();
      renderTablaSolicitudes(); renderStats();
    });
    const confirmarRechazo = document.getElementById('btn-confirmar-rechazo');
    if (confirmarRechazo) confirmarRechazo.addEventListener('click', ()=>{
      const motivo = (document.getElementById('motivo-rechazo')?.value || '').trim();
      if (!motivo) { showToast('Por favor ingrese el motivo del rechazo', 'error'); return; }
      s.estado = 'pendiente';
      s.historial.push({ ts: Date.now(), evento: 'rechazo por estudiante', motivo });
      saveLS(STORAGE_KEYS.solicitudes, solicitudes);
      showToast('Rechazo registrado', 'success');
      closeModal();
      renderTablaSolicitudes(); renderStats();
    });
  }

  if (action === 'cancelar') {
    if (confirm('¿Cancelar la solicitud pendiente?')) {
      s.estado = 'rechazada';
      s.historial.push({ ts: Date.now(), evento: 'cancelada por estudiante' });
      saveLS(STORAGE_KEYS.solicitudes, solicitudes);
      showToast('Solicitud cancelada', 'success');
      renderTablaSolicitudes(); renderStats();
    }
  }

  if (action === 'aceptar-repro') {
    s.estado = 'aceptada';
    s.historial.push({ ts: Date.now(), evento: 'reprogramación aceptada por estudiante' });
    saveLS(STORAGE_KEYS.solicitudes, solicitudes);
    showToast('Reprogramación aceptada', 'success');
    renderTablaSolicitudes(); renderStats();
  }
  if (action === 'rechazar-repro') {
    s.estado = 'pendiente';
    s.historial.push({ ts: Date.now(), evento: 'reprogramación rechazada por estudiante' });
    saveLS(STORAGE_KEYS.solicitudes, solicitudes);
    showToast('Reprogramación rechazada', 'success');
    renderTablaSolicitudes(); renderStats();
  }
}

// ---------------------------- Init ----------------------------
function renderAll() {
  renderStats();
  renderTablaSolicitudes();
  renderHistorial();
}

function init() {
  seedIfNeeded();
  ensureDemoReprogramada();
  renderCombosSolicitud();
  cargarPreferencias();
  renderAll();

  // navegación
  $$('.menu-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.target)));
  // formulario de solicitud
  $('#form-solicitud').addEventListener('submit', handleSubmitSolicitud);
  $('#docente').addEventListener('change', () => { syncModalidadHelper(); refreshHorasDisponibles(); });
  $('#fecha').addEventListener('change', refreshHorasDisponibles);
  $('#modalidad').addEventListener('change', syncModalidadHelper);
  $('#archivo').addEventListener('change', (e)=>{
    const f = e.target.files[0];
    $('#archivo-info').textContent = f ? `${f.name} (${Math.round(f.size/1024)} KB)` : '';
  });

  // filtros de solicitudes (ahora están en Inicio) - si existen
  const filtroEstadoEl = document.getElementById('filtro-estado');
  if (filtroEstadoEl) filtroEstadoEl.addEventListener('change', renderTablaSolicitudes);
  const buscarSolicitudEl = document.getElementById('buscar-solicitud');
  if (buscarSolicitudEl) buscarSolicitudEl.addEventListener('input', renderTablaSolicitudes);
  $('#tabla-solicitudes').addEventListener('click', onTablaClick);

  // preferencias
  $('#form-preferencias').addEventListener('submit', guardarPreferencias);

  // modal close
  $('#modal-close').addEventListener('click', closeModal);

  // sin botones de exportación para estudiante

  // botón de Inicio: Solicitar nueva tutoría
  const btnNueva = document.getElementById('btn-ir-solicitud');
  if (btnNueva) btnNueva.addEventListener('click', ()=> navigate('nueva-solicitud'));

  // Historial: búsqueda y filtros avanzados
  const buscarHist = document.getElementById('buscar-historial');
  if (buscarHist) buscarHist.addEventListener('input', renderHistorial);
  const toggleF = document.getElementById('btn-toggle-filtros');
  if (toggleF) toggleF.addEventListener('click', ()=>{
    const panel = document.getElementById('filtros-avanzados');
    if (panel) panel.classList.toggle('hidden');
  });
  const aplicarF = document.getElementById('btn-aplicar-filtros');
  if (aplicarF) aplicarF.addEventListener('click', renderHistorial);
  const limpiarF = document.getElementById('btn-limpiar-filtros');
  if (limpiarF) limpiarF.addEventListener('click', ()=>{
    ['fh-asignatura','fh-tipo','fh-tema','fh-modalidad'].forEach(id=>{ const el=document.getElementById(id); if (el) el.value=''; });
    const bh = document.getElementById('buscar-historial'); if (bh) bh.value = '';
    const vh = document.getElementById('vista-historial'); if (vh) vh.value = 'realizadas';
    renderHistorial();
  });

  // cambio de vista del historial
  const vistaH = document.getElementById('vista-historial');
  if (vistaH) vistaH.addEventListener('change', renderHistorial);

  // por defecto, ajustar fecha del formulario a hoy
  const hoy = new Date();
  $('#fecha').valueAsDate = hoy;
}

document.addEventListener('DOMContentLoaded', init);
