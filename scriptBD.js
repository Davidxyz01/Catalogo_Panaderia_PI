// URL base de la API
const URL_BASE = 'http://localhost:5000/api/productos';; // Aseguramos que apunte a tu endpoint de productos

// =========================================================
// PRODUCTOS POR DEFECTO (integrados desde ProyectoPanaderíaDV)
// Mismos nombres de campo que ya usa cargarProductosParaVisualizar()
// y abrirModalEditar(), para no tener que tocar esas funciones.
// =========================================================
const PRODUCTOS_POR_DEFECTO = [
    {
        Nombre: "Bolillo",
        Categoria: "Pan salado",
        Precio: "5",
        Ingredientes: "Harina, azúcar, mantequilla, leche y huevo.",
        Estado: "Disponible",
        Imagen: "assets/bolillo.jpg"
    },
    {
        Nombre: "Concha de chocolate",
        Categoria: "Pan dulce",
        Precio: "8",
        Ingredientes: "Harina, huevo, chocolate, azúcar, mantequilla.",
        Estado: "Disponible",
        Imagen: "assets/concha.jpg"
    },
    {
        Nombre: "Galleta",
        Categoria: "Galletas",
        Precio: "8",
        Ingredientes: "Harina, huevo, chocolate, azúcar, mantequilla.",
        Estado: "Disponible",
        Imagen: "assets/galleta.png"
    }
];

const BANDERA_SEED = "panaderiaProductosPorDefectoCargados";

