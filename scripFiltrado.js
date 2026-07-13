// =========================================================================
// PANEL LATERAL DE FILTROS: CATEGORÍAS (multi-selección) + RANGO DE PRECIO
// =========================================================================

let filtrosLateralesListos = false;

// Se ejecuta cada vez que el contenedor de tarjetas cambia (cuando script.js
// termina de inyectar los productos desde la API). Construye el panel de
// categorías con conteos reales y ajusta el slider de precio al catálogo.
function inicializarFiltrosLaterales() {
    const listaCategorias = document.getElementById('listaFiltroCategorias');
    const tarjetas = document.querySelectorAll('.columna-tarjeta-producto');

    if (!listaCategorias || tarjetas.length === 0) return;

    // --- Conteo de productos por categoría, a partir de las tarjetas ya renderizadas ---
    const conteoCategorias = {};
    let precioMax = 0;

    tarjetas.forEach(tarjeta => {
        const categoria = tarjeta.dataset.categoria
            || tarjeta.querySelector('.etiqueta-producto-tipo').textContent.trim();
        const precio = parseFloat(tarjeta.dataset.precio) || 0;

        conteoCategorias[categoria] = (conteoCategorias[categoria] || 0) + 1;
        if (precio > precioMax) precioMax = precio;
    });

    if (!filtrosLateralesListos) {
        // --- Pintamos los checkboxes de categoría (una sola vez) ---
        listaCategorias.innerHTML = "";
        Object.keys(conteoCategorias).sort().forEach(categoria => {
            const li = document.createElement('li');
            li.className = 'filtro-item-categoria';
            li.innerHTML = `
                <label>
                    <input type="checkbox" class="check-categoria-filtro" value="${categoria}">
                    <span class="filtro-item-nombre">${categoria}</span>
                    <span class="filtro-contador">(${conteoCategorias[categoria]})</span>
                </label>
            `;
            listaCategorias.appendChild(li);
        });

        document.querySelectorAll('.check-categoria-filtro').forEach(chk => {
            chk.addEventListener('change', aplicarFiltros);
        });

        // --- Slider de precio, ajustado al precio máximo real del catálogo ---
        const techo = Math.max(Math.ceil(precioMax / 5) * 5, 5) || 50;
        const rangoMin = document.getElementById('rangoPrecioMin');
        const rangoMax = document.getElementById('rangoPrecioMax');

        if (rangoMin && rangoMax) {
            rangoMin.min = 0;
            rangoMin.max = techo;
            rangoMin.value = 0;

            rangoMax.min = 0;
            rangoMax.max = techo;
            rangoMax.value = techo;

            actualizarTextoPrecio();

            rangoMin.addEventListener('input', () => {
                if (parseInt(rangoMin.value) > parseInt(rangoMax.value)) {
                    rangoMin.value = rangoMax.value;
                }
                actualizarTextoPrecio();
                aplicarFiltros();
            });

            rangoMax.addEventListener('input', () => {
                if (parseInt(rangoMax.value) < parseInt(rangoMin.value)) {
                    rangoMax.value = rangoMin.value;
                }
                actualizarTextoPrecio();
                aplicarFiltros();
            });
        }

        // --- Botón "Limpiar filtros" ---
        const btnLimpiar = document.getElementById('btnLimpiarFiltros');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                document.querySelectorAll('.check-categoria-filtro').forEach(chk => chk.checked = false);
                if (rangoMin) rangoMin.value = 0;
                if (rangoMax) rangoMax.value = techo;
                actualizarTextoPrecio();

                const inputBusqueda = document.getElementById('bread-search');
                if (inputBusqueda) inputBusqueda.value = "";

                aplicarFiltros();
            });
        }

        filtrosLateralesListos = true;

        // --- Si llegamos desde index.html con ?filtro=Categoria, marcamos esa casilla ---
        const parametros = new URLSearchParams(window.location.search);
        const filtroURL = parametros.get('filtro');
        if (filtroURL) {
            const checkboxCoincide = Array.from(document.querySelectorAll('.check-categoria-filtro'))
                .find(chk => chk.value.toLowerCase() === filtroURL.toLowerCase());
            if (checkboxCoincide) checkboxCoincide.checked = true;
        }
    }

    aplicarFiltros();
}

function actualizarTextoPrecio() {
    const rangoMin = document.getElementById('rangoPrecioMin');
    const rangoMax = document.getElementById('rangoPrecioMax');
    const textoMin = document.getElementById('precioMinValor');
    const textoMax = document.getElementById('precioMaxValor');

    if (rangoMin && textoMin) textoMin.textContent = `$${rangoMin.value}`;
    if (rangoMax && textoMax) textoMax.textContent = `$${rangoMax.value}`;
}

