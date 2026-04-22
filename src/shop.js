// Shop Page JavaScript for Urban Threads

class ShopManager {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentFilters = {
      categories: [],
      maxPrice: 200,
      sortBy: "name-asc",
    };
    this.init();
  }

  init() {
    // Load products
    this.loadProducts();

    // Set up event listeners
    this.setupEventListeners();

    // Setup URL parameters
    this.handleURLParameters();
  }

  setupEventListeners() {
    // Category filters
    const categoryFilters = document.querySelectorAll(".category-filter");
    categoryFilters.forEach((checkbox) => {
      checkbox.addEventListener("change", () => this.applyFilters());
    });

    // Price filter
    const priceRange = document.getElementById("price-range");
    const priceValue = document.getElementById("price-value");

    if (priceRange && priceValue) {
      priceRange.addEventListener("input", (e) => {
        priceValue.textContent = e.target.value;
        this.currentFilters.maxPrice = parseInt(e.target.value);
        this.applyFilters();
      });
    }

    // Sort filter
    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.currentFilters.sortBy = e.target.value;
        this.applyFilters();
      });
    }

    // View options
    const viewBtns = document.querySelectorAll(".view-btn");
    viewBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        viewBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.changeView(btn.dataset.view);
      });
    });

    // Modal close
    const closeModal = document.querySelector(".close-modal");
    if (closeModal) {
      closeModal.addEventListener("click", () => this.closeProductModal());
    }

    // Modal add to cart
    const modalAddToCart = document.getElementById("modal-add-to-cart");
    if (modalAddToCart) {
      modalAddToCart.addEventListener("click", () =>
        this.handleModalAddToCart(),
      );
    }

    // Modal close button
    const modalClose = document.getElementById("modal-close");
    if (modalClose) {
      modalClose.addEventListener("click", () => this.closeProductModal());
    }

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      const modal = document.getElementById("product-modal");
      if (e.target === modal) {
        this.closeProductModal();
      }
    });
  }

  handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get("category");

    if (categoryParam) {
      // Check the category checkbox if it exists
      const categoryCheckbox = document.querySelector(
        `.category-filter[value="${categoryParam}"]`,
      );
      if (categoryCheckbox) {
        categoryCheckbox.checked = true;
        this.currentFilters.categories = [categoryParam];
        this.applyFilters();
      }
    }
  }

  async loadProducts() {
    try {
      // Show loading state
      this.showLoading(true);

      // Get all products from Firestore
      const snapshot = await db
        .collection("products")
        .orderBy("createdAt", "desc")
        .get();

      this.products = [];
      snapshot.forEach((doc) => {
        this.products.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Apply filters and render
      this.applyFilters();
    } catch (error) {
      console.error("Error loading products:", error);
      this.renderErrorProducts();
    } finally {
      this.showLoading(false);
    }
  }

  applyFilters() {
    // Start with all products
    this.filteredProducts = [...this.products];

    // Apply category filters
    if (this.currentFilters.categories.length > 0) {
      this.filteredProducts = this.filteredProducts.filter((product) =>
        this.currentFilters.categories.includes(product.category),
      );
    }

    // Apply price filter
    this.filteredProducts = this.filteredProducts.filter(
      (product) => product.price <= this.currentFilters.maxPrice,
    );

    // Apply sorting
    this.sortProducts();

    // Update results count
    this.updateResultsCount();

    // Render products
    this.renderProducts();
  }

  sortProducts() {
    switch (this.currentFilters.sortBy) {
      case "name-asc":
        this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        this.filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "price-asc":
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
    }
  }

  updateResultsCount() {
    const resultsCount = document.getElementById("results-count");
    if (resultsCount) {
      const count = this.filteredProducts.length;
      resultsCount.textContent = `Showing ${count} product${count !== 1 ? "s" : ""}`;
    }
  }

  renderProducts() {
    const container = document.getElementById("products-grid");
    const noProducts = document.getElementById("no-products");

    if (!container) return;

    if (this.filteredProducts.length === 0) {
      container.style.display = "none";
      if (noProducts) noProducts.style.display = "block";
      return;
    }

    container.style.display = "grid";
    if (noProducts) noProducts.style.display = "none";

    container.innerHTML = "";

    this.filteredProducts.forEach((product) => {
      const productCard = this.createProductCard(product);
      container.appendChild(productCard);
    });
  }

  createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    // Check if product is on sale
    const isSale = product.sale || false;
    const salePercentage = product.salePercentage || 0;
    const finalPrice = isSale
      ? product.price * (1 - salePercentage / 100)
      : product.price;

    card.innerHTML = `
            <div class="product-image">
                <img src="${product.imageURL}" alt="${product.name}">
                ${isSale ? `<span class="product-badge">${salePercentage}% OFF</span>` : ""}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    ${
                      isSale
                        ? `<span style="text-decoration: line-through; color: #7f8c8d; margin-right: 10px;">$${product.price.toFixed(2)}</span>
                         <span>$${finalPrice.toFixed(2)}</span>`
                        : `<span>$${product.price.toFixed(2)}</span>`
                    }
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="shopManager.viewProduct('${product.id}')">View Details</button>
                    <button class="btn btn-secondary" onclick="shopManager.addToCart('${product.id}')">Add to Cart</button>
                </div>
            </div>
        `;

    return card;
  }

  async viewProduct(productId) {
    try {
      const doc = await db.collection("products").doc(productId).get();
      if (doc.exists) {
        const product = { id: doc.id, ...doc.data() };
        this.showProductModal(product);
      } else {
        authManager.showError("Product not found");
      }
    } catch (error) {
      console.error("Error viewing product:", error);
      authManager.showError("Error loading product details");
    }
  }

  async addToCart(productId) {
    if (!authManager.isAuthenticated()) {
      authManager.showError("Please login to add items to cart");
      return;
    }

    try {
      const doc = await db.collection("products").doc(productId).get();
      if (doc.exists) {
        const product = { id: doc.id, ...doc.data() };
        await cartManager.addToCart(product, 1);
      } else {
        authManager.showError("Product not found");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      authManager.showError("Error adding item to cart");
    }
  }

  showProductModal(product) {
    const modal = document.getElementById("product-modal");
    if (!modal) return;

    // Store current product for cart operations
    this.currentModalProduct = product;

    // Populate modal with product details
    document.getElementById("modal-image").src = product.imageURL;
    document.getElementById("modal-image").alt = product.name;
    document.getElementById("modal-name").textContent = product.name;
    document.getElementById("modal-category").textContent = product.category;
    document.getElementById("modal-description").textContent =
      product.description;

    // Handle pricing
    const isSale = product.sale || false;
    const salePercentage = product.salePercentage || 0;
    const modalPrice = document.getElementById("modal-price");

    if (isSale) {
      modalPrice.innerHTML = `
                <span style="text-decoration: line-through; color: #7f8c8d; margin-right: 10px;">$${product.price.toFixed(2)}</span>
                <span>$${(product.price * (1 - salePercentage / 100)).toFixed(2)}</span>
            `;
    } else {
      modalPrice.textContent = `$${product.price.toFixed(2)}`;
    }

    // Show modal
    modal.style.display = "block";
  }

  async handleModalAddToCart() {
    if (this.currentModalProduct) {
      await cartManager.addToCart(this.currentModalProduct, 1);
      this.closeProductModal();
    }
  }

  closeProductModal() {
    const modal = document.getElementById("product-modal");
    if (modal) {
      modal.style.display = "none";
      this.currentModalProduct = null;
    }
  }

  changeView(viewType) {
    const container = document.getElementById("products-grid");
    if (!container) return;

    if (viewType === "list") {
      container.classList.add("list-view");
    } else {
      container.classList.remove("list-view");
    }
  }

  showLoading(show) {
    const container = document.getElementById("products-grid");
    if (container) {
      if (show) {
        container.innerHTML = '<div class="loading">Loading products...</div>';
      }
    }
  }

  renderErrorProducts() {
    const container = document.getElementById("products-grid");
    const noProducts = document.getElementById("no-products");

    if (container) {
      container.style.display = "none";
    }

    if (noProducts) {
      noProducts.style.display = "block";
      noProducts.innerHTML = `
                <h3>Error loading products</h3>
                <p>There was an error loading the products. Please try again later.</p>
                <button class="btn btn-primary" onclick="shopManager.loadProducts()">Retry</button>
            `;
    }
  }

  // Method to get unique categories from products
  getAvailableCategories() {
    const categories = [
      ...new Set(this.products.map((product) => product.category)),
    ];
    return categories.sort();
  }

  // Method to get price range
  getPriceRange() {
    if (this.products.length === 0) {
      return { min: 0, max: 200 };
    }

    const prices = this.products.map((product) => product.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }

  // Method to reset all filters
  resetFilters() {
    this.currentFilters = {
      categories: [],
      maxPrice: 200,
      sortBy: "name-asc",
    };

    // Reset UI
    document.querySelectorAll(".category-filter").forEach((checkbox) => {
      checkbox.checked = false;
    });

    const priceRange = document.getElementById("price-range");
    const priceValue = document.getElementById("price-value");
    if (priceRange && priceValue) {
      priceRange.value = 200;
      priceValue.textContent = "200";
    }

    const sortSelect = document.getElementById("sort-select");
    if (sortSelect) {
      sortSelect.value = "name-asc";
    }

    this.applyFilters();
  }
}

// Initialize ShopManager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.shopManager = new ShopManager();
});

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = ShopManager;
}
