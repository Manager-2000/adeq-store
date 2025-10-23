// navbar.js
document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu functionality
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const closeMobileMenu = document.getElementById("closeMobileMenu");
  const mobileMenu = document.getElementById("mobileMenu");
  const overlay = document.getElementById("overlay");

  // Check if elements exist before adding event listeners
  if (mobileMenuButton && mobileMenu && overlay && closeMobileMenu) {
    function openMenu() {
      mobileMenu.classList.add("open");
      overlay.classList.add("open");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      mobileMenu.classList.remove("open");
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    }

    // Add event listeners
    mobileMenuButton.addEventListener("click", function (e) {
      e.stopPropagation();
      openMenu();
    });

    closeMobileMenu.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    // Close mobile menu when a link is clicked
    const mobileLinks = mobileMenu.querySelectorAll("a");
    mobileLinks.forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
        closeMenu();
      }
    });
  }
});
