
// توجه: این رمز فقط برای نسخه نمایشی است.
const ADMIN_PASSWORD = "ehsan123";

const PRODUCTS_KEY = "ehsan_products";
const CART_KEY = "ehsan_cart";

let products = loadData(PRODUCTS_KEY, []);
let cart = loadData(CART_KEY, []);
let loggedIn = false;

const numberFormat = new Intl.NumberFormat("fa-IR");

function loadData(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function money(value) {
  return numberFormat.format(value) + " تومان";
}

// جلوگیری از تفسیر نام محصول به‌عنوان HTML
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderCategories() {
  const select = document.getElementById("category");
  const selected = select.value;

  const categories = [...new Set(
    products.map(product => product.category).filter(Boolean)
  )];

  select.innerHTML =
    '<option value="">همه دسته‌ها</option>' +
    categories.map(item =>
      `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`
    ).join("");

  select.value = categories.includes(selected) ? selected : "";
}

function renderProducts() {
  renderCategories();

  const query = document.getElementById("search").value
    .trim().toLocaleLowerCase("fa");

  const category = document.getElementById("category").value;

  const filtered = products.filter(product => {
    const text = `${product.name} ${product.category} ${product.description}`
      .toLocaleLowerCase("fa");

    return text.includes(query) &&
      (!category || product.category === category);
  });

  const container = document.getElementById("productList");

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">＋</div>
        <h3>${products.length ? "محصولی پیدا نشد" : "هنوز محصولی اضافه نشده"}</h3>
        <p>${products.length
          ? "جست‌وجو یا دسته‌بندی را تغییر بده."
          : "از پنل مدیریت، اولین محصول را اضافه کن."}</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-image">
        ${product.image
          ? `<img src="${escapeHTML(product.image)}"
              alt="${escapeHTML(product.name)}"
              onerror="this.style.display='none'">`
          : "⚙"}
      </div>
      <div class="product-content">
        <span class="category-label">${escapeHTML(product.category)}</span>
        <h3>${escapeHTML(product.name)}</h3>
        <p>${escapeHTML(product.description || "برای اطلاع از جزئیات تماس بگیرید.")}</p>
        <div class="product-bottom">
          <span class="price">${money(product.price)}</span>
          <button class="add-btn" data-add="${escapeHTML(product.id)}">
            افزودن به سبد
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderAdminProducts() {
  const container = document.getElementById("adminProducts");

  if (!products.length) {
    container.innerHTML = '<p class="muted">محصولی ثبت نشده است.</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="admin-item">
      <span>${escapeHTML(product.name)} — ${money(product.price)}</span>
      <button class="delete-btn" data-delete="${escapeHTML(product.id)}">
        حذف
      </button>
    </div>
  `).join("");
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById("cartCount").textContent = numberFormat.format(count);

  const container = document.getElementById("cartItems");
  let total = 0;

  const validCart = cart.filter(item =>
    products.some(product => product.id === item.id)
  );

  cart = validCart;

  if (!cart.length) {
    container.innerHTML = '<p class="muted">سبد خرید خالی است.</p>';
  } else {
    container.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      total += product.price * item.qty;

      return `
        <div class="cart-item">
          <span>${escapeHTML(product.name)} × ${numberFormat.format(item.qty)}</span>
          <b>${money(product.price * item.qty)}</b>
          <button class="remove-btn" data-remove="${escapeHTML(product.id)}">حذف</button>
        </div>`;
    }).join("");
  }

  document.getElementById("total").textContent = money(total);
  saveData();
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.getElementById("adminBtn").addEventListener("click", () => {
  document.getElementById("loginPanel").hidden = loggedIn;
  document.getElementById("dashboard").hidden = !loggedIn;

  if (loggedIn) renderAdminProducts();

  openModal("adminOverlay");
});

document.getElementById("cartBtn").addEventListener("click", () => {
  renderCart();
  openModal("cartOverlay");
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".overlay").forEach(overlay => {
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeModal(overlay.id);
  });
});

document.getElementById("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const password = document.getElementById("password").value;
  const error = document.getElementById("loginError");

  if (password === ADMIN_PASSWORD) {
    loggedIn = true;
    document.getElementById("loginPanel").hidden = true;
    document.getElementById("dashboard").hidden = false;
    document.getElementById("password").value = "";
    error.textContent = "";
    renderAdminProducts();
  } else {
    error.textContent = "رمز واردشده صحیح نیست.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  loggedIn = false;
  closeModal("adminOverlay");
});

document.getElementById("productForm").addEventListener("submit", event => {
  event.preventDefault();

  if (!loggedIn) return;

  const name = document.getElementById("name").value.trim();
  const price = Number(document.getElementById("price").value);
  const category = document.getElementById("productCategory").value.trim();
  const image = document.getElementById("image").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!name || !category || !Number.isFinite(price) || price < 0) return;

  products.unshift({
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()),
    name,
    price,
    category,
    image,
    description
  });

  saveData();
  event.target.reset();
  renderProducts();
  renderAdminProducts();
  renderCart();
});

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");

  if (addButton) {
    const id = addButton.dataset.add;
    const existing = cart.find(item => item.id === id);

    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id, qty: 1 });
    }

    saveData();
    renderCart();
    addButton.textContent = "اضافه شد ✓";

    setTimeout(() => {
      if (addButton.isConnected) {
        addButton.textContent = "افزودن به سبد";
      }
    }, 900);
  }

  const deleteButton = event.target.closest("[data-delete]");

  if (deleteButton && loggedIn) {
    const id = deleteButton.dataset.delete;
    products = products.filter(product => product.id !== id);
    cart = cart.filter(item => item.id !== id);

    saveData();
    renderProducts();
    renderAdminProducts();
    renderCart();
  }

  const removeButton = event.target.closest("[data-remove]");

  if (removeButton) {
    cart = cart.filter(item => item.id !== removeButton.dataset.remove);
    saveData();
    renderCart();
  }
});

document.getElementById("search").addEventListener("input", renderProducts);
document.getElementById("category").addEventListener("change", renderProducts);

renderProducts();
renderCart();
