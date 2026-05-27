let allProducts = [];
let activeFilter = "all";

const CATEGORY_CONFIG = [
  { label: "Semua", value: "all", icon: "★" },
  { label: "Digital Products", value: "Digital Products", icon: "💾" },
  { label: "Fashion", value: "Fashion", icon: "👕" },
  { label: "Accessories", value: "Accessories", icon: "⌚" }
];

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function formatPrice(value) {
  const number = Number(value || 0);
  if (!number) return "Rp0";
  return "Rp" + number.toLocaleString("id-ID");
}

function productMatchesCategory(product, categoryValue) {
  if (categoryValue === "all") return true;

  const category = normalizeText(product.category);
  const title = normalizeText(product.title);
  const subtitle = normalizeText(product.subtitle);
  const description = normalizeText(product.description);
  const tags = Array.isArray(product.tags)
    ? product.tags.map(normalizeText).join(" ")
    : normalizeText(product.tags);

  const combined = `${category} ${title} ${subtitle} ${description} ${tags}`;

  const map = {
    "digital products": ["digital", "produk digital", "ebook", "template", "file", "download", "course", "kelas"],
    "ebook": ["ebook", "e-book", "panduan", "guide", "buku digital"],
    "template": ["template", "planner", "checklist", "worksheet", "dokumen"],
    "fashion": ["fashion", "baju", "kaos", "hoodie", "apparel", "wear", "clothing"],
    "accessories": ["accessories", "aksesoris", "aksesori", "jam", "tas", "case", "strap"],
    "physical products": ["physical", "fisik", "barang", "produk fisik", "merchandise"],
    "bundle": ["bundle", "paket", "combo", "set"]
  };

  const key = normalizeText(categoryValue);
  const keywords = map[key] || [key];

  return keywords.some(keyword => combined.includes(keyword));
}

function getCategoryCount(categoryValue) {
  return allProducts.filter(product => productMatchesCategory(product, categoryValue)).length;
}

function buildCategoryStrip() {
  const categoryStrip = document.getElementById("categoryStrip");
  if (!categoryStrip) return;

  categoryStrip.innerHTML = CATEGORY_CONFIG.map(category => {
    const count = getCategoryCount(category.value);
    const isActive = activeFilter === category.value ? "active" : "";

    return `
      <button class="category-card js-filter-trigger ${isActive}" data-filter="${category.value}" type="button">
        <span class="category-icon">${category.icon}</span>
        <span class="category-name">${category.label}</span>
        <span class="category-count">${count} produk</span>
      </button>
    `;
  }).join("");

  bindFilterTriggers();
}