// Siembra los productos por defecto UNA sola vez por navegador.
// Si ya se marcó la bandera, no se vuelve a ejecutar aunque el admin
// haya editado o eliminado esos productos después (evita duplicados
// y respeta los cambios previos del usuario).
async function sembrarProductosPorDefecto() {
    if (localStorage.getItem(BANDERA_SEED) === "true") {
        return actualizarTablasCatalogo();
    }

    try {
        const respuesta = await fetch(URL_BASE);
        if (!respuesta.ok) throw new Error("El servidor respondió con un error");
        const productosActuales = await respuesta.json();

        const nombresExistentes = productosActuales.map(p =>
            (p.nombre || p.Nombre || "").trim().toLowerCase()
        );

        const productosFaltantes = PRODUCTOS_POR_DEFECTO.filter(
            p => !nombresExistentes.includes(p.Nombre.trim().toLowerCase())
        );

        for (const producto of productosFaltantes) {
            const formData = new FormData();
            formData.append("Nombre", producto.Nombre);
            formData.append("Categoria", producto.Categoria);
            formData.append("Precio", producto.Precio);
            formData.append("Ingredientes", producto.Ingredientes);
            formData.append("Estado", producto.Estado);
            formData.append("Imagen", producto.Imagen); // ruta local, sin archivo subido

            await fetch(URL_BASE, { method: "POST", body: formData });
        }

        // Solo marcamos la siembra como hecha si SÍ logramos hablar con el backend.
        // Así, si el backend estaba apagado, se reintentará la próxima vez que
        // se abra el panel (cuando ya esté disponible), en vez de darse por
        // sembrado sin haberlo logrado.
        localStorage.setItem(BANDERA_SEED, "true");
    } catch (error) {
        console.warn("No se pudo sembrar productos por defecto (¿backend apagado?):", error);
    } finally {
        actualizarTablasCatalogo();
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // === LÓGICA DE VISTA PREVIA DE IMÁGENES ===
    const inputImagen = document.getElementById('inputImagen');
    const vistaPreviaCaja = document.getElementById('vistaPreviaCaja');
    const imagenPreviaElemento = document.getElementById('imagenPreviaElemento');

    if (inputImagen) {
        inputImagen.addEventListener('change', function() {
            const archivo = this.files[0];
            if (archivo) {
                const lector = new FileReader();
                lector.addEventListener('load', function() {
                    if (imagenPreviaElemento) imagenPreviaElemento.setAttribute('src', this.result);
                    if (vistaPreviaCaja) vistaPreviaCaja.style.display = 'block';
                });
                lector.readAsDataURL(archivo);
            } else {
                if (vistaPreviaCaja) vistaPreviaCaja.style.display = 'none';
            }
        });
    }

    // Vinculación del formulario (Mantenemos tu misma estructura)
    const formProducto = document.getElementById('formProducto');
    if (formProducto) {
        formProducto.addEventListener('submit', function(evento) {
            evento.preventDefault();

            const nombreInput = document.getElementById('nombreProducto').value.trim();
            const categoriaInput = document.getElementById('categoriaProducto').value.trim();
            const precioInput = document.getElementById('precioProducto').value;
            const ingredientesInput = document.getElementById('ingredientesProducto').value.trim();
            const archivoImagen = document.getElementById('inputImagen').files[0]; // Recogemos el archivo físico

            // Como el campo de categoría ahora es un desplegable propio (input oculto),
            // el "required" del navegador no lo valida, así que lo revisamos a mano.
            if (!categoriaInput) {
                mostrarAviso('Selecciona o agrega una categoría para el producto.', 'error');
                return;
            }

            // === VERIFICACIÓN DE NOMBRE DUPLICADO ===
            // Antes de guardar, revisamos si ya existe un producto con el mismo
            // nombre (sin importar mayúsculas/minúsculas ni espacios extra) para
            // avisarle al admin en vez de crear un producto repetido.
            fetch(URL_BASE)
                .then(function(res) { return res.ok ? res.json() : []; })
                .then(function(productosActuales) {
                    const yaExiste = (productosActuales || []).some(function(p) {
                        return (p.nombre || p.Nombre || "").trim().toLowerCase() === nombreInput.toLowerCase();
                    });

                    if (yaExiste) {
                        mostrarAviso('Ya existe un producto llamado "' + nombreInput + '". Elige un nombre distinto para evitar duplicados.', 'error');
                        return;
                    }

                    guardarProductoNuevoEnServidor();
                })
                .catch(function() {
                    // Si no se pudo verificar (por ejemplo, backend apagado), intentamos guardar de todas formas
                    guardarProductoNuevoEnServidor();
                });

            function guardarProductoNuevoEnServidor() {
                // En lugar de un JSON plano, usamos FormData para transferir el archivo real al servidor
                const formData = new FormData();
                formData.append("Nombre", nombreInput);
                formData.append("Categoria", categoriaInput);
                formData.append("Precio", precioInput);
                formData.append("Ingredientes", ingredientesInput);
                formData.append("Estado", "Disponible");

                if (archivoImagen) {
                    formData.append("ImagenArchivo", archivoImagen); // Se envía la imagen real al backend
                }

                console.log("FormData de Añadir listo para enviarse");

                // Enviamos SIN 'Content-Type' en los headers para que el navegador configure automáticamente multipart/form-data
                fetch(URL_BASE, {
                    method: 'POST',
                    body: formData
                })
                .then(function(respuesta) {
                    if (respuesta.ok) {
                        return respuesta.json();
                    }
                    throw new Error('Código HTTP: ' + respuesta.status);
                })
                .then(function(datosServidor) {
                    mostrarAviso('Producto guardado correctamente', 'exito');

                    // 1. Limpiamos los campos del formulario
                    document.getElementById('formProducto').reset();

                    // 2. Ocultamos la vista previa
                    if (vistaPreviaCaja) vistaPreviaCaja.style.display = 'none';

                    // 3. Actualizamos la tabla
                    actualizarTablasCatalogo();
                })
                .catch(function(error) {
                    console.error('Error:', error);
                    mostrarAviso('No se pudo guardar el producto', 'error');
                });
            }
        });
    }

    // === LÓGICA DEL BUSCADOR Y ORDENAMIENTO DEL INVENTARIO ===
    const inputBuscador = document.getElementById('buscadorProductos');
    const btnLimpiarBusqueda = document.getElementById('btnLimpiarBusqueda');
    const btnOrdenAZ = document.getElementById('btnOrdenAZ');

    if (inputBuscador) {
        inputBuscador.addEventListener('input', function() {
            if (btnLimpiarBusqueda) {
                btnLimpiarBusqueda.style.display = this.value.trim() !== "" ? 'block' : 'none';
            }
            aplicarFiltroYOrden();
        });
    }

    if (btnLimpiarBusqueda) {
        btnLimpiarBusqueda.addEventListener('click', function() {
            if (inputBuscador) {
                inputBuscador.value = "";
                inputBuscador.focus();
            }
            this.style.display = 'none';
            aplicarFiltroYOrden();
        });
    }

    if (btnOrdenAZ) {
        btnOrdenAZ.addEventListener('click', alternarOrdenNombre);
    }

    sembrarProductosPorDefecto();
});

// === FUNCIÓN PARA CONVERTIR ARCHIVO A BASE64 ===
// Se mantiene intacta por si la ocupas en otra parte, aunque ya no se requiere para el guardado principal
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// =========================================================================
// MÓDULO: PRODUCTOS DESTACADOS (aparecen en la página principal / index.html)
// Se guarda en localStorage la lista de IDs marcados como destacados.
// La página principal (script.js) lee esta misma clave para decidir qué
// productos mostrar, así que marcar/desmarcar aquí se refleja de inmediato
// ahí (con solo recargar esa página).
// =========================================================================
const CLAVE_PRODUCTOS_DESTACADOS = "panaderiaProductosDestacados";

