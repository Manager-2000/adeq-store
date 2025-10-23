// Payment option toggle
document.addEventListener("DOMContentLoaded", function () {
  const paymentModal = document.getElementById("paymentModal");
  const closePaymentModal = document.getElementById("closePaymentModal");

  if (!paymentModal) return;

  // close button (already working)
  if (closePaymentModal) {
    closePaymentModal.addEventListener("click", () => {
      paymentModal.classList.add("hidden");
    });
  }

  // Close when clicking outside the modal content
  paymentModal.addEventListener("click", (e) => {
    // modalContent = the inner white box (first direct element inside modal)
    const modalContent =
      paymentModal.querySelector(":scope > div") ||
      paymentModal.firstElementChild;
    if (!modalContent) return;
    // if the click target is not inside the white box → close
    if (!modalContent.contains(e.target)) {
      paymentModal.classList.add("hidden");
    }
  });

  // Close on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !paymentModal.classList.contains("hidden")) {
      paymentModal.classList.add("hidden");
    }
  });
});
