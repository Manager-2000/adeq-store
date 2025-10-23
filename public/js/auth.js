// auth.js - Complete Integrated Authentication System (Production Ready)
const authSystem = {
  isProcessing: false,
  lastRequestTime: 0,
  requestCooldown: 5000, // 5 seconds cooldown

  // Global variables
  verificationCode: "",
  pendingUser: null,
  resetPasswordEmail: "",
  verificationType: "", // "register" or "reset"

  // DOM Elements
  elements: {},

  // Current user data
  currentUser: null,

  // Initialize the authentication system
  init: function () {
    this.cacheElements();
    this.bindEvents();
    this.checkExistingUser();
    this.setupVerificationInputs();
  },

  // Cache DOM elements
  cacheElements: function () {
    this.elements = {
      // Header elements
      headerAuthButton: document.getElementById("headerAuthButton"),
      authButtonText: document.getElementById("authButtonText"),
      userDropdown: document.getElementById("userDropdown"),
      userDropdownName: document.getElementById("userDropdownName"),
      logoutButton: document.getElementById("logoutButton"),

      // Modal elements
      authModal: document.getElementById("authModal"),
      closeAuthModal: document.getElementById("closeAuthModal"),

      // Tabs
      loginTab: document.getElementById("loginTab"),
      registerTab: document.getElementById("registerTab"),

      // Forms
      loginForm: document.getElementById("loginForm"),
      registerForm: document.getElementById("registerForm"),
      verificationForm: document.getElementById("verificationForm"),
      forgotPasswordForm: document.getElementById("forgotPasswordForm"),
      resetPasswordForm: document.getElementById("resetPasswordForm"),

      // Form elements
      loginUserForm: document.getElementById("loginUserForm"),
      registerUserForm: document.getElementById("registerUserForm"),
      forgotPasswordUserForm: document.getElementById("forgotPasswordUserForm"),
      resetPasswordUserForm: document.getElementById("resetPasswordUserForm"),

      // Buttons
      showForgotPassword: document.getElementById("showForgotPassword"),
      verifyCodeBtn: document.getElementById("verifyCodeBtn"),
      resendCodeBtn: document.getElementById("resendCodeBtn"),
      backToRegisterFromVerify: document.getElementById(
        "backToRegisterFromVerify"
      ),
      backToLoginFromForgot: document.getElementById("backToLoginFromForgot"),

      // Messages
      verificationMessage: document.getElementById("verificationMessage"),
    };
  },

  // Setup verification digit inputs
  setupVerificationInputs: function () {
    const digits = document.querySelectorAll(".verification-digit");

    digits.forEach((digit, index) => {
      // Auto-navigate between inputs
      digit.addEventListener("input", (e) => {
        this.moveToNext(e.target);

        // Auto-submit if all digits are filled
        const allFilled = Array.from(digits).every((d) => d.value !== "");
        if (allFilled) {
          this.verifyCode();
        }
      });

      // Allow backspace to move to previous input
      digit.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !digit.value && index > 0) {
          digits[index - 1].focus();
        }
      });

      // Allow pressing Enter to verify code
      digit.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
          this.verifyCode();
        }
      });
    });
  },

  // Bind event listeners
  bindEvents: function () {
    // Header auth button
    this.elements.headerAuthButton.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.currentUser) {
        this.toggleUserDropdown();
      } else {
        this.showAuthModal();
        this.showLoginForm();
      }
    });

    // Logout button - FIXED EVENT HANDLING
    this.elements.logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling up
      this.logout();
    });

    // Close modal
    this.elements.closeAuthModal.addEventListener("click", () =>
      this.hideAuthModal()
    );
    this.elements.authModal.addEventListener("click", (e) => {
      if (e.target === this.elements.authModal) this.hideAuthModal();
    });

    // Prevent dropdown from closing when clicking inside it
    this.elements.userDropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Close dropdown when clicking outside - FIXED
    document.addEventListener("click", () => {
      this.hideUserDropdown();
    });

    // Tab switching
    this.elements.loginTab.addEventListener("click", () =>
      this.showLoginForm()
    );
    this.elements.registerTab.addEventListener("click", () =>
      this.showRegisterForm()
    );

    // Form submissions
    this.elements.loginUserForm.addEventListener("submit", (e) =>
      this.handleLogin(e)
    );
    this.elements.registerUserForm.addEventListener("submit", (e) =>
      this.handleRegister(e)
    );
    this.elements.forgotPasswordUserForm.addEventListener("submit", (e) =>
      this.handleForgotPassword(e)
    );
    this.elements.resetPasswordUserForm.addEventListener("submit", (e) =>
      this.handleResetPassword(e)
    );

    // Verification buttons
    this.elements.verifyCodeBtn.addEventListener("click", () =>
      this.verifyCode()
    );
    this.elements.resendCodeBtn.addEventListener("click", () =>
      this.resendCode()
    );

    // Navigation buttons
    this.elements.showForgotPassword.addEventListener("click", () =>
      this.showForgotPasswordForm()
    );
    this.elements.backToRegisterFromVerify.addEventListener("click", () =>
      this.backToRegisterForm()
    );
    this.elements.backToLoginFromForgot.addEventListener("click", () =>
      this.showLoginForm()
    );

    // Close dropdown when clicking outside
    document.addEventListener("click", () => this.hideUserDropdown());
  },

  // Show/hide auth modal
  showAuthModal: function () {
    this.elements.authModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  },

  hideAuthModal: function () {
    this.elements.authModal.classList.add("hidden");
    document.body.style.overflow = "auto";
    this.hideAllForms();
    this.showLoginForm();
  },

  // Show/hide user dropdown
  toggleUserDropdown: function () {
    this.elements.userDropdown.classList.toggle("hidden");
  },

  hideUserDropdown: function () {
    this.elements.userDropdown.classList.add("hidden");
  },

  // Check if user is already logged in
  checkExistingUser: async function () {
    const token = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("currentUser");

    if (token && storedUser) {
      try {
        // Verify token is still valid
        const response = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.currentUser = data.user;
          this.updateUIAfterLogin(data.user);
        } else {
          // Token invalid, logout
          this.logout();
        }
      } catch (error) {
        console.error("Profile check error:", error);
        this.logout();
      }
    }
  },

  // Update UI after login
  updateUIAfterLogin: function (user) {
    this.elements.authButtonText.textContent = user.firstName;
    this.elements.userDropdownName.textContent = `${user.firstName} ${user.lastName}`;
    this.elements.headerAuthButton.innerHTML = `<i class="fas fa-user-circle text-xl mr-2"></i><span>${user.firstName}</span>`;
  },

  // Show login form
  showLoginForm: function () {
    this.hideAllForms();
    this.elements.loginForm.classList.remove("hidden");
    this.elements.loginTab.classList.add("active-tab");
    this.elements.loginTab.classList.remove("bg-gray-100", "text-gray-700");
    this.elements.registerTab.classList.remove("active-tab");
    this.elements.registerTab.classList.add("bg-gray-100", "text-gray-700");
  },

  // Show register form
  showRegisterForm: function () {
    this.hideAllForms();
    this.elements.registerForm.classList.remove("hidden");
    this.elements.registerTab.classList.add("active-tab");
    this.elements.registerTab.classList.remove("bg-gray-100", "text-gray-700");
    this.elements.loginTab.classList.remove("active-tab");
    this.elements.loginTab.classList.add("bg-gray-100", "text-gray-700");
  },

  // Show verification form - UPDATED FOR MONGODB
  showVerificationForm: function (type, email) {
    this.hideAllForms();
    this.elements.verificationForm.classList.remove("hidden");
    this.verificationType = type;

    // Update message based on verification type
    if (type === "register") {
      this.elements.verificationMessage.textContent =
        "We've sent a 6-digit verification code to your email address. Please enter it below to complete your registration.";
    } else if (type === "reset") {
      this.elements.verificationMessage.textContent =
        "We've sent a 6-digit verification code to your email address. Please enter it below to reset your password.";
      this.resetPasswordEmail = email;
    }

    // Clear verification digits
    const digits = document.querySelectorAll(".verification-digit");
    digits.forEach((digit) => (digit.value = ""));

    // Focus first digit
    if (digits.length > 0) {
      digits[0].focus();
    }

    console.log(`📧 Verification code was sent to ${email} by the server`);
  },

  // Show forgot password form
  showForgotPasswordForm: function () {
    this.hideAllForms();
    this.elements.forgotPasswordForm.classList.remove("hidden");
  },

  // Show reset password form
  showResetPasswordForm: function () {
    this.hideAllForms();
    this.elements.resetPasswordForm.classList.remove("hidden");
  },

  // Hide all forms
  hideAllForms: function () {
    this.elements.loginForm.classList.add("hidden");
    this.elements.registerForm.classList.add("hidden");
    this.elements.verificationForm.classList.add("hidden");
    this.elements.forgotPasswordForm.classList.add("hidden");
    this.elements.resetPasswordForm.classList.add("hidden");

    // Clear any error messages
    this.clearErrorMessages();
  },

  // Back to register form from verification
  backToRegisterForm: function () {
    this.hideAllForms();
    this.elements.registerForm.classList.remove("hidden");
    this.verificationType = "";
    this.pendingUser = null;
  },

  // Handle login form submission - UPDATED FOR MONGODB
  handleLogin: async function (e) {
    e.preventDefault();
    this.clearErrorMessages();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    // Basic validation
    if (!this.validateEmail(email)) {
      this.showError("loginEmailError", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      this.showError(
        "loginPasswordError",
        "Password must be at least 6 characters"
      );
      return;
    }

    try {
      // Call MongoDB API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save user data and token
        this.currentUser = data.user;
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        localStorage.setItem("authToken", data.token);

        this.updateUIAfterLogin(data.user);
        this.showSuccessMessage("Login successful!");
        this.elements.loginUserForm.reset();
        this.hideAuthModal();
      } else {
        this.showError("loginPasswordError", data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showError("loginPasswordError", "Login failed. Please try again.");
    }
  },

  // Handle register form submission - UPDATED WITH DEBOUNCING
  handleRegister: async function (e) {
    e.preventDefault();

    // ✅ DEBOUNCE CHECK - Prevent multiple clicks
    if (this.isProcessing) {
      console.log("⏳ Registration already in progress...");
      return;
    }

    const currentTime = Date.now();
    if (currentTime - this.lastRequestTime < this.requestCooldown) {
      const remainingTime = Math.ceil(
        (this.requestCooldown - (currentTime - this.lastRequestTime)) / 1000
      );
      this.showError(
        "registerEmailError",
        `Please wait ${remainingTime} seconds before trying again`
      );
      return;
    }

    this.clearErrorMessages();
    this.isProcessing = true;
    this.lastRequestTime = currentTime;

    // Update button text to show loading
    const submitButton = this.elements.registerUserForm.querySelector(
      'button[type="submit"]'
    );
    const originalText = submitButton.textContent;
    submitButton.textContent = "Sending Code...";
    submitButton.disabled = true;

    const firstName = document.getElementById("registerFirstName").value;
    const lastName = document.getElementById("registerLastName").value;
    const email = document.getElementById("registerEmail").value;
    const phone = document.getElementById("registerPhone").value;
    const password = document.getElementById("registerPassword").value;

    // Format phone number
    const formattedPhone = this.formatPhone(phone);

    // Validation
    if (firstName.trim().length < 2) {
      this.showError(
        "registerFirstNameError",
        "First name must be at least 2 characters"
      );
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
      return;
    }

    if (lastName.trim().length < 2) {
      this.showError(
        "registerLastNameError",
        "Last name must be at least 2 characters"
      );
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
      return;
    }

    if (!this.validateEmail(email)) {
      this.showError(
        "registerEmailError",
        "Please enter a valid email address"
      );
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
      return;
    }

    if (!this.validatePhone(phone)) {
      this.showError(
        "registerPhoneError",
        "Please enter a valid Nigerian phone number (e.g., 08012345678, +2348012345678)"
      );
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
      return;
    }

    if (password.length < 6) {
      this.showError(
        "registerPasswordError",
        "Password must be at least 6 characters"
      );
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
      return;
    }

    try {
      // Call MongoDB API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: formattedPhone,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data temporarily for verification
        this.pendingUser = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: formattedPhone,
          password: password,
          verified: false,
          id: "user_" + Date.now(),
        };

        // Show verification form
        this.showVerificationForm("register", email);
        this.showSuccessMessage(
          "Registration successful! Check your email for verification code."
        );
      } else {
        this.showError(
          "registerEmailError",
          data.message || "Registration failed"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.showError(
        "registerEmailError",
        "Registration failed. Please try again."
      );
    } finally {
      // Always reset button state
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
    }
  },

  // Handle forgot password form submission - WITH DEBOUNCING
  handleForgotPassword: async function (e) {
    e.preventDefault();

    // ✅ DEBOUNCE CHECK - Prevent multiple clicks
    if (this.isProcessing) {
      console.log("⏳ Forgot password request already in progress...");
      return;
    }

    const currentTime = Date.now();
    if (currentTime - this.lastRequestTime < this.requestCooldown) {
      const remainingTime = Math.ceil(
        (this.requestCooldown - (currentTime - this.lastRequestTime)) / 1000
      );
      this.showError(
        "forgotPasswordEmailError",
        `Please wait ${remainingTime} seconds before requesting another code`
      );
      return;
    }

    this.clearErrorMessages();
    this.isProcessing = true;
    this.lastRequestTime = currentTime;

    // Update button text to show loading
    const submitButton = this.elements.forgotPasswordUserForm.querySelector(
      'button[type="submit"]'
    );
    const originalText = submitButton.textContent;
    submitButton.textContent = "Sending Code...";
    submitButton.disabled = true;

    const email = document.getElementById("forgotPasswordEmail").value;

    if (!this.validateEmail(email)) {
      this.showError(
        "forgotPasswordEmailError",
        "Please enter a valid email address"
      );
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
      return;
    }

    try {
      console.log("🔍 Sending forgot password request for:", email);

      // Call MongoDB API endpoint for forgot password
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();
      console.log("🔍 Forgot password response:", data);

      if (response.ok) {
        // Show verification form for password reset
        this.showVerificationForm("reset", email);
        this.showSuccessMessage("Password reset code sent to your email!");
      } else {
        this.showError(
          "forgotPasswordEmailError",
          data.message || "No account found with this email"
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      this.showError(
        "forgotPasswordEmailError",
        "Failed to process request. Please try again."
      );
    } finally {
      // Always reset button state
      this.resetButtonState(submitButton, originalText);
      this.isProcessing = false;
    }
  },

  // Handle reset password form submission - ENHANCED DEBUGGING
  handleResetPassword: async function (e) {
    e.preventDefault();
    this.clearErrorMessages();

    const newPassword = document.getElementById("resetPassword").value;
    const confirmPassword = document.getElementById(
      "resetPasswordConfirm"
    ).value;
    const enteredCode = this.getVerificationCode();

    // Validation
    if (newPassword.length < 6) {
      this.showError(
        "resetPasswordError",
        "Password must be at least 6 characters"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showError("resetPasswordConfirmError", "Passwords do not match");
      return;
    }

    if (enteredCode.length !== 6) {
      this.showError(
        "resetPasswordError",
        "Please enter the verification code"
      );
      return;
    }

    try {
      console.log("🔍 Sending reset password request:", {
        email: this.resetPasswordEmail,
        code: enteredCode,
        passwordLength: newPassword.length,
      });

      // Call MongoDB API endpoint for reset password
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: this.resetPasswordEmail,
          code: enteredCode,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      console.log("🔍 Reset password response:", data);
      console.log("🔍 Response status:", response.status);

      if (response.ok) {
        this.showSuccessMessage("Password reset successfully!");
        this.showLoginForm();

        // Clear the verification digits
        const digits = document.querySelectorAll(".verification-digit");
        digits.forEach((digit) => (digit.value = ""));
      } else {
        this.showError(
          "resetPasswordError",
          data.message || "Error resetting password. Please try again."
        );
      }
    } catch (error) {
      console.error("Reset password error:", error);
      console.error("Error details:", error.message);
      this.showError(
        "resetPasswordError",
        "Password reset failed. Please try again."
      );
    }
  },

  // Verify the code entered by the user - SIMPLIFIED FIX
  verifyCode: async function () {
    const enteredCode = this.getVerificationCode();

    console.log("🔍 Verifying code:", enteredCode);
    console.log(
      "📧 Email:",
      this.verificationType === "register"
        ? this.pendingUser?.email
        : this.resetPasswordEmail
    );
    console.log("🔑 Verification type:", this.verificationType);

    if (enteredCode.length !== 6) {
      this.shakeVerificationDigits();
      alert("Please enter the complete 6-digit code");
      return;
    }

    try {
      if (this.verificationType === "register") {
        // Handle registration verification
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: this.pendingUser.email,
            code: enteredCode,
          }),
        });

        const data = await response.json();
        console.log("🔍 Registration verification response:", data);

        if (response.ok) {
          this.completeRegistration(data);
        } else {
          this.shakeVerificationDigits();
          alert(data.message || "Invalid verification code. Please try again.");
        }
      } else if (this.verificationType === "reset") {
        // ✅ FIX: For password reset, just proceed to reset form
        // We'll verify the code when actually resetting the password
        this.showResetPasswordForm();
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("Verification failed. Please try again.");
      this.shakeVerificationDigits();
    }
  },

  // Complete registration after verification - UPDATED FOR MONGODB
  completeRegistration: function (data) {
    // Save user data and token from backend response
    this.currentUser = data.user;
    localStorage.setItem("currentUser", JSON.stringify(data.user));
    localStorage.setItem("authToken", data.token);

    this.updateUIAfterLogin(data.user);
    this.showSuccessMessage("Registration completed successfully!");
    this.hideAuthModal();
    this.pendingUser = null;
  },

  // Resend verification code - WITH DEBOUNCING
  resendCode: async function () {
    // ✅ DEBOUNCE CHECK
    if (this.isProcessing) {
      console.log("⏳ Resend code already in progress...");
      return;
    }

    const currentTime = Date.now();
    if (currentTime - this.lastRequestTime < this.requestCooldown) {
      const remainingTime = Math.ceil(
        (this.requestCooldown - (currentTime - this.lastRequestTime)) / 1000
      );
      alert(
        `Please wait ${remainingTime} seconds before requesting another code`
      );
      return;
    }

    if (this.verificationType === "register" && !this.pendingUser) {
      alert("No pending registration found");
      return;
    }

    if (this.verificationType === "reset" && !this.resetPasswordEmail) {
      alert("No password reset request found");
      return;
    }

    this.isProcessing = true;
    this.lastRequestTime = currentTime;

    // Update resend button text
    const resendButton = this.elements.resendCodeBtn;
    const originalText = resendButton.textContent;
    resendButton.textContent = "Sending...";
    resendButton.disabled = true;

    const email =
      this.verificationType === "register"
        ? this.pendingUser.email
        : this.resetPasswordEmail;

    try {
      console.log("🔍 Resending code to:", email);

      // Call backend to resend code
      const endpoint =
        this.verificationType === "register"
          ? "/api/auth/register"
          : "/api/auth/forgot-password";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          // Include other required fields for registration
          ...(this.verificationType === "register" && this.pendingUser
            ? {
                firstName: this.pendingUser.firstName,
                lastName: this.pendingUser.lastName,
                phone: this.pendingUser.phone,
                password: this.pendingUser.password,
              }
            : {}),
        }),
      });

      if (response.ok) {
        this.showSuccessMessage("Verification code sent again!");
      } else {
        const data = await response.json();
        alert(data.message || "Failed to resend code");
      }
    } catch (error) {
      console.error("Resend code error:", error);
      alert("Failed to resend verification code");
    } finally {
      // Reset button state
      resendButton.textContent = originalText;
      resendButton.disabled = false;
      this.isProcessing = false;
    }
  },

  // Logout user
  logout: function () {
    if (confirm("Are you sure you want to logout?")) {
      this.currentUser = null;
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken"); // ADDED: Remove token too

      // Reset UI to logged out state
      this.elements.authButtonText.textContent = "Login";
      this.elements.headerAuthButton.innerHTML =
        '<i class="fas fa-user-circle text-xl mr-2"></i><span>Login</span>';
      this.elements.userDropdownName.textContent = "User Name";

      this.hideUserDropdown();
      this.showSuccessMessage("You have been logged out successfully!");

      console.log("User logged out"); // Debug
    }
  },

  // Toggle user dropdown - ENHANCED
  toggleUserDropdown: function () {
    const isHidden = this.elements.userDropdown.classList.contains("hidden");
    this.hideUserDropdown(); // First hide any open dropdowns

    if (isHidden) {
      this.elements.userDropdown.classList.remove("hidden");
    }
  },

  // Hide user dropdown
  hideUserDropdown: function () {
    this.elements.userDropdown.classList.add("hidden");
  },

  // Move to next verification digit
  moveToNext: function (input) {
    const digits = document.querySelectorAll(".verification-digit");
    const currentIndex = parseInt(input.getAttribute("data-index"));

    if (input.value.length === 1 && currentIndex < digits.length - 1) {
      digits[currentIndex + 1].focus();
    }
  },

  // Get the full verification code
  getVerificationCode: function () {
    const digits = document.querySelectorAll(".verification-digit");
    let code = "";
    digits.forEach((digit) => {
      code += digit.value;
    });
    return code;
  },

  // Generate a 6-digit verification code
  generateVerificationCode: function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Send verification email - FIXED FOR PRODUCTION
  async sendVerificationEmail(email, code, type) {
    const endpoint =
      type === "register"
        ? "/api/send-verification"
        : "/api/send-password-reset";

    try {
      // ✅ FIXED: Use relative URL for production compatibility
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Verification email sent to ${email}`);
        this.showSuccessMessage(`Verification code sent to ${email}`);
        return true;
      } else {
        console.error("❌ Failed to send verification email:", data.message);
        // Fallback for production - show code to user
        this.showSuccessMessage(`Use this verification code: ${code}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Email sending error:", error);
      // Fallback for production - show code to user
      this.showSuccessMessage(`Use this verification code: ${code}`);
      return false;
    }
  },

  // Validate email format
  validateEmail: function (email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate phone number
  validatePhone: function (phone) {
    // Remove any non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");

    // Allow Nigerian numbers in different formats
    const patterns = [
      /^\+234[789]\d{9}$/, // +2348012345678
      /^0[789]\d{9}$/, // 08012345678
      /^234[789]\d{9}$/, // 2348012345678
    ];

    return patterns.some((pattern) => pattern.test(cleaned));
  },

  // Add phone formatting function
  formatPhone: function (phone) {
    const cleaned = phone.replace(/[^\d+]/g, "");

    if (cleaned.startsWith("0") && cleaned.length === 11) {
      return "+234" + cleaned.substring(1);
    } else if (cleaned.startsWith("234") && cleaned.length === 13) {
      return "+" + cleaned;
    } else if (cleaned.startsWith("+234") && cleaned.length === 14) {
      return cleaned;
    }

    return cleaned; // Return as is if no pattern matches
  },

  // Show error message
  showError: function (elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  },

  // Clear all error messages
  clearErrorMessages: function () {
    const errorElements = document.querySelectorAll(".error-message");
    errorElements.forEach((element) => {
      element.classList.add("hidden");
      element.textContent = "";
    });
  },

  // Show success message
  showSuccessMessage: function (message) {
    // Create a temporary success message
    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    successDiv.textContent = message;

    document.body.appendChild(successDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  },

  // Shake verification digits for error feedback
  shakeVerificationDigits: function () {
    const digits = document.querySelectorAll(".verification-digit");
    digits.forEach((digit) => {
      digit.classList.add("shake");
      setTimeout(() => {
        digit.classList.remove("shake");
      }, 500);
    });
  },

  // Reset button state helper
  resetButtonState: function (button, originalText) {
    button.textContent = originalText;
    button.disabled = false;
  },
};

// Initialize the authentication system when the page loads
document.addEventListener("DOMContentLoaded", function () {
  authSystem.init();
});
