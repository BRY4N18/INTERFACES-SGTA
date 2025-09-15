window.addEventListener('DOMContentLoaded', () => {
    // Mejora de nitidez global para todos los gráficos
    if (window.Chart) {
        Chart.defaults.devicePixelRatio = Math.min(2, window.devicePixelRatio || 1.5);
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false; // Usamos el alto definido por CSS
        Chart.defaults.font.family = "Inter, Arial, sans-serif";
        Chart.defaults.color = '#1f2937';
    }
    // Gráfico de barras: Tutorías por mes
    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
            datasets: [{
                label: 'Tutorías por Mes',
                data: [120, 150, 180, 160, 185, 210, 200, 175],
                backgroundColor: '#666666',
                borderRadius: 6
            }]
        },
        options: {
            plugins: {
                legend: { display: true, position: 'top', labels: { color: '#333333' } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#555555' }, grid: { color: '#e0e0e0' } },
                x: { ticks: { color: '#555555' }, grid: { display: false } }
            }
        }
    });

    // Gráfico de pastel: Modalidad
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Presencial', 'Virtual'],
            datasets: [{
                data: [85, 15],
                backgroundColor: ['#666666', '#bfbfbf'],
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: { color: '#333333', font: { size: 16 } }
                }
            },
            layout: { padding: 8 },
            animation: { duration: 0 }
        }
    });
});
// Navegación entre secciones (con menú basado en .sidebar-link)
const dashboardBtn = document.getElementById('dashboardBtn');
const reportesBtn = document.getElementById('reportesBtn');
const mainTitle = document.getElementById('mainTitle');

const dashboardSection = document.getElementById('dashboardSection');
const reportesSection = document.getElementById('reportesSection');

const sectionMap = {
    dashboardBtn: {section: dashboardSection, title: 'Inicio'},
    reportesBtn: {section: reportesSection, title: 'Reportes'}
};

function showSection(btnId) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    Object.keys(sectionMap).forEach(id => sectionMap[id].section.classList.remove('active'));
    sectionMap[btnId].section.classList.add('active');
    mainTitle.textContent = sectionMap[btnId].title;
}

dashboardBtn.addEventListener('click', () => showSection('dashboardBtn'));
reportesBtn.addEventListener('click', () => showSection('reportesBtn'));

const reportTableBody = document.getElementById('reportTableBody');


const reportesData = [
    {
        fecha: '15/09/2025',
        hora: '10:00',
        asignatura: 'Programación Orientada a Objetos',
        docente: 'Juan Pérez',
        temaMotivo: 'DEMO Reprogramada',
        modalidad: 'Virtual',
        tipoSesion: 'Individual',
        estado: 'Aceptada'
    },
    {
        fecha: '12/09/2025',
        hora: '08:30',
        asignatura: 'Física',
        docente: 'María López',
        temaMotivo: 'Cinemática',
        modalidad: 'Virtual',
        tipoSesion: 'Grupal',
        estado: 'Pendiente'
    },
    {
        fecha: '10/09/2025',
        hora: '14:00',
        asignatura: 'Matemáticas',
        docente: 'Juan Pérez',
        temaMotivo: 'Álgebra',
        modalidad: 'Presencial',
        tipoSesion: 'Grupal',
        estado: 'Rechazada'
    }
];



function renderReportesTable(data) {
    reportTableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.fecha}</td>
            <td>${row.hora}</td>
            <td>${row.asignatura}</td>
            <td>${row.docente}</td>
            <td>${row.temaMotivo}</td>
            <td>${row.modalidad}</td>
            <td>${row.tipoSesion}</td>
            <td>${row.estado}</td>
        `;
        reportTableBody.appendChild(tr);
    });
}


renderReportesTable(reportesData);


const filtrarBtn = document.getElementById('filtrarBtn');
filtrarBtn.onclick = function() {
    const docente = document.getElementById('docenteSelect').value;
    const asignatura = document.getElementById('asignaturaSelect').value;
    const temaMotivo = document.getElementById('temaMotivoSelect').value;
    const modalidad = document.getElementById('modalidadSelect').value;
    const tipoSesion = document.getElementById('tipoSesionSelect').value;
    const estado = document.getElementById('estadoSelect').value;
    // Filtrar por cada campo seleccionado
    const filtrados = reportesData.filter(r =>
        (docente === '' || r.docente === docente) &&
        (asignatura === '' || r.asignatura === asignatura) &&
        (temaMotivo === '' || r.temaMotivo === temaMotivo) &&
        (modalidad === '' || r.modalidad === modalidad) &&
        (tipoSesion === '' || r.tipoSesion === tipoSesion) &&
        (estado === '' || r.estado === estado)
    );
    renderReportesTable(filtrados);
};

const pdfBtn = document.getElementById('pdfBtn');
pdfBtn.onclick = function() {
    alert('Reporte exportado en PDF (simulado)');
};
const excelBtn = document.getElementById('excelBtn');
excelBtn.onclick = function() {
    alert('Reporte exportado en Excel (simulado)');
};

