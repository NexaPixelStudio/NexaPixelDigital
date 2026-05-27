async function loadPublicProducts() {
  const catalogContainer = document.getElementById("catalog-products");

  if (!catalogContainer) {
    console.log("catalog-products tidak ditemukan di index.html");
    return;
  }

  const oldCatalog = catalogContainer.innerHTML;

  if (typeof supabaseClient === "undefined") {
    console.log("Supabase client belum tersedia. Katalog lama tetap ditampilkan.");
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
    return;
  }

  if (!data || data.length === 0) {
    return;
  }

  const adminProducts = data.map((product, index) => {
    const slug = product.slug || "";
    const detailUrl = "checkout.html?produk=" + encodeURIComponent(slug);
    const tags = Array.isArray(product.tags) && product.tags.length
      ? product.tags
      : [product.category || "Ebook"];

    return `
      <article class="product-card" data-dynamic="true">
        <div class="product-cover">
          <div class="product-label">
            <span>${escapeHtml(product.subtitle || "Ebook Digital")}</span>
            <span>${String(index + 1).padStart(2, "0")}</span>
          </div>
          <h3>${escapeHtml(product.title || "Produk Digital")}</h3>
        </div>

        <div class="product-body">
          <p>${escapeHtml(product.description || "")}</p>

          <div class="tags">
            ${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>

          <div class="product-footer">
            <span class="price">Rp${Number(product.price || 0).toLocaleString("id-ID")}</span>
            <a class="mini-btn" href="${detailUrl}">
              Lihat Detail
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  catalogContainer.innerHTML = adminProducts + oldCatalog;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", loadPublicProducts);
