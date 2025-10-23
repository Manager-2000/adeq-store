// CMS Loader for ADEQ Website - Dynamic Content Loading
class ADEQContentLoader {
  constructor() {
    this.baseURL = window.location.origin;
    this.lastUpdateTime = null;
    this.initAutoRefresh();
    this.initContactAutoRefresh();
  }

  initAutoRefresh() {
    // Check for updates every 30 seconds
    setInterval(() => {
      this.checkForUpdates();
    }, 30000);

    // Also check when page becomes visible
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });

    // 🔥 ADD THIS: Listen for the SPECIFIC hero refresh event
    window.addEventListener("storage", (e) => {
      if (e.key === "hero_refresh_event") {
        console.log("🔄 Hero refresh event detected");
        // Add a delay to ensure the data is saved
        setTimeout(() => {
          this.loadHeroContent();
        }, 1000);
      }
    });
  }

  // 🔥 ALSO UPDATE THE checkForUpdates METHOD:
  async checkForUpdates() {
    try {
      const response = await fetch(`${this.baseURL}/api/hero`);
      const data = await response.json();

      // Simple check - if data has changed, reload
      const currentTime = JSON.stringify(data);
      if (this.lastUpdateTime !== currentTime) {
        this.lastUpdateTime = currentTime;

        // Only reload if we're not already loading
        if (!this.loadingHero) {
          this.loadHeroContent();
          console.log("Content updated automatically");
        }
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  }

  // Add auto-refresh for contact updates
  initContactAutoRefresh() {
    // Listen for storage events (when admin updates contact)
    window.addEventListener("storage", (e) => {
      if (e.key === "contact_updated") {
        console.log("🔄 Contact update detected, refreshing...");
        this.loadContactInfo();
      }
    });

    // Also check periodically
    setInterval(() => {
      this.loadContactInfo();
    }, 30000); // Check every 30 seconds
  }

  // In the checkForUpdates method, add this condition:
  async checkForUpdates() {
    try {
      const response = await fetch(`${this.baseURL}/api/hero`);
      const data = await response.json();

      // Simple check - if data has changed, reload
      const currentTime = JSON.stringify(data);
      if (this.lastUpdateTime !== currentTime) {
        this.lastUpdateTime = currentTime;
        this.loadHeroContent();
        console.log("Content updated automatically");

        // DON'T reload equipment automatically as it breaks view more functionality
        // Only reload hero content for auto-updates
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  }

  // In cms-loader.js - Updated hero methods
  async loadHeroContent() {
    try {
      // Just let the HeroSlider class handle it
      if (window.heroSlider) {
        window.heroSlider.loadHeroContent();
      }
    } catch (error) {
      console.error("Error loading hero content:", error);
    }
  }

  // Load services data
  async loadServices() {
    try {
      const response = await fetch(`${this.baseURL}/api/services`);
      const data = await response.json();

      if (data.services && data.services.length > 0) {
        this.renderServices(data.services);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    }
  }

  // === UPDATED EQUIPMENT METHODS ===

  async loadEquipment() {
    try {
      console.log("🔄 Loading equipment...");
      const response = await fetch(
        `${this.baseURL}/api/equipment?t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Equipment data received:", data);

      if (data.equipment && data.equipment.length > 0) {
        console.log(`🎯 Rendering ${data.equipment.length} equipment items`);
        this.renderEquipment(data.equipment);

        // 🔥 ADD THIS: Trigger cart price refresh when equipment data loads
        if (window.refreshCartPrices) {
          setTimeout(() => {
            window.refreshCartPrices();
          }, 500);
        }
      } else {
        console.warn("⚠️ No equipment found or empty array");
        this.renderEquipment([]);
      }
    } catch (error) {
      console.error("❌ Error loading equipment:", error);
      this.renderEquipment([]);
    }
  }

  // === UPDATED EQUIPMENT METHODS WITH WORKING CAROUSEL ===
  renderEquipment(equipment) {
    console.log("🎨 START Rendering equipment...");

    const equipmentContainer = document.querySelector("#equipment .grid");
    if (!equipmentContainer) {
      console.error("❌ Equipment container not found!");
      return;
    }

    // Clear existing content
    equipmentContainer.innerHTML = "";

    if (!equipment || equipment.length === 0) {
      equipmentContainer.innerHTML = `
      <div class="col-span-3 text-center py-8">
        <p class="text-gray-500">No equipment available yet.</p>
      </div>
    `;
      return;
    }

    // Filter featured equipment
    const displayEquipment = equipment.filter((item) => item.featured === true);
    const equipmentToShow =
      displayEquipment.length > 0 ? displayEquipment : equipment;

    // Render equipment items
    equipmentToShow.forEach((item, index) => {
      const equipmentItem = this.createEquipmentItemWithCarousel(item, index);
      equipmentContainer.appendChild(equipmentItem);
    });

    // Initialize carousels after rendering
    setTimeout(() => {
      console.log("🔄 Equipment rendering complete - triggering event");

      // Trigger custom event for slider initialization
      const event = new CustomEvent("equipmentLoaded");
      window.dispatchEvent(event);

      // Also directly initialize
      if (window.initializeEquipmentSliders) {
        window.initializeEquipmentSliders();
      }
    }, 200);
  }

  // NEW METHOD: Create equipment item with working carousel
  createEquipmentItemWithCarousel(item, index) {
    const div = document.createElement("div");
    div.className = `bg-white p-6 rounded-xl shadow-md transform hover:-translate-y-2 transition duration-300 equipment-item`;
    div.setAttribute("data-equipment-index", index);

    // Generate carousel HTML with proper structure
    const carouselHTML = this.generateCarouselHTML(item, index);

    div.innerHTML = `
    ${carouselHTML}
    <h3 class="text-2xl font-bold text-primary mb-2">${item.name}</h3>
    <p class="text-gray-600 mb-4">${item.description}</p>
    <div class="flex justify-between items-center">
      <span class="text-2xl font-bold text-secondary">${item.price}</span>
      <button class="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-full transition duration-300 add-to-cart"
              data-product="${item.name}"
              data-price="${item.price.replace("₦", "").replace(/,/g, "")}">
        Add to Cart
      </button>
    </div>
  `;

    return div;
  }

  // NEW METHOD: Generate carousel HTML
  generateCarouselHTML(item, index) {
    if (!item.images || item.images.length === 0) {
      return `
      <div class="relative h-56 rounded-lg overflow-hidden mb-6 bg-gray-200 flex items-center justify-center">
        <i class="fas fa-image text-gray-400 text-4xl"></i>
      </div>
    `;
    }

    const imagesHTML = item.images
      .map(
        (img, imgIndex) => `
    <div class="carousel-slide ${
      imgIndex === 0 ? "active" : ""
    }" data-slide="${imgIndex}">
      <img src="${img}" alt="${item.name}" class="w-full h-56 object-cover">
    </div>
  `
      )
      .join("");

    const indicatorsHTML =
      item.images.length > 1
        ? item.images
            .map(
              (_, indicatorIndex) => `
    <button class="carousel-indicator w-3 h-3 rounded-full bg-white/70 mx-1 ${
      indicatorIndex === 0 ? "bg-white" : ""
    }" 
            data-carousel="${index}" data-slide-to="${indicatorIndex}"></button>
  `
            )
            .join("")
        : "";

    return `
    <div class="relative h-56 rounded-lg overflow-hidden mb-6 equipment-carousel" data-carousel-id="${index}">
      <div class="carousel-container relative w-full h-full">
        ${imagesHTML}
      </div>
      
      ${
        item.images.length > 1
          ? `
        <!-- Navigation arrows -->
        <button class="carousel-prev absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="carousel-next absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition">
          <i class="fas fa-chevron-right"></i>
        </button>
        
        <!-- Indicators -->
        <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          ${indicatorsHTML}
        </div>
      `
          : ""
      }
    </div>
  `;
  }

  // NEW METHOD: Initialize equipment carousels
  initializeEquipmentCarousels() {
    const carousels = document.querySelectorAll(".equipment-carousel");
    console.log(`🎠 Found ${carousels.length} carousels to initialize`);

    carousels.forEach((carousel, carouselIndex) => {
      const slides = carousel.querySelectorAll(".carousel-slide");
      const indicators = carousel.querySelectorAll(".carousel-indicator");
      const prevBtn = carousel.querySelector(".carousel-prev");
      const nextBtn = carousel.querySelector(".carousel-next");

      console.log(`   Carousel ${carouselIndex}: ${slides.length} slides`);

      if (slides.length <= 1) {
        // No need for carousel if only one image
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        return;
      }

      let currentIndex = 0;
      let autoSlideInterval;

      // Function to show specific slide
      const showSlide = (index) => {
        // Hide all slides
        slides.forEach((slide) => {
          slide.classList.remove("active");
          slide.style.display = "none";
        });

        // Remove active class from all indicators
        indicators.forEach((indicator) => {
          indicator.classList.remove("bg-white");
          indicator.classList.add("bg-white/70");
        });

        // Show current slide
        slides[index].classList.add("active");
        slides[index].style.display = "block";

        // Update indicator
        if (indicators[index]) {
          indicators[index].classList.remove("bg-white/70");
          indicators[index].classList.add("bg-white");
        }

        currentIndex = index;
      };

      // Next slide function
      const nextSlide = () => {
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
      };

      // Previous slide function
      const prevSlide = () => {
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
      };

      // Auto-slide function
      const startAutoSlide = () => {
        autoSlideInterval = setInterval(nextSlide, 3000); // Change slide every 3 seconds
      };

      // Stop auto-slide function
      const stopAutoSlide = () => {
        if (autoSlideInterval) {
          clearInterval(autoSlideInterval);
        }
      };

      // Initialize first slide
      showSlide(0);

      // Start auto-slide
      startAutoSlide();

      // Event listeners for navigation
      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          stopAutoSlide();
          nextSlide();
          startAutoSlide();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          stopAutoSlide();
          prevSlide();
          startAutoSlide();
        });
      }

      // Event listeners for indicators
      indicators.forEach((indicator, index) => {
        indicator.addEventListener("click", (e) => {
          e.stopPropagation();
          stopAutoSlide();
          showSlide(index);
          startAutoSlide();
        });
      });

      // Pause on hover
      carousel.addEventListener("mouseenter", stopAutoSlide);
      carousel.addEventListener("mouseleave", startAutoSlide);

      // Touch/swipe support for mobile
      let touchStartX = 0;
      let touchEndX = 0;

      carousel.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
      });

      carousel.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoSlide();
      });

      const handleSwipe = () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) {
            // Swipe left - next slide
            nextSlide();
          } else {
            // Swipe right - previous slide
            prevSlide();
          }
        }
      };

      console.log(
        `✅ Carousel ${carouselIndex} initialized with ${slides.length} slides`
      );
    });
  }

  // Create equipment item with proper carousel structure
  createEquipmentItem(item, index) {
    const div = document.createElement("div");
    div.className = `bg-white p-6 rounded-xl shadow-md transform hover:-translate-y-2 transition duration-300 equipment-item`;
    div.setAttribute("data-equipment-index", index);

    // Generate slider HTML - make sure it matches what the carousel expects
    const sliderHTML =
      item.images && item.images.length > 0
        ? `
    <!-- Image Slider -->
    <div class="relative h-56 rounded-lg overflow-hidden mb-6 equipment-slider" data-slider-index="${index}">
      ${item.images
        .map(
          (img, imgIndex) => `
        <img src="${img}" 
             class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 slider-image ${
               imgIndex === 0 ? "opacity-100" : "opacity-0"
             }" 
             alt="${item.name}"
             data-image-index="${imgIndex}">
      `
        )
        .join("")}
      
      <!-- Slider Indicators (if multiple images) -->
      ${
        item.images.length > 1
          ? `
        <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          ${item.images
            .map(
              (_, indicatorIndex) => `
            <button class="slider-indicator w-2 h-2 rounded-full bg-white/70 hover:bg-white transition ${
              indicatorIndex === 0 ? "bg-white" : ""
            }"
                    data-slider="${index}" 
                    data-slide-to="${indicatorIndex}"></button>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `
        : `
    <!-- Fallback if no images -->
    <div class="relative h-56 rounded-lg overflow-hidden mb-6 bg-gray-200 flex items-center justify-center">
      <i class="fas fa-image text-gray-400 text-4xl"></i>
    </div>
  `;

    div.innerHTML = `
    ${sliderHTML}
    <h3 class="text-2xl font-bold text-primary mb-2">${item.name}</h3>
    <p class="text-gray-600 mb-4">${item.description}</p>
    <div class="flex justify-between items-center">
      <span class="text-2xl font-bold text-secondary">${item.price}</span>
      <button class="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-full transition duration-300 add-to-cart"
              data-product="${item.name}"
              data-price="${item.price.replace("₦", "").replace(/,/g, "")}">
        Add to Cart
      </button>
    </div>
  `;

    return div;
  }

  // Enhanced equipment image sliders with better initialization
  initEquipmentSliders() {
    const sliders = document.querySelectorAll(".equipment-slider");
    console.log(`🎠 Found ${sliders.length} equipment sliders to initialize`);

    sliders.forEach((slider, sliderIndex) => {
      const images = slider.querySelectorAll(".slider-image");
      const indicators = slider.querySelectorAll(".slider-indicator");

      console.log(`🖼️ Slider ${sliderIndex} has ${images.length} images`);

      if (images.length <= 1) {
        // No need for slider if only one image
        if (indicators.length > 0) {
          indicators[0].style.display = "none"; // Hide indicator for single image
        }
        return;
      }

      let currentIndex = 0;

      // Clear any existing interval for this slider
      if (slider.sliderInterval) {
        clearInterval(slider.sliderInterval);
      }

      // Function to show specific slide
      const showSlide = (index) => {
        images.forEach((img, i) => {
          img.classList.remove("opacity-100");
          img.classList.add("opacity-0");
        });
        indicators.forEach((indicator, i) => {
          indicator.classList.remove("bg-white");
          indicator.classList.add("bg-white/70");
        });

        images[index].classList.remove("opacity-0");
        images[index].classList.add("opacity-100");
        indicators[index].classList.remove("bg-white/70");
        indicators[index].classList.add("bg-white");

        currentIndex = index;
      };

      // Auto-advance slides
      slider.sliderInterval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        showSlide(nextIndex);
      }, 3000);

      // Click indicators to navigate
      indicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => {
          showSlide(index);
          // Reset timer when manually navigating
          clearInterval(slider.sliderInterval);
          slider.sliderInterval = setInterval(() => {
            const nextIndex = (currentIndex + 1) % images.length;
            showSlide(nextIndex);
          }, 3000);
        });
      });

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

  // Load projects data
  // === UPDATED PROJECTS METHODS ===
  async loadProjects() {
    try {
      console.log("🔄 Loading projects...");

      // Add cache-busting parameter
      const response = await fetch(
        `${this.baseURL}/api/projects?t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Projects data received:", data);

      if (data.projects && data.projects.length > 0) {
        console.log(`🎯 Rendering ${data.projects.length} projects`);
        this.renderProjects(data.projects);
      } else {
        console.warn("⚠️ No projects found or empty array");
        this.renderProjects([]);
      }
    } catch (error) {
      console.error("❌ Error loading projects:", error);
      this.renderProjects([]);
    }
  }

  // === FIXED RENDER PROJECTS METHOD ===
  // Updated renderProjects method for new design
  renderProjects(projects) {
    console.log("🎨 Rendering projects with new design...");

    const projectsContainer = document.getElementById("projects-container");
    if (!projectsContainer) {
      console.error("❌ projects-container not found!");
      return;
    }

    // Clear existing content
    projectsContainer.innerHTML = "";

    if (!projects || projects.length === 0) {
      projectsContainer.innerHTML = `
      <div class="col-span-3 text-center py-12">
        <div class="max-w-md mx-auto">
          <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-inbox text-gray-400 text-3xl"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No Projects Yet</h3>
          <p class="text-gray-500">Our project portfolio is being updated with amazing work.</p>
        </div>
      </div>
    `;
      return;
    }

    // Render projects with new design
    const projectsHTML = projects
      .map((project, index) => {
        return `
      <div class="project-card group bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
        <div class="project-image-container relative overflow-hidden">
          <img 
            src="${project.image || "assets/images/placeholder-project.jpg"}" 
            alt="${project.title || "Project"}" 
            class="w-full h-64 object-cover transform group-hover:scale-110 transition duration-500"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end">
            <div class="p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition duration-300">
              <div class="flex items-center space-x-2 mb-2">
                <i class="fas fa-map-marker-alt text-sm"></i>
                <span class="text-sm font-medium">Completed Project</span>
              </div>
              <h3 class="text-xl font-bold mb-2">${
                project.title || "Water Solution Project"
              }</h3>
            </div>
          </div>
          <div class="absolute top-4 right-4">
            <span class="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              <i class="fas fa-check-circle mr-1"></i>Done
            </span>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
              ${project.title || "Water Solution Project"}
            </h3>
            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <i class="fas fa-water text-primary"></i>
            </div>
          </div>
          
          <p class="text-gray-600 leading-relaxed mb-6 line-clamp-3">
            ${
              project.description ||
              "Professional water solution project completed with excellence and precision."
            }
          </p>
          
          <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <div class="flex items-center space-x-1 text-amber-500">
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
              <i class="fas fa-star"></i>
            </div>
            <span class="text-sm text-gray-500 font-medium">
              <i class="far fa-clock mr-1"></i>Recently
            </span>
          </div>
        </div>
      </div>
    `;
      })
      .join("");

    projectsContainer.innerHTML = projectsHTML;

    // Add animation to cards when they come into view
    setTimeout(() => {
      const cards = projectsContainer.querySelectorAll(".project-card");
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add("animate-fade-in-up");
      });
    }, 100);
  }
  // === END UPDATED PROJECTS METHODS ===

  // === UPDATED TESTIMONIALS METHODS ===
  async loadTestimonials() {
    try {
      console.log("🔄 Loading testimonials...");

      // Add cache-busting parameter
      const response = await fetch(
        `${this.baseURL}/api/testimonials?t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Testimonials data received:", data);

      if (data.testimonials && data.testimonials.length > 0) {
        console.log(`🎯 Rendering ${data.testimonials.length} testimonials`);
        this.renderTestimonials(data.testimonials);
      } else {
        console.warn("⚠️ No testimonials found or empty array");
        this.renderTestimonials([]);
      }
    } catch (error) {
      console.error("❌ Error loading testimonials:", error);
      this.renderTestimonials([]);
    }
  }

  // === FIXED RENDER TESTIMONIALS METHOD ===
  renderTestimonials(testimonials) {
    console.log("🎨 START Rendering testimonials...");
    console.log("📊 Testimonials to render:", testimonials);

    // Target the specific container we created
    const testimonialsContainer = document.getElementById(
      "testimonials-container"
    );

    if (!testimonialsContainer) {
      console.error(
        '❌ testimonials-container not found! Make sure HTML has id="testimonials-container"'
      );
      return;
    }

    console.log("✅ Found testimonials-container");

    // Clear existing content
    testimonialsContainer.innerHTML = "";

    if (!testimonials || testimonials.length === 0) {
      testimonialsContainer.innerHTML = `
        <div class="col-span-3 text-center py-8">
          <p class="text-gray-500">No testimonials available yet.</p>
        </div>
      `;
      console.log("ℹ️ No testimonials to display");
      return;
    }

    // Render testimonials - match your exact HTML structure
    console.log(`🖼️ Rendering ${testimonials.length} testimonials...`);

    const testimonialsHTML = testimonials
      .map((testimonial, index) => {
        const stars = this.renderStars(testimonial.rating || 5);

        return `
          <div class="bg-light p-6 rounded-xl shadow-md transform hover:-translate-y-2 transition duration-300">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-4">
                ${testimonial.initials || "CU"}
              </div>
              <div>
                <h4 class="font-bold">${testimonial.name || "Customer"}</h4>
                <p class="text-gray-600">${testimonial.role || "Client"}</p>
              </div>
            </div>
            <p class="text-gray-700">${
              testimonial.text || "No testimonial text provided."
            }</p>
            <div class="flex text-accent mt-4">
              ${stars}
            </div>
          </div>
        `;
      })
      .join("");

    testimonialsContainer.innerHTML = testimonialsHTML;

    // Verify rendering worked
    const renderedItems = testimonialsContainer.children;
    console.log(
      `✅ Successfully rendered ${renderedItems.length} testimonial items`
    );
    console.log("🏁 FINISHED rendering testimonials");
  }
  // === END UPDATED TESTIMONIALS METHODS ===

  // Load contact information
  // Add this method to your ADEQContentLoader class in cms-loader.js
  async loadContactInfo() {
    try {
      console.log("📞 Loading contact info...");

      const response = await fetch(
        `${this.baseURL}/api/contact?t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Contact data received:", data);

      if (data.contact) {
        this.renderContactInfo(data.contact);
      }
    } catch (error) {
      console.error("❌ Error loading contact info:", error);
    }
  }

  // Add this method to render contact info
  renderContactInfo(contact) {
    console.log("🎨 Rendering contact info...");

    if (!contact) return;

    // Update contact section
    this.updateContactSection(contact);

    // Update footer contact info
    this.updateFooterContact(contact);
  }

  // Update contact section
  updateContactSection(contact) {
    const contactSection = document.getElementById("contact");
    if (!contactSection) {
      console.error("❌ Contact section not found");
      return;
    }

    // Update address
    const addressElements = contactSection.querySelectorAll(
      '[data-field="address"]'
    );
    addressElements.forEach((el) => {
      if (el) el.textContent = contact.address || "";
    });

    // Update phones
    const phoneElements = contactSection.querySelectorAll(
      '[data-field="phone"]'
    );
    if (phoneElements.length >= 2 && contact.phones) {
      phoneElements[0].textContent = contact.phones[0] || "";
      phoneElements[1].textContent = contact.phones[1] || "";
    }

    // Update emails
    const emailElements = contactSection.querySelectorAll(
      '[data-field="email"]'
    );
    if (emailElements.length >= 2 && contact.emails) {
      emailElements[0].textContent = contact.emails[0] || "";
      emailElements[1].textContent = contact.emails[1] || "";
    }

    // Update hours
    const hoursElements = contactSection.querySelectorAll(
      '[data-field="hours"]'
    );
    if (hoursElements.length >= 2 && contact.hours) {
      hoursElements[0].textContent = contact.hours.weekdays || "";
      hoursElements[1].textContent = contact.hours.saturday || "";
    }

    console.log("✅ Contact section updated");
  }

  // Update footer contact info
  updateFooterContact(contact) {
    const footer = document.querySelector("footer");
    if (!footer || !contact) return;

    console.log("🔄 Updating footer contact info...");

    // Find ALL footer contact elements
    const footerAddress = footer.querySelector("li:first-child span");
    const footerPhone = footer.querySelector("li:nth-child(2) span");
    const footerEmail = footer.querySelector("li:nth-child(3) span");
    const footerHours = footer.querySelector("li:nth-child(4) span"); // Working hours element

    if (footerAddress) {
      footerAddress.textContent = contact.address || "";
      console.log("✅ Footer address updated:", contact.address);
    }

    if (footerPhone) {
      footerPhone.textContent = contact.phones?.[0] || "";
      console.log("✅ Footer phone updated:", contact.phones?.[0]);
    }

    if (footerEmail) {
      footerEmail.textContent = contact.emails?.[0] || "";
      console.log("✅ Footer email updated:", contact.emails?.[0]);
    }

    if (footerHours && contact.hours) {
      // Combine weekday and saturday hours for footer
      const hoursText = `${contact.hours.weekdays || ""} | ${
        contact.hours.saturday || ""
      }`;
      footerHours.textContent = hoursText;
      console.log("✅ Footer hours updated:", hoursText);
    }

    console.log("✅ Footer contact completely updated");
  }

  // Load booking options
  async loadBookingOptions() {
    try {
      const response = await fetch(`${this.baseURL}/api/booking`);
      const data = await response.json();

      if (data.surveyTypes && data.surveyTypes.length > 0) {
        this.renderBookingOptions(data.surveyTypes);
      }
    } catch (error) {
      console.error("Error loading booking options:", error);
    }
  }

  // Render services
  renderServices(services) {
    const servicesContainer = document.getElementById("services-container");
    if (!servicesContainer) return;

    servicesContainer.innerHTML = services
      .map(
        (service) => `
        <div class="bg-light p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-2">
            <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <i class="${service.icon} text-2xl"></i>
            </div>
            <h3 class="text-xl font-bold text-primary mb-3">${
              service.title
            }</h3>
            <p class="text-gray-600 mb-4">${service.description}</p>
            ${
              service.price
                ? `<p class="text-secondary font-bold mb-2">${this.ensureNairaSymbol(
                    service.price
                  )}</p>`
                : ""
            }
            <a href="${
              service.link
            }" class="text-accent font-medium flex items-center">
                Learn more <i class="fas fa-arrow-right ml-2"></i>
            </a>
        </div>
    `
      )
      .join("");
  }

  // Add this helper method to ensure naira symbol displays correctly
  ensureNairaSymbol(priceText) {
    return (
      `<span class="naira-symbol">₦</span>` +
      priceText.replace(/[₦&#8358;]/g, "")
    );
  }

  // === FIXED EQUIPMENT SECTION ===
  renderEquipment(equipment) {
    const equipmentContainer = document.querySelector("#equipment .grid");
    if (!equipmentContainer) return;

    // Clear existing content
    equipmentContainer.innerHTML = "";

    // Filter featured equipment (or all if you want)
    const displayEquipment = equipment.filter((item) => item.featured === true);

    // If no featured equipment, show all
    const equipmentToShow =
      displayEquipment.length > 0 ? displayEquipment : equipment;

    // Render equipment items
    equipmentToShow.forEach((item, index) => {
      const equipmentItem = this.createEquipmentItem(item, false);
      equipmentContainer.appendChild(equipmentItem);
    });

    // Re-initialize view more functionality
    setTimeout(() => {
      if (window.initializeViewMoreEquipment) {
        initializeViewMoreEquipment();
      }
    }, 100);
  }

  createEquipmentItem(item, isHidden = false) {
    const div = document.createElement("div");
    div.className = `bg-white p-6 rounded-xl shadow-md transform hover:-translate-y-2 transition duration-300 equipment-item`;

    div.innerHTML = `
        <!-- Image Slider -->
        <div class="relative h-56 rounded-lg overflow-hidden mb-6">
            ${item.images
              .map(
                (img, index) => `
                <img src="${img}" class="absolute inset-0 w-full h-full object-cover slider-image ${
                  index === 0 ? "active" : ""
                }" alt="${item.name}">
            `
              )
              .join("")}
        </div>
        <h3 class="text-2xl font-bold text-primary mb-2">${item.name}</h3>
        <p class="text-gray-600 mb-4">${item.description}</p>
        <div class="flex justify-between items-center">
            <span class="text-2xl font-bold text-secondary">${item.price}</span>
            <button class="bg-primary hover:bg-secondary text-white px-6 py-2 rounded-full transition duration-300 add-to-cart">
                Add to Cart
            </button>
        </div>
    `;

    return div;
  }

  // Initialize all equipment functionality
  initEquipmentFunctionality() {
    this.initEquipmentSliders();
  }

  // Initialize equipment image sliders - SINGLE VERSION
  initEquipmentSliders() {
    document.querySelectorAll(".equipment-item").forEach((item) => {
      const images = item.querySelectorAll(".slider-image");
      if (images.length <= 1) return;

      let currentIndex = 0;

      // Clear any existing intervals
      if (item.sliderInterval) {
        clearInterval(item.sliderInterval);
      }

      item.sliderInterval = setInterval(() => {
        images[currentIndex].classList.remove("active");
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.add("active");
      }, 3000);
    });
  }
  // === END FIXED EQUIPMENT SECTION ===

  // Render projects
  renderProjects(projects) {
    const projectsContainer = document.querySelector("#projects .grid");
    if (!projectsContainer) return;

    projectsContainer.innerHTML = projects
      .map(
        (project) => `
            <div class="bg-light rounded-xl overflow-hidden shadow-lg transform hover:-translate-y-2 transition duration-300 group relative">
                <img src="${project.image}" alt="${project.title}" class="w-full h-56 object-cover transform group-hover:scale-110 transition duration-500">
                <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <p class="text-white text-lg font-semibold">${project.title}</p>
                </div>
                <div class="p-4">
                    <p class="text-gray-600 text-xl mb-8">${project.description}</p>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Render star ratings
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = "";

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }

    return stars;
  }

  // Render contact information
  renderContactInfo(contact) {
    // Update contact section
    const contactSection = document.getElementById("contact");
    if (contactSection && contact) {
      // Update address
      const addressElements = contactSection.querySelectorAll(
        '[data-field="address"]'
      );
      addressElements.forEach((el) => {
        if (el) el.textContent = contact.address || "";
      });

      // Update phones
      const phoneElements = contactSection.querySelectorAll(
        '[data-field="phone"]'
      );
      if (phoneElements.length >= 2 && contact.phones) {
        phoneElements[0].textContent = contact.phones[0] || "";
        phoneElements[1].textContent = contact.phones[1] || "";
      }

      // Update emails
      const emailElements = contactSection.querySelectorAll(
        '[data-field="email"]'
      );
      if (emailElements.length >= 2 && contact.emails) {
        emailElements[0].textContent = contact.emails[0] || "";
        emailElements[1].textContent = contact.emails[1] || "";
      }

      // Update hours
      const hoursElements = contactSection.querySelectorAll(
        '[data-field="hours"]'
      );
      if (hoursElements.length >= 2 && contact.hours) {
        hoursElements[0].textContent = contact.hours.weekdays || "";
        hoursElements[1].textContent = contact.hours.saturday || "";
      }
    }

    // Update footer contact info
    const footer = document.querySelector("footer");
    if (footer && contact) {
      const footerAddress = footer.querySelector("li:first-child span");
      const footerPhone = footer.querySelector("li:nth-child(2) span");
      const footerEmail = footer.querySelector("li:nth-child(3) span");

      if (footerAddress) footerAddress.textContent = contact.address || "";
      if (footerPhone) footerPhone.textContent = contact.phones?.[0] || "";
      if (footerEmail) footerEmail.textContent = contact.emails?.[0] || "";
    }
  }

  // Render booking options
  renderBookingOptions(surveyTypes) {
    const surveyTypeSelect = document.getElementById("surveyType");
    if (!surveyTypeSelect) return;

    surveyTypeSelect.innerHTML = `
            <option value="">Select a service</option>
            ${surveyTypes
              .map(
                (type) => `
                <option value="${type.value}" data-price="${type.price}">${
                  type.label
                } - ₦${type.price.toLocaleString()}</option>
            `
              )
              .join("")}
        `;
  }

  // Load all content
  async loadAllContent() {
    await Promise.all([
      this.loadHeroContent(),
      this.loadServices(),
      this.loadEquipment(),
      this.loadProjects(),
      this.loadTestimonials(),
      this.loadContactInfo(),
      this.loadBookingOptions(),
    ]);

    console.log("All content loaded successfully!");
  }
}

// Initialize and load content when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  const contentLoader = new ADEQContentLoader();
  contentLoader.loadAllContent();
});
