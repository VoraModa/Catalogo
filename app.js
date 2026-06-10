// =========================
// FIREBASE
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// CONFIG

const firebaseConfig = {
    apiKey: "AIzaSyAD_FPhpmmbuvnXUxKVlNpENdViPTIBaYU",
    authDomain: "sentinels-web.firebaseapp.com",
    projectId: "sentinels-web",
    storageBucket: "sentinels-web.firebasestorage.app",
    messagingSenderId: "565758042156",
    appId: "1:565758042156:web:50a34188f07a3dce3af189"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================
// ELEMENTOS
// =========================

const productsGrid = document.getElementById("productsGrid");
const catalogoSection = document.getElementById("catalogo");

const cartBtn = document.getElementById("cartBtn");
const cartSidebar = document.getElementById("cartSidebar");
const closeCart = document.getElementById("closeCart");

const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const closeAdmin = document.getElementById("closeAdmin");

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

const productForm = document.getElementById("productForm");
const adminProducts = document.getElementById("adminProducts");

const checkoutBtn = document.getElementById("checkoutBtn");

let products = [];
let cart = [];

// Control de género actual
let currentCatalogGender = 'mujer';

// =========================
// LOADER
// =========================

window.addEventListener("load", () => {

    setTimeout(() => {

        document.getElementById("loader").style.display = "none";

    }, 1000);

});

// =========================
// MENU MOVIL
// =========================

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

menuBtn.addEventListener("click", () => {

    mobileMenu.classList.toggle("active");
    menuBtn.classList.toggle("active");

});

window.closeMobileMenu = function() {
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('menuBtn').classList.remove('active');
    document.getElementById('mobileCatSubmenu').classList.remove('active');
};

// =========================
// NAVEGACION SECCIONES
// =========================

window.showSection = function(section, gender = null) {

    const inicio = document.getElementById("inicio");
    const catalogo = document.getElementById("catalogo");

    if (section === "inicio") {
        inicio.style.display = "flex";
        catalogo.style.display = "none";
    } else if (section === "catalogo") {
        inicio.style.display = "none";
        catalogo.style.display = "block";
        
        if(gender) {
            currentCatalogGender = gender;
            const title = gender === 'mujer' ? 'Catálogo Mujer' : 'Catálogo Hombre';
            document.getElementById("catalogMainTitle").textContent = title;
            
            // Cambiar fondo según género
            const catalogoSection = document.getElementById("catalogo");
            catalogoSection.style.backgroundImage = gender === 'mujer' ? "url('fondo-catalogo-mujer.jpg')" : "url('fondo-catalogo-hombre.jpg')";
            
            // Aplicar clase temática si es mujer
            if (gender === 'mujer') {
                catalogoSection.classList.add('theme-feminine');
            } else {
                catalogoSection.classList.remove('theme-feminine');
            }
            
            renderProducts();
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// =========================
// CARRITO
// =========================

cartBtn.addEventListener("click", () => {

    cartSidebar.classList.add("active");

});

closeCart.addEventListener("click", () => {

    cartSidebar.classList.remove("active");

});

function updateCart() {

    cartItems.innerHTML = "";

    let total = 0;

    cart.forEach(item => {

        total += Number(item.price);

        cartItems.innerHTML += `
            <div style="margin-bottom:15px;border-bottom:1px solid #ddd;padding-bottom:10px;">
                <strong>${item.name}</strong>
                <br>
                $${Number(item.price).toLocaleString("es-CO")}
            </div>
        `;

    });

    cartCount.textContent = cart.length;

    cartTotal.textContent =
        "$" + total.toLocaleString("es-CO");

}

// =========================
// FIRESTORE
// =========================

async function loadProducts() {

    products = [];

    const snapshot =
        await getDocs(collection(db, "products"));

    snapshot.forEach(docSnap => {

        products.push({
            id: docSnap.id,
            ...docSnap.data()
        });

    });

    renderProducts();

}

async function addProduct(product) {

    await addDoc(
        collection(db, "products"),
        product
    );

    loadProducts();

}

async function removeProduct(id) {

    await deleteDoc(
        doc(db, "products", id)
    );

    loadProducts();

}

// =========================
// RENDER
// =========================

function renderProducts() {

    productsGrid.innerHTML = "";

    const filtered =
        products.filter(product => {
            const prodGender = product.gender ? product.gender : "mujer";
            return prodGender === currentCatalogGender;
        });

    filtered.forEach((product) => {

        const card = `
            <div class="product-card">

                <div class="img-container">
                    <img
                    src="${product.image}"
                    class="product-image"
                    alt="${product.name}"
                    >
                </div>

                <div class="product-info">

                    <div class="product-name">
                        ${product.name}
                    </div>

                    <div class="product-price">
                        $${Number(product.price).toLocaleString("es-CO")}
                    </div>

                    <button
                    class="product-btn"
                    onclick="addToCart('${product.id}')">
                        <i class="fa-solid fa-bag-shopping"></i> Agregar
                    </button>

                </div>

            </div>
        `;

        productsGrid.innerHTML += card;

    });

    renderAdminProducts();

}

// =========================
// ADMIN
// =========================

productForm.addEventListener("submit",

async function(e){

    e.preventDefault();

    const product = {

        name:
        document.getElementById("productName").value,

        image:
        document.getElementById("productImage").value,

        price:
        document.getElementById("productPrice").value,

        category:
        document.getElementById("productCategory").value,

        gender:
        document.getElementById("productGender").value

    };

    await addProduct(product);

    productForm.reset();

});

function renderAdminProducts(){

    adminProducts.innerHTML = "";

    products.forEach(product => {

        adminProducts.innerHTML += `
            <div style="
            border:1px solid #ddd;
            padding:10px;
            margin-top:10px;
            border-radius:12px;
            ">

                <strong>
                ${product.name}
                </strong>

                <br>

                $${Number(product.price)
                .toLocaleString("es-CO")}

                <br><br>

                <button
                onclick="deleteProduct('${product.id}')">

                    Eliminar

                </button>

            </div>
        `;

    });

}

// =========================
// MODAL ADMIN
// =========================

adminBtn.addEventListener("click", () => {

    adminModal.classList.add("active");

});

closeAdmin.addEventListener("click", () => {

    adminModal.classList.remove("active");

});

// =========================
// FUNCIONES GLOBALES
// =========================

window.addToCart = function(id){

    const product =
        products.find(
            p => p.id === id
        );

    if(!product) return;

    cart.push(product);

    updateCart();

};

window.deleteProduct =
async function(id){

    if(
        !confirm(
            "¿Eliminar producto?"
        )
    ) return;

    await removeProduct(id);

};

// =========================
// WHATSAPP
// =========================

checkoutBtn.addEventListener(
"click",
() => {

    if(cart.length === 0){

        alert(
            "Tu carrito está vacío"
        );

        return;

    }

    let message =
    "Hola Vora Moda, deseo comprar:%0A%0A";

    let total = 0;

    cart.forEach(item => {

        total += Number(item.price);

        message +=
        `• ${item.name} - $${Number(item.price).toLocaleString("es-CO")}%0A`;

    });

    message +=
    `%0A*Total:* $${total.toLocaleString("es-CO")}`;

    window.open(
    `https://wa.me/573160673379?text=${message}`,
    "_blank"
    );

});

// =========================
// INICIO
// =========================

loadProducts();