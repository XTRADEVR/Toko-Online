/**
 * LangkahLokal Co. - Progressive Web App Logic
 */

// Phone Admin Toko WhatsApp (Format Internasional tanpa tanda +)
const STORE_PHONE = '6281234567890';

// App State
let state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('ll_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('ll_wishlist')) || [],
  orders: JSON.parse(localStorage.getItem('ll_orders')) || [],
  activeCategory: 'all',
  activeSize: 'all',
  searchQuery: '',
  selectedProduct: null,
  selectedSize: null
};

// DOM Selectors
const productGrid = document.getElementById('productGrid');
const wishlistGrid = document.getElementById('wishlistGrid');
const orderHistoryList = document.getElementById('orderHistoryList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const categoryChips = document.getElementById('categoryChips');
const sizeFilter = document.getElementById('sizeFilter');
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartDrawer = document.getElementById('cartDrawer');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const productModal = document.getElementById('productModal');
const modalProductDetail = document.getElementById('modalProductDetail');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const btnOrderWhatsapp = document.getElementById('btnOrderWhatsapp');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view-section');

// 1. Initial Load & Fetch Data
async function initApp() {
  try {
    const res = await fetch('./app-data.json');
    if (!res.ok) throw new Error('Gagal mengambil data produk');
    state.products = await res.json();
    renderProducts();
    updateCartUI();
  } catch (error) {
    console.error(error);
    productGrid.innerHTML = `<p class="empty-state">Gagal memuat katalog: ${error.message}</p>`;
  }
}

// 2. Format Rupiah
const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

// 3. Render Product Catalog
function renderProducts() {
  const filtered = state.products.filter(p => {
    const matchCat = state.activeCategory === 'all' || p.kategori === state.activeCategory;
    const matchSize = state.activeSize === 'all' || p.ukuran.includes(Number(state.activeSize));
    const matchSearch = p.nama.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                        p.deskripsi.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchCat && matchSize && matchSearch;
  });

  if (filtered.length === 0) {
    productGrid.innerHTML = `<p class="empty-state">Sepatu tidak ditemukan. Coba ubah kata kunci atau filter.</p>`;
    return;
  }

  productGrid.innerHTML = filtered.map(item => {
    const isLiked = state.wishlist.includes(item.id);
    return `
      <div class="card" data-id="${item.id}">
        <div class="card-img-wrap">
          <img src="${item.foto}" alt="${item.nama}" loading="lazy">
          <button class="wishlist-toggle ${isLiked ? 'liked' : ''}" onclick="toggleWishlist('${item.id}', event)">
            ${isLiked ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-content" onclick="openProductDetail('${item.id}')">
          <span class="card-cat">${item.kategori}</span>
          <h3 class="card-title">${item.nama}</h3>
          <div class="card-price">${formatRupiah(item.harga)}</div>
          <button class="btn btn-primary" onclick="openProductDetail('${item.id}'); event.stopPropagation();">
            Pilih Ukuran
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 4. Modal Detail Produk
window.openProductDetail = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  state.selectedProduct = product;
  state.selectedSize = product.ukuran[0]; // default size

  modalProductDetail.innerHTML = `
    <img src="${product.foto}" alt="${product.nama}">
    <span class="card-cat">${product.kategori}</span>
    <h2>${product.nama}</h2>
    <div class="card-price" style="font-size: 1.25rem; margin: 0.25rem 0;">${formatRupiah(product.harga)}</div>
    <p style="font-size:0.85rem; color: var(--text-muted); margin-bottom:1rem;">${product.deskripsi}</p>
    
    <label style="font-size:0.85rem; font-weight:700;">Pilih Ukuran Sepatu:</label>
    <div class="size-picker" id="sizePicker">
      ${product.ukuran.map(sz => `
        <div class="size-option ${sz === state.selectedSize ? 'selected' : ''}" onclick="selectSize(${sz})">
          ${sz}
        </div>
      `).join('')}
    </div>

    <button class="btn btn-primary" style="padding: 0.85rem;" onclick="addToCart()">
      + Masukkan ke Keranjang
    </button>
  `;
  productModal.style.display = 'flex';
};

window.selectSize = function(size) {
  state.selectedSize = size;
  document.querySelectorAll('.size-option').forEach(el => {
    el.classList.toggle('selected', el.innerText.trim() === String(size));
  });
};

closeDetailBtn.addEventListener('click', () => {
  productModal.style.display = 'none';
});

// 5. Cart Logic
window.addToCart = function() {
  if (!state.selectedProduct || !state.selectedSize) return;

  const existingIndex = state.cart.findIndex(
    item => item.id === state.selectedProduct.id && item.size === state.selectedSize
  );

  if (existingIndex > -1) {
    state.cart[existingIndex].qty += 1;
  } else {
    state.cart.push({
      id: state.selectedProduct.id,
      nama: state.selectedProduct.nama,
      harga: state.selectedProduct.harga,
      foto: state.selectedProduct.foto,
      size: state.selectedSize,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  productModal.style.display = 'none';
  cartDrawer.style.display = 'flex';
};

function saveCart() {
  localStorage.setItem('ll_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((acc, i) => acc + i.qty, 0);
  cartBadge.innerText = totalCount;

  if (state.cart.length === 0) {
    cartItemsList.innerHTML = `<p class="empty-state">Keranjang Anda masih kosong.</p>`;
    cartTotalPrice.innerText = 'Rp 0';
    return;
  }

  let total = 0;
  cartItemsList.innerHTML = state.cart.map((item, idx) => {
    total += item.harga * item.qty;
    return `
      <div class="cart-item">
        <img src="${item.foto}" alt="${item.nama}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.nama}</div>
          <div class="cart-item-meta">Size: ${item.size} | ${formatRupiah(item.harga)}</div>
          <div class="cart-actions" style="margin-top: 4px;">
            <button class="qty-btn" onclick="updateItemQty(${idx}, -1)">-</button>
            <span style="font-size:0.85rem; font-weight:bold;">${item.qty}</span>
            <button class="qty-btn" onclick="updateItemQty(${idx}, 1)">+</button>
          </div>
        </div>
        <button class="icon-btn" onclick="removeItem(${idx})" style="color:var(--danger); font-size:1rem;">🗑️</button>
      </div>
    `;
  }).join('');

  cartTotalPrice.innerText = formatRupiah(total);
}

window.updateItemQty = function(index, delta) {
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
};

window.removeItem = function(index) {
  state.cart.splice(index, 1);
  saveCart();
  updateCartUI();
};

// Open & Close Cart
cartBtn.addEventListener('click', () => cartDrawer.style.display = 'flex');
closeCartBtn.addEventListener('click', () => cartDrawer.style.display = 'none');

// 6. Checkout WhatsApp
btnOrderWhatsapp.addEventListener('click', () => {
  if (state.cart.length === 0) {
    alert('Keranjang Anda masih kosong!');
    return;
  }

  const name = document.getElementById('custName').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const payment = document.getElementById('custPayment').value;

  if (!name || !address) {
    alert('Harap lengkapi nama dan alamat pengiriman!');
    return;
  }

  const orderId = 'LL-' + Date.now().toString().slice(-6);
  let totalOrder = 0;
  let itemsText = '';

  state.cart.forEach((i, idx) => {
    const sub = i.harga * i.qty;
    totalOrder += sub;
    itemsText += `${idx + 1}. ${i.nama} (Size ${i.size}) x${i.qty} = ${formatRupiah(sub)}\n`;
  });

  const orderPayload = {
    orderId,
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: [...state.cart],
    total: totalOrder,
    status: 'Menunggu Konfirmasi CS'
  };

  // Simpan riwayat pesanan
  state.orders.unshift(orderPayload);
  localStorage.setItem('ll_orders', JSON.stringify(state.orders));

  // Format pesan WhatsApp
  const waMessage = 
`*PESANAN BARU SEPATU LANGKAHLOKAL*
ID Pesanan: *#${orderId}*

*Daftar Produk:*
${itemsText}
*Total Biaya:* ${formatRupiah(totalOrder)}

*Data Pemesan:*
Nama: ${name}
Alamat: ${address}
Pembayaran: ${payment}

Mohon konfirmasi ketersediaan stok & ongkos kirim ya min, terima kasih!`;

  const waUrl = `https://api.whatsapp.com/send?phone=${STORE_PHONE}&text=${encodeURIComponent(waMessage)}`;

  // Clear Cart & Form
  state.cart = [];
  saveCart();
  updateCartUI();
  document.getElementById('custName').value = '';
  document.getElementById('custAddress').value = '';
  cartDrawer.style.display = 'none';

  // Buka WhatsApp di tab baru
  window.open(waUrl, '_blank');
  renderHistory();
});

// 7. Wishlist / Favorit
window.toggleWishlist = function(id, evt) {
  evt.stopPropagation();
  const idx = state.wishlist.indexOf(id);
  if (idx > -1) {
    state.wishlist.splice(idx, 1);
  } else {
    state.wishlist.push(id);
  }
  localStorage.setItem('ll_wishlist', JSON.stringify(state.wishlist));
  renderProducts();
  renderWishlist();
};

function renderWishlist() {
  const wishItems = state.products.filter(p => state.wishlist.includes(p.id));
  if (wishItems.length === 0) {
    wishlistGrid.innerHTML = `<p class="empty-state">Belum ada sepatu favorit.</p>`;
    return;
  }
  wishlistGrid.innerHTML = wishItems.map(item => `
    <div class="card" data-id="${item.id}">
      <div class="card-img-wrap">
        <img src="${item.foto}" alt="${item.nama}" loading="lazy">
        <button class="wishlist-toggle liked" onclick="toggleWishlist('${item.id}', event)">❤️</button>
      </div>
      <div class="card-content" onclick="openProductDetail('${item.id}')">
        <span class="card-cat">${item.kategori}</span>
        <h3 class="card-title">${item.nama}</h3>
        <div class="card-price">${formatRupiah(item.harga)}</div>
      </div>
    </div>
  `).join('');
}

// 8. Order History
function renderHistory() {
  if (state.orders.length === 0) {
    orderHistoryList.innerHTML = `<p class="empty-state">Belum ada riwayat pesanan.</p>`;
    return;
  }
  orderHistoryList.innerHTML = state.orders.map(order => `
    <div class="history-card">
      <div class="history-header">
        <strong>Order #${order.orderId}</strong>
        <span>${order.date}</span>
      </div>
      <div style="font-size:0.85rem; margin-bottom: 0.5rem;">
        ${order.items.map(i => `• ${i.nama} (Size ${i.size}) x${i.qty}`).join('<br>')}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.75rem; background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-weight:600;">
          ${order.status}
        </span>
        <strong style="color:var(--primary); font-size:0.95rem;">${formatRupiah(order.total)}</strong>
      </div>
    </div>
  `).join('');
}

// 9. Filters & Events
categoryChips.addEventListener('click', (e) => {
  if (e.target.classList.contains('chip')) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    state.activeCategory = e.target.dataset.cat;
    renderProducts();
  }
});

sizeFilter.addEventListener('change', (e) => {
  state.activeSize = e.target.value;
  renderProducts();
});

searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
  renderProducts();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  state.searchQuery = '';
  clearSearchBtn.style.display = 'none';
  renderProducts();
});

// 10. Tab Navigation
navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    const targetView = document.getElementById(btn.dataset.target);
    if (targetView) targetView.classList.add('active');

    // Trigger sub-renderers
    if (btn.dataset.target === 'viewWishlist') renderWishlist();
    if (btn.dataset.target === 'viewHistory') renderHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// 11. Modal Backdrop Click to Close
window.addEventListener('click', (e) => {
  if (e.target === productModal) productModal.style.display = 'none';
  if (e.target === cartDrawer) cartDrawer.style.display = 'none';
});

// Start the application
initApp();
