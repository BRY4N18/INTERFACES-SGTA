// Navegación unificada de actores SGTA
(function(){
  const chips = document.querySelectorAll('.chip');
  const toast = document.getElementById('toast');
  const form = document.getElementById('formLogin');

  const routes = {
    estudiante: 'SGTA-Estudiantes/index.html',
    docente: 'SGTA-Docentes/docsente-ui/index.html',
    coordinacion: 'SGTA-Coordinacion/index.html'
  };

  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=> toast.classList.remove('show'), 2200);
  }

  chips.forEach(btn => {
    btn.addEventListener('click', () => {
      const actor = btn.dataset.actor;
      const url = routes[actor];
      if(!url){
        showToast('Módulo no disponible');
        return;
      }
      showToast('Abriendo módulo de ' + actor + '…');
      setTimeout(()=> window.location.href = url, 650);
    });
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const usuario = (document.getElementById('usuario')||{}).value?.trim();
    const contrasena = (document.getElementById('contrasena')||{}).value;
    if(!usuario || !contrasena){
      showToast('Ingresa usuario y contraseña');
      return;
    }
    showToast('Inicio de sesión simulado');
  });
})();