function obtenerProductosDestacados() {
    try {
        const guardados = JSON.parse(localStorage.getItem(CLAVE_PRODUCTOS_DESTACADOS) || "[]");
        return Array.isArray(guardados) ? guardados.map(String) : [];
    } catch (e) {
        return [];
    }
}

function guardarProductosDestacados(lista) {
    localStorage.setItem(CLAVE_PRODUCTOS_DESTACADOS, JSON.stringify(lista));
}

function esProductoDestacado(id) {
    return obtenerProductosDestacados().includes(String(id));
}

// Alterna el estado de favorito/destacado de un producto y refresca la tabla
function alternarProductoDestacado(id, nombreProducto) {
    const actuales = obtenerProductosDestacados();
    const idTexto = String(id);
    const yaEstaba = actuales.includes(idTexto);

    const actualizados = yaEstaba
        ? actuales.filter(x => x !== idTexto)
        : [...actuales, idTexto];

    guardarProductosDestacados(actualizados);

    mostrarAviso(
        yaEstaba
            ? '"' + nombreProducto + '" ya no aparecerá en la página principal'
            : '"' + nombreProducto + '" ahora aparece en la página principal',
        'exito'
    );

    aplicarFiltroYOrden(); // Vuelve a pintar la tabla para reflejar el nuevo estado
}

// Se llama al eliminar un producto, para que no quede un ID "fantasma" marcado
function quitarDestacado(id) {
    const actuales = obtenerProductosDestacados();
    const idTexto = String(id);
    if (actuales.includes(idTexto)) {
        guardarProductosDestacados(actuales.filter(x => x !== idTexto));
    }
}

// === RENDERIZADO Y CARGA DE TABLAS ===

// Guardamos en memoria la última lista de productos que trajo el servidor,
// así el buscador y el ordenamiento filtran/ordenan localmente sin tener
// que volver a pedirle los datos al backend en cada tecla que el admin escribe.
let productosCacheVisualizar = [];

// Controla el sentido del ordenamiento por nombre: 'asc' (A-Z) o 'desc' (Z-A)
let ordenNombreActual = 'asc';

function actualizarTablasCatalogo() {
    cargarProductosParaVisualizar();
}

function cargarProductosParaVisualizar() {
    const cuerpo = document.getElementById('tablaCuerpoVisualizar');
    if (!cuerpo) return;

    fetch(URL_BASE)
        .then(res => res.json())
        .then(productos => {
            productosCacheVisualizar = productos || [];
            aplicarFiltroYOrden();
            actualizarTodosLosSelectoresCategoria();
        });
}

// =========================================================================
// SELECTOR DE CATEGORÍA PERSONALIZADO
// Reemplaza el <datalist> nativo (que se veía inconsistente y no se podía
// estilizar ni administrar) por un desplegable propio. Incluye:
//   - Categorías "gestionables": arrancan siendo las 5 de siempre (Pan
//     dulce, Pan salado, etc.) pero TODAS se pueden eliminar con el ícono
//     de basura, y las que el admin escriba se agregan a esta misma lista.
//     Se guardan en localStorage para que los cambios persistan.
//   - Categorías que ya están en uso por productos existentes pero que ya
//     no están en la lista gestionable (por ejemplo, si se eliminaron de
//     ahí): se siguen mostrando para que se puedan seguir usando, pero sin
//     ícono de basura, porque no hay nada que "gestionar" ahí.
// =========================================================================

const CATEGORIAS_BASE_INICIALES = ["Pan dulce", "Pan salado", "Pan sin gluten", "Pasteles", "Galletas"];
const CLAVE_CATEGORIAS_GESTIONABLES = "panaderiaCategoriasGestionables";
const CLAVE_CATEGORIAS_PERSONALIZADAS_LEGADO = "panaderiaCategoriasPersonalizadas"; // clave usada en una versión anterior

