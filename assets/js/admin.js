const statusBox = document.getElementById("status");
const loginBox = document.getElementById("loginBox");
const dashboardBox = document.getElementById("dashboardBox");
const productList = document.getElementById("productList");
const saveButton = document.getElementById("saveButton");
const cancelEditButton = document.getElementById("cancelEditButton");
let editingProductId = null;
let currentProducts = [];

function showStatus(message) {
  statusBox.textContent = message;
}

function value(id) {
  return document.getElementById(id).value.trim();
}

function setValue(id, val) {
  document.getElementById(id).value = val ?? "";
}

function makeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    loginBox.classList.add("hidden");
    dashboardBox.classList.remove("hidden");
    loadProducts();
  } else {
    loginBox.classList.remove("hidden");
    dashboardBox.classList.add("hidden");
  }
}

async function login() {
  const email = value("email");
  const password = value("password");

  showStatus("Mencoba login...");

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    showStatus("Login gagal: " + error.message);
    return;
  }

  showStatus("Login berhasil.");
  checkSession();
}

async function logout() {
  await supabaseClient.auth.signOut();
  showStatus("Berhasil logout.");
  checkSession();
}

function ensureCategoryOption(category) {
  const select = document.getElementById("category");
  if (!select || !category) return;
  const exists = Array.from(select.options).some(option => option.value === category);
  if (!exists) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  }
}

function getProductPayload() {
  const tags = value("tags")
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);

  return {
    title: value("title"),
    slug: value("slug"),
    subtitle: value("subtitle"),
    description: value("description"),
    category: value("category") || "Digital Products",
    tags,
    price: Number(value("price") || 0),
    compare_at_price: value("compare_at_price") ? Number(value("compare_at_price")) : null,
    cover_url: value("cover_url"),
    checkout_url: value("checkout_url"),
    preview_url: "",
    ebook_url: value("ebook_url"),
    access_token: value("access_token"),
    token_enabled: Boolean(value("access_token") && value("ebook_url")),
    sort_order: Number(value("sort_order") || 0),
    is_published: document.getElementById("is_published").value === "true"
  };
}

async function saveProduct() {
  const product = getProductPayload();

  if (!product.title || !product.slug) {
    showStatus("Nama produk dan slug wajib diisi.");
    return;
  }

  showStatus(editingProductId ? "Menyimpan perubahan..." : "Menyimpan produk...");

  const query = editingProductId
    ? supabaseClient.from("products").update(product).eq("id", editingProductId)
    : supabaseClient.from("products").insert(product);

  const { error } = await query;

  if (error) {
    showStatus("Gagal menyimpan: " + error.message);
    return;
  }

  showStatus(editingProductId ? "Produk berhasil diperbarui." : "Produk berhasil disimpan.");
  resetForm();
  loadProducts();
}

function resetForm() {
  editingProductId = null;
  [
    "title", "slug", "subtitle", "description", "category", "price", "compare_at_price",
    "tags", "cover_url", "checkout_url", "ebook_url", "access_token", "sort_order"
  ].forEach(id => setValue(id, ""));
  setValue("category", "Digital Products");
  setValue("is_published", "true");
  saveButton.textContent = "Simpan Produk";
  cancelEditButton.style.display = "none";
}

function editProduct(id) {
  const product = currentProducts.find(item => item.id === id);
  if (!product) return;

  editingProductId = id;
  setValue("title", product.title);
  setValue("slug", product.slug);
  setValue("subtitle", product.subtitle);
  setValue("description", product.description);
  ensureCategoryOption(product.category);
  setValue("category", product.category || "Digital Products");
  setValue("price", product.price);
  setValue("compare_at_price", product.compare_at_price);
  setValue("tags", Array.isArray(product.tags) ? product.tags.join(", ") : "");
  setValue("cover_url", product.cover_url);
  setValue("checkout_url", product.checkout_url);
  setValue("ebook_url", product.ebook_url);
  setValue("access_token", product.access_token);
  setValue("sort_order", product.sort_order);
  setValue("is_published", product.is_published ? "true" : "false");

  saveButton.textContent = "Simpan Perubahan";
  cancelEditButton.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadProducts() {
  productList.innerHTML = "Memuat produk...";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    productList.innerHTML = "Gagal memuat produk: " + error.message;
    return;
  }

  currentProducts = data || [];

  if (!currentProducts.length) {
    productList.innerHTML = "Belum ada produk.";
    return;
  }

  productList.innerHTML = currentProducts.map(product => {
    const type = product.access_token || product.ebook_url || product.token_enabled ? "Digital" : "Produk";
    return `
      <div class="product-item">
        <h3>${product.title || "Produk tanpa judul"}</h3>
        <p>${product.category || "Produk"} · ${type} · ${product.is_published ? "Published" : "Draft"}</p>
        <p>Harga: Rp${Number(product.price || 0).toLocaleString("id-ID")}</p>
        <p>Slug: ${product.slug || "-"}</p>
        <div class="product-actions">
          <button onclick="editProduct('${product.id}')">Edit</button>
          <button onclick="togglePublish('${product.id}', ${product.is_published})">${product.is_published ? "Unpublish" : "Publish"}</button>
          <button class="danger" onclick="deleteProduct('${product.id}')">Hapus</button>
        </div>
      </div>
    `;
  }).join("");
}

async function togglePublish(id, currentStatus) {
  const { error } = await supabaseClient
    .from("products")
    .update({ is_published: !currentStatus })
    .eq("id", id);

  if (error) {
    showStatus("Gagal update status: " + error.message);
    return;
  }

  showStatus("Status produk berhasil diubah.");
  loadProducts();
}

async function deleteProduct(id) {
  const confirmDelete = confirm("Yakin mau hapus produk ini?");
  if (!confirmDelete) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    showStatus("Gagal hapus produk: " + error.message);
    return;
  }

  showStatus("Produk berhasil dihapus.");
  loadProducts();
}

document.addEventListener("DOMContentLoaded", function () {
  const titleInput = document.getElementById("title");
  const slugInput = document.getElementById("slug");

  if (titleInput && slugInput) {
    titleInput.addEventListener("input", function () {
      if (!slugInput.value.trim()) {
        slugInput.value = makeSlug(this.value);
      }
    });
  }

  checkSession();
});
