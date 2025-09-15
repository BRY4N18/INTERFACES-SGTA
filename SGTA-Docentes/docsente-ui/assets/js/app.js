(function(){
  const views = document.querySelectorAll('.view');
  const navLinks = document.querySelectorAll('.nav-link');
  const bc = document.getElementById('bc');
  const toast = document.getElementById('toast');

  function show(viewId){
    views.forEach(v=>v.classList.remove('visible'));
    document.getElementById('view-'+viewId).classList.add('visible');
    navLinks.forEach(b=>b.classList.toggle('active', b.dataset.view===viewId));
    bc.textContent = document.querySelector(`[data-view="${viewId}"]`).textContent;
  }

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 1800);
  }

  document.body.addEventListener('click', (e)=>{
    const jump = e.target.closest('[data-view-jump]');
    if(jump){ show(jump.dataset.viewJump); }

    const nav = e.target.closest('.nav-link');
    if(nav){ show(nav.dataset.view); }

    const open = e.target.closest('[data-open]');
    if(open){
      const m = document.getElementById(open.dataset.open);
      if(m){
        // Si es el modal de detalle, poblar datos
        if(m.id === 'modal-detalle-solicitud'){
          const set = (id,val)=>{ const el=document.getElementById(id); if(el){ el.textContent = val || '—'; } };
          set('det-estudiante', open.dataset.estudiante);
          set('det-asignatura', open.dataset.asignatura);
          set('det-tema', open.dataset.tema);
          set('det-descripcion', open.dataset.descripcion);
          set('det-fecha', open.dataset.fecha);
          set('det-hora', open.dataset.hora);
          set('det-modalidad', open.dataset.modalidad);
          set('det-tipo', open.dataset.tipo);
          // Mostrar/ocultar áreas iniciales
          const areaRech = document.getElementById('area-rechazo');
          const areaRep = document.getElementById('area-reprogramar');
          if(areaRech) areaRech.style.display='none';
          if(areaRep) areaRep.style.display='none';
          // Si viene de Inicio, no se muestra aceptar (ya aceptada)
          const btnAceptar = document.getElementById('btn-det-aceptar');
          if(btnAceptar){ btnAceptar.style.display = open.dataset.context==='inicio' ? 'none' : 'inline-flex'; }
        }
        m.setAttribute('aria-hidden','false');
      }
    }

    const close = e.target.closest('[data-close]');
    if(close){
      const mod = close.closest('.modal');
      if(mod){ mod.setAttribute('aria-hidden','true'); showToast('Acción realizada'); }
    }
  });

  // Cerrar modal con fondo
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e)=>{ if(e.target===m){ m.setAttribute('aria-hidden','true'); } });
  });

  // Simulación error SGA
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('#btn-sga-error');
    if(btn){
      const field = document.getElementById('sga-status');
      if(field){
        const errored = field.classList.toggle('error');
        if(errored){
          field.value = 'Error de integración SGA';
          field.classList.remove('ok');
        } else {
          field.value = 'Disponible';
          field.classList.add('ok');
        }
      }
    }
  });

  // Acciones en detalle de solicitud
  document.addEventListener('click', (e)=>{
    const btnAceptar = e.target.closest('#btn-det-aceptar');
    const btnRechazar = e.target.closest('#btn-det-rechazar');
    const btnReprogramar = e.target.closest('#btn-det-reprogramar');
    const confirmarRechazo = e.target.closest('#confirmar-rechazo');
    const confirmarReprogramar = e.target.closest('#confirmar-reprogramar');

    if(btnAceptar){
      showToast('Tutoría aceptada (simulado)');
      document.getElementById('modal-detalle-solicitud').setAttribute('aria-hidden','true');
    }
    if(btnRechazar){
      document.getElementById('area-rechazo').style.display = 'block';
      document.getElementById('area-reprogramar').style.display = 'none';
    }
    if(btnReprogramar){
      document.getElementById('area-reprogramar').style.display = 'block';
      document.getElementById('area-rechazo').style.display = 'none';
    }
    if(confirmarRechazo){
      const motivo = (document.getElementById('txt-motivo-rechazo')||{}).value||'';
  showToast(motivo.trim()? 'Cancelación enviada (simulado)':'Escriba el motivo de la cancelación');
      if(motivo.trim()){
        document.getElementById('modal-detalle-solicitud').setAttribute('aria-hidden','true');
        document.getElementById('area-rechazo').style.display = 'none';
        document.getElementById('txt-motivo-rechazo').value='';
      }
    }
    if(confirmarReprogramar){
      const f = (document.getElementById('rep-fecha')||{}).value||'';
      const h = (document.getElementById('rep-hora')||{}).value||'';
  showToast((f&&h)? 'Reprogramación enviada (simulado)':'Ingrese nueva fecha y hora');
      if(f&&h){
        document.getElementById('modal-detalle-solicitud').setAttribute('aria-hidden','true');
        document.getElementById('area-reprogramar').style.display = 'none';
        document.getElementById('rep-fecha').value='';
        document.getElementById('rep-hora').value='';
      }
    }
  });

  // Reportes: generación demo basada en filtros
  document.addEventListener('click', (e)=>{
    const gen = e.target.closest('#btn-generar-reporte');
    if(!gen) return;
    const asig = (document.getElementById('report-asignatura')||{}).value||'todas';
    const grupo = (document.getElementById('report-grupo')||{}).value||'todos';
    const tema = (document.getElementById('report-tema')||{}).value||'todas';

    // Dataset demo (podría leerse de otras secciones en el futuro)
    const data = [
      {fecha:'10/09/2025', asignatura:'POO', tema:'Herencia', tipo:'Individual', modalidad:'Virtual', grupo:'Grupo 1', asistentes:1, duracion:60},
      {fecha:'08/09/2025', asignatura:'BD II', tema:'Normalización', tipo:'Grupal', modalidad:'Presencial', grupo:'Grupo 3', asistentes:5, duracion:45},
      {fecha:'12/09/2025', asignatura:'POO', tema:'Interfaces', tipo:'Individual', modalidad:'Virtual', grupo:'Grupo 1', asistentes:1, duracion:50}
    ];

    const fil = data.filter(r =>
      (asig==='todas' || r.asignatura===asig) &&
      (grupo==='todos' || r.grupo===grupo) &&
      (tema==='todas' || r.tema===tema)
    );

    const tbody = document.querySelector('#report-table tbody');
    const hint = document.getElementById('report-hint');
    if(!tbody) return;
    tbody.innerHTML = '';
    if(hint) hint.textContent = fil.length? `Mostrando ${fil.length} registro(s)` : 'Sin resultados para los filtros elegidos';

    fil.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.fecha}</td><td>${r.asignatura}</td><td>${r.tema}</td><td>${r.tipo}</td><td>${r.modalidad}</td><td>${r.grupo}</td><td>${r.asistentes}</td><td>${r.duracion}</td>`;
      tbody.appendChild(tr);
    });
  });

  // Reportes: exportación simulada
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-export]');
    if(!btn) return;
    const type = btn.dataset.export;
    showToast(type === 'pdf' ? 'Exportando a PDF (simulado)' : 'Exportando a Excel (simulado)');
  });

  // Solicitudes: filtros múltiples (toggle + aplicar) con selección única
  document.addEventListener('click', (e)=>{
    const toggle = e.target.closest('#sol-filters-toggle');
    const apply = e.target.closest('#sol-apply-filters');
    const clear = e.target.closest('#sol-clear-filters');
    const panel = document.getElementById('sol-filters-panel');
    if(toggle && panel){ panel.style.display = panel.style.display === 'none' || panel.style.display === '' ? 'block' : 'none'; }
    if(clear){
      const as = document.getElementById('sol-f-asig'); if(as) as.value='Todos';
      const tm = document.getElementById('sol-f-tema'); if(tm) tm.value='Todos';
      const md = document.getElementById('sol-f-mod'); if(md) md.value='Todos';
      const tp = document.getElementById('sol-f-tipo'); if(tp) tp.value='Todos';
      const es = document.getElementById('sol-f-estado'); if(es) es.value='Todos';
    }
    if(apply){
      // Recoger criterios
      const txt = (document.getElementById('sol-search')||{}).value?.toLowerCase()||'';
      const asigSel = (document.getElementById('sol-f-asig')||{}).value||'Cualquiera';
      const temaSel = (document.getElementById('sol-f-tema')||{}).value||'Cualquiera';
      const modSel = (document.getElementById('sol-f-mod')||{}).value||'Cualquiera';
      const tipoSel = (document.getElementById('sol-f-tipo')||{}).value||'Cualquiera';
      const estSel = (document.getElementById('sol-f-estado')||{}).value||'Cualquiera';

      const rows = document.querySelectorAll('#tabla-solicitudes tbody tr');
      let visibles = 0;
      rows.forEach(tr =>{
        const tds = tr.querySelectorAll('td');
        const fecha = tds[0]?.textContent?.toLowerCase()||'';
        const asig = tds[1]?.textContent||'';
        const tema = tds[2]?.textContent?.toLowerCase()||'';
        const mod = tds[3]?.textContent||'';
        const tipo = tds[4]?.textContent||'';
        const estado = (tds[5]?.textContent||'').replace(/\s+/g,' ').trim();

        // Búsqueda libre (en asignatura/tema/fecha)
        const matchTxt = !txt || asig.toLowerCase().includes(txt) || tema.includes(txt) || fecha.includes(txt);
  // Tema exacto (o cualquiera)
  const matchTema = (temaSel==='Cualquiera') || tema.includes(temaSel.toLowerCase());
  // Selección única (Cualquiera no filtra)
  const matchAsig = (asigSel==='Cualquiera') || (asigSel === tds[1]?.textContent);
  const matchMod = (modSel==='Cualquiera') || (modSel === tds[3]?.textContent);
  const matchTipo = (tipoSel==='Cualquiera') || (tipoSel === tds[4]?.textContent);
  const matchEst = (estSel==='Cualquiera') || estado.includes(estSel);

        const ok = matchTxt && matchTema && matchAsig && matchMod && matchTipo && matchEst;
        tr.style.display = ok ? '' : 'none';
        if(ok) visibles++;
      });

      showToast(`Filtros aplicados (${visibles} resultado${visibles===1?'':'s'})`);
      if(panel) panel.style.display = 'none';
    }
  });
})();