// =========================================================================
// FUNCIÓN UNIFICADA: combina buscador de texto + categorías + rango de precio
// =========================================================================
function aplicarFiltros() {
    const inputBusqueda = document.getElementById('bread-search');
    const textoFiltro = inputBusqueda ? inputBusqueda.value.toLowerCase().trim() : "";

    const categoriasSeleccionadas = Array.from(document.querySelectorAll('.check-categoria-filtro:checked'))
        .map(chk => chk.value);

    const rangoMin = document.getElementById('rangoPrecioMin');
    const rangoMax = document.getElementById('rangoPrecioMax');
    const precioMin = rangoMin ? parseFloat(rangoMin.value) : 0;
    const precioMax = rangoMax ? parseFloat(rangoMax.value) : Infinity;

    const tarjetas = document.querySelectorAll('.columna-tarjeta-producto');
    let visibles = 0;

    tarjetas.forEach(tarjeta => {
        const categoria = tarjeta.dataset.categoria
            || tarjeta.querySelector('.etiqueta-producto-tipo').textContent.trim();
        const precio = parseFloat(tarjeta.dataset.precio) || 0;
        const nombre = tarjeta.querySelector('h3').textContent.toLowerCase();

        const coincideCategoria = categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoria);
        const coincidePrecio = precio >= precioMin && precio <= precioMax;
        const coincideTexto = nombre.includes(textoFiltro);

        const mostrar = coincideCategoria && coincidePrecio && coincideTexto;
        tarjeta.style.display = mostrar ? "block" : "none";
        if (mostrar) visibles++;
    });

    const contador = document.getElementById('contadorResultados');
    if (contador) {
        contador.textContent = visibles === 1 ? "1 resultado" : `${visibles} resultados`;
    }

    const contenedorIcono = document.getElementById('search-icon-container');
    if (contenedorIcono) contenedorIcono.className = "icon-idle";
}

// =========================================================================
// Enlaces del menú superior y del footer (data-categoria): ahora en vez de
// cambiar el título de la sección, marcan (de forma exclusiva) la casilla
// correspondiente en el panel lateral y aplican los filtros.
// =========================================================================
function filtrarPorCategoria(evento) {
    evento.preventDefault();

    const inputBusqueda = document.getElementById('bread-search');
    if (inputBusqueda) inputBusqueda.value = ""; // Limpia el texto escrito

    const enlaceSeleccionado = evento.currentTarget;
    const categoriaFiltrar = enlaceSeleccionado.getAttribute('data-categoria');

    const checkboxCoincide = Array.from(document.querySelectorAll('.check-categoria-filtro'))
        .find(chk => chk.value.toLowerCase() === categoriaFiltrar.toLowerCase());

    if (checkboxCoincide) {
        // Selección exclusiva: solo esa categoría, como al entrar desde un enlace directo
        document.querySelectorAll('.check-categoria-filtro').forEach(chk => chk.checked = false);
        checkboxCoincide.checked = true;
    }

    // GESTIÓN VISUAL DE ENLACES ACTIVOS
    document.querySelectorAll('.submenu-categorias a, .footer-subcategorias a').forEach(enlace => {
        enlace.classList.remove('enlace-activo');
    });
    enlaceSeleccionado.classList.add('enlace-activo');

    const botonPadreCategorias = document.querySelector('.menu-dropdown > a');
    if (botonPadreCategorias) botonPadreCategorias.classList.add('enlace-activo');

    aplicarFiltros();

    // Restauramos la opacidad del contenedor (usada por script.js al llegar con ?filtro=)
    const contenedorTarjetas = document.getElementById('contenedorTarjetasProductos');
    if (contenedorTarjetas) contenedorTarjetas.style.opacity = "1";

    const menuEnlaces = document.getElementById("menuEnlaces");
    if (menuEnlaces && menuEnlaces.classList.contains("mostrar")) {
        menuEnlaces.classList.remove("mostrar");
    }
}

// =========================================================================
// Esperamos a que script.js termine de inyectar las tarjetas del catálogo
// (fetch asíncrono a la API) para poder construir el panel de filtros.
// =========================================================================
document.addEventListener('DOMContentLoaded', function() {
    const contenedorTarjetas = document.getElementById('contenedorTarjetasProductos');
    if (!contenedorTarjetas) return;

    const observador = new MutationObserver(() => {
        inicializarFiltrosLaterales();
    });
    observador.observe(contenedorTarjetas, { childList: true });
});
