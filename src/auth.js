// Authentication System for Urban Threads

// Authentication System for Urban Threads

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.init();
  }

  init() {
    // Check if Firebase auth is available
    if (typeof auth === 'undefined') {
      console.error('Firebase auth not initialized');
      return;
    }
    
    // Listen for authentication state changes
    auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      this.updateUI(user);
      this.notifyListeners(user);
    });

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById("login-form-element");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Signup form
    const signupForm = document.getElementById("signup-form-element");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSignup();
      });
    }

    // Google login/signup
    const googleLogin = document.getElementById("google-login");
    if (googleLogin) {
      googleLogin.addEventListener("click", () => this.handleGoogleAuth());
    }

    const googleSignup = document.getElementById("google-signup");
    if (googleSignup) {
      googleSignup.addEventListener("click", () => this.handleGoogleAuth());
    }

    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => this.handleLogout());
    }

    // Form switching
    const showSignup = document.getElementById("show-signup");
    if (showSignup) {
      showSignup.addEventListener("click", (e) => {
        e.preventDefault();
        this.switchForm("signup");
      });
    }

    const showLogin = document.getElementById("show-login");
    if (showLogin) {
      showLogin.addEventListener("click", (e) => {
        e.preventDefault();
        this.switchForm("login");
      });
    }
  }

  async handleLogin() {
    if (typeof auth === 'undefined') {
      this.showError('Firebase auth not initialized');
      return;
    }
    
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      this.showError("Please fill in all fields");
      return;
    }

    this.showLoading(true);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      this.showSuccess("Login successful!");

      // Redirect to home page after successful login
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  async handleSignup() {
    if (typeof auth === 'undefined') {
      this.showError('Firebase auth not initialized');
      return;
    }
    
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById(
      "signup-confirm-password",
    ).value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      this.showError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      this.showError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      this.showError("Passwords do not match");
      return;
    }

    this.showLoading(true);

    try {
      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password,
      );

      // Update user profile with display name
      await userCredential.user.updateProfile({
        displayName: name,
      });

      // Create user document in Firestore
      await this.createUserDocument(userCredential.user, name);

      this.showSuccess("Account created successfully!");

      // Redirect to home page after successful signup
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  async handleGoogleAuth() {
    if (typeof auth === 'undefined') {
      this.showError('Firebase auth not initialized');
      return;
    }
    
    this.showLoading(true);

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);

      // Create user document if it doesn't exist
      if (result.additionalUserInfo.isNewUser) {
        await this.createUserDocument(result.user, result.user.displayName);
      }

      this.showSuccess("Login successful!");

      // Redirect to home page after successful login
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1500);
    } catch (error) {
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  async handleLogout() {
    if (typeof auth === 'undefined') {
      this.showError('Firebase auth not initialized');
      return;
    }
    
    try {
      await auth.signOut();
      this.showSuccess("Logged out successfully!");

      // Redirect to home page after logout
      setTimeout(() => {
        // Check if we're on the root index.html or in src folder
        if (window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
          // We're already on index.html, just reload
          window.location.reload();
        } else {
          // We're in src folder, go to root index.html
          window.location.href = "../index.html";
        }
      }, 1000);
    } catch (error) {
      this.showError("Error logging out");
    }
  }

  async createUserDocument(user, displayName) {
    if (typeof db === 'undefined') {
      console.error('Firestore db not initialized');
      return;
    }
    
    try {
      await db
        .collection("users")
        .doc(user.uid)
        .set({
          uid: user.uid,
          email: user.email,
          displayName: displayName || user.displayName || "User",
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  }

  updateUI(user) {
    const authLink = document.getElementById("auth-link");
    const userInfo = document.getElementById("user-info");
    const userEmail = document.getElementById("user-email");

    if (user) {
      // User is logged in
      if (authLink) authLink.style.display = "none";
      if (userInfo) userInfo.style.display = "flex";
      if (userEmail) userEmail.textContent = user.email || user.displayName;
    } else {
      // User is logged out
      if (authLink) authLink.style.display = "block";
      if (userInfo) userInfo.style.display = "none";
    }
  }

  switchForm(formType) {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (formType === "signup") {
      loginForm.style.display = "none";
      signupForm.style.display = "block";
    } else {
      loginForm.style.display = "block";
      signupForm.style.display = "none";
    }
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? "flex" : "none";
    }
  }

  showSuccess(message) {
    const successMessage = document.getElementById("success-message");
    const successText = document.getElementById("success-text");

    if (successMessage && successText) {
      successText.textContent = message;
      successMessage.style.display = "block";

      setTimeout(() => {
        successMessage.style.display = "none";
      }, 3000);
    }
  }

  showError(message) {
    const errorMessage = document.getElementById("error-message");
    const errorText = document.getElementById("error-text");

    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.style.display = "block";

      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 5000);
    }
  }

  getErrorMessage(error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please use a different email or login.";
      case "auth/invalid-email":
        return "Invalid email address. Please check and try again.";
      case "auth/weak-password":
        return "Password is too weak. Please choose a stronger password.";
      case "auth/user-not-found":
        return "No account found with this email. Please sign up first.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled. Please try again.";
      default:
        return "An error occurred. Please try again.";
    }
  }

  // Method to check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Method to get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Method to add authentication state listener
  addAuthListener(callback) {
    this.authListeners.push(callback);
  }

  // Method to notify all listeners
  notifyListeners(user) {
    this.authListeners.forEach((callback) => callback(user));
  }

  // Method to protect routes that require authentication
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }
}

// Initialize AuthManager when Firebase is ready
let authManager;

window.initializeAuthManager = function() {
  if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
    authManager = new AuthManager();
    window.authManager = authManager; // Make it globally available
    console.log('AuthManager initialized successfully');
  } else {
    console.error('Firebase not initialized properly');
  }
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthManager;
}
