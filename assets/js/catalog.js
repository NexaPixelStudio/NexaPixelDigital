async function loadPublicProducts() {
  const catalogContainer = document.getElementById("catalog-products");

  if (!catalogContainer) {
    console.log("catalog-products tidak ditemukan di index.html");
    return;
  }

  catalogContainer.innerHTML = `
    <article class="product-card">
      <div class="product-body">
        <p>Memuat produk dari admin...</p>
      </div>
    </article>
  `;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    catalogContainer.innerHTML = `
      <article class="product-card">
        <div class="product-body">
          <p>Produk belum bisa dimuat. Cek koneksi Supabase atau RLS policy.</p>
        </div>
      </article>
    `;
    return;
  }

  if (!data || data.length === 0) {
    catalogContainer.innerHTML = `
      <article class="product-card">
        <div class="product-body">
          <p>Belum ada produk yang dipublish dari admin.</p>
        </div>
      </article>
    `;
    return;
  }

  window.allCatalogProducts = data;
  renderProducts(data);
  setupCategoryTabs();
}

function renderProducts(products) {
  const catalogContainer = document.getElementById("catalog-products");

  catalogContainer.innerHTML = products.map((product, index) => {
    const title = escapeHTML(product.title || "Tanpa Judul");
    const subtitle = escapeHTML(product.subtitle || "Ebook Digital");
    const description = escapeHTML(product.description || "");
    const category = escapeHTML(product.category || "Ebook");
    const price = Number(product.price || 0).toLocaleString("id-ID");
    const buttonLink = product.checkout_url || `checkout.html?produk=${encodeURIComponent(product.slug || product.id)}`;
    const buttonText = product.checkout_url ? "Beli Sekarang" : "Lihat Detail";
    const number = String(index + 1).padStart(2, "0");

    const tagsHTML = buildTags(product, category);

    return `
      <article class="product-card" data-category="${category}">
        <div class="product-cover">
          <div class="product-label">
            <span>${subtitle}</span>
            <span>${number}</span>
          </div>
          <h3>${title}</h3>
        </div>

        <div class="product-body">
          <p>${description}</p>

          <div class="tags">
            ${tagsHTML}
          </div>

          <div class="product-footer">
            <span class="price">Rp${price}</span>
            <a class="mini-btn" href="${escapeAttribute(buttonLink)}" target="_blank" rel="noopener">
              ${buttonText}
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function buildTags(product, fallbackCategory) {
  if (Array.isArray(product.tags) && product.tags.length > 0) {
    return product.tags
      .slice(0, 3)
      .map(tag => `<span>${escapeHTML(tag)}</span>`)
      .join("");
  }

  return `<span>${fallbackCategory}</span>`;
}

function setupCategoryTabs() {
  const tabs = document.querySelectorAll(".category-tabs .tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.remove("active"));
      tab.classList.add("active");

      const selectedCategory = tab.textContent.trim().toLowerCase();
      const products = window.allCatalogProducts || [];

      if (selectedCategory === "semua") {
        renderProducts(products);
        return;
      }

      const filtered = products.filter(product => {
        const productCategory = String(product.category || "").toLowerCase();
        return productCategory.includes(selectedCategory);
      });

      if (filtered.length === 0) {
        const catalogContainer = document.getElementById("catalog-products");
        catalogContainer.innerHTML = `
          <article class="product-card">
            <div class="product-body">
              <p>Belum ada produk di kategori ini.</p>
            </div>
          </article>
        `;
        return;
      }

      renderProducts(filtered);
    });
  });
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replace(/`/g, "&#096;");
}

document.addEventListener("DOMContentLoaded", loadPublicProducts);
