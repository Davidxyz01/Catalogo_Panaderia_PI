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
            const categoriaInput = document.getElementById('categoriaProducto').value;
            const precioInput = document.getElementById('precioProducto').value;
            const ingredientesInput = document.getElementById('ingredientesProducto').value.trim();
            const archivoImagen = document.getElementById('inputImagen').files[0]; // Recogemos el archivo físico

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
                alert('Producto guardado correctamente');
                
                // 1. Limpiamos los campos del formulario
                document.getElementById('formProducto').reset();
                
                // 2. Ocultamos la vista previa
                if (vistaPreviaCaja) vistaPreviaCaja.style.display = 'none';
                
                // 3. Actualizamos la tabla
                actualizarTablasCatalogo();
            })
            .catch(function(error) {
                console.error('Error:', error);
                alert('No se pudo guardar el producto');
            });
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
        });
}

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
                <td colspan="7" style="text-align:center; padding: 25px; color: var(--secondary);">
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

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td data-label="ID">${id}</td>
            <td data-label="Imagen"><img src="${srcFinal}" width="50" height="50" style="object-fit: cover; border-radius: 4px;"></td>
            <td data-label="Nombre">${nombre}</td>
            <td data-label="Categoría">${categoria}</td>
            <td data-label="Precio">$${precio}</td>
            <td data-label="Estado"><span class="badge ${estado === 'Disponible' ? 'bg-success' : 'bg-danger'}">${estado}</span></td>
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
            if (document.getElementById('editCategoriaProducto')) document.getElementById('editCategoriaProducto').value = prod.categoria || prod.Categoria;
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
            alert("Error al abrir edición: " + err.message);
        });
}


// NUEVO: Función modificada para procesar los cambios al Guardar la Edición usando FormData
function guardarCambiosEditar() {
    // 1. Recuperamos los valores de los campos de texto usando tus IDs reales del HTML
    const id = document.getElementById('editIdProducto').value;
    const nombreInput = document.getElementById('editNombreProducto').value.trim();
    const categoriaInput = document.getElementById('editCategoriaProducto').value;
    const precioInput = document.getElementById('editPrecioProducto').value;
    const ingredientesInput = document.getElementById('editIngredientesProducto').value.trim();
    const estadoInput = document.getElementById('editEstadoProducto').value;
    
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

    // 5. Enviamos la petición PUT al backend
    fetch(`${URL_BASE}/${id}`, {
        method: 'PUT',
        body: formData
    })
    .then(respuesta => {
        if (respuesta.ok) {
            alert('¡Producto actualizado con éxito!');

            // Regresamos a "Visualizar y editar" (el menú lateral ya no tiene
            // una pantalla de bienvenida a la que volver)
            if (typeof irASidebar === "function") {
                irASidebar('secVisualizar');
            } else {
                document.getElementById('secEditarProducto').style.display = 'none';
                document.getElementById('secVisualizar').style.display = 'block';
            }

            // Refrescamos las tablas del catálogo de inmediato
            actualizarTablasCatalogo(); 
        } else {
            alert('Error al intentar guardar los cambios en el servidor.');
        }
    })
    .catch(error => {
        console.error('Error al editar:', error);
        alert('Ocurrió un problema de red al intentar actualizar.');
    });
}

function cerrarModalEditar() {
    const modal = document.getElementById('modalEditar');
    if (modal) modal.style.display = 'none';
}

function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción borrará también su imagen del servidor.')) {
        fetch(`${URL_BASE}/${id}`, { method: 'DELETE' })
        .then(respuesta => {
            if (respuesta.ok) {
                alert('¡Producto y su archivo de imagen eliminados con éxito!');
                actualizarTablasCatalogo(); // Recarga las tablas
            } else {
                alert('El producto no pudo ser eliminado del servidor.');
            }
        })
        .catch(error => {
            console.error('Error al intentar eliminar:', error);
            alert('Ocurrió un error de red al intentar eliminar el producto.');
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
}