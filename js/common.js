// ============================================
// FUNCIONES COMUNES PARA TODA LA APLICACIÓN
// ============================================

// Obtener progreso actual
function getProgreso() {
    const progreso = localStorage.getItem('streamProgress');
    return progreso ? JSON.parse(progreso) : null;
}

// Guardar progreso
function saveProgreso(progreso) {
    localStorage.setItem('streamProgress', JSON.stringify(progreso));
}

// Actualizar última página visitada
function actualizarUltimaPagina(pagina) {
    const progreso = getProgreso();
    if (progreso) {
        progreso.ultimaPagina = pagina;
        saveProgreso(progreso);
    }
}

// ============================================
// SISTEMA DE GAMIFICACIÓN
// ============================================

const BADGES = {
    PRIMERA_SANGRE: { id: 'primera_sangre', nombre: '🎯 Primera Sangre', descripcion: 'Completar primera actividad' },
    VELOCISTA: { id: 'velocista', nombre: '⚡ Velocista', descripcion: 'Completar actividad en primer intento' },
    PENSADOR_FASE1: { id: 'pensador_fase1', nombre: '🧠 Pensador Fase 1', descripcion: 'Completar todas las actividades de Fase 1' },
    PENSADOR_FASE2: { id: 'pensador_fase2', nombre: '🧠 Pensador Fase 2', descripcion: 'Completar todas las actividades de Fase 2' },
    PENSADOR_FASE3: { id: 'pensador_fase3', nombre: '🧠 Pensador Fase 3', descripcion: 'Completar todas las actividades de Fase 3' },
    MAESTRO_STREAMS: { id: 'maestro_streams', nombre: '🏆 Maestro de Streams', descripcion: 'Completar todas las fases obligatorias' },
    EXPERTO_AVANZADO: { id: 'experto_avanzado', nombre: '💎 Experto Avanzado', descripcion: 'Completar fase avanzada' },
    RACHA_PERFECTA: { id: 'racha_perfecta', nombre: '🔥 Racha Perfecta', descripcion: '3 actividades seguidas en primer intento' },
    GRADUADO: { id: 'graduado', nombre: '🎓 Graduado', descripcion: 'Completar todo incluyendo avanzado' },
    RAPIDO: { id: 'rapido', nombre: '⏱️ Rápido', descripcion: 'Completar actividad en menos de 2 minutos' }
};

const ACTIVIDADES_POR_FASE = {
    fase1: ['actividad1-1', 'actividad1-2', 'actividad1-3', 'actividad1-4'],
    fase2: ['actividad2-1', 'actividad2-2', 'actividad2-3'],
    fase3: ['actividad3-1', 'actividad3-2'],
    avanzada: []
};

function calcularPuntos(intentos, tiempoSegundos) {
    let puntos = 0;

    if (intentos === 1) puntos = 100;
    else if (intentos === 2) puntos = 75;
    else if (intentos === 3) puntos = 50;
    else puntos = 25;

    if (tiempoSegundos < 120) {
        puntos += 25;
    }

    return puntos;
}

function otorgarBadge(badgeId) {
    const progreso = getProgreso();
    if (!progreso) return;

    if (!progreso.badges) {
        progreso.badges = [];
    }

    // Solo otorgar si no lo tiene ya
    if (!progreso.badges.includes(badgeId)) {
        progreso.badges.push(badgeId);
        saveProgreso(progreso);
        actualizarDisplayBadges();
        mostrarNotificacionBadge(badgeId);
        return true; // Badge otorgado
    }

    return false; // Ya tenía el badge
}

function verificarBadges(actividadId, intentos) {
    const progreso = getProgreso();
    if (!progreso) return;

    if (progreso.actividadesCompletadas.length === 1) {
        otorgarBadge(BADGES.PRIMERA_SANGRE.id);
    }

    if (intentos === 1) {
        otorgarBadge(BADGES.VELOCISTA.id);
        verificarRachaPerfecta();
    }

    verificarFaseCompletada();
    verificarMaestroStreams();
    verificarGraduado();
}

