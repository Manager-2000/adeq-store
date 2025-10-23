// Custom Hero Slider - Simple and Reliable
class HeroSlider {
  constructor() {
    this.currentSlide = 0;
    this.slides = [];
    this.autoSlideInterval = null;
    this.init();
  }

  init() {
    this.loadHeroContent();
    this.setupEventListeners();
  }

  async loadHeroContent() {
    try {
      const response = await fetch("/api/hero");
      const data = await response.json();

      if (data.slides && data.slides.length > 0) {
        this.slides = data.slides;
        this.renderSlides();
        this.startAutoSlide();
      }
    } catch (error) {
      console.error("Error loading hero content:", error);
    }
  }

  renderSlides() {
    const slidesContainer = document.getElementById("heroSlides");
    const dotsContainer = document.getElementById("heroDots");

    if (!slidesContainer) return;

    // Clear existing content
    slidesContainer.innerHTML = "";
    if (dotsContainer) dotsContainer.innerHTML = "";

    // Create slides
    this.slides.forEach((slide, index) => {
      // Create slide element
      const slideElement = document.createElement("div");
      slideElement.className = `absolute inset-0 w-full h-full transition-opacity duration-1000 ${
        index === 0 ? "opacity-100" : "opacity-0"
      }`;
      slideElement.innerHTML = `
        <img
          src="${slide.image}"
          alt="${slide.title}"
          class="w-full h-full object-cover"
          loading="eager"
          onerror="this.src='assets/images/fallback-hero.jpg'"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div class="absolute inset-0 flex items-center justify-center z-10">
          <div class="text-center text-white max-w-4xl px-6">
            <h1 class="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">${slide.title}</h1>
            <p class="text-lg md:text-xl mb-6 drop-shadow">${slide.description}</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="${slide.cta1Link}" class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition">
                ${slide.cta1}
              </a>
              <a href="${slide.cta2Link}" class="bg-white/90 hover:bg-white text-primary px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <i class="fas fa-phone"></i> ${slide.cta2}
              </a>
            </div>
          </div>
        </div>
      `;
      slidesContainer.appendChild(slideElement);

      // Create dot if container exists
      if (dotsContainer) {
        const dot = document.createElement("button");
        dot.className = `w-3 h-3 rounded-full transition-all duration-300 ${
          index === 0 ? "bg-white" : "bg-white/50"
        }`;
        dot.addEventListener("click", () => this.goToSlide(index));
        dotsContainer.appendChild(dot);
      }
    });
  }

  goToSlide(index) {
    if (index < 0 || index >= this.slides.length) return;

    const slides = document.querySelectorAll("#heroSlides > div");
    const dots = document.querySelectorAll("#heroDots button");

    // Hide all slides
    slides.forEach((slide) => {
      slide.classList.remove("opacity-100");
      slide.classList.add("opacity-0");
    });

    // Show current slide
    slides[index].classList.remove("opacity-0");
    slides[index].classList.add("opacity-100");

    // Update dots
    if (dots.length > 0) {
      dots.forEach((dot) => dot.classList.remove("bg-white"));
      dots.forEach((dot) => dot.classList.add("bg-white/50"));
      if (dots[index]) {
        dots[index].classList.remove("bg-white/50");
        dots[index].classList.add("bg-white");
      }
    }

    this.currentSlide = index;
    this.restartAutoSlide();
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex =
      (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  startAutoSlide() {
    if (this.slides.length <= 1) return;

    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Change slide every 5 seconds
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  restartAutoSlide() {
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  setupEventListeners() {
    // Navigation buttons
    const prevBtn = document.getElementById("heroPrev");
    const nextBtn = document.getElementById("heroNext");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        this.prevSlide();
        this.restartAutoSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        this.nextSlide();
        this.restartAutoSlide();
      });
    }

    // Pause on hover
    const heroSection = document.getElementById("home");
    if (heroSection) {
      heroSection.addEventListener("mouseenter", () => this.stopAutoSlide());
      heroSection.addEventListener("mouseleave", () => this.startAutoSlide());
    }

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    if (heroSection) {
      heroSection.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].screenX;
        this.stopAutoSlide();
      });

      heroSection.addEventListener("touchend", (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
        this.startAutoSlide();
      });
    }
  }

  handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        this.nextSlide();
      } else {
        // Swipe right - previous slide
        this.prevSlide();
      }
    }
  }

  // Method to update slides dynamically (for CMS updates)
  updateSlides(newSlides) {
    this.slides = newSlides;
    this.renderSlides();
    this.currentSlide = 0;
    this.restartAutoSlide();
  }
}

// Initialize hero slider when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  window.heroSlider = new HeroSlider();
});

// Listen for updates from admin
window.addEventListener("storage", function (e) {
  if (e.key === "hero_refresh_event" && window.heroSlider) {
    console.log("🔄 Hero update received from admin");
    setTimeout(() => {
      window.heroSlider.loadHeroContent();
    }, 500);
  }
});