function getFilteredProducts() {
  const searchInput = document.getElementById("productSearch");
  const sortSelect = document.getElementById("sortSelect");

  const query = normalizeText(searchInput ? searchInput.value : "");
  const sort = sortSelect ? sortSelect.value : "newest";

  let products = allProducts.filter(product => productMatchesCategory(product, activeFilter));

  if (query) {
    products = products.filter(product => {
      const tags = Array.isArray(product.tags) ? product.tags.join(" ") : String(product.tags || "");
      const haystack = normalizeText(`${product.title} ${product.subtitle} ${product.description} ${product.category} ${tags}`);
      return haystack.includes(query);
    });
  }

  products = [...products];

  if (sort === "low") {
    products.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (sort === "high") {
    products.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else if (sort === "az") {
    products.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  } else {
    products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  return products;
}

function getCategoryIcon(product) {
  const text = `${product.category || ""} ${product.title || ""}`.toLowerCase();

  if (text.includes("ebook") || text.includes("buku")) return "📘";
  if (text.includes("template")) return "📄";
  if (text.includes("fashion") || text.includes("kaos") || text.includes("baju")) return "👕";
  if (text.includes("access") || text.includes("aksesor")) return "⌚";
  if (text.includes("bundle") || text.includes("paket")) return "🎁";
  if (text.includes("fisik") || text.includes("physical")) return "📦";

  return "💾";
}

function renderProducts() {
  const catalogContainer = document.getElementById("catalog-products");
  const activeFilterText = document.getElementById("activeFilterText");

  if (!catalogContainer) return;

  const products = getFilteredProducts();
  const filterLabel = activeFilter === "all" ? "semua produk" : activeFilter;

  if (activeFilterText) {
    activeFilterText.textContent = `Menampilkan ${products.length} produk untuk kategori ${filterLabel}.`;
  }

  if (!products.length) {
    catalogContainer.innerHTML = `
      <div class="empty-state">
        <strong>Belum ada produk di kategori ini.</strong>
        Tambahkan produk dari admin, isi kategori yang sesuai, lalu aktifkan publish.
      </div>
    `;
    return;
  }

  catalogContainer.innerHTML = products.map(product => {
    const detailUrl = `checkout.html?produk=${encodeURIComponent(product.slug)}`;

    const tags = Array.isArray(product.tags)
      ? product.tags.filter(Boolean).slice(0, 3)
      : String(product.tags || "").split(",").map(item => item.trim()).filter(Boolean).slice(0, 3);

    const cover = product.cover_url
      ? `<img src="${product.cover_url}" alt="${product.title}">`
      : `<div class="placeholder">${getCategoryIcon(product)}</div>`;

    return `
      <article class="product-card">
        <div class="product-cover">
          <span class="badge">${product.category || "Produk"}</span>
          ${cover}
        </div>

        <div class="product-body">
          <h3>${product.title || "Produk tanpa judul"}</h3>
          <p>${product.subtitle || product.description || "Detail produk tersedia di halaman checkout."}</p>

          <div class="tags">
            ${(tags.length ? tags : [product.category || "Produk"]).map(tag => `<span>${tag}</span>`).join("")}
          </div>

          <div class="product-footer">
            <span class="price">
              ${product.compare_at_price ? `<small>${formatPrice(product.compare_at_price)}</small>` : ""}
              ${formatPrice(product.price)}
            </span>
            <a class="detail-btn" href="${detailUrl}">Lihat Detail</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function setActiveFilter(filterValue) {
  activeFilter = filterValue || "all";

  document.querySelectorAll(".js-filter-trigger").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === activeFilter);
  });

  buildCategoryStrip();
  renderProducts();

  const productSection = document.getElementById("produk");
  if (productSection) {
    productSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function bindFilterTriggers() {
  document.querySelectorAll(".js-filter-trigger").forEach(button => {
    button.onclick = function () {
      setActiveFilter(this.dataset.filter || "all");
    };
  });
}

async function loadPublicProducts() {
  const catalogContainer = document.getElementById("catalog-products");

  if (!catalogContainer) return;

  catalogContainer.innerHTML = `
    <div class="empty-state">
      <strong>Memuat produk...</strong>
      Produk yang sudah dipublish dari admin akan muncul sebentar lagi.
    </div>
  `;

  if (typeof supabaseClient === "undefined" || !supabaseClient) {
    catalogContainer.innerHTML = `
      <div class="empty-state">
        <strong>Koneksi Supabase belum terbaca.</strong>
        Pastikan assets/js/supabase-client.js sudah ada dan dipanggil sebelum catalog.js.
      </div>
    `;
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    catalogContainer.innerHTML = `
      <div class="empty-state">
        <strong>Produk belum bisa dimuat.</strong>
        Cek koneksi Supabase, RLS policy, atau status publish produk.
      </div>
    `;
    return;
  }

  allProducts = Array.isArray(data) ? data : [];

  buildCategoryStrip();
  renderProducts();
}

document.addEventListener("DOMContentLoaded", function () {
  buildCategoryStrip();
  bindFilterTriggers();

  const searchInput = document.getElementById("productSearch");
  const sortSelect = document.getElementById("sortSelect");

  if (searchInput) searchInput.addEventListener("input", renderProducts);
  if (sortSelect) sortSelect.addEventListener("change", renderProducts);

  loadPublicProducts();
});