function obtenerCategoriasGestionables() {
    const guardadas = localStorage.getItem(CLAVE_CATEGORIAS_GESTIONABLES);

    if (guardadas === null) {
        // Primera vez que se usa el nuevo sistema: sembramos con las 5 de
        // siempre + cualquier categoría personalizada que ya existiera con
        // la clave anterior, para no perder nada que el admin ya hubiera agregado.
        let personalizadasPrevias = [];
        try {
            personalizadasPrevias = JSON.parse(localStorage.getItem(CLAVE_CATEGORIAS_PERSONALIZADAS_LEGADO) || "[]");
            if (!Array.isArray(personalizadasPrevias)) personalizadasPrevias = [];
        } catch (e) {
            personalizadasPrevias = [];
        }

        const listaInicial = Array.from(new Set([...CATEGORIAS_BASE_INICIALES, ...personalizadasPrevias]));
        guardarCategoriasGestionables(listaInicial);
        return listaInicial;
    }

    try {
        const lista = JSON.parse(guardadas);
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

function guardarCategoriasGestionables(lista) {
    localStorage.setItem(CLAVE_CATEGORIAS_GESTIONABLES, JSON.stringify(lista));
}

function obtenerCategoriasEnUso() {
    return Array.from(new Set(
        (productosCacheVisualizar || [])
            .map(p => (p.categoria || p.Categoria || "").trim())
            .filter(Boolean)
    ));
}

// Configuración de cada instancia del selector (Añadir y Editar producto
// comparten la misma lógica, cada uno con sus propios ids en el HTML)
const CONFIG_SELECTOR_ANADIR = {
    idContenedor: 'categoriaSelector',
    idBoton: 'categoriaBoton',
    idTexto: 'categoriaBotonTexto',
    idLista: 'categoriaLista',
    idInputOculto: 'categoriaProducto'
};
const CONFIG_SELECTOR_EDITAR = {
    idContenedor: 'categoriaSelectorEdit',
    idBoton: 'categoriaBotonEdit',
    idTexto: 'categoriaBotonTextoEdit',
    idLista: 'categoriaListaEdit',
    idInputOculto: 'editCategoriaProducto'
};

function actualizarTodosLosSelectoresCategoria() {
    renderizarListaCategorias(CONFIG_SELECTOR_ANADIR);
    renderizarListaCategorias(CONFIG_SELECTOR_EDITAR);
}

function crearOpcionCategoria(nombre, valorActual, config) {
    const opcion = document.createElement('div');
    opcion.className = 'categoria-opcion' + (nombre.toLowerCase() === (valorActual || "").toLowerCase() ? ' seleccionada' : '');

    const span = document.createElement('span');
    span.textContent = nombre;
    opcion.appendChild(span);
    opcion.addEventListener('click', () => seleccionarCategoria(nombre, config));

    return opcion;
}

function renderizarListaCategorias(config) {
    const lista = document.getElementById(config.idLista);
    const inputOculto = document.getElementById(config.idInputOculto);
    if (!lista || !inputOculto) return;

    const valorActual = inputOculto.value;
    const categoriasGestionables = obtenerCategoriasGestionables();
    const enUsoExtra = obtenerCategoriasEnUso().filter(c =>
        !categoriasGestionables.some(g => g.toLowerCase() === c.toLowerCase())
    );

    lista.innerHTML = "";

    // Todas las categorías gestionables (creadas desde la sección "Categorías"
    // del sidebar). Este desplegable ya solo sirve para SELECCIONAR: agregar
    // o quitar categorías se hace desde esa sección.
    categoriasGestionables.forEach(cat => lista.appendChild(crearOpcionCategoria(cat, valorActual, config)));

    // Categorías que algún producto ya usa pero que ya no están en la lista
    // gestionable (por ejemplo, si se eliminaron desde la sección Categorías).
    // Se siguen mostrando aquí para poder seguir usándolas.
    if (enUsoExtra.length > 0) {
        const separadorUso = document.createElement('div');
        separadorUso.className = 'categoria-selector-separador';
        lista.appendChild(separadorUso);
        enUsoExtra.forEach(cat => lista.appendChild(crearOpcionCategoria(cat, valorActual, config)));
    }
}

// =========================================================================
// MÓDULO: GESTIÓN DE CATEGORÍAS (sección propia del sidebar "Categorías")
// Usa las MISMAS funciones/almacenamiento (obtenerCategoriasGestionables /
// guardarCategoriasGestionables) que ya usan los selectores de Añadir y
// Editar producto, así que cualquier categoría creada aquí queda disponible
// de inmediato en esos formularios, y viceversa.
// =========================================================================
function renderizarGestionCategorias() {
    const lista = document.getElementById('listaCategoriasAdmin');
    if (!lista) return;

    const categorias = obtenerCategoriasGestionables();
    const conteoPorCategoria = {};
    (productosCacheVisualizar || []).forEach(p => {
        const cat = (p.categoria || p.Categoria || "").trim();
        if (cat) conteoPorCategoria[cat] = (conteoPorCategoria[cat] || 0) + 1;
    });

    lista.innerHTML = "";

    if (categorias.length === 0) {
        lista.innerHTML = '<li class="categorias-admin-vacio">Aún no hay categorías registradas.</li>';
        return;
    }

    categorias.slice().sort((a, b) => a.localeCompare(b)).forEach(nombre => {
        const cantidad = conteoPorCategoria[nombre] || 0;

        const li = document.createElement('li');
        li.className = 'categoria-admin-item';
        li.innerHTML =
            '<span>' +
                '<span class="categoria-admin-item-nombre"></span>' +
                '<span class="categoria-admin-item-contador"></span>' +
            '</span>' +
            '<button type="button" class="categoria-admin-item-eliminar" title="Eliminar categoría">' +
                '<i class="fas fa-trash"></i>' +
            '</button>';

        li.querySelector('.categoria-admin-item-nombre').textContent = nombre;
        li.querySelector('.categoria-admin-item-contador').textContent =
            cantidad === 1 ? '(1 producto)' : '(' + cantidad + ' productos)';

        li.querySelector('.categoria-admin-item-eliminar').addEventListener('click', async () => {
            const confirmado = await mostrarConfirmacion(
                '¿Eliminar la categoría "' + nombre + '"? ' +
                (cantidad > 0 ? 'Los ' + cantidad + ' producto(s) que ya la usan conservarán su categoría actual.' : '')
            );
            if (!confirmado) return;

            const actualizadas = obtenerCategoriasGestionables().filter(c => c.toLowerCase() !== nombre.toLowerCase());
            guardarCategoriasGestionables(actualizadas);
            actualizarTodosLosSelectoresCategoria();
            renderizarGestionCategorias();
            mostrarAviso('Categoría "' + nombre + '" eliminada', 'exito');
        });

        lista.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const inputNuevaCategoriaAdmin = document.getElementById('inputNuevaCategoriaAdmin');
    const btnAgregarCategoriaAdmin = document.getElementById('btnAgregarCategoriaAdmin');
    if (!inputNuevaCategoriaAdmin || !btnAgregarCategoriaAdmin) return;

    function agregarCategoriaDesdeModulo() {
        const valor = inputNuevaCategoriaAdmin.value.trim();
        if (!valor) {
            mostrarAviso('Escribe un nombre para la categoría.', 'error');
            return;
        }

        const actuales = obtenerCategoriasGestionables();
        const yaExiste = actuales.some(c => c.toLowerCase() === valor.toLowerCase());
        if (yaExiste) {
            mostrarAviso('La categoría "' + valor + '" ya existe.', 'error');
            return;
        }

        actuales.push(valor);
        guardarCategoriasGestionables(actuales);

        // Se refleja de inmediato en: esta lista, los selectores de Añadir/Editar
        // producto, y (al recargar) en los filtros del catálogo público.
        renderizarGestionCategorias();
        actualizarTodosLosSelectoresCategoria();

        inputNuevaCategoriaAdmin.value = '';
        mostrarAviso('Categoría "' + valor + '" agregada correctamente', 'exito');
    }

    btnAgregarCategoriaAdmin.addEventListener('click', agregarCategoriaDesdeModulo);
    inputNuevaCategoriaAdmin.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            agregarCategoriaDesdeModulo();
        }
    });
});

