
/* Manejo de estados de búsqueda y temporizadores */
/* Manejo de estados de búsqueda y temporizadores */
/* Manejo de estados de búsqueda y temporizadores */
/* Manejo de estados de búsqueda y temporizadores */
let temporizadorBusqueda;

function filtrarPanes() {
    const contenedorIcono = document.getElementById('search-icon-container');
    const inputBusqueda = document.getElementById('bread-search');
    
    if (!inputBusqueda) return; // Seguridad en caso de que no exista el input

    const textoFiltro = inputBusqueda.value.toLowerCase().trim();
    const tarjetasProductos = document.querySelectorAll('.columna-tarjeta-producto');

    // 1. LEER LA CATEGORÍA DIRECTAMENTE DESDE EL TÍTULO H2 DE LA PÁGINA
    const tituloElemento = document.querySelector('.titulo-seccion');
    let categoriaActiva = tituloElemento ? tituloElemento.textContent.trim().toLowerCase() : "";

    // Determinamos si estamos en el Index (Catálogo Completo) o en una categoría fija de categorias.html
    const titulosGlobales = ["todos los productos", "catálogo", "nuestros productos", "inicio", ""];
    const esCatalogoFiltrado = !titulosGlobales.includes(categoriaActiva);

    // 2. 🚨 CONTROL CUANDO EL BUSCADOR QUEDA VACÍO (Al borrar de más)
    if (textoFiltro === "") {
        // 🔧 FIX: Cancelamos cualquier búsqueda pendiente (setTimeout) de una letra
        // anterior. Sin esto, si borrabas rápido, el temporizador de la búsqueda
        // vieja (ej. "role") se ejecutaba 400ms después y volvía a ocultar
        // productos aunque el buscador ya estuviera vacío.
        clearTimeout(temporizadorBusqueda);

        if (contenedorIcono) contenedorIcono.className = "icon-idle";
        
        tarjetasProductos.forEach(tarjeta => {
            if (esCatalogoFiltrado) {
                const categoriaTarjeta = tarjeta.querySelector('.etiqueta-producto-tipo').textContent.trim().toLowerCase();
                
                // Si la tarjeta corresponde a la sección actual, la muestra; si no, la oculta
                if (categoriaTarjeta === categoriaActiva || categoriaTarjeta.includes(categoriaActiva)) {
                    tarjeta.style.display = "block";
                } else {
                    tarjeta.style.display = "none";
                }
            } else {
                // Si estás en index.html, muestra absolutamente TODOS los productos
                tarjeta.style.display = "block";
            }
        });
        return; // Importante: frena el flujo para que no se ejecute el delay del temporizador
    }

    // 3. PROCESO DE BÚSQUEDA ACTIVA (Cuando el usuario escribe)
    if (contenedorIcono) contenedorIcono.className = "icon-loading";
    clearTimeout(temporizadorBusqueda);

    temporizadorBusqueda = setTimeout(() => {
        tarjetasProductos.forEach(tarjeta => {
            const nombrePan = tarjeta.querySelector('h3').textContent.toLowerCase();
            const coincideTexto = nombrePan.includes(textoFiltro);

            if (esCatalogoFiltrado) {
                const categoriaTarjeta = tarjeta.querySelector('.etiqueta-producto-tipo').textContent.trim().toLowerCase();
                const coincideCategoria = (categoriaTarjeta === categoriaActiva || categoriaTarjeta.includes(categoriaActiva));
                
                // Filtra: debe coincidir el nombre Y pertenecer a la categoría de la página
                tarjeta.style.display = (coincideTexto && coincideCategoria) ? "block" : "none";
            } else {
                // En el index, solo importa que coincida el nombre
                tarjeta.style.display = coincideTexto ? "block" : "none";
            }
        });
        if (contenedorIcono) contenedorIcono.className = "icon-idle";
    }, 400); // Ajustado a 400ms para una búsqueda más rápida y fluida
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

// FUNCIÓN PARA CARGAR LOS PRODUCTOS CON TU ESTRUCTURA HTML EXACTA
/* FUNCIÓN PARA CARGAR LOS PRODUCTOS DESDE LA API EN EL CATÁLOGO PÚBLICO */

// =========================================================================
// PRODUCTOS DE MUESTRA (fallback local, no dependen del backend)
// Se muestran cuando la base de datos está apagada o aún no tiene
// productos guardados, para que el catálogo nunca se vea vacío.
// Usan imágenes locales de /assets, así que funcionan sin servidor.
// =========================================================================
const PRODUCTOS_DE_MUESTRA = [
    {
        nombre: "Bolillo",
        categoria: "Pan salado",
        precio: "5",
        ingredientes: "Harina, azúcar, mantequilla, leche y huevo.",
        estado: "Disponible",
        imagen: "assets/bolillo.jpg"
    },
    {
        nombre: "Concha de chocolate",
        categoria: "Pan dulce",
        precio: "8",
        ingredientes: "Harina, huevo, chocolate, azúcar, mantequilla.",
        estado: "Disponible",
        imagen: "assets/concha.jpg"
    },
    {
        nombre: "Galleta",
        categoria: "Galletas",
        precio: "8",
        ingredientes: "Harina, huevo, chocolate, azúcar, mantequilla.",
        estado: "Disponible",
        imagen: "assets/galleta.png"
    }
];

function cargarProductosCatalogo() {
    const contenedor = document.getElementById('contenedorTarjetasProductos');
    if (!contenedor) return;

    fetch('http://localhost:5000/api/productos')
        .then(respuesta => {
            if (!respuesta.ok) throw new Error('El servidor respondió con un error');
            return respuesta.json();
        })
        .then(productos => {
            // Si el backend está encendido pero la tabla aún no tiene productos,
            // igual mostramos el catálogo de muestra en vez de dejarlo vacío.
            const listaAMostrar = (productos && productos.length > 0) ? productos : PRODUCTOS_DE_MUESTRA;
            renderizarTarjetasProductos(listaAMostrar);
        })
        .catch(error => {
            // El backend está apagado / no se pudo conectar: mostramos el catálogo de muestra.
            console.warn('No se pudo conectar con el servidor, mostrando catálogo de muestra:', error);
            renderizarTarjetasProductos(PRODUCTOS_DE_MUESTRA);
        });
}

// Pinta las tarjetas de producto en el contenedor. Recibe un arreglo de
// productos, ya sea que vengan del backend o del catálogo de muestra local.
function renderizarTarjetasProductos(productos) {
    const contenedor = document.getElementById('contenedorTarjetasProductos');
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Limpiamos el contenedor antes de inyectar

    productos.forEach(prod => {
        const nombre = prod.nombre || prod.Nombre;
        const categoria = prod.categoria || prod.Categoria;
        const precio = prod.precio || prod.Precio;
        const ingredientes = prod.ingredientes || prod.Ingredientes || '';
        const imagen = prod.imagen || prod.Imagen || 'assets/default.jpg';
        // ... dentro del listado de productos
        const estado = prod.estado || prod.Estado || 'Disponible'; // Guardamos el estado actual
        const claseEstadoCard = (estado.toLowerCase() === 'disponible') ? 'estado-disponible' : 'estado-agotado';
        // === 🛠️ AQUÍ ESTÁ EL CAMBIO CLAVE ===
        // Si la ruta inicia con 'imagenes_productos/', significa que se subió dinámicamente al servidor,
        // por lo tanto, le concatenamos la URL del Backend (http://localhost:5000/).
        // Si no, lo dejamos igual (catálogo de muestra o imágenes locales en 'assets/').
        const srcFinal = imagen.startsWith('imagenes_productos/') ? `http://localhost:5000/${imagen}` : imagen;

        // Guardamos esta ruta final calculada dentro del objeto por si abren el modal de detalles
        prod.srcFinal = srcFinal;

        const columna = document.createElement('div');
        columna.className = 'columna-tarjeta-producto';
        columna.dataset.categoria = categoria;
        columna.dataset.precio = parseFloat(precio) || 0;
        columna.innerHTML = `
            <div class="tarjeta-producto-caja">
                <div class="bloque-superior-imagen">
                    <img src="${srcFinal}" alt="${nombre}" class="imagen-producto">
                </div>
                <div class="contenido-tarjeta">
                    <div class="bloque-superior-textos">
                        <div class="etiqueta-producto-tipo">${categoria}</div>
                        <h3>${nombre}</h3>
                    </div>
                    <div class="bloque-inferior-precio-boton">
                        <p class="precio-texto">$${precio}</p>
                        <p class="disponibilidad-texto ${claseEstadoCard}">${estado}</p>
                        <button class="boton-ver-mas" onclick="verDetallesProducto(${JSON.stringify(prod).replace(/"/g, '&quot;')})">Ver más</button>
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(columna);
    });
}

// FUNCIÓN PARA PASAR LOS DATOS AL MODAL DINÁMICO ÚNICO Y MOSTRARLO
// === CORRECCIÓN AQUÍ ===
function verDetallesProducto(producto) {
    // 1. Usamos el srcFinal que calculaste con la URL de tu backend, o en su defecto calculamos una ruta segura
    const imagenFinal = producto.srcFinal || 
                        ((producto.imagen || producto.Imagen || 'assets/default.jpg').startsWith('imagenes_productos/') 
                        ? `http://localhost:5000/${producto.imagen || producto.Imagen}` 
                        : (producto.imagen || producto.Imagen || 'assets/default.jpg'));

    // 2. Aseguramos tolerancia a mayúsculas/minúsculas de la base de datos
    const nombre = producto.nombre || producto.Nombre || 'Pan Artesanal';
    const ingredientes = producto.ingredientes || producto.Ingredientes || 'Delicioso pan artesanal preparado diariamente.';
    const precio = producto.precio || producto.Precio || '0.00';
    
    // === ¡AQUÍ ESTABA EL CAMBIO FALTASTA! Declaramos la variable estado ===
    const estado = producto.estado || producto.Estado || 'Disponible';

    // 3. Obtenemos el elemento del estado y lo formateamos
    const modalEstadoElemento = document.getElementById('modalEstado');
    modalEstadoElemento.textContent = estado;
    modalEstadoElemento.className = ""; // Limpiamos clases viejas

    // 4. Asignamos los estilos dinámicos de color verde/rojo
    if (estado.toLowerCase() === 'disponible') {
        modalEstadoElemento.classList.add('estado-disponible');
    } else {
        modalEstadoElemento.classList.add('estado-agotado');
    }

    // 5. Asignamos el resto de los valores corregidos al HTML del modal grande
    document.getElementById('modalImagen').src = imagenFinal;
    document.getElementById('modalImagen').alt = nombre;
    document.getElementById('modalNombre').textContent = nombre;
    document.getElementById('modalIngredientes').textContent = ingredientes;
    document.getElementById('modalPrecio').textContent = `$${precio}`;

    // Ejecuta tu función nativa para abrirlo visualmente
    abrirModal('modalProductoDinamico');
}

// Inicializa la carga cuando la página index.html esté lista
document.addEventListener('DOMContentLoaded', function() {
    // 1. Cargamos todos los productos desde la base de datos de manera normal
    cargarProductosCatalogo();

    // 2. Verificamos si venimos desde otra página con un filtro en la URL
    const parametros = new URLSearchParams(window.location.search);
    const filtroURL = parametros.get('filtro');
    const contenedorTarjetas = document.getElementById('contenedorTarjetasProductos');

    if (filtroURL) {
        // Si hay un filtro, primero ocultamos el contenedor agregando una transición suave en línea
        if (contenedorTarjetas) {
            contenedorTarjetas.style.opacity = "0";
            contenedorTarjetas.style.transition = "opacity 0.2s ease-in-out";
        }

        // Esperamos a que el fetch de la BD termine de inyectar las tarjetas
        setTimeout(() => {
            const enlacesSubmenu = document.querySelectorAll('.submenu-categorias a');
            let enlaceEncontrado = null;

            enlacesSubmenu.forEach(enlace => {
                const categoriaData = enlace.getAttribute('data-categoria');
                if (categoriaData && categoriaData.toLowerCase() === filtroURL.toLowerCase()) {
                    enlaceEncontrado = enlace;
                }
            });

            if (enlaceEncontrado) {
                const eventoSimulado = {
                    preventDefault: () => {},
                    currentTarget: enlaceEncontrado
                };
                filtrarPorCategoria(eventoSimulado);
            } else {
                // Si por alguna razón el filtro de la URL no coincide con ninguno, mostramos todo por seguridad
                if (contenedorTarjetas) contenedorTarjetas.style.opacity = "1";
            }
        }, 500);
    } else {
        // Si NO hay filtro en la URL, aseguramos que el catálogo completo se visualice de inmediato
        if (contenedorTarjetas) {
            contenedorTarjetas.style.opacity = "1";
        }
    }
});


