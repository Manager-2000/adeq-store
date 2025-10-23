// booking.js - CLEANED VERSION (only client email)
document.addEventListener("DOMContentLoaded", function () {
  if (typeof PaystackPop === "undefined") {
    console.error("Paystack library not loaded!");
    alert("Payment system is not available. Please refresh the page.");
    return;
  }

  const PAYSTACK_KEY = "pk_test_8e2842d4d202ae95e064cf7343ed9766506d72bb";
  const WHATSAPP_NUMBER = "2348104058164";
  const SERVER_URL = "http://localhost:3000"; // Change when hosted

  const PRICES = {
    residential: { town: 30000, outskirt: 50000 },
    commercial: { town: 30000, outskirt: 50000 },
    mining: { consultation: 100000 },
    borehole: { consultation: 150000 },
  };

  const surveyType = document.getElementById("surveyType");
  const dynamicOptions = document.getElementById("dynamicOptions");
  const quantityInput = document.getElementById("quantity");
  const bookingForm = document.getElementById("bookingForm");

  const customerName = document.getElementById("customerName");
  const customerEmail = document.getElementById("customerEmail");
  const customerPhone = document.getElementById("customerPhone");
  const preferredDate = document.getElementById("preferredDate");
  const projectLocation = document.getElementById("projectLocation");
  const projectDetails = document.getElementById("projectDetails");

  // Add these utility functions at the top
  function isUserLoggedIn() {
    const isLoggedIn = localStorage.getItem("userLoggedIn");
    const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return !!(isLoggedIn && userData.id);
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  }

  function isUserLoggedIn() {
    const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return !!(userData && userData.email); // Check if user data exists and has email
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  }

  function requireLogin(actionName = "complete this action") {
    if (!isUserLoggedIn()) {
      // Show auth modal if available
      const authModal = document.getElementById("authModal");
      if (authModal && typeof authSystem !== "undefined") {
        authSystem.showAuthModal();
        authSystem.showLoginForm();
      } else {
        // Fallback: redirect to login or show message
        alert(`Please login to ${actionName}`);
      }
      return false;
    }
    return true;
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      type === "success"
        ? "bg-green-500 text-white"
        : type === "error"
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  const formError = document.createElement("p");
  formError.id = "formError";
  formError.className = "hidden text-red-300 bg-red-900/50 p-3 rounded-lg mt-4";
  if (dynamicOptions && dynamicOptions.parentNode) {
    dynamicOptions.parentNode.insertBefore(formError, dynamicOptions);
  }

  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loadingOverlay";
  loadingOverlay.className =
    "fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden";
  loadingOverlay.innerHTML = `
    <div class="bg-white rounded-lg p-6 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
      <p class="text-gray-800 font-semibold">Processing payment...</p>
      <p class="text-gray-600 text-sm">Please wait while we process your transaction</p>
    </div>
  `;
  document.body.appendChild(loadingOverlay);

  function showError(msg) {
    formError.textContent = msg;
    formError.classList.remove("hidden");
    formError.classList.add("block");
  }

  function clearError() {
    formError.textContent = "";
    formError.classList.remove("block");
    formError.classList.add("hidden");
  }

  function showLoading() {
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.classList.add("flex");
  }

  function hideLoading() {
    loadingOverlay.classList.remove("flex");
    loadingOverlay.classList.add("hidden");
  }

  if (surveyType) {
    surveyType.addEventListener("change", updateForm);
  }
  if (quantityInput) {
    quantityInput.addEventListener("input", function () {
      if (document.getElementById("qtySummary")) refreshTotals();
    });
  }

  updateForm();

  function updateForm() {
    clearError();
    if (!surveyType || !dynamicOptions) return;

    const selected = surveyType.value;
    dynamicOptions.innerHTML = "";
    dynamicOptions.classList.add("hidden");

    if (!selected) return;

    if (selected === "mining" || selected === "borehole") {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg mt-4 transition-colors";
      btn.textContent =
        selected === "mining"
          ? "Contact for Mining Survey"
          : "Contact for Borehole Drilling";

      btn.onclick = function () {
        const serviceText =
          selected === "mining"
            ? "Mining Survey"
            : "Borehole Drilling Consultation";

        const msg = `Hello, I am interested in ${serviceText}.\nName: ${
          customerName.value || "N/A"
        }\nPhone: ${customerPhone.value || "N/A"}\nPreferred Date: ${
          preferredDate.value || "N/A"
        }\nLocation: ${projectLocation.value || "N/A"}\nDetails: ${
          projectDetails.value || "N/A"
        }`;

        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
          "_blank"
        );
      };

      dynamicOptions.appendChild(btn);
      dynamicOptions.classList.remove("hidden");
      return;
    }

    const label = document.createElement("p");
    label.className = "text-white font-semibold mb-4 text-lg";
    label.textContent = "Choose location and payment option:";

    const locationSelect = document.createElement("select");
    locationSelect.id = "locationSelect";
    locationSelect.className =
      "w-full p-3 rounded-lg mb-4 bg-white/90 text-gray-800 border-none focus:ring-2 focus:ring-cyan-400";
    locationSelect.innerHTML = `
      <option value="town">Inside Town (₦30,000)</option>
      <option value="outskirt">Outskirts/Outside State (₦50,000)</option>
    `;

    const qtySummary = document.createElement("p");
    qtySummary.id = "qtySummary";
    qtySummary.className = "text-white mb-2";

    const totalDisplay = document.createElement("p");
    totalDisplay.id = "totalDisplay";
    totalDisplay.className = "text-xl font-bold text-white mb-4";

    const paymentRadios = document.createElement("div");
    paymentRadios.className = "mb-4 space-y-2";
    paymentRadios.innerHTML = `
      <label class="flex items-center text-white">
        <input type="radio" name="payOpt" value="full" checked class="mr-2 h-5 w-5">
        Full Payment
      </label>
      <label class="flex items-center text-white">
        <input type="radio" name="payOpt" value="half" class="mr-2 h-5 w-5">
        50% Deposit
      </label>
      <p class="text-yellow-300 text-sm mt-2">Note: Remaining balance must be paid on site after the survey.</p>
    `;

    const payBtn = document.createElement("button");
    payBtn.type = "button";
    payBtn.id = "paystackButton";
    payBtn.className =
      "bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors w-full relative";
    payBtn.innerHTML = `
  <span class="pay-btn-text">Pay with Paystack</span>
  <span class="pay-btn-loading hidden">
    <i class="fas fa-spinner fa-spin mr-2"></i> Processing...
  </span>
`;

    // Update the event listener
    payBtn.addEventListener("click", function (e) {
      // Check if user is logged in
      if (!requireLogin("book services")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // If logged in, process the payment
      processPayment();
    });

    // Add to your dynamic options
    dynamicOptions.appendChild(payBtn);

    locationSelect.addEventListener("change", refreshTotals);
    paymentRadios.addEventListener("change", function () {
      refreshTotals();
    });

    payBtn.addEventListener("click", processPayment);

    dynamicOptions.appendChild(label);
    dynamicOptions.appendChild(locationSelect);
    dynamicOptions.appendChild(qtySummary);
    dynamicOptions.appendChild(totalDisplay);
    dynamicOptions.appendChild(paymentRadios);
    dynamicOptions.appendChild(payBtn);

    dynamicOptions.classList.remove("hidden");
    refreshTotals();
  }

  function refreshTotals() {
    clearError();
    const selected = surveyType.value;
    const locationSelect = document.getElementById("locationSelect");
    if (!locationSelect) return;

    const loc = locationSelect.value;
    const qty = Math.max(1, parseInt(quantityInput.value || "1", 10));
    const base = PRICES[selected]?.[loc] || 0;
    const option =
      document.querySelector('input[name="payOpt"]:checked')?.value || "full";
    const fullTotal = base * qty;
    const toPay = option === "half" ? Math.ceil(fullTotal / 2) : fullTotal;

    const qtyEl = document.getElementById("qtySummary");
    const totalEl = document.getElementById("totalDisplay");
    const payBtn = document.getElementById("paystackButton");

    if (qtyEl) qtyEl.textContent = `Quantity: ${qty}`;
    if (totalEl)
      totalEl.textContent = `Total: ₦${fullTotal.toLocaleString()} — Pay Now: ₦${toPay.toLocaleString()}`;
    if (payBtn) payBtn.setAttribute("data-amount", toPay);
  }

  function setButtonLoading(loading) {
    const payBtn = document.getElementById("paystackButton");
    if (!payBtn) return;

    const textSpan = payBtn.querySelector(".pay-btn-text");
    const loadingSpan = payBtn.querySelector(".pay-btn-loading");

    if (loading) {
      textSpan.classList.add("hidden");
      loadingSpan.classList.remove("hidden");
      payBtn.disabled = true;
    } else {
      textSpan.classList.remove("hidden");
      loadingSpan.classList.add("hidden");
      payBtn.disabled = false;
    }
  }

  // ✅ REPLACE THIS FUNCTION in your booking.js
  async function sendClientEmail(bookingData) {
    try {
      console.log("📤 Sending email to client:", bookingData);

      const response = await fetch(`${SERVER_URL}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      const result = await response.json();
      console.log("Email server response:", result);

      if (result.success) {
        console.log("✅ Confirmation email sent to client!");
      } else {
        throw new Error(result.message || "Failed to send email");
      }
    } catch (error) {
      console.error("❌ Client email sending failed:", error);
      // You can add a fallback here, like showing the details on screen
      alert(
        "Payment successful! However, we couldn't send the confirmation email. Please note your reference: " +
          bookingData.reference
      );
    }
  }

  function processPayment() {
    clearError();

    // Check authentication FIRST
    if (!requireLogin("book services")) {
      return;
    }

    const name = customerName.value.trim();
    const email = customerEmail.value.trim();
    const phone = customerPhone.value.trim();
    const date = preferredDate.value.trim();
    const location = projectLocation.value.trim();
    const service = surveyType.options[surveyType.selectedIndex].text;

    if (!name || !email || !phone || !date || !location) {
      showError("Please fill in all required fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    const payBtn = document.getElementById("paystackButton");
    const amount = parseInt(payBtn?.getAttribute("data-amount") || "0");

    if (amount <= 0) {
      showError("Invalid payment amount. Please check your selection.");
      return;
    }

    setButtonLoading(true);
    showLoading();

    const ref = "ADEQ_" + new Date().getTime();
    const user = getCurrentUser();

    const handler = PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: email,
      amount: amount * 100,
      currency: "NGN",
      ref: ref,
      metadata: {
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: user.id || "unknown",
          },
        ],
      },
      callback: function (response) {
        const quantity = Math.max(1, parseInt(quantityInput.value || "1", 10));
        const paymentType =
          document.querySelector('input[name="payOpt"]:checked')?.value ||
          "full";

        const bookingData = {
          reference: response.reference,
          name: name,
          email: email,
          phone: phone,
          service: service,
          amount: amount,
          quantity: quantity,
          paymentType: paymentType,
          location: location,
          date: date,
          details: projectDetails.value.trim(),
          timestamp: new Date().toLocaleString(),
          userId: user.id || "unknown", // Add user ID for tracking
        };

        sendClientEmail(bookingData);

        hideLoading();
        setButtonLoading(false);

        alert(
          "Payment successful! Reference: " +
            response.reference +
            "\nA confirmation email has been sent to you."
        );

        bookingForm.reset();
        dynamicOptions.innerHTML = "";
        dynamicOptions.classList.add("hidden");
        clearError();
      },
      onClose: function () {
        hideLoading();
        setButtonLoading(false);
        showError(
          "Payment was cancelled. Please try again if you want to complete your booking."
        );
      },
    });

    handler.openIframe();
  }

  // UPDATED: Add event listener to refresh user data when auth state changes
  function setupAuthListener() {
    // Listen for storage changes (login/logout)
    window.addEventListener("storage", function (e) {
      if (e.key === "currentUser") {
        autoFillUserData();
      }
    });

    // Also check auth status periodically (optional)
    setInterval(autoFillUserData, 1000);
  }

  setupAuthListener();
});
