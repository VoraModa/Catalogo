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
    doc,
    updateDoc
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

// SISTEMA DE SEGURIDAD ADMIN
const adminLoginView = document.getElementById("adminLoginView");
const adminAppView = document.getElementById("adminAppView");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const closeLoginBtn = document.getElementById("closeLoginBtn");

// Credenciales
const ADMIN_USER = "franboy1221@gmail.com";
const ADMIN_PASS = "21121999";

const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");

const productForm = document.getElementById("productForm");
const financeForm = document.getElementById("financeForm");

const checkoutBtn = document.getElementById("checkoutBtn");

let products = [];
let cart = [];
let sales = []; // Colección de ventas / finanzas

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
            
            const catalogoSection = document.getElementById("catalogo");
            catalogoSection.style.backgroundImage = gender === 'mujer' ? "url('fondo-catalogo-mujer.jpg')" : "url('fondo-catalogo-hombre.jpg')";
            
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
    let totalVenta = 0;

    cart.forEach((item, index) => {
        totalVenta += Number(item.price || 0);
        
        cartItems.innerHTML += `
            <div class="cart-item-modern">
                <div class="cart-info">
                    <strong>${item.name}</strong>
                    <span>Cod: ${item.code || 'N/A'}</span>
                    <span style="color:var(--gold); font-weight:700;">$${Number(item.price || 0).toLocaleString("es-CO")}</span>
                </div>
                <button class="cart-btn-del" onclick="removeFromCart(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    });

    cartCount.textContent = cart.length;
    cartTotal.textContent = "$" + totalVenta.toLocaleString("es-CO");
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCart();
};

// =========================
// FIRESTORE Y DATOS
// =========================

async function loadSales() {
    sales = [];
    const snapshot = await getDocs(collection(db, "sales"));
    snapshot.forEach(docSnap => {
        sales.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderAdminViews();
}

async function loadProducts() {
    products = [];
    const snapshot = await getDocs(collection(db, "products"));

    snapshot.forEach(docSnap => {
        products.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    loadSales(); 
    renderProducts();
}

async function addProduct(product) {
    await addDoc(collection(db, "products"), product);
    loadProducts();
}

async function removeProduct(id) {
    await deleteDoc(doc(db, "products", id));
    loadProducts();
}

// Global para actualizar inventario desde el nuevo listado
window.updateStock = async function(id, change) {
    const product = products.find(p => p.id === id);
    if(!product) return;
    
    let newStock = (Number(product.stock) || 0) + change;
    if(newStock < 0) newStock = 0; 
    
    try {
        await updateDoc(doc(db, "products", id), { stock: newStock });
        product.stock = newStock;
        renderAdminViews(); 
    } catch(e) { console.error(e); }
};

// =========================
// RENDER PÚBLICO
// =========================

function renderProducts() {
    productsGrid.innerHTML = "";

    const filtered = products.filter(product => {
        const prodGender = product.gender ? product.gender : "mujer";
        return prodGender === currentCatalogGender;
    });

    filtered.forEach((product) => {
        
        // SLIDER DE IMÁGENES MÚLTIPLES DESPLAZABLES
        let imagesHtml = '';
        if (product.images && product.images.length > 0) {
            imagesHtml = `<div class="product-images-slider">`;
            product.images.forEach(img => {
                imagesHtml += `<img src="${img}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x400?text=Imagen+Rota'">`;
            });
            imagesHtml += `</div>`;
        } else {
            const imgSrc = product.image ? product.image : "https://via.placeholder.com/300x400?text=Sin+Imagen";
            imagesHtml = `<img src="${imgSrc}" class="product-image" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x400?text=Imagen+Rota'">`;
        }

        const card = `
            <div class="product-card">
                <div class="img-container">
                    ${imagesHtml}
                </div>
                <div class="product-info">
                    <div class="product-name">
                        ${product.name}<br>
                        <span style="font-size:0.8rem; color:var(--gray-dark); font-weight:normal;">Cód: ${product.code || 'N/A'}</span>
                    </div>
                    
                    <div style="font-size: 0.8rem; color: var(--gray-dark); margin-bottom: 10px;">
                        Talla: ${product.size || 'N/A'} | Color: ${product.color || 'N/A'}
                    </div>

                    <div class="product-price">$${Number(product.price || 0).toLocaleString("es-CO")}</div>
                    
                    <button class="product-btn" onclick="addToCart('${product.id}')">
                        <i class="fa-solid fa-bag-shopping"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        productsGrid.innerHTML += card;
    });

    renderAdminViews();
}

// =========================
// PESTAÑAS ADMIN (3 PARTES)
// =========================

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabName).classList.add('active');
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');
};

// FORMA 1: GUARDAR DATOS
productForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const submitBtn = productForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;

    try {
        const fileInput = document.getElementById("productImageFile");
        const files = fileInput.files;

        if (files.length > 0) {
            const readImage = (file) => new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement("canvas");
                        const MAX_WIDTH = 600; 
                        const MAX_HEIGHT = 800;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                        } else {
                            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL("image/jpeg", 0.7));
                    };
                    img.src = reader.result;
                };
                reader.readAsDataURL(file);
            });

            let compressedImages = [];
            for (let i = 0; i < files.length; i++) {
                compressedImages.push(await readImage(files[i]));
            }

            const productPriceInput = Number(document.getElementById("productPriceInput").value);

            const product = {
                name: document.getElementById("productName").value,
                code: document.getElementById("productCode").value,
                size: document.getElementById("productSize").value,
                color: document.getElementById("productColor").value,
                gender: document.getElementById("productGender").value,
                image: compressedImages[0], 
                images: compressedImages, 
                price: productPriceInput,
                stock: 0 // Se inicializa el stock para la nueva función
            };

            await addProduct(product);
            productForm.reset();
            submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Guardar Producto';
            submitBtn.disabled = false;
            
            alert("Producto agregado correctamente.");
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Ocurrió un error al procesar el producto.");
        submitBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Guardar Producto';
        submitBtn.disabled = false;
    }
});

// FORMA 3: REGISTRO DE VENTAS (FINANZAS)
financeForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const btn = financeForm.querySelector('button[type="submit"]');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    const code = document.getElementById("financeCodeSelect").value;
    const cost = Number(document.getElementById("financeCost").value);
    const price = Number(document.getElementById("financePrice").value);
    const delivery = Number(document.getElementById("financeDelivery").value);

    const saleData = {
        code: code,
        cost: cost,
        price: price,
        delivery: delivery,
        date: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "sales"), saleData);
        alert("Registro de finanza/venta creado correctamente.");
        financeForm.reset();
        loadSales(); 
    } catch(err) {
        console.error(err);
        alert("Error al guardar en la base de datos.");
    }

    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar Venta';
    btn.disabled = false;
});


// Renderizado de las vistas internas del Admin
function renderAdminViews(){

    const productsList = document.getElementById("adminProductsList");
    const financeSelect = document.getElementById("financeCodeSelect");
    const adminSalesList = document.getElementById("adminSalesList");
    const adminTotalSalesCounter = document.getElementById("adminTotalSalesCounter");
    
    // Contenedores Inventario
    const invCountEl = document.getElementById("invCount");
    const invProfitEl = document.getElementById("invProfit");
    const adminInventoryList = document.getElementById("adminInventoryList");

    financeSelect.innerHTML = '<option value="">Seleccionar Código...</option>';
    productsList.innerHTML = "<div class='admin-section-title'>Lista Rápida de Productos</div>";
    
    if(adminInventoryList) {
        adminInventoryList.innerHTML = "<div class='admin-section-title'>Control de Cantidades</div>";
    }

    let totalInventarioGanancia = 0;
    let totalPrendasStock = 0;

    // 1. Lógica Pestaña Productos e Inventario
    if(products.length === 0){
        productsList.innerHTML += "<p style='color:var(--gray-dark);'>Aún no hay prendas registradas.</p>";
        if(adminInventoryList) adminInventoryList.innerHTML += "<p style='color:var(--gray-dark);'>No hay inventario.</p>";
    } else {
        products.forEach(product => {
            const imgSrc = product.image ? product.image : "https://via.placeholder.com/60?text=Img";
            const codeDisplay = product.code ? product.code : "Sin Codigo";
            const stock = Number(product.stock) || 0;
            const price = Number(product.price) || 0;
            
            // Cálculos para el inventario (Ganancia = Stock total × Precio)
            totalPrendasStock += stock;
            totalInventarioGanancia += (stock * price);
            
            financeSelect.innerHTML += `<option value="${codeDisplay}">${codeDisplay} - ${product.name}</option>`;

            // Lista en Productos
            productsList.innerHTML += `
                <div class="admin-product-item" style="flex-direction:row;">
                    <div class="admin-product-header" style="flex:1;">
                        <img src="${imgSrc}" class="admin-product-thumb" alt="thumb">
                        <div class="admin-product-details">
                            <strong>${product.name}</strong>
                            <span style="font-size:0.8rem; color:var(--gray-dark);">Cód: ${codeDisplay} | Talla: ${product.size || 'N/A'}</span>
                        </div>
                    </div>
                    <button class="admin-delete-btn" onclick="deleteProduct('${product.id}')" title="Eliminar del sistema">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            // Lista en Inventario con Botones
            if(adminInventoryList) {
                adminInventoryList.innerHTML += `
                    <div class="admin-product-item">
                        <div class="admin-product-header">
                            <img src="${imgSrc}" class="admin-product-thumb" alt="thumb">
                            <div class="admin-product-details">
                                <strong>${product.name}</strong>
                                <span style="font-size:0.8rem; color:var(--gray-dark);">Cód: ${codeDisplay}</span>
                            </div>
                        </div>
                        <div class="inv-controls">
                            <div class="inv-stepper">
                                <button class="inv-btn" onclick="updateStock('${product.id}', -1)">-</button>
                                <span style="font-weight:700; width:65px; text-align:center;">Stock: ${stock}</span>
                                <button class="inv-btn" onclick="updateStock('${product.id}', 1)">+</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    if(invCountEl) invCountEl.textContent = totalPrendasStock;
    if(invProfitEl) invProfitEl.textContent = "$" + totalInventarioGanancia.toLocaleString("es-CO");

    // 2. Lógica de Pestaña Finanzas (Los 5 botones exactos)
    let totalVentasCount = sales.length;
    let valCompraGeneral = 0;
    let valTotalGanancia = 0;
    let valGananciaReal = 0;
    let valDomicilio = 0;

    if(adminSalesList) {
        adminSalesList.innerHTML = "<div class='admin-section-title'>Listado de Ventas</div>";
        if(sales.length === 0){
            adminSalesList.innerHTML += "<p style='color:var(--gray-dark); font-size:0.9rem;'>No hay ventas registradas.</p>";
        } else {
            sales.forEach(sale => {
                const dateObj = new Date(sale.date);
                const dateStr = dateObj.toLocaleDateString();
                
                const c = Number(sale.cost || 0);
                const p = Number(sale.price || 0);
                const d = Number(sale.delivery || 0);

                valCompraGeneral += c;
                valTotalGanancia += (c + (p - c) + d);
                valGananciaReal += (p + d);
                valDomicilio += d;

                adminSalesList.innerHTML += `
                    <div class="admin-product-item" style="flex-direction:column; gap:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong>Cód: ${sale.code || 'N/A'}</strong>
                            <span style="font-size:0.8rem; color:var(--gray-dark);">${dateStr}</span>
                        </div>
                        <div style="font-size:0.85rem; color:var(--gray-dark); line-height:1.4;">
                            Compra: $${c.toLocaleString("es-CO")} | Venta: $${p.toLocaleString("es-CO")}<br>
                            Domicilio: $${d.toLocaleString("es-CO")}
                        </div>
                        <div style="display:flex; gap:10px; margin-top:5px;">
                            <button onclick="editSale('${sale.id}', ${c}, ${p}, ${d})" style="background:#f1c40f; border:none; padding:8px; border-radius:8px; color:white; cursor:pointer; flex:1;" title="Editar Venta"><i class="fa-solid fa-pen"></i> Editar</button>
                            <button onclick="deleteSale('${sale.id}')" style="background:#ff4757; border:none; padding:8px; border-radius:8px; color:white; cursor:pointer; flex:1;" title="Eliminar Venta"><i class="fa-solid fa-trash"></i> Borrar</button>
                        </div>
                    </div>
                `;
            });
        }
    }

    if(adminTotalSalesCounter) {
        adminTotalSalesCounter.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom:15px;">
                <button class="btn-modern-submit" style="margin:0; font-size:0.8rem; padding:12px; background:#111;">Ventas Actuales: <br><span style="font-size:1.1rem">${totalVentasCount}</span></button>
                <button class="btn-modern-submit" style="margin:0; font-size:0.8rem; padding:12px; background:#2980b9;">Compra Gral: <br><span style="font-size:1.1rem">$${valCompraGeneral.toLocaleString("es-CO")}</span></button>
                <button class="btn-modern-submit" style="margin:0; font-size:0.8rem; padding:12px; background:#27ae60; grid-column:1/-1;">Total Ganancia (Formula Solicitada): <br><span style="font-size:1.2rem">$${valTotalGanancia.toLocaleString("es-CO")}</span></button>
                <button class="btn-modern-submit" style="margin:0; font-size:0.8rem; padding:12px; background:#8e44ad; grid-column:1/-1;">Ganancia Real (Venta + Dom): <br><span style="font-size:1.2rem">$${valGananciaReal.toLocaleString("es-CO")}</span></button>
                <button class="btn-modern-submit" style="margin:0; font-size:0.8rem; padding:12px; background:#d35400; grid-column:1/-1;">Valor de Domicilios: <br><span style="font-size:1.2rem">$${valDomicilio.toLocaleString("es-CO")}</span></button>
            </div>
        `;
    }
}