function seleccionarCategoria(nombre, config) {
    const inputOculto = document.getElementById(config.idInputOculto);
    if (inputOculto) inputOculto.value = nombre;

    const textoBoton = document.getElementById(config.idTexto);
    if (textoBoton) {
        textoBoton.textContent = nombre;
        const boton = textoBoton.closest('.categoria-selector-boton');
        if (boton) boton.classList.remove('placeholder-activo');
    }

    cerrarSelectorCategoria(config);
}

function abrirSelectorCategoria(config) {
    document.querySelectorAll('.categoria-selector.abierto').forEach(el => el.classList.remove('abierto'));
    const contenedor = document.getElementById(config.idContenedor);
    if (contenedor) {
        contenedor.classList.add('abierto');
        renderizarListaCategorias(config);
    }
}

function cerrarSelectorCategoria(config) {
    const contenedor = document.getElementById(config.idContenedor);
    if (contenedor) contenedor.classList.remove('abierto');
}

function inicializarSelectorCategoria(config) {
    const boton = document.getElementById(config.idBoton);
    const contenedor = document.getElementById(config.idContenedor);
    if (!boton || !contenedor) return;

    boton.addEventListener('click', (evento) => {
        evento.stopPropagation();
        if (contenedor.classList.contains('abierto')) {
            cerrarSelectorCategoria(config);
        } else {
            abrirSelectorCategoria(config);
        }
    });
}

// Cierra cualquier selector abierto si el admin hace clic fuera de él
document.addEventListener('click', (evento) => {
    if (!evento.target.closest('.categoria-selector')) {
        document.querySelectorAll('.categoria-selector.abierto').forEach(el => el.classList.remove('abierto'));
    }
});

