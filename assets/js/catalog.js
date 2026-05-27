async function loadPublicProducts() {
  const catalogContainer = document.getElementById("catalog-products");

  if (!catalogContainer) {
    console.log("catalog-products tidak ditemukan di index.html");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    console.log("supabaseClient belum terbaca. Cek assets/js/supabase-client.js");
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil produk Supabase:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("Belum ada produk publish dari admin. Katalog lama tetap ditampilkan.");
    return;
  }

  const oldAdminProducts = catalogContainer.querySelectorAll('[data-source="supabase"]');
  oldAdminProducts.forEach(item => item.remove());

  const adminProductCards = data.map((product, index) => {
    const price = Number(product.price || 0).toLocaleString("id-ID");
    const checkoutUrl = product.checkout_url || "#";
    const subtitle = product.subtitle || "Ebook Digital";
    const category = product.category || "Ebook";

    let tagsHtml = `<span>${category}</span>`;

    if (Array.isArray(product.tags) && product.tags.length > 0) {
      tagsHtml = product.tags
        .map(tag => `<span>${tag}</span>`)
        .join("");
    }

    return `
      <article class="product-card" data-source="supabase">
        <div class="product-cover">
          <div class="product-label">
            <span>${subtitle}</span>
            <span>${String(index + 1).padStart(2, "0")}</span>
          </div>
          <h3>${product.title || "Produk tanpa judul"}</h3>
        </div>

        <div class="product-body">
          <p>${product.description || ""}</p>

          <div class="tags">
            ${tagsHtml}
          </div>

          <div class="product-footer">
            <span class="price">Rp${price}</span>
            <a class="mini-btn" href="${checkoutUrl}">
              Lihat Detail
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  catalogContainer.insertAdjacentHTML("afterbegin", adminProductCards);
}

document.addEventListener("DOMContentLoaded", loadPublicProducts);
