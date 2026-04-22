// Main JavaScript for Urban Threads Homepage

class MainManager {
  constructor() {
    this.featuredProducts = [];
    this.init();
  }

  init() {
    // Load featured products
    this.loadFeaturedProducts();

    // Set up event listeners
    this.setupEventListeners();

    // Setup mobile menu
    this.setupMobileMenu();
  }

  setupEventListeners() {
    // Category cards
    const categoryCards = document.querySelectorAll(".category-card");
    categoryCards.forEach((card) => {
      card.addEventListener("click", () => {
        const category = card.dataset.category;
        window.location.href = `shop.html?category=${encodeURIComponent(category)}`;
      });
    });
  }

  setupMobileMenu() {
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
      });

      // Close mobile menu when clicking on a link
      document.querySelectorAll(".nav-link").forEach((n) =>
        n.addEventListener("click", () => {
          hamburger.classList.remove("active");
          navMenu.classList.remove("active");
        }),
      );
    }
  }

  async loadFeaturedProducts() {
    try {
      // Get featured products from Firestore
      const snapshot = await db
        .collection("products")
        .orderBy("createdAt", "desc")
        .limit(8) // Show 8 featured products
        .get();

      this.featuredProducts = [];
      snapshot.forEach((doc) => {
        this.featuredProducts.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      this.renderFeaturedProducts();
    } catch (error) {
      console.error("Error loading featured products:", error);
      this.renderEmptyFeaturedProducts();
    }
  }

  renderFeaturedProducts() {
    const container = document.getElementById("featured-products");
    if (!container) return;

    if (this.featuredProducts.length === 0) {
      this.renderEmptyFeaturedProducts();
      return;
    }

    container.innerHTML = "";

    this.featuredProducts.forEach((product) => {
      const productCard = this.createProductCard(product);
      container.appendChild(productCard);
    });
  }

  renderEmptyFeaturedProducts() {
    const container = document.getElementById("featured-products");
    if (!container) return;

    container.innerHTML = `
            <div class="empty-products">
                <p>No featured products available at the moment.</p>
                <a href="shop.html" class="btn btn-primary">Browse All Products</a>
            </div>
        `;
  }

  createProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";

    // Check if product is on sale (you can add a 'sale' field to products)
    const isSale = product.sale || false;
    const salePercentage = product.salePercentage || 0;

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
                         <span>$${(product.price * (1 - salePercentage / 100)).toFixed(2)}</span>`
                        : `<span>$${product.price.toFixed(2)}</span>`
                    }
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="mainManager.viewProduct('${product.id}')">View Details</button>
                    <button class="btn btn-secondary" onclick="mainManager.addToCart('${product.id}')">Add to Cart</button>
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

    // Set up modal buttons
    const addToCartBtn = document.getElementById("modal-add-to-cart");
    const closeBtn = document.getElementById("modal-close");

    // Remove existing event listeners
    const newAddToCartBtn = addToCartBtn.cloneNode(true);
    const newCloseBtn = closeBtn.cloneNode(true);
    addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);

    // Add new event listeners
    newAddToCartBtn.addEventListener("click", async () => {
      await cartManager.addToCart(product, 1);
      this.closeProductModal();
    });

    newCloseBtn.addEventListener("click", () => this.closeProductModal());

    // Show modal
    modal.style.display = "block";
  }

  closeProductModal() {
    const modal = document.getElementById("product-modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  // Method to initialize sample products (for testing)
  async initializeSampleProducts() {
    const sampleProducts = [
      {
        name: "Oversized Hoodie",
        price: 49.99,
        category: "Hoodies",
        description:
          "Soft cotton hoodie in oversized fit. Perfect for casual streetwear.",
        imageURL:
          "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
        sale: true,
        salePercentage: 20,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Classic T-Shirt",
        price: 24.99,
        category: "T-shirts",
        description:
          "Premium cotton t-shirt with modern fit and comfortable feel.",
        imageURL:
          "https://images.unsplash.com/photo-1521572168571-1b5351aae0b6?w=400",
        sale: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Street Sneakers",
        price: 89.99,
        category: "Sneakers",
        description:
          "High-quality sneakers with superior comfort and urban style.",
        imageURL:
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400",
        sale: true,
        salePercentage: 15,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Urban Backpack",
        price: 39.99,
        category: "Accessories",
        description:
          "Stylish backpack perfect for daily commute and street style.",
        imageURL:
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        sale: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Zip-Up Hoodie",
        price: 54.99,
        category: "Hoodies",
        description:
          "Comfortable zip-up hoodie with front pockets and adjustable hood.",
        imageURL:
          "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400",
        sale: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Graphic Tee",
        price: 29.99,
        category: "T-shirts",
        description: "Eye-catching graphic t-shirt with unique urban design.",
        imageURL:
          "https://images.unsplash.com/photo-1583743818113-90b22e8973df?w=400",
        sale: true,
        salePercentage: 25,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Running Shoes",
        price: 119.99,
        category: "Sneakers",
        description:
          "Performance running shoes with advanced cushioning technology.",
        imageURL:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
        sale: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      {
        name: "Baseball Cap",
        price: 19.99,
        category: "Accessories",
        description:
          "Classic baseball cap with embroidered logo and adjustable strap.",
        imageURL:
          "https://images.unsplash.com/photo-1574662795486-8362ffb37c62?w=400",
        sale: true,
        salePercentage: 10,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
    ];

    try {
      // Add sample products to Firestore
      for (const product of sampleProducts) {
        await db.collection("products").add(product);
      }

      console.log("Sample products added successfully");
      authManager.showSuccess("Sample products added to database!");

      // Reload featured products
      await this.loadFeaturedProducts();
    } catch (error) {
      console.error("Error adding sample products:", error);
      authManager.showError("Error adding sample products");
    }
  }
}

// Initialize MainManager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.mainManager = new MainManager();
});

// Handle modal close when clicking outside
window.addEventListener("click", (event) => {
  const modal = document.getElementById("product-modal");
  if (modal && event.target === modal) {
    window.mainManager.closeProductModal();
  }
});

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = MainManager;
}
