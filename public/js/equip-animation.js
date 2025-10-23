// SIMPLE Equipment Animation - Debug Version
console.log("🎬 Equipment animation script loaded");

// Add this to automatically initialize sliders when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log("📄 DOM Ready - Initializing equipment sliders");
  
  // Wait a bit for CMS content to load
  setTimeout(() => {
    initializeEquipmentSliders();
  }, 1500);
});

// Also listen for CMS content updates
if (typeof window !== 'undefined') {
  window.addEventListener('equipmentLoaded', function() {
    console.log("🔄 Equipment loaded event received - initializing sliders");
    setTimeout(() => {
      initializeEquipmentSliders();
    }, 500);
  });
}

function initializeEverything() {
  console.log("🚀 Initializing all equipment functionality");
  initializeViewMoreEquipment();
  initializeEquipmentSliders();
}

// SIMPLE View More Function
function initializeViewMoreEquipment() {
  console.log("🔍 Looking for view more button...");
  const viewMoreBtn = document.getElementById("viewMoreBtn");

  if (!viewMoreBtn) {
    console.log("❌ View More button not found");
    return;
  }

  console.log("✅ Found view more button");

  // Remove old event listeners
  const newBtn = viewMoreBtn.cloneNode(true);
  viewMoreBtn.parentNode.replaceChild(newBtn, viewMoreBtn);

  newBtn.setAttribute("data-expanded", "false");

  newBtn.addEventListener("click", function (e) {
    e.preventDefault();
    console.log("🔄 View More button clicked");
    toggleEquipmentView(newBtn);
  });

  // Initial setup
  setupInitialView();
}

// In equip-animation.js - Update the setupInitialView function
function setupInitialView() {
  const grid = document.querySelector("#equipment .grid");
  if (!grid) {
    console.log("❌ Equipment grid not found");
    return;
  }

  const items = grid.querySelectorAll(".equipment-item");
  console.log(`📦 Found ${items.length} equipment items`);

  if (items.length <= 3) {
    const btn = document.getElementById("viewMoreBtn");
    if (btn) btn.style.display = "none";

    // ✅ INITIALIZE SLIDERS FOR VISIBLE ITEMS
    initializeEquipmentSliders();
    return;
  }

  // Show only first 3 items
  items.forEach((item, index) => {
    if (index >= 3) {
      item.style.display = "none";
      item.classList.add("hidden-equipment");
    } else {
      item.style.display = "block";
      item.classList.remove("hidden-equipment");
    }
  });

  // ✅ INITIALIZE SLIDERS FOR VISIBLE ITEMS
  setTimeout(() => {
    initializeEquipmentSliders();
  }, 100);
}

// Also update the toggleEquipmentView function
function toggleEquipmentView(btn) {
  const grid = document.querySelector("#equipment .grid");
  const items = grid.querySelectorAll(".equipment-item");
  const isExpanded = btn.getAttribute("data-expanded") === "true";

  console.log(`🔄 Toggling view: ${isExpanded ? "collapse" : "expand"}`);

  if (!isExpanded) {
    // Show all
    items.forEach((item) => {
      item.style.display = "block";
      item.classList.remove("hidden-equipment");
    });
    btn.setAttribute("data-expanded", "true");
    btn.innerHTML = 'Show Less <i class="fas fa-arrow-up ml-2"></i>';
  } else {
    // Show only first 3
    items.forEach((item, index) => {
      if (index >= 3) {
        item.style.display = "none";
        item.classList.add("hidden-equipment");
      }
    });
    btn.setAttribute("data-expanded", "false");
    btn.innerHTML = 'View All Equipment <i class="fas fa-arrow-down ml-2"></i>';
  }

  // ✅ RE-INITIALIZE SLIDERS AFTER TOGGLE
  setTimeout(() => {
    initializeEquipmentSliders();
  }, 100);
}

function toggleEquipmentView(btn) {
  const grid = document.querySelector("#equipment .grid");
  const items = grid.querySelectorAll(
    '.equipment-item, [class*="equipment"], .bg-white.p-6.rounded-xl'
  );
  const isExpanded = btn.getAttribute("data-expanded") === "true";

  console.log(`🔄 Toggling view: ${isExpanded ? "collapse" : "expand"}`);

  if (!isExpanded) {
    // Show all
    items.forEach((item) => {
      item.style.display = "block";
      item.classList.remove("hidden-equipment");
    });
    btn.setAttribute("data-expanded", "true");
    btn.innerHTML = 'Show Less <i class="fas fa-arrow-up ml-2"></i>';

    // Re-init sliders for newly shown items
    setTimeout(initializeEquipmentSliders, 100);
  } else {
    // Show only first 3
    items.forEach((item, index) => {
      if (index >= 3) {
        item.style.display = "none";
        item.classList.add("hidden-equipment");
      }
    });
    btn.setAttribute("data-expanded", "false");
    btn.innerHTML = 'View All Equipment <i class="fas fa-arrow-down ml-2"></i>';

    // Scroll to top
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Simple Equipment Sliders - Add this to equip-animation.js
function initializeEquipmentSliders() {
  console.log("🔄 Initializing equipment sliders...");

  const sliders = document.querySelectorAll(".equipment-item .relative.h-56");

  console.log(`🎠 Found ${sliders.length} equipment sliders`);

  sliders.forEach((slider, sliderIndex) => {
    const images = slider.querySelectorAll(".slider-image");
    console.log(`   Slider ${sliderIndex}: ${images.length} images`);

    if (images.length <= 1) {
      console.log(`   ⏩ Skipping slider ${sliderIndex} - only 1 image`);
      return; // No need for slider if only one image
    }

    let currentIndex = 0;

    // Clear any existing interval for this slider
    if (slider.sliderInterval) {
      clearInterval(slider.sliderInterval);
    }

    // Function to show specific slide
    const showSlide = (index) => {
      // Remove active class from all images
      images.forEach((img) => img.classList.remove("active"));

      // Add active class to current image
      images[index].classList.add("active");

      currentIndex = index;
    };

    // Auto-advance slides every 3 seconds
    slider.sliderInterval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      showSlide(nextIndex);
    }, 3000);

    // Pause on hover
    slider.addEventListener("mouseenter", () => {
      if (slider.sliderInterval) {
        clearInterval(slider.sliderInterval);
      }
    });

    slider.addEventListener("mouseleave", () => {
      slider.sliderInterval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        showSlide(nextIndex);
      }, 3000);
    });

    console.log(
      `✅ Slider ${sliderIndex} initialized with ${images.length} images`
    );
  });
}

// Make sure to call this function after equipment loads
window.initializeEquipmentSliders = initializeEquipmentSliders;

// Make functions global
window.initializeViewMoreEquipment = initializeViewMoreEquipment;
window.initializeEquipmentSliders = initializeEquipmentSliders;
window.initializeEverything = initializeEverything;

// Re-initialize when equipment updates
window.addEventListener("storage", function (e) {
  if (e.key === "equipment_updated") {
    console.log("🔄 Equipment updated - reinitializing animations");
    setTimeout(initializeEverything, 500);
  }
});

// Export for CMS loader
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    initializeViewMoreEquipment,
    initializeEquipmentSliders,
    initializeEverything,
  };
}
