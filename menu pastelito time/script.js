/* =========================================================
   IMPORTACIONES FIREBASE
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";


/* =========================================================
   CONFIGURACIÓN FIREBASE
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyC_tJKVUImVlDxAjsXlTl52SwdSQL6SVLI",

    authDomain:
        "facturacion-pastelitos-time.firebaseapp.com",

    databaseURL:
        "https://facturacion-pastelitos-time-default-rtdb.firebaseio.com",

    projectId:
        "facturacion-pastelitos-time",

    storageBucket:
        "facturacion-pastelitos-time.firebasestorage.app",

    messagingSenderId:
        "911065226832",

    appId:
        "1:911065226832:web:ebfcd3bc5534fc8214bb55",

    measurementId:
        "G-FMSC6ZL514"
};


/* =========================================================
   INICIALIZAR FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);


/* =========================================================
   VARIABLES
========================================================= */

let productos = {};

let categoriaSeleccionada = "TODOS";


/* =========================================================
   ELEMENTOS
========================================================= */

const menuContainer =
    document.getElementById("menuContainer");

const categoriesContainer =
    document.getElementById("categories");

const connectionDot =
    document.getElementById("connectionDot");

const connectionText =
    document.getElementById("connectionText");


/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

function normalizarTexto(texto) {

    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


/* =========================================================
   FORMATEAR PRECIO
========================================================= */

function formatearPrecio(precio) {

    const numero = Number(precio);

    if (Number.isNaN(numero)) {
        return "$0.00";
    }

    return numero.toLocaleString("en-US", {

        style: "currency",

        currency: "USD",

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

    });

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(texto) {

    return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   OBTENER CATEGORÍA
========================================================= */

function obtenerCategoria(producto) {

    const categoria =
        String(producto.categoria || "").trim();

    if (!categoria) {
        return "Otros";
    }

    return categoria;

}


/* =========================================================
   DISPONIBILIDAD
========================================================= */

function estaDisponible(producto) {

    const stock = Number(producto.stock || 0);

    return stock > 0;

}


/* =========================================================
   PRODUCTO VISIBLE
========================================================= */

function esProductoVisible(producto) {

    /*
     * Excluir inactivos
     */

    if (
        producto.activo === false ||
        producto.activo === "false"
    ) {
        return false;
    }


    /*
     * Excluir sin stock
     */

    if (!estaDisponible(producto)) {
        return false;
    }


    return true;

}


/* =========================================================
   ORDEN DE CATEGORÍAS
========================================================= */

const ordenCategorias = [
    "Pastelitos",
    "Bebidas",
    "Postres"
];


/* =========================================================
   OBTENER CATEGORÍAS ORDENADAS
========================================================= */

function obtenerCategorias(productosArray) {

    const categorias = [];

    productosArray.forEach(producto => {

        const categoria =
            obtenerCategoria(producto);

        if (
            categoria &&
            !categorias.some(
                c =>
                    normalizarTexto(c) ===
                    normalizarTexto(categoria)
            )
        ) {

            categorias.push(categoria);

        }

    });


    /*
     * Primero las conocidas
     */

    const resultado = [];


    ordenCategorias.forEach(categoriaBase => {

        const encontrada =
            categorias.find(
                categoria =>
                    normalizarTexto(categoria) ===
                    normalizarTexto(categoriaBase)
            );

        if (encontrada) {
            resultado.push(encontrada);
        }

    });


    /*
     * Después las nuevas
     */

    categorias.forEach(categoria => {

        if (
            !resultado.some(
                existente =>
                    normalizarTexto(existente) ===
                    normalizarTexto(categoria)
            )
        ) {

            resultado.push(categoria);

        }

    });


    return resultado;

}


/* =========================================================
   PRODUCTOS VISIBLES (ARRAY)
========================================================= */

function obtenerProductosVisibles() {

    return Object.entries(productos || {})
        .map(([id, producto]) => ({
            id,
            ...producto
        }))
        .filter(esProductoVisible);

}


/* =========================================================
   RENDERIZAR BOTONES DE CATEGORÍA
========================================================= */

function renderizarCategorias() {

    if (!categoriesContainer) return;


    const productosVisibles =
        obtenerProductosVisibles();


    const categorias =
        obtenerCategorias(productosVisibles);


    /*
     * Validar que la categoría seleccionada exista
     */

    if (
        categoriaSeleccionada !== "TODOS" &&
        !categorias.some(
            c =>
                normalizarTexto(c) ===
                normalizarTexto(categoriaSeleccionada)
        )
    ) {

        categoriaSeleccionada = "TODOS";

    }


    /*
     * Construir botones
     */

    let html = `

        <button
            class="category-btn ${categoriaSeleccionada === "TODOS" ? "active" : ""}"
            data-category="TODOS">

            Todos

        </button>

    `;


    categorias.forEach(categoria => {

        const activa =
            normalizarTexto(categoria) ===
            normalizarTexto(categoriaSeleccionada);

        html += `

            <button
                class="category-btn ${activa ? "active" : ""}"
                data-category="${escaparHTML(categoria)}">

                ${escaparHTML(categoria)}

            </button>

        `;

    });


    categoriesContainer.innerHTML = html;


    /*
     * Asignar eventos
     */

    categoriesContainer
        .querySelectorAll(".category-btn")
        .forEach(button => {

            button.addEventListener("click", () => {

                categoriaSeleccionada =
                    button.dataset.category;

                renderizarCategorias();

                renderizarMenu();

            });

        });

}


/* =========================================================
   RENDERIZAR MENÚ
========================================================= */

function renderizarMenu() {

    const productosVisibles =
        obtenerProductosVisibles();


    /*
     * Sin productos en total
     */

    if (productosVisibles.length === 0) {

        menuContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-utensils"></i>

                <h3>
                    Menú no disponible
                </h3>

                <p>
                    En este momento no hay productos disponibles.
                </p>

            </div>

        `;

        return;

    }


    /*
     * Filtrar por categoría
     */

    let productosFiltrados =
        productosVisibles.filter(producto => {

            if (categoriaSeleccionada === "TODOS") {
                return true;
            }

            return (
                normalizarTexto(
                    obtenerCategoria(producto)
                ) ===
                normalizarTexto(
                    categoriaSeleccionada
                )
            );

        });


    /*
     * Categoría vacía
     */

    if (productosFiltrados.length === 0) {

        menuContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-box-open"></i>

                <h3>
                    No hay productos
                </h3>

                <p>
                    Actualmente no hay productos en esta categoría.
                </p>

            </div>

        `;

        return;

    }


    /*
     * Agrupar por categoría
     */

    const grupos = {};


    productosFiltrados.forEach(producto => {

        const categoria =
            obtenerCategoria(producto);

        if (!grupos[categoria]) {
            grupos[categoria] = [];
        }

        grupos[categoria].push(producto);

    });


    /*
     * Ordenar productos
     */

    Object.values(grupos).forEach(lista => {

        lista.sort((a, b) => {

            const nombreA =
                normalizarTexto(a.nombre);

            const nombreB =
                normalizarTexto(b.nombre);

            return nombreA.localeCompare(nombreB);

        });

    });


    /*
     * Ordenar categorías
     */

    const categorias =
        Object.keys(grupos).sort((a, b) => {

            const indexA =
                ordenCategorias.findIndex(
                    categoria =>
                        normalizarTexto(categoria) ===
                        normalizarTexto(a)
                );

            const indexB =
                ordenCategorias.findIndex(
                    categoria =>
                        normalizarTexto(categoria) ===
                        normalizarTexto(b)
                );


            const posicionA =
                indexA === -1 ? 999 : indexA;

            const posicionB =
                indexB === -1 ? 999 : indexB;


            if (posicionA !== posicionB) {
                return posicionA - posicionB;
            }


            return normalizarTexto(a)
                .localeCompare(
                    normalizarTexto(b)
                );

        });


    /*
     * Construir HTML
     */

    let html = "";


    categorias.forEach(categoria => {

        html += `

            <section
                class="category-section"
                data-category-section="${escaparHTML(categoria)}">

                <div class="category-title">

                    <h2>
                        ${escaparHTML(categoria)}
                    </h2>

                </div>

                <div class="products-grid">

        `;


        grupos[categoria].forEach(producto => {

            const nombre =
                escaparHTML(
                    producto.nombre || "Producto"
                );

            const precio =
                formatearPrecio(
                    producto.precio
                );

            const imagen =
                producto.imagen
                    ? String(producto.imagen).trim()
                    : "";


            html += `

                <article class="product-card">

                    ${imagen
                    ?

                    `
                            <div class="product-image">

                                <img
                                    src="${escaparHTML(imagen)}"
                                    alt="${nombre}"
                                    loading="lazy"
                                    onerror="this.parentElement.style.display='none'">

                            </div>
                            `

                    :

                    ""

                }

                    <div>

                        <div class="product-name">
                            ${nombre}
                        </div>

                        <div class="product-price">
                            ${precio}
                        </div>

                    </div>

                    <div>

                        <span class="availability available">

                            <span class="availability-dot"></span>

                            Disponible

                        </span>

                    </div>

                </article>

            `;

        });


        html += `

                </div>

            </section>

        `;

    });


    menuContainer.innerHTML = html;

}


/* =========================================================
   FIREBASE — TIEMPO REAL
========================================================= */

const productosRef =
    ref(db, "productos");


onValue(

    productosRef,

    snapshot => {

        productos =
            snapshot.val() || {};


        connectionDot
            .classList
            .remove("loading", "error");

        connectionText.textContent =
            "Menú actualizado en tiempo real";


        /*
         * Renderizamos botones y menú
         */

        renderizarCategorias();

        renderizarMenu();

    },

    error => {

        console.error(
            "Error leyendo productos:",
            error
        );


        connectionDot
            .classList
            .remove("loading");

        connectionDot
            .classList
            .add("error");

        connectionText.textContent =
            "No se pudo conectar con el menú";


        categoriesContainer.innerHTML = "";


        menuContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    No pudimos cargar el menú
                </h3>

                <p>
                    Intenta actualizar la página nuevamente.
                </p>

            </div>

        `;

    }

);


/* =========================================================
   AÑO FOOTER
========================================================= */

document.getElementById("year")
    .textContent =
    new Date().getFullYear();