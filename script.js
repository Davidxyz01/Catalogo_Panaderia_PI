/* Manejo de estados de búsqueda y temporizadores */
let temporizadorBusqueda;

function filtrarPanes() {
    const contenedorIcono = document.getElementById('search-icon-container');
    const inputBusqueda = document.getElementById('bread-search');
    const textoFiltro = inputBusqueda.value.toLowerCase().trim();
    const tarjetasProductos = document.querySelectorAll('.columna-tarjeta-producto');

    if (textoFiltro === "") {
        contenedorIcono.className = "icon-idle";
        tarjetasProductos.forEach(tarjeta => tarjeta.style.display = "block");
        return;
    }

    contenedorIcono.className = "icon-loading";
    clearTimeout(temporizadorBusqueda);

    /* Aplica el filtro con debounce para optimizar el rendimiento */
    temporizadorBusqueda = setTimeout(() => {
        tarjetasProductos.forEach(tarjeta => {
            const nombrePan = tarjeta.querySelector('h3').textContent.toLowerCase();
            tarjeta.style.display = nombrePan.includes(textoFiltro) ? "block" : "none";
        });
        contenedorIcono.className = "icon-idle";
    }, 1200); 
}

/* Control de visibilidad del menú en dispositivos móviles */
function controlarMenu() {
    document.getElementById("menuEnlaces").classList.toggle("mostrar");
}

/* Gestión de modales y superposición */
function abrirModal(id) {
    document.getElementById(id).style.display = "block";
    document.getElementById("fondoOscuro").style.display = "block";
}

function cerrarModal(id) {
    document.getElementById(id).style.display = "none";
    document.getElementById("fondoOscuro").style.display = "none";
}

function cerrarTodosModales() {
    document.querySelectorAll('.modal-producto').forEach(modal => modal.style.display = "none");
    document.getElementById("fondoOscuro").style.display = "none";
}

/* Control de visibilidad del botón de retorno al inicio */
window.onscroll = function() {
    const boton = document.getElementById("btnIrArriba");
    boton.style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) ? "block" : "none";
};

function subirAlInicio() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Rotación automática de imágenes del carrusel */
if (document.querySelector('.contenedor-carrusel')) {
    let totalFotos = 3;
    let contador = 1;
    
    setInterval(() => {
        const fotoActual = document.getElementById('foto-' + contador);
        if (fotoActual) fotoActual.classList.remove('activa');
        
        contador = (contador >= totalFotos) ? 1 : contador + 1;
        
        const siguienteFoto = document.getElementById('foto-' + contador);
        if (siguienteFoto) siguienteFoto.classList.add('activa');
    }, 3000);
}