document.addEventListener('DOMContentLoaded', function() {
    inicializarSelectorCategoria(CONFIG_SELECTOR_ANADIR);
    inicializarSelectorCategoria(CONFIG_SELECTOR_EDITAR);
});

// Aplica, sobre la lista ya cargada en memoria, el texto del buscador
// y el ordenamiento por nombre actualmente seleccionado, y repinta la tabla.
function aplicarFiltroYOrden() {
    const inputBuscador = document.getElementById('buscadorProductos');
    const texto = inputBuscador ? inputBuscador.value.trim().toLowerCase() : "";

    let lista = productosCacheVisualizar.slice();

    if (texto !== "") {
        lista = lista.filter(prod => {
            const nombre = (prod.nombre || prod.Nombre || "").toLowerCase();
            const categoria = (prod.categoria || prod.Categoria || "").toLowerCase();
            return nombre.includes(texto) || categoria.includes(texto);
        });
    }

    lista.sort((a, b) => {
        const nombreA = (a.nombre || a.Nombre || "").toLowerCase();
        const nombreB = (b.nombre || b.Nombre || "").toLowerCase();
        if (nombreA < nombreB) return ordenNombreActual === 'asc' ? -1 : 1;
        if (nombreA > nombreB) return ordenNombreActual === 'asc' ? 1 : -1;
        return 0;
    });

    renderizarFilasProductos(lista);
}

