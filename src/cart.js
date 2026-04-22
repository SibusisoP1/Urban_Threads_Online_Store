// Shopping Cart System for Urban Threads

class CartManager {
  constructor() {
    this.cart = [];
    this.cartListeners = [];
    this.init();
  }

  init() {
    // Load cart from localStorage or Firestore
    this.loadCart();

    // Set up event listeners
    this.setupEventListeners();

    // Update UI
    this.updateCartUI();
  }

  setupEventListeners() {
    // Cart link click
    const cartLink = document.getElementById("cart-link");
    if (cartLink) {
      cartLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (authManager.isAuthenticated()) {
          window.location.href = "cart.html";
        } else {
          authManager.showError("Please login to view your cart");
          window.location.href = "login.html";
        }
      });
    }

    // Checkout button
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => this.openCheckoutModal());
    }

    // Checkout form
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleCheckout();
      });
    }

    // Modal close buttons
    const closeButtons = document.querySelectorAll(".close-modal");
    closeButtons.forEach((button) => {
      button.addEventListener("click", () =>
        this.closeModal(
          button.closest(".product-modal, .checkout-modal, .success-modal"),
        ),
      );
    });

    // Continue shopping button
    const continueShopping = document.getElementById("continue-shopping");
    if (continueShopping) {
      continueShopping.addEventListener("click", () => {
        this.closeModal(document.getElementById("success-modal"));
        window.location.href = "shop.html";
      });
    }

    // View orders button (placeholder)
    const viewOrders = document.getElementById("view-orders");
    if (viewOrders) {
      viewOrders.addEventListener("click", () => {
        authManager.showError("Order history feature coming soon!");
      });
    }

    // Clear filters button
    const clearFilters = document.getElementById("clear-filters");
    if (clearFilters) {
      clearFilters.addEventListener("click", () => {
        // Clear all filters
        document
          .querySelectorAll(".category-filter")
          .forEach((checkbox) => (checkbox.checked = false));
        document.getElementById("price-range").value = 200;
        document.getElementById("price-value").textContent = "200";
        document.getElementById("sort-select").value = "name-asc";

        // Reload products
        if (window.shopManager) {
          window.shopManager.loadProducts();
        }
      });
    }
  }

  async loadCart() {
    if (authManager.isAuthenticated()) {
      // Load cart from Firestore for logged-in users
      try {
        const user = authManager.getCurrentUser();
        const doc = await db.collection("carts").doc(user.uid).get();

        if (doc.exists) {
          this.cart = doc.data().items || [];
        } else {
          this.cart = [];
        }
      } catch (error) {
        console.error("Error loading cart from Firestore:", error);
        this.cart = [];
      }
    } else {
      // Load cart from localStorage for guest users
      const savedCart = localStorage.getItem("urbanThreadsCart");
      if (savedCart) {
        try {
          this.cart = JSON.parse(savedCart);
        } catch (error) {
          console.error("Error parsing cart from localStorage:", error);
          this.cart = [];
        }
      } else {
        this.cart = [];
      }
    }
  }

  async saveCart() {
    if (authManager.isAuthenticated()) {
      // Save cart to Firestore for logged-in users
      try {
        const user = authManager.getCurrentUser();
        await db.collection("carts").doc(user.uid).set({
          items: this.cart,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("Error saving cart to Firestore:", error);
      }
    } else {
      // Save cart to localStorage for guest users
      localStorage.setItem("urbanThreadsCart", JSON.stringify(this.cart));
    }
  }

  async addToCart(product, quantity = 1) {
    if (!authManager.isAuthenticated()) {
      authManager.showError("Please login to add items to cart");
      return;
    }

    // Check if product already exists in cart
    const existingItem = this.cart.find((item) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        imageURL: product.imageURL,
        quantity: quantity,
      });
    }

    await this.saveCart();
    this.updateCartUI();
    this.notifyListeners();

    authManager.showSuccess(`${product.name} added to cart!`);
  }

  async removeFromCart(productId) {
    this.cart = this.cart.filter((item) => item.id !== productId);
    await this.saveCart();
    this.updateCartUI();
    this.notifyListeners();
  }

  async updateQuantity(productId, quantity) {
    const item = this.cart.find((item) => item.id === productId);
    if (item) {
      if (quantity <= 0) {
        await this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        await this.saveCart();
        this.updateCartUI();
        this.notifyListeners();
      }
    }
  }

  getCartCount() {
    return this.cart.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    return this.cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }

  updateCartUI() {
    // Update cart count in navigation
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
      cartCount.textContent = this.getCartCount();
    }

    // Update cart page if on cart.html
    if (window.location.pathname.includes("cart.html")) {
      this.renderCartItems();
      this.renderCartSummary();
    }
  }

  renderCartItems() {
    const container = document.getElementById("cart-items-container");
    const emptyCart = document.getElementById("empty-cart");

    if (this.cart.length === 0) {
      if (container) container.style.display = "none";
      if (emptyCart) emptyCart.style.display = "block";
      return;
    }

    if (container) {
      container.style.display = "block";
      container.innerHTML = "";

      this.cart.forEach((item) => {
        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
                    <img src="${item.imageURL}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4 class="cart-item-name">${item.name}</h4>
                        <p class="cart-item-category">${item.category}</p>
                        <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <input type="number" class="quantity-value" value="${item.quantity}" min="1" onchange="cartManager.updateQuantity('${item.id}', parseInt(this.value))">
                            <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                        <button class="remove-btn" onclick="cartManager.removeFromCart('${item.id}')">Remove</button>
                    </div>
                `;
        container.appendChild(cartItem);
      });
    }

    if (emptyCart) emptyCart.style.display = "none";
  }

  renderCartSummary() {
    const subtotal = this.getCartTotal();
    const shipping = subtotal > 0 ? (subtotal > 100 ? 0 : 10) : 0;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    // Update summary values
    const subtotalEl = document.getElementById("subtotal");
    const shippingEl = document.getElementById("shipping");
    const taxEl = document.getElementById("tax");
    const totalEl = document.getElementById("total");

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl)
      shippingEl.textContent =
        shipping === 0 && subtotal > 0 ? "FREE" : `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  }

  openCheckoutModal() {
    if (this.cart.length === 0) {
      authManager.showError("Your cart is empty");
      return;
    }

    const modal = document.getElementById("checkout-modal");
    if (modal) {
      this.renderCheckoutSummary();
      modal.style.display = "block";
    }
  }

  renderCheckoutSummary() {
    const summaryContainer = document.getElementById("checkout-summary");
    if (!summaryContainer) return;

    const subtotal = this.getCartTotal();
    const shipping = subtotal > 0 ? (subtotal > 100 ? 0 : 10) : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    let summaryHTML = '<div class="checkout-items">';

    this.cart.forEach((item) => {
      summaryHTML += `
                <div class="checkout-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `;
    });

    summaryHTML += "</div>";
    summaryHTML += `
            <div class="checkout-totals">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping</span>
                    <span>${shipping === 0 ? "FREE" : "$" + shipping.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="summary-divider"></div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        `;

    summaryContainer.innerHTML = summaryHTML;
  }

  async handleCheckout() {
    if (!authManager.isAuthenticated()) {
      authManager.showError("Please login to checkout");
      return;
    }

    // Get form data
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const address = document.getElementById("address").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const zip = document.getElementById("zip").value;
    const cardNumber = document.getElementById("card-number").value;
    const expiry = document.getElementById("expiry").value;
    const cvv = document.getElementById("cvv").value;

    // Basic validation
    if (
      !firstName ||
      !lastName ||
      !address ||
      !city ||
      !state ||
      !zip ||
      !cardNumber ||
      !expiry ||
      !cvv
    ) {
      authManager.showError("Please fill in all fields");
      return;
    }

    this.showLoading(true);

    try {
      // Create order document in Firestore
      const user = authManager.getCurrentUser();
      const order = {
        userId: user.uid,
        userEmail: user.email,
        items: this.cart,
        shipping: {
          firstName,
          lastName,
          address,
          city,
          state,
          zip,
        },
        payment: {
          cardNumber: cardNumber.slice(-4), // Only store last 4 digits
          expiry,
        },
        totals: {
          subtotal: this.getCartTotal(),
          shipping: this.getCartTotal() > 100 ? 0 : 10,
          tax: this.getCartTotal() * 0.08,
          total:
            this.getCartTotal() +
            (this.getCartTotal() > 100 ? 0 : 10) +
            this.getCartTotal() * 0.08,
        },
        status: "processing",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        orderNumber: this.generateOrderNumber(),
      };

      await db.collection("orders").add(order);

      // Clear cart
      this.cart = [];
      await this.saveCart();
      this.updateCartUI();

      // Close checkout modal and show success modal
      this.closeModal(document.getElementById("checkout-modal"));
      this.showSuccessModal(order.orderNumber);
    } catch (error) {
      console.error("Checkout error:", error);
      authManager.showError("Error processing order. Please try again.");
    } finally {
      this.showLoading(false);
    }
  }

  generateOrderNumber() {
    return "UT" + Date.now().toString().slice(-8);
  }

  showSuccessModal(orderNumber) {
    const modal = document.getElementById("success-modal");
    const orderNumberEl = document.getElementById("order-number");

    if (modal && orderNumberEl) {
      orderNumberEl.textContent = orderNumber;
      modal.style.display = "block";
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.style.display = "none";
    }
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? "flex" : "none";
    }
  }

  // Method to add cart state listener
  addCartListener(callback) {
    this.cartListeners.push(callback);
  }

  // Method to notify all listeners
  notifyListeners() {
    this.cartListeners.forEach((callback) => callback(this.cart));
  }

  // Method to clear cart
  async clearCart() {
    this.cart = [];
    await this.saveCart();
    this.updateCartUI();
    this.notifyListeners();
  }
}

// Initialize CartManager
const cartManager = new CartManager();

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CartManager;
}