// Globales Edición y Eliminación Ventas
window.deleteSale = async function(saleId) {
    if(!confirm("¿Eliminar este registro de venta permanentemente?")) return;
    await deleteDoc(doc(db, "sales", saleId));
    loadSales();
};

window.editSale = async function(saleId, oldCost, oldPrice, oldDelivery) {
    const newCost = prompt("Editar Valor de Compra ($):", oldCost);
    if(newCost === null || newCost.trim() === "") return;
    const newPrice = prompt("Editar Valor de Venta ($):", oldPrice);
    if(newPrice === null || newPrice.trim() === "") return;
    const newDelivery = prompt("Editar Valor de Domicilio ($):", oldDelivery);
    if(newDelivery === null || newDelivery.trim() === "") return;

    if(!isNaN(newCost) && !isNaN(newPrice) && !isNaN(newDelivery)) {
        await updateDoc(doc(db, "sales", saleId), { 
            cost: Number(newCost),
            price: Number(newPrice),
            delivery: Number(newDelivery)
        });
        loadSales();
    } else {
        alert("Por favor ingresa únicamente valores numéricos válidos.");
    }
};

// =========================
// SEGURIDAD MODAL ADMIN CON MEMORIA
// =========================

adminBtn.addEventListener("click", () => {
    adminModal.classList.add("active");
    if(localStorage.getItem("adminVoraModaLogged") === "true"){
        adminLoginView.style.display = "none";
        adminAppView.style.display = "flex";
    }
});