function verificarRachaPerfecta() {
    const progreso = getProgreso();
    if (!progreso) return;

    const ultimasTres = progreso.actividadesCompletadas.slice(-3);
    if (ultimasTres.length === 3 && ultimasTres.every(a => a.intentos === 1)) {
        otorgarBadge(BADGES.RACHA_PERFECTA.id);
    }
}

function verificarFaseCompletada() {
    const progreso = getProgreso();
    if (!progreso) return;

    const completadas = progreso.actividadesCompletadas.map(a => a.id);

    if (ACTIVIDADES_POR_FASE.fase1.every(id => completadas.includes(id))) {
        otorgarBadge(BADGES.PENSADOR_FASE1.id);
    }
    if (ACTIVIDADES_POR_FASE.fase2.every(id => completadas.includes(id))) {
        otorgarBadge(BADGES.PENSADOR_FASE2.id);
    }
    if (ACTIVIDADES_POR_FASE.fase3.every(id => completadas.includes(id))) {
        otorgarBadge(BADGES.PENSADOR_FASE3.id);
    }
    if (ACTIVIDADES_POR_FASE.avanzada.every(id => completadas.includes(id))) {
        otorgarBadge(BADGES.EXPERTO_AVANZADO.id);
    }
}

function verificarMaestroStreams() {
    const progreso = getProgreso();
    if (!progreso) return;

    const completadas = progreso.actividadesCompletadas.map(a => a.id);
    const todasObligatorias = [
        ...ACTIVIDADES_POR_FASE.fase1,
        ...ACTIVIDADES_POR_FASE.fase2,
        ...ACTIVIDADES_POR_FASE.fase3
    ];

    if (todasObligatorias.every(id => completadas.includes(id))) {
        otorgarBadge(BADGES.MAESTRO_STREAMS.id);
    }
}

function verificarGraduado() {
    const progreso = getProgreso();
    if (!progreso) return;

    const completadas = progreso.actividadesCompletadas.map(a => a.id);
    const todas = [
        ...ACTIVIDADES_POR_FASE.fase1,
        ...ACTIVIDADES_POR_FASE.fase2,
        ...ACTIVIDADES_POR_FASE.fase3,
        ...ACTIVIDADES_POR_FASE.avanzada
    ];

    if (todas.every(id => completadas.includes(id))) {
        otorgarBadge(BADGES.GRADUADO.id);
    }
}