// Solo se encarga de dibujar en el <tbody> la lista de productos que recibe,
// ya filtrada y ordenada por aplicarFiltroYOrden().
function renderizarFilasProductos(productos) {
    const cuerpo = document.getElementById('tablaCuerpoVisualizar');
    if (!cuerpo) return;

    cuerpo.innerHTML = "";

    if (productos.length === 0) {
        cuerpo.innerHTML = `
            <tr class="fila-sin-resultados">
                <td colspan="8" style="text-align:center; padding: 25px; color: var(--secondary);">
                    <i class="fas fa-search"></i> No se encontraron productos que coincidan con la búsqueda.
                </td>
            </tr>
        `;
        return;
    }

    productos.forEach(prod => {
        const id = prod.id || prod.Id;
        const nombre = prod.nombre || prod.Nombre;
        const categoria = prod.categoria || prod.Categoria;
        const precio = prod.precio || prod.Precio;
        const estado = prod.estado || prod.Estado || "Disponible";
        const imagen = prod.imagen || prod.Imagen || "default.jpg";

        // Si la imagen ya viene del nuevo servidor dinámico, apuntamos a la URL correcta del backend
        const srcFinal = imagen.startsWith('imagenes_productos/') ? `http://localhost:5000/${imagen}` : imagen;

        const destacado = esProductoDestacado(id);
        const nombreEscapado = String(nombre).replace(/'/g, "\\'").replace(/"/g, '&quot;');

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td data-label="ID">${id}</td>
            <td data-label="Imagen"><img src="${srcFinal}" width="50" height="50" style="object-fit: cover; border-radius: 4px;"></td>
            <td data-label="Nombre">${nombre}</td>
            <td data-label="Categoría">${categoria}</td>
            <td data-label="Precio">$${precio}</td>
            <td data-label="Estado"><span class="badge ${estado === 'Disponible' ? 'bg-success' : 'bg-danger'}">${estado}</span></td>
            <td data-label="Destacado">
                <button type="button" class="btn-destacado ${destacado ? 'activo' : ''}"
                    onclick="alternarProductoDestacado(${id}, '${nombreEscapado}')"
                    title="${destacado ? 'Quitar de la página principal' : 'Mostrar en la página principal'}">
                    <i class="${destacado ? 'fas' : 'far'} fa-star"></i>
                </button>
            </td>
            <td data-label="Acción">
                <div class="acciones-fila">
                    <button class="btn-icono btn-icono-editar" onclick="abrirModalEditar(${id})" title="Editar producto">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icono btn-icono-eliminar" onclick="eliminarProducto(${id})" title="Eliminar producto">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}

// Alterna el sentido del ordenamiento (A-Z / Z-A) y actualiza el ícono del botón
function alternarOrdenNombre() {
    ordenNombreActual = ordenNombreActual === 'asc' ? 'desc' : 'asc';

    const boton = document.getElementById('btnOrdenAZ');
    if (boton) {
        boton.innerHTML = ordenNombreActual === 'asc'
            ? 'Nombre <i class="fas fa-sort-alpha-down"></i>'
            : 'Nombre <i class="fas fa-sort-alpha-up"></i>';
    }

    aplicarFiltroYOrden();
}

// === ACCIONES: EDITAR Y ELIMINAR ===
// Función auxiliar para construir la URL de la imagen en base al servidor backend
// === ACCIONES DEL CATÁLOGO: EDITAR Y PREVISUALIZAR ===

// Función auxiliar para resolver la ruta de la imagen proveniente del servidor
function obtenerUrlImagen(ruta) {
    if (!ruta || ruta === "default.jpg") {
        return "default.jpg";
    }
    if (ruta.startsWith('imagenes_productos/')) {
        return `http://localhost:5000/${ruta}`;
    }
    return ruta;
}

function abrirModalEditar(id) {
    fetch(`${URL_BASE}/${id}`)
        .then(res => {
            if (!res.ok) throw new Error("No se pudo recuperar la información del producto.");
            return res.json();
        })
        .then(prod => {
            const imagenUrl = prod.imagen || prod.imagenUrl || prod.ImagenUrl || prod.Imagen || "";

            if (document.getElementById('editIdProducto')) document.getElementById('editIdProducto').value = prod.id || prod.Id;
            if (document.getElementById('editNombreProducto')) document.getElementById('editNombreProducto').value = prod.nombre || prod.Nombre;

            // Reflejamos la categoría actual del producto en el desplegable propio
            const categoriaActual = prod.categoria || prod.Categoria || "";
            if (document.getElementById('editCategoriaProducto')) document.getElementById('editCategoriaProducto').value = categoriaActual;
            const textoBotonEdit = document.getElementById('categoriaBotonTextoEdit');
            if (textoBotonEdit) textoBotonEdit.textContent = categoriaActual || 'Selecciona una categoría';

            if (document.getElementById('editPrecioProducto')) document.getElementById('editPrecioProducto').value = prod.precio || prod.Precio;
            if (document.getElementById('editIngredientesProducto')) document.getElementById('editIngredientesProducto').value = prod.ingredientes || prod.Ingredientes || "";
            if (document.getElementById('editEstadoProducto')) document.getElementById('editEstadoProducto').value = prod.estado || prod.Estado || "Disponible";

            // Guardamos el dataset en el formulario correcto: formEditarProducto
            const formEditar = document.getElementById('formEditarProducto');
            if (formEditar) {
                formEditar.dataset.imagenActual = imagenUrl;
            }

            // CORRECCIÓN: Usar el ID exacto del HTML
            const inputArchivo = document.getElementById('editInputImagen');
            if (inputArchivo) {
                inputArchivo.value = "";
            }

            // --- CAMBIO DE SECCIÓN ---
            const menuAdmin = document.getElementById('menuPanelAdmin');
            if (menuAdmin) menuAdmin.style.display = 'none';

            const secciones = document.querySelectorAll('.seccion-admin');
            secciones.forEach(sec => sec.style.display = 'none');

            const seccionEditar = document.getElementById('secEditarProducto');
            if (seccionEditar) {
                seccionEditar.style.display = 'block';
            }

            // Editar es parte del flujo de "Visualizar y editar", así que dejamos
            // ese ítem del menú lateral marcado como activo
            document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('activo'));
            const itemVisualizar = document.querySelector('.sidebar-item[data-target="secVisualizar"]');
            if (itemVisualizar) itemVisualizar.classList.add('activo');
        })
        .catch(err => {
            console.error(err);
            mostrarAviso("Error al abrir edición: " + err.message, 'error');
        });
}


// NUEVO: Función modificada para procesar los cambios al Guardar la Edición usando FormData
function guardarCambiosEditar() {
    // 1. Recuperamos los valores de los campos de texto usando tus IDs reales del HTML
    const id = document.getElementById('editIdProducto').value;
    const nombreInput = document.getElementById('editNombreProducto').value.trim();
    const categoriaInput = document.getElementById('editCategoriaProducto').value.trim();
    const precioInput = document.getElementById('editPrecioProducto').value;
    const ingredientesInput = document.getElementById('editIngredientesProducto').value.trim();
    const estadoInput = document.getElementById('editEstadoProducto').value;

    if (!categoriaInput) {
        mostrarAviso('Selecciona o agrega una categoría para el producto.', 'error');
        return;
    }
    
    // 2. Capturamos si el usuario seleccionó un archivo nuevo de imagen
    const archivoNuevaImagen = document.getElementById('editInputImagen').files[0];
    
    // 3. ¡AQUÍ ESTÁ LA CORRECCIÓN! 
    // En lugar de buscar un elemento .value que no existe y da error null,
    // leemos la propiedad que guardamos temporalmente en el formulario
    const formEditar = document.getElementById('formEditarProducto');
    const imagenActual = formEditar ? (formEditar.dataset.imagenActual || "") : "";

    // 4. Construimos el FormData para enviarlo al servidor C#
    const formData = new FormData();
    formData.append("Nombre", nombreInput);
    formData.append("Categoria", categoriaInput);
    formData.append("Precio", precioInput);
    formData.append("Ingredientes", ingredientesInput);
    formData.append("Estado", estadoInput);
    formData.append("Imagen", imagenActual); // Pasamos la ruta vieja como respaldo

    if (archivoNuevaImagen) {
        formData.append("ImagenArchivo", archivoNuevaImagen); // Si hay archivo nuevo, lo adjuntamos físico
    }

    // === VERIFICACIÓN DE NOMBRE DUPLICADO ===
    // Revisamos que el nuevo nombre no choque con el de OTRO producto ya
    // existente (excluyendo el producto que se está editando, ya que puede
    // guardarse a sí mismo sin cambiar el nombre).
    fetch(URL_BASE)
        .then(res => res.ok ? res.json() : [])
        .then(productosActuales => {
            const nombreDuplicado = (productosActuales || []).some(p => {
                const idProd = String(p.id || p.Id);
                const nombreProd = (p.nombre || p.Nombre || "").trim().toLowerCase();
                return idProd !== String(id) && nombreProd === nombreInput.toLowerCase();
            });

            if (nombreDuplicado) {
                mostrarAviso('Ya existe otro producto llamado "' + nombreInput + '". Elige un nombre distinto para evitar duplicados.', 'error');
                return;
            }

            enviarEdicionAlServidor();
        })
        .catch(() => {
            // Si no se pudo verificar (backend apagado), intentamos guardar de todas formas
            enviarEdicionAlServidor();
        });

    function enviarEdicionAlServidor() {
        // 5. Enviamos la petición PUT al backend
        fetch(`${URL_BASE}/${id}`, {
            method: 'PUT',
            body: formData
        })
        .then(respuesta => {
            if (respuesta.ok) {
                mostrarAviso('¡Producto actualizado con éxito!', 'exito');

                // Regresamos a "Visualizar y editar"
                if (typeof irASidebar === "function") {
                    irASidebar('secVisualizar');
                } else {
                    document.getElementById('secEditarProducto').style.display = 'none';
                    document.getElementById('secVisualizar').style.display = 'block';
                }

                // Refrescamos las tablas del catálogo de inmediato
                actualizarTablasCatalogo();
            } else {
                mostrarAviso('Error al intentar guardar los cambios en el servidor.', 'error');
            }
        })
        .catch(error => {
            console.error('Error al editar:', error);
            mostrarAviso('Ocurrió un problema de red al intentar actualizar.', 'error');
        });
    }
}

function cerrarModalEditar() {
    const modal = document.getElementById('modalEditar');
    if (modal) modal.style.display = 'none';
}

async function eliminarProducto(id) {
    const confirmado = await mostrarConfirmacion('¿Estás seguro de que deseas eliminar este producto? Esta acción borrará también su imagen del servidor.');
    if (confirmado) {
        fetch(`${URL_BASE}/${id}`, { method: 'DELETE' })
        .then(respuesta => {
            if (respuesta.ok) {
                mostrarAviso('¡Producto y su archivo de imagen eliminados con éxito!', 'exito');
                quitarDestacado(id); // Si estaba marcado como destacado, lo limpiamos también
                actualizarTablasCatalogo(); // Recarga las tablas
            } else {
                mostrarAviso('El producto no pudo ser eliminado del servidor.', 'error');
            }
        })
        .catch(error => {
            console.error('Error al intentar eliminar:', error);
            mostrarAviso('Ocurrió un error de red al intentar eliminar el producto.', 'error');
        });
    }
}

function limpiarFormularioAnadir() {
    const form = document.getElementById('formProducto');
    if (form) form.reset();
    const vistaPrevia = document.getElementById('vistaPreviaCaja');
    const imgPrevia = document.getElementById('imagenPreviaElemento');
    if (vistaPrevia) vistaPrevia.style.display = 'none';
    if (imgPrevia) imgPrevia.setAttribute('src', '');

    // El desplegable de categoría no es un <select> nativo, así que hay que
    // limpiarlo a mano (form.reset() no lo toca)
    const categoriaOculta = document.getElementById('categoriaProducto');
    if (categoriaOculta) categoriaOculta.value = '';
    const textoBotonAnadir = document.getElementById('categoriaBotonTexto');
    if (textoBotonAnadir) textoBotonAnadir.textContent = 'Selecciona una categoría';
}