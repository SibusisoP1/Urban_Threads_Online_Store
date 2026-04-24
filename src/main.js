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
    if (typeof db === 'undefined') {
      console.error('Firestore db not initialized');
      this.renderEmptyFeaturedProducts();
      return;
    }
    
    try {
      // Get featured products from Firestore
      const snapshot = await db
        .collection("products")
        .orderBy("createdAt", "desc")
        .limit(8) // Show 8 featured products
        .get();

      this.featuredProducts = [];
      snapshot.forEach((doc) => {
        const productData = {
          id: doc.id,
          ...doc.data(),
        };
        this.featuredProducts.push(productData);
        console.log('Loaded product:', productData); // Debug log
      });

      console.log('All featured products:', this.featuredProducts); // Debug log
      this.renderFeaturedProducts();
    } catch (error) {
      console.error("Error loading featured products:", error);
      this.renderEmptyFeaturedProducts();
    }
  }

  renderFeaturedProducts() {
    const container = document.getElementById("featured-products");
    if (!container) {
      console.error('Featured products container not found');
      return;
    }

    if (this.featuredProducts.length === 0) {
      this.renderEmptyFeaturedProducts();
      return;
    }

    container.innerHTML = "";

    this.featuredProducts.forEach((product) => {
      const productCard = this.createProductCard(product);
      container.appendChild(productCard);
      console.log('Product card added to DOM:', productCard); // Debug log
    });
    
    console.log('Final container HTML:', container.innerHTML); // Debug log
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
    console.log('Creating product card for:', product); // Debug log
    const card = document.createElement("div");
    card.className = "product-card";

    // Check if product is on sale (you can add a 'sale' field to products)
    const isSale = product.sale || false;
    const salePercentage = product.salePercentage || 0;

    const cardHTML = `
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
    
    console.log('Card HTML:', cardHTML); // Debug log
    card.innerHTML = cardHTML;

    return card;
  }

  async viewProduct(productId) {
    if (typeof db === 'undefined') {
      console.error('Firestore db not initialized');
      if (typeof authManager !== 'undefined') {
        authManager.showError("Database not available");
      }
      return;
    }
    
    try {
      const doc = await db.collection("products").doc(productId).get();
      if (doc.exists) {
        const product = { id: doc.id, ...doc.data() };
        this.showProductModal(product);
      } else {
        if (typeof authManager !== 'undefined') {
          authManager.showError("Product not found");
        }
      }
    } catch (error) {
      console.error("Error viewing product:", error);
      if (typeof authManager !== 'undefined') {
        authManager.showError("Error loading product details");
      }
    }
  }

  async addToCart(productId) {
    console.log('Add to cart clicked for product ID:', productId);
    console.log('AuthManager available:', typeof authManager !== 'undefined');
    console.log('User authenticated:', typeof authManager !== 'undefined' && authManager.isAuthenticated());
    console.log('CartManager available:', typeof cartManager !== 'undefined');
    
    if (typeof authManager === 'undefined' || !authManager.isAuthenticated()) {
      console.log('User not authenticated, showing login message');
      if (typeof authManager !== 'undefined') {
        authManager.showError("Please login to add items to cart");
      }
      return;
    }

    if (typeof db === 'undefined') {
      console.error('Firestore db not initialized');
      if (typeof authManager !== 'undefined') {
        authManager.showError("Database not available");
      }
      return;
    }

    try {
      console.log('Fetching product from Firestore...');
      const doc = await db.collection("products").doc(productId).get();
      if (doc.exists) {
        const product = { id: doc.id, ...doc.data() };
        console.log('Product fetched:', product);
        if (typeof cartManager !== 'undefined') {
          console.log('Adding to cart...');
          await cartManager.addToCart(product, 1);
          console.log('Product added to cart successfully');
        } else {
          console.error('CartManager not available');
        }
      } else {
        console.log('Product not found in Firestore');
        if (typeof authManager !== 'undefined') {
          authManager.showError("Product not found");
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (typeof authManager !== 'undefined') {
        authManager.showError("Error adding item to cart");
      }
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
      if (typeof cartManager !== 'undefined') {
        await cartManager.addToCart(product, 1);
      }
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

  }

// Initialize MainManager when Firebase is ready
document.addEventListener("DOMContentLoaded", () => {
  // Wait for Firebase to be ready before initializing MainManager
  function initializeMainManager() {
    if (window.firebaseReady) {
      window.mainManager = new MainManager();
      console.log('MainManager initialized successfully');
      
      // Handle modal close when clicking outside
      window.addEventListener("click", (event) => {
        const modal = document.getElementById("product-modal");
        if (modal && event.target === modal) {
          window.mainManager.closeProductModal();
        }
      });
    } else {
      // Retry after a short delay
      setTimeout(initializeMainManager, 100);
    }
  }
  
  initializeMainManager();
});

// Helper function to wait for mainManager to be available
window.waitForMainManager = function(callback) {
  if (typeof window.mainManager !== 'undefined') {
    callback();
  } else {
    setTimeout(() => window.waitForMainManager(callback), 100);
  }
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = MainManager;
}
