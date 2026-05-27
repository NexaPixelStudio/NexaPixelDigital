async function loadPublicProducts() {
  const catalogContainer = document.getElementById("catalog-products");

  if (!catalogContainer) {
    console.log("Container catalog-products tidak ditemukan.");
    return;
  }

  catalogContainer.innerHTML = "<p>Memuat produk dari admin...</p>";

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    catalogContainer.innerHTML = "<p>Produk belum bisa dimuat.</p>";
    return;
  }

  if (!data || data.length === 0) {
    catalogContainer.innerHTML = "<p>Belum ada produk yang dipublish.</p>";
    return;
  }

  catalogContainer.innerHTML = data.map(product => `
    <div class="admin-product-card">
      ${product.cover_url ? `
        <img src="${product.cover_url}" alt="${product.title}" class="admin-product-cover">
      ` : ""}

      <div class="admin-product-body">
        <p class="admin-product-category">${product.category || "Ebook"}</p>
        <h3>${product.title}</h3>
        <p>${product.subtitle || ""}</p>
        <p>${product.description || ""}</p>

        <div class="admin-product-price">
          <strong>Rp${Number(product.price).toLocaleString("id-ID")}</strong>
          ${product.compare_at_price ? `
            <span>Rp${Number(product.compare_at_price).toLocaleString("id-ID")}</span>
          ` : ""}
        </div>

        <div class="admin-product-actions">
          ${product.preview_url ? `
            <a href="${product.preview_url}" target="_blank">Preview</a>
          ` : ""}

          ${product.checkout_url ? `
            <a href="${product.checkout_url}" target="_blank">Beli Sekarang</a>
          ` : ""}
        </div>
      </div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadPublicProducts);
