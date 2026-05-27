const statusBox = document.getElementById("status");
const loginBox = document.getElementById("loginBox");
const dashboardBox = document.getElementById("dashboardBox");
const productList = document.getElementById("productList");

function showStatus(message) {
  statusBox.textContent = message;
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
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  showStatus("Mencoba login...");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

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

function makeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function clearValue(id) {
  const el = document.getElementById(id);
  if (el) el.value = "";
}

async function addProduct() {
  const product = {
    title: getValue("title"),
    slug: getValue("slug"),
    subtitle: getValue("subtitle"),
    description: getValue("description"),
    category: getValue("category") || "Ebook",
    price: Number(getValue("price") || 0),
    compare_at_price: getValue("compare_at_price")
      ? Number(getValue("compare_at_price"))
      : null,
    cover_url: getValue("cover_url"),
    checkout_url: getValue("checkout_url"),
    preview_url: getValue("preview_url"),
    ebook_url: getValue("ebook_url"),
    access_token: getValue("access_token"),
    is_published: document.getElementById("is_published").value === "true"
  };

  if (!product.title || !product.slug) {
    showStatus("Judul dan slug wajib diisi.");
    return;
  }

  showStatus("Menyimpan produk...");

  const { error } = await supabaseClient
    .from("products")
    .insert(product);

  if (error) {
    showStatus("Gagal menyimpan: " + error.message);
    return;
  }

  showStatus("Produk berhasil disimpan.");

  [
    "title",
    "slug",
    "subtitle",
    "description",
    "category",
    "price",
    "compare_at_price",
    "cover_url",
    "checkout_url",
    "preview_url",
    "ebook_url",
    "access_token"
  ].forEach(clearValue);

  document.getElementById("is_published").value = "true";

  loadProducts();
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

  if (!data || data.length === 0) {
    productList.innerHTML = "Belum ada produk.";
    return;
  }

  productList.innerHTML = data.map(product => `
    <div class="product-item">
      <strong>${product.title}</strong><br>
      <small>${product.is_published ? "Published" : "Draft"}</small><br>
      <small>Slug: ${product.slug || "-"}</small><br>
      <small>Harga: Rp${Number(product.price).toLocaleString("id-ID")}</small><br>
      <small>Checkout: ${product.checkout_url || "belum diisi"}</small><br>
      <small>Ebook: ${product.ebook_url || "belum diisi"}</small><br>
      <small>Token: ${product.access_token || "belum diisi"}</small><br><br>

      <button onclick="togglePublish('${product.id}', ${product.is_published})">
        ${product.is_published ? "Unpublish" : "Publish"}
      </button>

      <button onclick="deleteProduct('${product.id}')" class="danger">
        Hapus
      </button>
    </div>
  `).join("");
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
