// Cart Loader - Complete with Paystack Payment
class ADEQCartLoader {
  constructor() {
    this.init();
  }

  init() {
    this.syncWithExistingCart();
    this.initCartEventListeners();
    this.initCartPriceRefresh(); // Added price refresh initialization
    console.log("🛒 Cart loader initialized");
  }

  // Sync with existing cart system
  syncWithExistingCart() {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const cartCount = parseInt(localStorage.getItem("cartCount")) || 0;

    // Update cart count display
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }

    console.log("🛒 Cart synced:", { items: cartItems, count: cartCount });
  }

  // Initialize cart price refresh functionality
  initCartPriceRefresh() {
    // Refresh prices when page loads
    setTimeout(() => {
      this.refreshCartPrices();
    }, 2000); // 2 second delay to ensure page is fully loaded

    // Also refresh when equipment data is updated (from admin changes)
    window.addEventListener("storage", (e) => {
      if (e.key === "equipment_updated") {
        console.log("🔄 Equipment updated, refreshing cart prices...");
        setTimeout(() => this.refreshCartPrices(), 1000);
      }
    });

    // Refresh prices every 30 seconds to catch any updates
    setInterval(() => {
      this.refreshCartPrices();
    }, 30000);

    // Also refresh when cart modal is opened
    document.addEventListener("click", (e) => {
      if (e.target.closest("#cartIcon")) {
        setTimeout(() => this.refreshCartPrices(), 500);
      }
    });
  }

  // Refresh cart prices from current equipment data
  async refreshCartPrices() {
    try {
      // Get current equipment data from the server
      const response = await fetch("/api/equipment");
      const equipmentData = await response.json();

      if (!equipmentData.equipment) return;

      // Get current cart items
      const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
      let cartUpdated = false;

      // Update cart items with current prices
      const updatedCartItems = cartItems.map((cartItem) => {
        const currentEquipment = equipmentData.equipment.find(
          (item) => item.name === cartItem.product
        );

        if (currentEquipment) {
          // Extract price number from the formatted price string (e.g., "₦400,000" -> 400000)
          const currentPriceText = currentEquipment.price.replace(/[₦,]/g, "");
          const currentPrice = parseInt(currentPriceText) || 0;

          if (currentPrice !== cartItem.price) {
            console.log(
              `🔄 Updating price for ${cartItem.product}: ${cartItem.price} → ${currentPrice}`
            );
            cartUpdated = true;
            return {
              ...cartItem,
              price: currentPrice,
              originalPrice: currentPrice,
            };
          }
        }

        return cartItem;
      });

      // Save updated cart if changes were made
      if (cartUpdated) {
        localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));
        this.updateCartModal(); // Refresh the cart display
        console.log("✅ Cart prices updated successfully");

        // Show notification to user
        this.showCartNotification("Cart prices updated with latest changes!");
      }
    } catch (error) {
      console.error("❌ Error refreshing cart prices:", error);
    }
  }

  // Initialize cart event listeners
  initCartEventListeners() {
    // Use event delegation for all cart interactions
    document.addEventListener("click", (e) => {
      // Add to cart buttons
      if (e.target.classList.contains("add-to-cart")) {
        e.preventDefault();
        e.stopPropagation();
        this.handleAddToCart(e.target);
      }

      // Quantity controls
      if (
        e.target.classList.contains("increase-quantity") ||
        e.target.classList.contains("decrease-quantity")
      ) {
        this.handleQuantityChange(e.target);
      }

      // Cart icon
      if (e.target.closest("#cartIcon")) {
        this.showCartModal();
      }

      // Close cart
      if (e.target.closest("#closeCart")) {
        this.hideCartModal();
      }

      // Checkout button
      if (e.target.closest("#checkoutButton")) {
        e.preventDefault();
        this.handleCheckout();
      }

      // Close payment modal
      if (e.target.closest("#closePaymentModal")) {
        this.hidePaymentModal();
      }

      // Pay Now button - PAYSTACK PAYMENT
      if (e.target.closest("#payWithPaystack")) {
        e.preventDefault();
        this.handlePaystackPayment();
      }
    });
  }

  // Handle add to cart
  handleAddToCart(button) {
    if (button.disabled) return;
    button.disabled = true;

    const productElement = button.closest(".equipment-item");
    if (!productElement) {
      button.disabled = false;
      return;
    }

    const productName =
      productElement.querySelector("h3")?.textContent?.trim() ||
      "Unknown Product";
    const priceElement = productElement.querySelector(".text-secondary");
    let price = 0;

    if (priceElement) {
      const priceText = priceElement.textContent
        .replace("₦", "")
        .replace(/,/g, "");
      price = parseInt(priceText) || 0;
    }

    console.log("🎯 Adding to cart:", productName, price);

    // Get current cart data
    let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    let cartCount = parseInt(localStorage.getItem("cartCount")) || 0;
    let cartTotal = parseInt(localStorage.getItem("cartTotal")) || 0;

    // Find existing item
    const existingItem = cartItems.find((item) => item.product === productName);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        product: productName,
        price: price,
        quantity: 1,
      });
    }

    // Recalculate totals
    cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    cartTotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save to localStorage
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    localStorage.setItem("cartCount", cartCount);
    localStorage.setItem("cartTotal", cartTotal);

    console.log("💾 Cart saved:", {
      items: cartItems.length,
      count: cartCount,
      total: cartTotal,
    });

    // Update UI
    this.updateCartUI(cartCount);
    this.showCartNotification(`${productName} added to cart!`);
    this.showButtonFeedback(button);

    setTimeout(() => {
      button.disabled = false;
    }, 1000);
  }

  // Handle quantity changes
  handleQuantityChange(button) {
    const product = button.getAttribute("data-product");
    const isIncrease = button.classList.contains("increase-quantity");

    let cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const itemIndex = cartItems.findIndex((item) => item.product === product);

    if (itemIndex !== -1) {
      if (isIncrease) {
        cartItems[itemIndex].quantity++;
      } else {
        if (cartItems[itemIndex].quantity > 1) {
          cartItems[itemIndex].quantity--;
        } else {
          cartItems.splice(itemIndex, 1);
        }
      }

      // Recalculate totals
      const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      );
      const cartTotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Save to localStorage
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      localStorage.setItem("cartCount", cartCount);
      localStorage.setItem("cartTotal", cartTotal);

      // Update UI
      this.updateCartUI(cartCount);
      this.updateCartModal();
      this.showCartNotification(
        isIncrease ? "Quantity increased!" : "Quantity decreased!"
      );
    }
  }

  // Update cart UI
  updateCartUI(cartCount) {
    const cartCountElement = document.getElementById("cartCount");
    if (cartCountElement) {
      cartCountElement.textContent = cartCount;
    }
  }

  // Update cart modal
  updateCartModal() {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const cartTotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const cartItemsContainer = document.getElementById("cartItems");
    const cartSubtotal = document.getElementById("cartSubtotal");
    const emptyCartMessage = document.getElementById("emptyCartMessage");
    const checkoutButton = document.getElementById("checkoutButton");

    if (cartItemsContainer && cartSubtotal) {
      if (cartItems.length === 0) {
        if (emptyCartMessage) emptyCartMessage.classList.remove("hidden");
        cartItemsContainer.innerHTML = "";
        if (checkoutButton) {
          checkoutButton.disabled = true;
          checkoutButton.classList.add("opacity-50", "cursor-not-allowed");
        }
      } else {
        if (emptyCartMessage) emptyCartMessage.classList.add("hidden");

        cartItemsContainer.innerHTML = cartItems
          .map(
            (item) => `
          <div class="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <h4 class="font-medium text-gray-800">${item.product}</h4>
              <p class="text-gray-600 text-sm">₦${item.price.toLocaleString()} each</p>
              ${
                item.originalPrice && item.originalPrice !== item.price
                  ? `<p class="text-green-600 text-xs font-semibold">Price updated!</p>`
                  : ""
              }
            </div>
            <div class="flex items-center space-x-3">
              <button class="decrease-quantity w-8 h-8 bg-red text-white rounded-full flex items-center justify-center hover:bg-red-600 transition" 
                      data-product="${item.product}">-</button>
              <span class="font-semibold text-lg min-w-8 text-center">${
                item.quantity
              }</span>
              <button class="increase-quantity w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition" 
                      data-product="${item.product}">+</button>
            </div>
          </div>
        `
          )
          .join("");

        cartSubtotal.textContent = `₦${cartTotal.toLocaleString()}`;

        if (checkoutButton) {
          checkoutButton.disabled = false;
          checkoutButton.classList.remove("opacity-50", "cursor-not-allowed");
        }
      }
    }
  }

  // Show cart modal
  showCartModal() {
    const cartModal = document.getElementById("cartModal");
    if (cartModal) {
      cartModal.classList.remove("hidden");
      this.updateCartModal();
    }
  }

  // Hide cart modal
  hideCartModal() {
    const cartModal = document.getElementById("cartModal");
    if (cartModal) {
      cartModal.classList.add("hidden");
    }
  }

  // Hide payment modal
  hidePaymentModal() {
    const paymentModal = document.getElementById("paymentModal");
    if (paymentModal) {
      paymentModal.classList.add("hidden");
    }
  }

  // Handle checkout
  handleCheckout() {
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];

    console.log("💰 Checkout - Cart items:", cartItems);

    if (cartItems.length === 0) {
      this.showCartNotification("Your cart is empty!", "error");
      return;
    }

    const cartTotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Hide cart modal and show payment modal
    this.hideCartModal();

    const paymentModal = document.getElementById("paymentModal");
    if (paymentModal) {
      const paymentAmount = document.getElementById("paymentAmount");
      if (paymentAmount) {
        paymentAmount.value = `₦${cartTotal.toLocaleString()}`;
      }

      // Auto-fill user data
      const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const customersName = document.getElementById("customersName");
      const customersEmail = document.getElementById("customersEmail");
      const customersPhone = document.getElementById("customersPhone");

      if (userData && userData.email) {
        if (customersName)
          customersName.value = `${userData.firstName || ""} ${
            userData.lastName || ""
          }`.trim();
        if (customersEmail) customersEmail.value = userData.email || "";
        if (customersPhone) customersPhone.value = userData.phone || "";
      }

      paymentModal.classList.remove("hidden");
      console.log("💰 Payment modal shown with total:", cartTotal);
    }
  }

  // Handle Paystack Payment
  handlePaystackPayment() {
    console.log("💳 Paystack payment initiated");

    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const isLoggedIn = !!(currentUser && currentUser.email);

    console.log("🔐 Payment Auth Check:", {
      isLoggedIn: isLoggedIn,
      currentUser: currentUser,
    });

    if (!isLoggedIn) {
      alert("Please login to complete your purchase");
      return;
    }

    // Get form data
    const customersName = document.getElementById("customersName");
    const customersEmail = document.getElementById("customersEmail");
    const customersPhone = document.getElementById("customersPhone");
    const paymentAmount = document.getElementById("paymentAmount");

    const email = customersEmail?.value || currentUser.email;
    const name =
      customersName?.value ||
      `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim();
    const phone = customersPhone?.value || currentUser.phone;

    // Get cart data
    const cartItems = JSON.parse(localStorage.getItem("cartItems")) || [];
    const cartTotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    console.log("📧 Payment details:", { email, name, phone, cartTotal });

    // Validation
    if (!email) {
      alert("Please enter your email");
      return;
    }

    if (!name) {
      alert("Please enter your name");
      return;
    }

    if (!phone) {
      alert("Please enter your phone number");
      return;
    }

    if (!cartTotal || cartTotal <= 0 || isNaN(cartTotal)) {
      alert(
        "Error: Cart total is invalid. Please add items to your cart first."
      );
      return;
    }

    // Create cart summary
    let cartSummary = cartItems
      .map((item) => {
        let totalPrice = item.price * item.quantity;
        return `${item.product} x${
          item.quantity
        } - ₦${totalPrice.toLocaleString()}`;
      })
      .join(" | ");

    const amountInKobo = Math.round(cartTotal * 100);

    // Make sure Paystack is loaded
    if (typeof PaystackPop === "undefined") {
      alert("Payment service is not available. Please try again later.");
      return;
    }

    console.log("🚀 Starting Paystack payment...");

    let handler = PaystackPop.setup({
      key: "pk_test_8e2842d4d202ae95e064cf7343ed9766506d72bb", // Your Paystack public key
      email: email,
      amount: amountInKobo,
      currency: "NGN",
      metadata: {
        custom_fields: [
          {
            display_name: "Cart Items",
            variable_name: "cart_items",
            value: cartSummary,
          },
          {
            display_name: "Customer Name",
            variable_name: "customer_name",
            value: name,
          },
          {
            display_name: "Customer Phone",
            variable_name: "customer_phone",
            value: phone,
          },
        ],
      },
      callback: (response) => {
        console.log("✅ Payment successful:", response.reference);
        this.handleSuccessfulPayment(
          response.reference,
          email,
          name,
          phone,
          cartItems,
          cartTotal
        );
      },
      onClose: () => {
        console.log("❌ Payment window closed");
        alert("Payment was cancelled. You can try again.");
      },
    });

    handler.openIframe();
  }

  // Handle successful payment
  handleSuccessfulPayment(
    reference,
    email,
    name,
    phone,
    cartItems,
    totalAmount
  ) {
    // Show success message
    alert("Payment successful! Reference: " + reference);

    // Hide payment modal
    this.hidePaymentModal();

    // Send email notifications
    this.sendPaymentEmail(
      reference,
      email,
      name,
      phone,
      cartItems,
      totalAmount
    );

    // Clear cart after successful payment
    localStorage.removeItem("cartItems");
    localStorage.removeItem("cartCount");
    localStorage.removeItem("cartTotal");

    // Update UI
    this.updateCartUI(0);
    this.updateCartModal();

    alert("Thank you for your purchase! Your order has been processed.");
  }

  // Send payment email (you can customize this)
  async sendPaymentEmail(
    reference,
    email,
    name,
    phone,
    orderDetails,
    totalAmount
  ) {
    try {
      const orderData = {
        reference: reference,
        name: name,
        email: email,
        phone: phone,
        service: "Equipment Purchase",
        amount: totalAmount,
        quantity: orderDetails.reduce(
          (total, item) => total + item.quantity,
          0
        ),
        paymentType: "full",
        location: "Online Store",
        date: new Date().toISOString().split("T")[0],
        details: `Equipment Order: ${orderDetails
          .map((item) => `${item.product} (x${item.quantity})`)
          .join(", ")}`,
        orderDetails: orderDetails,
      };

      // Send to your server endpoint
      const response = await fetch("http://localhost:3000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to send notifications");
      }

      console.log("📧 Payment notifications sent successfully!");
    } catch (error) {
      console.error("Error sending payment notifications:", error);
      // Don't show error to user - payment was successful anyway
    }
  }

  // Show button feedback
  showButtonFeedback(button) {
    const originalText = button.textContent;
    const originalClasses = button.className;

    button.textContent = "Added to Cart!";
    button.className = originalClasses
      .replace("bg-primary", "bg-green-600")
      .replace("hover:bg-secondary", "");

    setTimeout(() => {
      button.textContent = originalText;
      button.className = originalClasses;
    }, 2000);
  }

  // Show cart notification
  showCartNotification(message, type = "success") {
    const existingNotification = document.querySelector(".cart-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    const bgColor = type === "error" ? "bg-red-500" : "bg-green-500";
    notification.className = `cart-notification fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${
          type === "error" ? "fa-exclamation-circle" : "fa-check-circle"
        } mr-2"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize cart when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("🛒 Initializing cart loader with Paystack...");
  if (!window.cartLoader) {
    window.cartLoader = new ADEQCartLoader();
  }
});