function mostrarNotificacionBadge(badgeId) {
    console.log('=== INICIO mostrarNotificacionBadge ===');
    console.log('badgeId recibido:', badgeId);

    const badge = Object.values(BADGES).find(b => b.id === badgeId);
    console.log('Badge encontrado:', badge);

    if (!badge) {
        console.error('Badge no encontrado:', badgeId);
        return;
    }

    // Scroll al top de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Crear overlay con todo inline
    const overlay = document.createElement('div');
    overlay.id = 'badge-modal-overlay-' + Date.now();
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.85) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        padding: 20px !important;
    `;

    // Crear modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white !important;
        border-radius: 20px !important;
        padding: 40px !important;
        max-width: 500px !important;
        width: 100% !important;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4) !important;
        text-align: center !important;
        transform: scale(0.7) !important;
        transition: transform 0.3s ease !important;
    `;

    modal.innerHTML = `
        <div style="font-size: 80px; margin-bottom: 20px; animation: badgeBounce 0.6s ease-in-out;">
            ${badge.nombre.split(' ')[0]}
        </div>
        <div style="font-size: 16px; color: #999; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; font-weight: 600;">
            ¡Nuevo Logro Desbloqueado!
        </div>
        <div style="font-size: 32px; font-weight: bold; color: #667eea; margin-bottom: 15px;">
            ${badge.nombre}
        </div>
        <div style="font-size: 18px; color: #666; margin-bottom: 30px; line-height: 1.5;">
            ${badge.descripcion}
        </div>
        <button onclick="cerrarModalBadge('${overlay.id}')" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 15px 40px; font-size: 18px; font-weight: bold; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Cerrar
        </button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    console.log('Modal añadido al body con ID:', overlay.id);
    console.log('Elemento en DOM:', document.getElementById(overlay.id));

    // Animar entrada del modal
    setTimeout(() => {
        modal.style.transform = 'scale(1)';
        console.log('Animación aplicada');
    }, 50);
}

function cerrarModalBadge(overlayId) {
    console.log('Cerrando modal:', overlayId);
    const overlay = overlayId ? document.getElementById(overlayId) : document.querySelector('[id^="badge-modal-overlay-"]');
    if (overlay) {
        const modal = overlay.querySelector('div');
        if (modal) {
            modal.style.transform = 'scale(0.7)';
        }
        setTimeout(() => {
            overlay.remove();
            console.log('Modal eliminado');
        }, 300);
    }
}

function getPuntosTotales() {
    const progreso = getProgreso();
    if (!progreso) return 0;
    return progreso.puntos || 0;
}

function agregarPuntos(puntos) {
    const progreso = getProgreso();
    if (!progreso) return;

    if (!progreso.puntos) {
        progreso.puntos = 0;
    }

    progreso.puntos += puntos;
    saveProgreso(progreso);

    actualizarDisplayPuntos();
}

function actualizarDisplayPuntos() {
    const puntosElement = document.getElementById('puntos-totales');
    if (puntosElement) {
        puntosElement.textContent = getPuntosTotales();
    }
}

function actualizarDisplayActividades() {
    const progreso = getProgreso();
    if (!progreso) return;

    const actividadesElement = document.getElementById('num-actividades');
    if (actividadesElement) {
        actividadesElement.textContent = progreso.actividadesCompletadas.length;
    }
}

function actualizarDisplayBadges() {
    const progreso = getProgreso();
    if (!progreso) return;

    const badgesElement = document.getElementById('num-badges');
    if (badgesElement) {
        const numBadges = progreso.badges ? progreso.badges.length : 0;
        badgesElement.textContent = numBadges;
    }
}

// ============================================
// FUNCIONES DE PROGRESO
// ============================================

// Marcar actividad como completada
function marcarActividadCompletada(actividadId, intentos, errores = []) {
    let progreso = getProgreso();
    if (!progreso) return;

    const yaCompletada = progreso.actividadesCompletadas.find(a => a.id === actividadId);
    if (yaCompletada) return;

    const tiempoInicio = progreso.actividadActualInicio || Date.now();
    const tiempoSegundos = Math.floor((Date.now() - tiempoInicio) / 1000);

    const puntos = calcularPuntos(intentos, tiempoSegundos);

    // Añadir actividad completada
    progreso.actividadesCompletadas.push({
        id: actividadId,
        timestamp: Date.now(),
        intentos: intentos,
        errores: errores,
        tiempoSegundos: tiempoSegundos,
        puntos: puntos
    });

    // Limpiar el inicio de actividad
    delete progreso.actividadActualInicio;

    // IMPORTANTE: Guardar primero la actividad completada
    saveProgreso(progreso);

    // Ahora agregar puntos y badges (que también guardan el progreso)
    agregarPuntos(puntos);

    if (tiempoSegundos < 120) {
        otorgarBadge(BADGES.RAPIDO.id);
    }

    verificarBadges(actividadId, intentos);

    // Actualizar displays
    actualizarDisplayActividades();
}

function iniciarActividad() {
    const progreso = getProgreso();
    if (!progreso) return;

    progreso.actividadActualInicio = Date.now();
    saveProgreso(progreso);
}

// Registrar intento de actividad
function registrarIntento(actividadId) {
    const progreso = getProgreso();
    if (!progreso) return;

    if (!progreso.intentosPorActividad[actividadId]) {
        progreso.intentosPorActividad[actividadId] = 0;
    }
    progreso.intentosPorActividad[actividadId]++;

    saveProgreso(progreso);
    return progreso.intentosPorActividad[actividadId];
}

// Obtener número de intentos de una actividad
function getIntentos(actividadId) {
    const progreso = getProgreso();
    if (!progreso) return 0;
    return progreso.intentosPorActividad[actividadId] || 0;
}

// Formatear tiempo transcurrido
function formatearTiempo(milisegundos) {
    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

// Variable global para el intervalo del cronómetro
let intervaloCronometro = null;

// Actualizar cronómetro en el header
function actualizarCronometro() {
    const progreso = getProgreso();
    if (!progreso || !progreso.startTime) return;

    const tiempoElement = document.getElementById('tiempo-actual');
    if (!tiempoElement) return;

    const tiempoTranscurrido = Date.now() - progreso.startTime;
    tiempoElement.textContent = formatearTiempo(tiempoTranscurrido);
}

// Iniciar actualización del cronómetro
function iniciarCronometro() {
    // Detener cronómetro anterior si existe
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
    }

    actualizarCronometro();
    intervaloCronometro = setInterval(actualizarCronometro, 1000);
}

// Detener cronómetro
function detenerCronometro() {
    if (intervaloCronometro) {
        clearInterval(intervaloCronometro);
        intervaloCronometro = null;
    }
}

// Crear header común
function crearHeader() {
    const progreso = getProgreso();
    if (!progreso) {
        window.location.href = 'index.html';
        return;
    }

    const header = document.createElement('div');
    header.className = 'header';

    const equipoClass = `equipo-${progreso.equipo}`;
    const equipoEmoji = {
        'A': '🔴',
        'B': '🔵',
        'C': '🟢',
        'D': '🟡'
    }[progreso.equipo] || '';

    const puntos = progreso.puntos || 0;
    const numBadges = progreso.badges ? progreso.badges.length : 0;

    header.innerHTML = `
        <div class="equipo-info ${equipoClass}">
            ${equipoEmoji} Equipo ${progreso.equipo}
        </div>
        <div class="tiempo-info">
            ⏱️ <span id="tiempo-actual">00:00</span>
        </div>
        <div class="progreso-info">
            📊 Actividades: <span id="num-actividades">${progreso.actividadesCompletadas.length}</span>
        </div>
        <div class="puntos-info">
            ⭐ <span id="puntos-totales">${puntos}</span> pts
        </div>
        <div class="badges-info" onclick="mostrarBadges()">
            🏆 <span id="num-badges">${numBadges}</span> logros
        </div>
    `;

    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
        mainContainer.insertBefore(header, mainContainer.firstChild);
    }

    crearBarraProgreso();
iniciarCronometro();
}

function crearBarraProgreso() {
const progreso = getProgreso();
if (!progreso) return;

const paginaActual = progreso.ultimaPagina || 'teoria1-1.html';

const fases = [
{
nombre: 'Fase 1: Fundamentos',
paginas: ['teoria1-1.html', 'teoria1-2.html', 'teoria1-3.html',
'actividad1-1.html', 'actividad1-2.html', 'actividad1-3.html', 'actividad1-4.html']
},
{
nombre: 'Fase 2: Op. Intermedias',
paginas: ['teoria2-1.html', 'actividad2-1.html', 'teoria2-2.html', 'actividad2-2.html',
'teoria2-3.html', 'teoria2-4.html', 'actividad2-3.html', 'actividad2-4.html',
'actividad2-5.html', 'actividad2-6.html', 'actividad2-7.html']
},
{
nombre: 'Fase 3: Op. Terminales',
paginas: ['teoria3-1.html', 'teoria3-2.html', 'actividad3-1.html', 'teoria3-3.html',
'teoria3-4.html', 'actividad3-2.html', 'teoria3-5.html', 'teoria3-6.html',
'actividad3-3.html', 'actividad3-4.html', 'actividad3-5.html', 'actividad3-6.html']
},
{
nombre: 'Resumen',
paginas: ['resumen.html']
},
{
nombre: 'Avanzado (Opcional)',
paginas: ['teoria-avanzada-1.html', 'teoria-avanzada-2.html', 'teoria-avanzada-3.html',
'teoria-avanzada-4.html', 'actividad-avanzada-1.html', 'actividad-avanzada-2.html',
'actividad-avanzada-3.html']
}
];

let faseActual = -1;
let totalPaginas = 0;
let paginasCompletadas = 0;

for (let i = 0; i < fases.length; i++) {
totalPaginas += fases[i].paginas.length;
const indexPagina = fases[i].paginas.indexOf(paginaActual);
if (indexPagina !== -1) {
faseActual = i;
paginasCompletadas += indexPagina;
break;
}
paginasCompletadas += fases[i].paginas.length;
}

const porcentaje = Math.round((paginasCompletadas / totalPaginas) * 100);

const barraProgreso = document.createElement('div');
barraProgreso.className = 'barra-progreso-container';
barraProgreso.innerHTML = `
<div class="barra-progreso-info">
<span class="fase-actual">${faseActual >= 0 ? fases[faseActual].nombre : 'Inicio'}</span>
<span class="porcentaje-progreso">${porcentaje}%</span>
</div>
<div class="barra-progreso">
<div class="barra-progreso-fill" style="width: ${porcentaje}%"></div>
</div>
<div class="fases-indicadores">
${fases.map((fase, index) => `
<div class="fase-indicador ${index < faseActual ? 'completada' : ''} ${index === faseActual ? 'actual' : ''}">
${index < faseActual ? '✓' : index + 1}
</div>
`).join('')}
</div>
`;

const mainContainer = document.querySelector('.main-container');
const header = document.querySelector('.header');
if (mainContainer && header) {
mainContainer.insertBefore(barraProgreso, header.nextSibling);
}
}

function mostrarBadges() {
    const progreso = getProgreso();
    if (!progreso) return;

    const badgesObtenidos = progreso.badges || [];
    const todosBadges = Object.values(BADGES);

    const modal = document.createElement('div');
    modal.className = 'modal-badges';
    modal.innerHTML = `
        <div class="modal-badges-content">
            <div class="modal-badges-header">
                <h2>🏆 Tus Logros</h2>
                <button class="modal-close" onclick="cerrarModalBadges()">✕</button>
            </div>
            <div class="modal-badges-body">
                ${todosBadges.map(badge => {
                    const obtenido = badgesObtenidos.includes(badge.id);
                    return `
                        <div class="badge-item ${obtenido ? 'obtenido' : 'bloqueado'}">
                            <div class="badge-icono">${badge.nombre.split(' ')[0]}</div>
                            <div class="badge-detalles">
                                <div class="badge-nombre-modal">${badge.nombre}</div>
                                <div class="badge-descripcion">${badge.descripcion}</div>
                            </div>
                            ${obtenido ? '<div class="badge-check">✓</div>' : '<div class="badge-lock">🔒</div>'}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

function cerrarModalBadges() {
    const modal = document.querySelector('.modal-badges');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => document.body.removeChild(modal), 300);
    }
}

// Verificar que hay un equipo seleccionado
function verificarEquipo() {
    const progreso = getProgreso();
    if (!progreso || !progreso.equipo) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Navegar a la siguiente página
function navegarSiguiente(paginaSiguiente) {
    actualizarUltimaPagina(paginaSiguiente);
    window.location.href = paginaSiguiente;
}

// Reiniciar todo el progreso
function reiniciarProgreso() {
    if (confirm('¿Estás seguro de que quieres reiniciar todo el progreso?')) {
        localStorage.removeItem('streamProgress');
        window.location.href = 'index.html';
    }
}

// ============================================
// FUNCIONES DE DRAG & DROP
// ============================================

let draggedElement = null;
let draggedFrom = null;
let touchClone = null;

// Configurar drag & drop para piezas de código
function configurarDragPiezas(contenedorSelector, slotsSelector) {
    const piezas = document.querySelectorAll(`${contenedorSelector} .pieza-codigo`);
    const slots = document.querySelectorAll(slotsSelector);

    piezas.forEach(pieza => {
        // Mouse/Pointer events
        pieza.addEventListener('dragstart', handleDragStart);
        pieza.addEventListener('dragend', handleDragEnd);

        // Touch events
        pieza.addEventListener('touchstart', handleTouchStart, { passive: false });
        pieza.addEventListener('touchmove', handleTouchMove, { passive: false });
        pieza.addEventListener('touchend', handleTouchEnd, { passive: false });
    });

    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragleave', handleDragLeave);
    });
}

// Configurar drag & drop genérico para cualquier selector de elementos y slots
// Parámetros:
// - elementosSelector: selector CSS para los elementos arrastrables
// - slotsSelector: selector CSS para las zonas de drop
// - options: objeto con opciones adicionales
//   - bancoId: ID del contenedor banco para devolver elementos (opcional)
//   - slotClass: clase adicional para identificar slots en touch (opcional)
//   - onDrop: callback que se ejecuta después del drop (opcional)
//   - validateDrop: función de validación (elemento, slot) => boolean (opcional)
//   - onDragStart: callback al iniciar drag (opcional)
//   - onDragEnd: callback al terminar drag (opcional)
function configurarDragGenerico(elementosSelector, slotsSelector, options = {}) {
    const elementos = document.querySelectorAll(elementosSelector);
    const slots = document.querySelectorAll(slotsSelector);

    const config = {
        bancoId: options.bancoId || null,
        slotClass: options.slotClass || null,
        onDrop: options.onDrop || null,
        validateDrop: options.validateDrop || null,
        onDragStart: options.onDragStart || null,
        onDragEnd: options.onDragEnd || null
    };

    elementos.forEach(elemento => {
        // Mouse/Pointer events
        elemento.addEventListener('dragstart', (e) => {
            handleDragStart.call(elemento, e);
            if (config.onDragStart) config.onDragStart(elemento, e);
        });
        elemento.addEventListener('dragend', (e) => {
            handleDragEnd.call(elemento, e);
            if (config.onDragEnd) config.onDragEnd(elemento, e);
        });

        // Touch events con configuración
        elemento.addEventListener('touchstart', (e) => handleTouchStartGenerico(e, config), { passive: false });
        elemento.addEventListener('touchmove', handleTouchMove, { passive: false });
        elemento.addEventListener('touchend', (e) => handleTouchEndGenerico(e, config), { passive: false });
    });

    slots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', (e) => handleDropGenerico(e, config));
        slot.addEventListener('dragleave', handleDragLeave);
    });
}

function handleTouchStartGenerico(e, config) {
    e.preventDefault();
    const touch = e.touches[0];
    draggedElement = e.currentTarget;
    draggedFrom = draggedElement.parentElement;

    // Ejecutar callback onDragStart si existe
    if (config.onDragStart) config.onDragStart(draggedElement, e);

    // Crear clon visual
    touchClone = draggedElement.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.opacity = '0.8';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.width = draggedElement.offsetWidth + 'px';
    document.body.appendChild(touchClone);

    touchClone.style.left = touch.clientX - draggedElement.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - 20 + 'px';

    draggedElement.classList.add('dragging');
}

function handleTouchEndGenerico(e, config) {
    e.preventDefault();
    if (!draggedElement) return;

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    // Buscar el slot más cercano usando la clase configurada o clases por defecto
    let slot = dropTarget;
    const slotClasses = config.slotClass ? [config.slotClass] : ['slot', 'contenedor-drop', 'slot-drop', 'sandbox-drop', 'filtro-slot', 'slot-construccion', 'slot-inline'];

    while (slot && !slotClasses.some(cls => slot.classList && slot.classList.contains(cls))) {
        slot = slot.parentElement;
    }

    if (slot) {
        // Validar el drop si hay función de validación
        if (config.validateDrop && !config.validateDrop(draggedElement, slot)) {
            // Si la validación falla, no hacer nada
            draggedElement.classList.remove('dragging');
            if (touchClone) {
                document.body.removeChild(touchClone);
            }
            draggedElement = null;
            draggedFrom = null;
            touchClone = null;
            return;
        }

        // Si hay un banco configurado y el slot ya tiene un elemento, devolverlo al banco
        if (config.bancoId) {
            const existente = slot.querySelector(draggedElement.tagName.toLowerCase() + '[draggable="true"]');
            if (existente && existente !== draggedElement) {
                const banco = document.getElementById(config.bancoId);
                if (banco) banco.appendChild(existente);
            }
        }

        slot.appendChild(draggedElement);
        slot.classList.add('filled');

        // Ejecutar callback si existe
        if (config.onDrop) {
            config.onDrop(draggedElement, slot);
        }
    }

    // Ejecutar callback onDragEnd si existe
    if (config.onDragEnd) config.onDragEnd(draggedElement, e);

    draggedElement.classList.remove('dragging');
    if (touchClone) {
        document.body.removeChild(touchClone);
    }
    draggedElement = null;
    draggedFrom = null;
    touchClone = null;
}

function handleDropGenerico(e, config) {
    e.preventDefault();
    e.currentTarget.classList.remove('over');

    if (draggedElement) {
        // Validar el drop si hay función de validación
        if (config.validateDrop && !config.validateDrop(draggedElement, e.currentTarget)) {
            // Si la validación falla, no hacer nada
            return;
        }

        // Si hay un banco configurado y el slot ya tiene un elemento, devolverlo al banco
        if (config.bancoId) {
            const existente = e.currentTarget.querySelector(draggedElement.tagName.toLowerCase() + '[draggable="true"]');
            if (existente && existente !== draggedElement) {
                const banco = document.getElementById(config.bancoId);
                if (banco) banco.appendChild(existente);
            }
        }

        e.currentTarget.appendChild(draggedElement);
        e.currentTarget.classList.add('filled');

        // Ejecutar callback si existe
        if (config.onDrop) {
            config.onDrop(draggedElement, e.currentTarget);
        }

        draggedElement = null;
        draggedFrom = null;
    }
}

function handleDragStart(e) {
    draggedElement = this;
    draggedFrom = this.parentElement;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('over');

    if (draggedElement) {
        this.appendChild(draggedElement);
        this.classList.add('filled');

        draggedElement = null;
        draggedFrom = null;
    }
}

// Touch support
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    draggedElement = this;
    draggedFrom = this.parentElement;
    
    // Crear clon visual
    touchClone = this.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '10000';
    touchClone.style.opacity = '0.8';
    touchClone.style.pointerEvents = 'none';
    touchClone.style.width = this.offsetWidth + 'px';
    document.body.appendChild(touchClone);
    
    touchClone.style.left = touch.clientX - this.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - 20 + 'px';
    
    this.classList.add('dragging');
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!touchClone) return;
    
    const touch = e.touches[0];
    touchClone.style.left = touch.clientX - draggedElement.offsetWidth / 2 + 'px';
    touchClone.style.top = touch.clientY - 20 + 'px';
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!draggedElement) return;
    
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Buscar el slot más cercano
    let slot = dropTarget;
    while (slot && !slot.classList.contains('slot') && !slot.classList.contains('contenedor-drop')) {
        slot = slot.parentElement;
    }
    
    if (slot && (slot.classList.contains('slot') || slot.classList.contains('contenedor-drop'))) {
        slot.appendChild(draggedElement);
        slot.classList.add('filled');
    }
    
    draggedElement.classList.remove('dragging');
    if (touchClone) {
        document.body.removeChild(touchClone);
    }
    draggedElement = null;
    touchClone = null;
    draggedFrom = null;
}

// ============================================
// FUNCIONES DE DRAG & DROP PARA LÍNEAS
// ============================================

let draggedLinea = null;
let draggedLineaClone = null;

function configurarDragLineas(contenedorSelector) {
    const lineas = document.querySelectorAll(`${contenedorSelector} .linea-codigo`);
    
    lineas.forEach(linea => {
        linea.addEventListener('dragstart', handleLineaDragStart);
        linea.addEventListener('dragover', handleLineaDragOver);
        linea.addEventListener('drop', handleLineaDrop);
        linea.addEventListener('dragend', handleLineaDragEnd);
        
        // Touch events
        linea.addEventListener('touchstart', handleLineaTouchStart, { passive: false });
        linea.addEventListener('touchmove', handleLineaTouchMove, { passive: false });
        linea.addEventListener('touchend', handleLineaTouchEnd, { passive: false });
    });
}

function handleLineaDragStart(e) {
    draggedLinea = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleLineaDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(this.parentElement, e.clientY);
    if (afterElement == null) {
        this.parentElement.appendChild(draggedLinea);
    } else {
        this.parentElement.insertBefore(draggedLinea, afterElement);
    }
}

function handleLineaDrop(e) {
    e.preventDefault();
}

function handleLineaDragEnd(e) {
    this.classList.remove('dragging');
    actualizarNumerosLinea(this.parentElement);
}

function handleLineaTouchStart(e) {
    e.preventDefault();
    draggedLinea = this;
    
    draggedLineaClone = this.cloneNode(true);
    draggedLineaClone.style.position = 'fixed';
    draggedLineaClone.style.zIndex = '10000';
    draggedLineaClone.style.opacity = '0.8';
    draggedLineaClone.style.pointerEvents = 'none';
    draggedLineaClone.style.width = this.offsetWidth + 'px';
    document.body.appendChild(draggedLineaClone);
    
    const touch = e.touches[0];
    draggedLineaClone.style.left = touch.clientX - this.offsetWidth / 2 + 'px';
    draggedLineaClone.style.top = touch.clientY - 20 + 'px';
    
    this.classList.add('dragging');
}

function handleLineaTouchMove(e) {
    e.preventDefault();
    if (!draggedLineaClone) return;
    
    const touch = e.touches[0];
    draggedLineaClone.style.left = touch.clientX - draggedLinea.offsetWidth / 2 + 'px';
    draggedLineaClone.style.top = touch.clientY - 20 + 'px';
}

function handleLineaTouchEnd(e) {
    e.preventDefault();
    if (!draggedLinea) return;
    
    const touch = e.changedTouches[0];
    const container = draggedLinea.parentElement;
    const afterElement = getDragAfterElement(container, touch.clientY);
    
    if (afterElement == null) {
        container.appendChild(draggedLinea);
    } else {
        container.insertBefore(draggedLinea, afterElement);
    }
    
    draggedLinea.classList.remove('dragging');
    if (draggedLineaClone) {
        document.body.removeChild(draggedLineaClone);
    }
    
    actualizarNumerosLinea(container);
    draggedLinea = null;
    draggedLineaClone = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.linea-codigo:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function actualizarNumerosLinea(container) {
    const lineas = container.querySelectorAll('.linea-codigo');
    lineas.forEach((linea, index) => {
        const numeroSpan = linea.querySelector('.linea-numero');
        if (numeroSpan) {
            numeroSpan.textContent = index + 1;
        }
        linea.dataset.posicion = index;
    });
}