closeAdmin.addEventListener("click", () => {
    adminModal.classList.remove("active");
});

closeLoginBtn.addEventListener("click", () => {
    adminModal.classList.remove("active");
});

loginSubmitBtn.addEventListener("click", () => {
    const email = document.getElementById("adminEmail").value;
    const pass = document.getElementById("adminPassword").value;
    
    if(email === ADMIN_USER && pass === ADMIN_PASS){
        localStorage.setItem("adminVoraModaLogged", "true");
        adminLoginView.style.display = "none";
        adminAppView.style.display = "flex";
    } else {
        alert("Credenciales incorrectas de administrador.");
    }
});

// =========================
// FUNCIONES GLOBALES
// =========================

window.addToCart = function(id){
    const product = products.find(p => p.id === id);
    if(!product) return;
    cart.push(product);
    updateCart();
};

window.deleteProduct = async function(id){
    if(!confirm("¿Seguro que deseas eliminar este producto permanentemente de la tienda?")) return;
    await removeProduct(id);
};

// =========================
// WHATSAPP
// =========================

checkoutBtn.addEventListener("click", () => {
    if(cart.length === 0){ alert("Tu carrito está vacío"); return; }

    let message = "Hola, deseo comprar:%0A%0A";
    let totalVenta = 0;
    let totalCompra = 0;

    cart.forEach(item => {
        totalVenta += Number(item.price || 0);
        totalCompra += Number(item.costPrice || 0); // Asegúrate que cada producto tenga costPrice
        message += `• ${item.name} (Cod: ${item.code || 'N/A'}) - $${Number(item.price || 0).toLocaleString("es-CO")}%0A`;
    });

    message += `%0A-------------------`;
    message += `%0A*Valor Total Compra (Costo):* $${totalCompra.toLocaleString("es-CO")}`;
    message += `%0A*Total a Pagar (Venta):* $${totalVenta.toLocaleString("es-CO")}`;
    
    window.open(`https://wa.me/573160673379?text=${message}`, "_blank");
});

// =========================
// INICIO
// =========================

loadProducts();