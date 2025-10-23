// Simple Admin for ADEQ - Complete Functionality
class SimpleADEQAdmin {
  constructor() {
    this.baseURL = window.location.origin;
    this.currentData = {};
    this.init();
  }

  init() {
    this.checkAuth();
    this.initNavigation();
    this.loadDashboardStats();
    this.initEventListeners();
  }

  checkAuth() {
    const userData = localStorage.getItem("adeqAdmin");
    if (!userData) {
      document.getElementById("loginPage").classList.remove("hidden");
      document.getElementById("dashboardPage").classList.add("hidden");
      return;
    }

    this.user = JSON.parse(userData);
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("dashboardPage").classList.remove("hidden");
    document.getElementById("userName").textContent = this.user.name || "Admin";
  }

  initNavigation() {
    // Nav clicks
    document.querySelectorAll("[data-target]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget.getAttribute("data-target");
        this.showSection(target);
      });
    });

    // Logout
    document.getElementById("logoutButton").addEventListener("click", () => {
      localStorage.removeItem("adeqAdmin");
      window.location.reload();
    });

    // Login form
    document.getElementById("loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  initEventListeners() {
    console.log("🔧 Setting up event listeners");

    // Add buttons - with null checks
    const addServiceBtn = document.getElementById("addService");
    const addEquipmentBtn = document.getElementById("addEquipment");
    const addProjectBtn = document.getElementById("addProject");
    const addTestimonialBtn = document.getElementById("addTestimonial");
    const addHeroSlideBtn = document.getElementById("addHeroSlide");

    console.log("🔧 Button elements found:", {
      addService: addServiceBtn,
      addEquipment: addEquipmentBtn,
      addProject: addProjectBtn,
      addTestimonial: addTestimonialBtn,
      addHeroSlide: addHeroSlideBtn,
    });

    addServiceBtn?.addEventListener("click", () => {
      console.log("🔧 Add Service button clicked");
      this.showServiceForm();
    });

    addEquipmentBtn?.addEventListener("click", () => {
      console.log("🔧 Add Equipment button clicked");
      this.showEquipmentForm();
    });

    addProjectBtn?.addEventListener("click", () => {
      console.log("🔧 Add Project button clicked");
      this.showProjectForm();
    });

    addTestimonialBtn?.addEventListener("click", () => {
      console.log("🔧 Add Testimonial button clicked");
      this.showTestimonialForm();
    });

    // MAKE SURE THIS LINE EXISTS:
    addHeroSlideBtn?.addEventListener("click", () => {
      console.log("🔧 Add Hero Slide button clicked");
      this.showHeroSlideForm();
    });

    // Contact form
    const contactForm = document.getElementById("contactForm");
    contactForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveContactInfo();
    });
  }

  handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === "admin@adeq.com" && password === "password123") {
      const userData = {
        email: email,
        name: "Admin",
        loginTime: new Date().toISOString(),
      };
      localStorage.setItem("adeqAdmin", JSON.stringify(userData));
      this.showNotification("Login successful!", "success");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      this.showNotification("Invalid credentials!", "error");
    }
  }

  showSection(sectionId) {
    // Update navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active", "bg-blue-600", "text-white");
      item.classList.add("text-gray-700", "hover:bg-gray-100");
    });

    const activeNav = document.querySelector(`[data-target="${sectionId}"]`);
    activeNav.classList.add("active", "bg-blue-600", "text-white");
    activeNav.classList.remove("text-gray-700", "hover:bg-gray-100");

    // Show section
    document.querySelectorAll(".content-area").forEach((section) => {
      section.classList.remove("active");
    });
    document.getElementById(sectionId).classList.add("active");

    // Load section data
    this.loadSectionData(sectionId);
  }

  async loadDashboardStats() {
    try {
      const [services, equipment, testimonials] = await Promise.all([
        this.fetchData("services"),
        this.fetchData("equipment"),
        this.fetchData("testimonials"),
      ]);

      document.getElementById("servicesCount").textContent =
        services.services?.length || 0;
      document.getElementById("equipmentCount").textContent =
        equipment.equipment?.length || 0;
      document.getElementById("testimonialsCount").textContent =
        testimonials.testimonials?.length || 0;
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async loadSectionData(sectionId) {
    try {
      console.log(`📥 Loading data for: ${sectionId}`);
      const data = await this.fetchData(sectionId);
      console.log(`📦 Loaded ${sectionId} data:`, data);

      this.currentData[sectionId] = data;

      switch (sectionId) {
        case "hero":
          this.renderHeroEditor(data);
          break;
        case "services":
          this.renderServicesEditor(data);
          break;
        case "equipment":
          this.renderEquipmentEditor(data);
          break;
        case "projects":
          this.renderProjectsEditor(data);
          break;
        case "testimonials":
          this.renderTestimonialsEditor(data);
          break;
        case "contact":
          this.renderContactEditor(data);
          break;
      }
    } catch (error) {
      console.error(`❌ Error loading ${sectionId}:`, error);
    }
  }

  // Method to handle hero image uploads
  async uploadImage(file) {
    return new Promise((resolve, reject) => {
      try {
        // Validate file first
        this.validateImageFile(file);

        const reader = new FileReader();

        reader.onload = (e) => {
          // For hero images, we can use base64 directly
          resolve(e.target.result);
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // File validation method
  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB for hero images
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/gif",
    ];

    if (!file) {
      throw new Error("No file selected");
    }

    if (file.size > maxSize) {
      throw new Error(
        `File is too large. Maximum size is ${Math.round(
          maxSize / 1024 / 1024
        )}MB.`
      );
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Please select a valid image file (JPG, PNG, WebP, or GIF)."
      );
    }

    return true;
  }

  // Update hero image preview
  updateHeroImagePreview(imageUrl) {
    let previewContainer = document.querySelector(
      "#heroFormContainer .text-center"
    );
    if (!previewContainer) {
      // Create preview container
      const imageInput = document.getElementById("heroImage");
      const parent = imageInput.parentElement;

      previewContainer = document.createElement("div");
      previewContainer.className = "text-center mt-2";
      parent.appendChild(previewContainer);
    }

    previewContainer.innerHTML = `
      <img src="${imageUrl}" alt="Preview" class="w-20 h-16 object-cover rounded-lg mx-auto mb-1">
      <small class="text-gray-500">Image Preview</small>
    `;
  }

  // === HERO EDITOR - COMPLETE VERSION ===
  renderHeroEditor(data) {
    const container = document.getElementById("heroSlidesContainer");
    if (!container) return;

    container.innerHTML = `
    <div class="space-y-4">
      ${
        data.slides && data.slides.length > 0
          ? data.slides
              .map(
                (slide, index) => `
            <div class="border border-gray-200 rounded-lg p-4 bg-white">
              <div class="flex items-start space-x-4">
                <div class="flex-shrink-0">
                  <img src="${slide.image}" alt="${slide.title}" 
                       class="w-24 h-16 object-cover rounded-lg border">
                  <div class="text-xs text-gray-500 text-center mt-1">Slide ${
                    index + 1
                  }</div>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-lg text-gray-800">${
                    slide.title
                  }</h4>
                  <p class="text-gray-600 text-sm mt-1 line-clamp-2">${
                    slide.description
                  }</p>
                  <div class="mt-2 flex space-x-4 text-sm text-gray-500">
                    <span class="flex items-center">
                      <i class="fas fa-mouse-pointer mr-1"></i>
                      ${slide.cta1}
                    </span>
                    <span class="flex items-center">
                      <i class="fas fa-phone mr-1"></i>
                      ${slide.cta2}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col space-y-2">
                  <button onclick="admin.editHeroSlide(${index})" 
                          class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded text-sm">
                    <i class="fas fa-edit mr-1"></i>Edit
                  </button>
                  <button onclick="admin.deleteHeroSlide(${index})" 
                          class="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded text-sm">
                    <i class="fas fa-trash mr-1"></i>Delete
                  </button>
                  <div class="flex space-x-1">
                    <button onclick="admin.moveHeroSlide(${index}, 'up')" 
                            ${index === 0 ? "disabled" : ""}
                            class="text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-600 rounded text-xs ${
                              index === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }">
                      ↑
                    </button>
                    <button onclick="admin.moveHeroSlide(${index}, 'down')" 
                            ${
                              index === data.slides.length - 1 ? "disabled" : ""
                            }
                            class="text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-600 rounded text-xs ${
                              index === data.slides.length - 1
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }">
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
              )
              .join("")
          : '<p class="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">No hero slides found. Click "Add New Slide" to create your first slide.</p>'
      }
    </div>
    <div id="heroFormContainer" class="mt-6"></div>
  `;
  }

  showHeroSlideForm(heroIndex = null) {
    const slide =
      heroIndex !== null ? this.currentData.hero.slides[heroIndex] : null;
    const container = document.getElementById("heroFormContainer");

    container.innerHTML = `
    <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h4 class="text-lg font-semibold mb-4 text-gray-800">
        <i class="fas ${slide ? "fa-edit" : "fa-plus"} mr-2"></i>
        ${slide ? "Edit Hero Slide" : "Add New Hero Slide"}
      </h4>
      
      <form id="heroForm" class="space-y-4">
        <!-- Image Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div class="md:col-span-2">
            <label class="block text-gray-700 mb-2 font-medium">
              <i class="fas fa-image mr-2"></i>Slide Image URL
            </label>
            <input type="text" id="heroImage" value="${slide?.image || ""}" 
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                   placeholder="https://example.com/hero-image.jpg" required>
            <p class="text-sm text-gray-500 mt-1">Enter image URL or upload below</p>
          </div>
          <div class="text-center">
            ${
              slide?.image
                ? `
              <img src="${slide.image}" alt="Current Image" class="w-20 h-16 object-cover rounded-lg border mx-auto mb-2">
              <p class="text-xs text-gray-500">Current Image</p>
            `
                : `
              <div class="w-20 h-16 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-2">
                <i class="fas fa-image text-gray-400"></i>
              </div>
              <p class="text-xs text-gray-500">No Image</p>
            `
            }
          </div>
        </div>

        <!-- Image Upload -->
        <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <label class="block text-gray-700 mb-2 font-medium">
            <i class="fas fa-upload mr-2"></i>Upload New Image
          </label>
          <input type="file" id="heroImageUpload" 
                 accept="image/jpeg,image/png,image/webp,image/jpg" 
                 class="w-full p-2 border border-gray-300 rounded-lg bg-white">
          <p class="text-sm text-gray-500 mt-1">Max file size: 5MB • Supported: JPG, PNG, WebP</p>
          
          <div id="heroUploadProgress" class="mt-2 hidden">
            <div class="flex items-center space-x-2 text-sm text-blue-600">
              <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading image...</span>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label class="block text-gray-700 mb-2 font-medium">
            <i class="fas fa-heading mr-2"></i>Slide Title
          </label>
          <input type="text" id="heroTitle" value="${slide?.title || ""}" 
                 class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                 placeholder="Professional Water Solutions" required>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-gray-700 mb-2 font-medium">
            <i class="fas fa-align-left mr-2"></i>Description
          </label>
          <textarea id="heroDescription" rows="3"
                    class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Describe your service or offer..." required>${
                      slide?.description || ""
                    }</textarea>
        </div>

        <!-- CTA Buttons -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-gray-700 font-medium">
              <i class="fas fa-button mr-2"></i>Primary Button
            </label>
            <input type="text" id="heroCta1" value="${
              slide?.cta1 || "Get Free Consultation"
            }" 
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                   placeholder="Button Text" required>
            <input type="text" id="heroCta1Link" value="${
              slide?.cta1Link || "#contact"
            }" 
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                   placeholder="#contact or https://..." required>
          </div>
          
          <div class="space-y-2">
            <label class="block text-gray-700 font-medium">
              <i class="fas fa-phone mr-2"></i>Secondary Button
            </label>
            <input type="text" id="heroCta2" value="${
              slide?.cta2 || "Call Now"
            }" 
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                   placeholder="Button Text" required>
            <input type="text" id="heroCta2Link" value="${
              slide?.cta2Link || "tel:+2348104237317"
            }" 
                   class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                   placeholder="tel:+1234567890" required>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex space-x-4 pt-4 border-t border-gray-200">
          <button type="submit" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition duration-200 flex items-center">
            <i class="fas fa-save mr-2"></i>
            ${slide ? "Update Slide" : "Add Slide"}
          </button>
          <button type="button" onclick="admin.hideHeroForm()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition duration-200 flex items-center">
            <i class="fas fa-times mr-2"></i>
            Cancel
          </button>
        </div>

        ${
          heroIndex !== null
            ? `<input type="hidden" id="heroIndex" value="${heroIndex}">`
            : ""
        }
      </form>
    </div>
  `;

    // Setup file upload
    this.setupHeroImageUpload();

    // Form submission
    document.getElementById("heroForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveHeroSlide(heroIndex);
    });
  }

  setupHeroImageUpload() {
    const fileInput = document.getElementById("heroImageUpload");
    if (!fileInput) return;

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        this.showNotification("Uploading image...", "info");

        const progressElement = document.getElementById("heroUploadProgress");
        if (progressElement) progressElement.classList.remove("hidden");

        const imageUrl = await this.uploadImage(file);

        document.getElementById("heroImage").value = imageUrl;
        this.updateHeroImagePreview(imageUrl);

        this.showNotification("Image uploaded successfully!", "success");
      } catch (error) {
        console.error("Image upload error:", error);
        this.showNotification(`Upload failed: ${error.message}`, "error");
        fileInput.value = "";
      } finally {
        const progressElement = document.getElementById("heroUploadProgress");
        if (progressElement) progressElement.classList.add("hidden");
      }
    });
  }

  updateHeroImagePreview(imageUrl) {
    const previewContainer = document.querySelector(
      "#heroFormContainer .text-center"
    );
    if (previewContainer) {
      previewContainer.innerHTML = `
      <img src="${imageUrl}" alt="Preview" class="w-20 h-16 object-cover rounded-lg border mx-auto mb-2">
      <p class="text-xs text-gray-500">New Image</p>
    `;
    }
  }

  hideHeroForm() {
    const container = document.getElementById("heroFormContainer");
    if (container) container.innerHTML = "";
  }

  async saveHeroSlide(heroIndex) {
    const formData = {
      image: document.getElementById("heroImage").value.trim(),
      title: document.getElementById("heroTitle").value.trim(),
      description: document.getElementById("heroDescription").value.trim(),
      cta1: document.getElementById("heroCta1").value.trim(),
      cta1Link: document.getElementById("heroCta1Link").value.trim(),
      cta2: document.getElementById("heroCta2").value.trim(),
      cta2Link: document.getElementById("heroCta2Link").value.trim(),
    };

    // Validation
    if (!formData.image || !formData.title || !formData.description) {
      this.showNotification("Please fill in all required fields", "error");
      return;
    }

    try {
      const currentData = this.currentData.hero || { slides: [] };

      if (heroIndex !== null) {
        // Update existing
        currentData.slides[heroIndex] = formData;
      } else {
        // Add new
        currentData.slides.push(formData);
      }

      await this.saveData("hero", currentData);

      this.showNotification(
        `Hero slide ${heroIndex !== null ? "updated" : "added"} successfully!`,
        "success"
      );

      this.hideHeroForm();
      this.renderHeroEditor(currentData);
      this.triggerHeroRefresh();
    } catch (error) {
      this.showNotification(
        "Error saving hero slide: " + error.message,
        "error"
      );
    }
  }

  editHeroSlide(index) {
    this.showHeroSlideForm(index);
  }

  async deleteHeroSlide(index) {
    if (!confirm("Are you sure you want to delete this hero slide?")) return;

    try {
      const currentData = this.currentData.hero;
      currentData.slides.splice(index, 1);

      await this.saveData("hero", currentData);
      this.showNotification("Hero slide deleted successfully!", "success");
      this.renderHeroEditor(currentData);
      this.triggerHeroRefresh();
    } catch (error) {
      this.showNotification("Error deleting hero slide!", "error");
    }
  }

  async moveHeroSlide(index, direction) {
    try {
      const currentData = this.currentData.hero;
      const slides = currentData.slides;

      if (direction === "up" && index > 0) {
        [slides[index], slides[index - 1]] = [slides[index - 1], slides[index]];
      } else if (direction === "down" && index < slides.length - 1) {
        [slides[index], slides[index + 1]] = [slides[index + 1], slides[index]];
      } else {
        return;
      }

      await this.saveData("hero", currentData);
      this.showNotification("Slide order updated!", "success");
      this.renderHeroEditor(currentData);
      this.triggerHeroRefresh();
    } catch (error) {
      this.showNotification("Error moving slide!", "error");
    }
  }

  triggerHeroRefresh() {
    console.log("🔄 Triggering hero refresh on main page...");

    const refreshEvent = {
      type: "hero_refresh",
      timestamp: Date.now(),
      slidesCount: this.currentData.hero?.slides?.length || 0,
    };

    localStorage.setItem("hero_refresh_event", JSON.stringify(refreshEvent));

    this.showNotification(
      "Hero slides updated! Main page will refresh automatically.",
      "success"
    );
  }

  // Add this method to handle file uploads
  // async uploadImage(file) {
  //   try {
  //     // For now, we'll use a simple approach - convert to base64
  //     // In production, you'd upload to a server or cloud storage
  //     return new Promise((resolve, reject) => {
  //       const reader = new FileReader();
  //       reader.onload = (e) => {
  //         resolve(e.target.result);
  //       };
  //       reader.onerror = (error) => {
  //         reject(error);
  //       };
  //       reader.readAsDataURL(file);
  //     });
  //   } catch (error) {
  //     console.error("Error uploading image:", error);
  //     throw error;
  //   }
  // }

  // Add this method to your SimpleADEQAdmin class
  async uploadImageToServer(file) {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      return result.filePath;
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error(`Failed to upload "${file.name}": ${error.message}`);
    }
  }

  // Update the file validation method
  validateImageFile(file) {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (file.size > maxSize) {
      throw new Error(`"${file.name}" is too large. Maximum size is 2MB.`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `"${file.name}" is not a supported image type. Use JPG, PNG, or WebP.`
      );
    }

    return true;
  }

  // Updated showHeroSlideForm with file upload
  showHeroSlideForm(heroIndex = null) {
    const slide =
      heroIndex !== null ? this.currentData.hero.slides[heroIndex] : null;
    const container = document.getElementById("heroFormContainer");

    container.innerHTML = `
        <div class="bg-gray-50 p-6 rounded-lg border">
            <h4 class="text-lg font-semibold mb-4">${
              slide ? "Edit Hero Slide" : "Add New Hero Slide"
            }</h4>
            <form id="heroForm">
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Slide Image</label>
                        <div class="flex space-x-4 items-start">
                            <div class="flex-1">
                                <input type="text" id="heroImage" value="${
                                  slide?.image || ""
                                }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                       placeholder="assets/images/hero-slide.jpg" required>
                                <small class="text-gray-500">Image URL or upload file below</small>
                            </div>
                            <div class="text-center">
                                ${
                                  slide?.image
                                    ? `
                                    <img src="${slide.image}" alt="Preview" class="w-16 h-12 object-cover rounded-lg mb-2">
                                    <small class="text-gray-500">Current Image</small>
                                `
                                    : ""
                                }
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2">Upload New Image</label>
                        <input type="file" id="heroImageUpload" accept="image/jpeg,image/png,image/webp,image/jpg" class="w-full p-3 border border-gray-300 rounded-lg">
                        <small class="text-gray-500">Select an image file from your computer (Max 5MB)</small>
                        
                        <!-- Upload Progress -->
                        <div id="heroUploadProgress" class="mt-2 hidden">
                            <div class="flex items-center space-x-2 text-sm text-blue-600">
                                <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Processing image...</span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2">Title</label>
                        <input type="text" id="heroTitle" value="${
                          slide?.title || ""
                        }" class="w-full p-3 border border-gray-300 rounded-lg" 
                               placeholder="Professional Borehole Drilling & Water Solutions" required>
                    </div>
                    
                    <div>
                        <label class="block text-gray-700 mb-2">Description</label>
                        <textarea id="heroDescription" class="w-full p-3 border border-gray-300 rounded-lg" rows="3" required>${
                          slide?.description || ""
                        }</textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 mb-2">Button 1 Text</label>
                            <input type="text" id="heroCta1" value="${
                              slide?.cta1 || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                   placeholder="Get Free Consultation" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">Button 1 Link</label>
                            <input type="text" id="heroCta1Link" value="${
                              slide?.cta1Link || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                   placeholder="#contact" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 mb-2">Button 2 Text</label>
                            <input type="text" id="heroCta2" value="${
                              slide?.cta2 || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                   placeholder="Call Now" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">Button 2 Link</label>
                            <input type="text" id="heroCta2Link" value="${
                              slide?.cta2Link || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                   placeholder="tel:+2348104237317" required>
                        </div>
                    </div>
                </div>
                
                <div class="mt-6 flex space-x-4">
                    <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                        ${slide ? "Update Slide" : "Add Slide"}
                    </button>
                    <button type="button" onclick="admin.hideHeroForm()" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
                        Cancel
                    </button>
                </div>
                ${
                  heroIndex !== null
                    ? `<input type="hidden" id="heroIndex" value="${heroIndex}">`
                    : ""
                }
            </form>
        </div>
    `;

    // Handle file upload - UPDATED WITH BETTER ERROR HANDLING
    const fileInput = document.getElementById("heroImageUpload");
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        this.showNotification("Uploading image...", "info");

        // Show progress
        const progressElement = document.getElementById("heroUploadProgress");
        if (progressElement) {
          progressElement.classList.remove("hidden");
        }

        // Upload image
        const imageUrl = await this.uploadImage(file);

        // Update the image URL field
        document.getElementById("heroImage").value = imageUrl;

        // Update preview
        this.updateHeroImagePreview(imageUrl);

        this.showNotification("Image uploaded successfully!", "success");
      } catch (error) {
        console.error("❌ Hero image upload error:", error);

        // Hide progress on error
        const progressElement = document.getElementById("heroUploadProgress");
        if (progressElement) {
          progressElement.classList.add("hidden");
        }

        this.showNotification(`Upload failed: ${error.message}`, "error");

        // Clear the file input
        fileInput.value = "";
      }
    });

    document.getElementById("heroForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveHeroSlide(heroIndex);
    });
  }

  hideHeroForm() {
    document.getElementById("heroFormContainer").innerHTML = "";
  }

  async saveHeroSlide(heroIndex) {
    const slideData = {
      image: document.getElementById("heroImage").value,
      title: document.getElementById("heroTitle").value,
      description: document.getElementById("heroDescription").value,
      cta1: document.getElementById("heroCta1").value,
      cta1Link: document.getElementById("heroCta1Link").value,
      cta2: document.getElementById("heroCta2").value,
      cta2Link: document.getElementById("heroCta2Link").value,
    };

    try {
      const currentData = this.currentData.hero;
      if (heroIndex !== null) {
        // Update existing slide
        currentData.slides[heroIndex] = slideData;
      } else {
        // Add new slide
        if (!currentData.slides) currentData.slides = [];
        currentData.slides.push(slideData);
      }

      await this.saveData("hero", currentData);
      this.showNotification(
        `Hero slide ${heroIndex !== null ? "updated" : "added"} successfully!`,
        "success"
      );
      this.hideHeroForm();
      this.renderHeroEditor(currentData);

      // ✅ ADD THIS LINE TO TRIGGER MAIN PAGE UPDATE
      this.triggerHeroRefresh();
    } catch (error) {
      this.showNotification("Error saving hero slide!", "error");
    }
  }

  //triggerHeroRefresh method
  triggerHeroRefresh() {
    console.log("🔄 Triggering hero refresh on main page...");

    const refreshEvent = {
      type: "hero_refresh",
      timestamp: Date.now(),
      slidesCount: this.currentData.hero?.slides?.length || 0,
    };

    localStorage.setItem("hero_refresh_event", JSON.stringify(refreshEvent));

    this.showNotification(
      "Hero slides updated! Main page will update shortly...",
      "success"
    );
  }

  // 🔥 ALSO UPDATE THE saveHeroSlide METHOD TO USE THE FIXED VERSION:
  async saveHeroSlide(heroIndex) {
    const slideData = {
      image: document.getElementById("heroImage").value,
      title: document.getElementById("heroTitle").value,
      description: document.getElementById("heroDescription").value,
      cta1: document.getElementById("heroCta1").value,
      cta1Link: document.getElementById("heroCta1Link").value,
      cta2: document.getElementById("heroCta2").value,
      cta2Link: document.getElementById("heroCta2Link").value,
    };

    try {
      const currentData = this.currentData.hero;
      if (heroIndex !== null) {
        // Update existing slide
        currentData.slides[heroIndex] = slideData;
      } else {
        // Add new slide
        if (!currentData.slides) currentData.slides = [];
        currentData.slides.push(slideData);
      }

      await this.saveData("hero", currentData);
      this.showNotification(
        `Hero slide ${heroIndex !== null ? "updated" : "added"} successfully!`,
        "success"
      );
      this.hideHeroForm();
      this.renderHeroEditor(currentData);

      // ✅ USE THE FIXED VERSION INSTEAD
      this.triggerHeroRefresh(); // This now uses the fixed method above
    } catch (error) {
      this.showNotification("Error saving hero slide!", "error");
    }
  }

  editHeroSlide(index) {
    this.showHeroSlideForm(index);
  }

  async deleteHeroSlide(index) {
    if (confirm("Are you sure you want to delete this hero slide?")) {
      try {
        const currentData = this.currentData.hero;
        currentData.slides.splice(index, 1);
        await this.saveData("hero", currentData);
        this.showNotification("Hero slide deleted successfully!", "success");
        this.renderHeroEditor(currentData);
      } catch (error) {
        this.showNotification("Error deleting hero slide!", "error");
      }
    }
  }

  async moveHeroSlide(index, direction) {
    try {
      const currentData = this.currentData.hero;
      const slides = currentData.slides;

      if (direction === "up" && index > 0) {
        // Move slide up
        [slides[index], slides[index - 1]] = [slides[index - 1], slides[index]];
      } else if (direction === "down" && index < slides.length - 1) {
        // Move slide down
        [slides[index], slides[index + 1]] = [slides[index + 1], slides[index]];
      } else {
        return; // No movement needed
      }

      await this.saveData("hero", currentData);
      this.showNotification("Slide order updated!", "success");
      this.renderHeroEditor(currentData);
    } catch (error) {
      this.showNotification("Error moving slide!", "error");
    }
  }

  editHeroSlide(index) {
    this.showHeroSlideForm(index);
  }

  async deleteHeroSlide(index) {
    if (confirm("Are you sure you want to delete this hero slide?")) {
      try {
        const currentData = this.currentData.hero;
        currentData.slides.splice(index, 1);
        await this.saveData("hero", currentData);
        this.showNotification("Hero slide deleted successfully!", "success");
        this.renderHeroEditor(currentData);
      } catch (error) {
        this.showNotification("Error deleting hero slide!", "error");
      }
    }
  }

  async moveHeroSlide(index, direction) {
    try {
      const currentData = this.currentData.hero;
      const slides = currentData.slides;

      if (direction === "up" && index > 0) {
        // Move slide up
        [slides[index], slides[index - 1]] = [slides[index - 1], slides[index]];
      } else if (direction === "down" && index < slides.length - 1) {
        // Move slide down
        [slides[index], slides[index + 1]] = [slides[index + 1], slides[index]];
      } else {
        return; // No movement needed
      }

      await this.saveData("hero", currentData);
      this.showNotification("Slide order updated!", "success");
      this.renderHeroEditor(currentData);
    } catch (error) {
      this.showNotification("Error moving slide!", "error");
    }
  }

  // Similar methods for Projects editor...

  // === SERVICES EDITOR ===
  renderServicesEditor(data) {
    const container = document.getElementById("servicesContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-4">
            ${
              data.services
                ?.map(
                  (service, index) => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-semibold text-lg">${service.title}</h4>
                            <p class="text-gray-600 mt-1">${service.description}</p>
                            <div class="flex items-center mt-2">
                                <i class="${service.icon} text-blue-600 mr-2"></i>
                                <span class="text-green-600 font-semibold">${service.price}</span>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <button onclick="admin.editService(${index})" class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded">Edit</button>
                            <button onclick="admin.deleteService(${index})" class="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded">Delete</button>
                        </div>
                    </div>
                </div>
            `
                )
                .join("") ||
              '<p class="text-gray-500 text-center py-8">No services found. Click "Add New Service" to create one.</p>'
            }
        </div>
        <div id="serviceFormContainer" class="mt-6"></div>
    `;
  }

  showServiceForm(serviceIndex = null) {
    const service =
      serviceIndex !== null
        ? this.currentData.services.services[serviceIndex]
        : null;
    const container = document.getElementById("serviceFormContainer");

    // Extract just the number part for the input field (remove ₦ symbol)
    let priceValue = "";
    if (service?.price) {
      // Remove ₦ symbol and any spaces for the input field
      priceValue = service.price.replace("₦", "").trim();
    }

    container.innerHTML = `
        <div class="bg-gray-50 p-6 rounded-lg border">
            <h4 class="text-lg font-semibold mb-4">${
              service ? "Edit Service" : "Add New Service"
            }</h4>
            <form id="serviceForm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-gray-700 mb-2">Service Title</label>
                        <input type="text" id="serviceTitle" value="${
                          service?.title || ""
                        }" class="w-full p-3 border border-gray-300 rounded-lg" required>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Icon Class</label>
                        <input type="text" id="serviceIcon" value="${
                          service?.icon || "fas fa-cog"
                        }" class="w-full p-3 border border-gray-300 rounded-lg" 
                               placeholder="fas fa-cog" required>
                        <small class="text-gray-500">Use FontAwesome icon classes</small>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-gray-700 mb-2">Description</label>
                        <textarea id="serviceDescription" class="w-full p-3 border border-gray-300 rounded-lg" rows="3" required>${
                          service?.description || ""
                        }</textarea>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Price</label>
                        <div class="flex">
                            <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                                ₦
                            </span>
                            <input type="text" id="servicePrice" value="${priceValue}" class="w-full p-3 border border-gray-300 rounded-r-lg" 
                                   placeholder="50,000" required>
                        </div>
                        <small class="text-gray-500">Enter amount without ₦ symbol</small>
                    </div>
                    <div>
                        <label class="block text-gray-700 mb-2">Link</label>
                        <input type="text" id="serviceLink" value="${
                          service?.link || "#booking"
                        }" class="w-full p-3 border border-gray-300 rounded-lg" 
                               placeholder="#booking">
                    </div>
                </div>
                <div class="mt-6 flex space-x-4">
                    <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                        ${service ? "Update Service" : "Add Service"}
                    </button>
                    <button type="button" onclick="admin.hideServiceForm()" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
                        Cancel
                    </button>
                </div>
                ${
                  serviceIndex !== null
                    ? `<input type="hidden" id="serviceIndex" value="${serviceIndex}">`
                    : ""
                }
            </form>
        </div>
    `;

    document.getElementById("serviceForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveService(serviceIndex);
    });
  }

  async saveService(serviceIndex) {
    const form = document.getElementById("serviceForm");
    const priceInput = document.getElementById("servicePrice").value;

    // Format the price with ₦ symbol
    let formattedPrice = priceInput.trim();
    if (formattedPrice && !formattedPrice.startsWith("₦")) {
      formattedPrice = "₦" + formattedPrice;
    }

    const serviceData = {
      title: document.getElementById("serviceTitle").value,
      icon: document.getElementById("serviceIcon").value,
      description: document.getElementById("serviceDescription").value,
      price: formattedPrice,
      link: document.getElementById("serviceLink").value,
    };

    try {
      const currentData = this.currentData.services;
      if (serviceIndex !== null) {
        // Update existing service
        currentData.services[serviceIndex] = serviceData;
      } else {
        // Add new service
        if (!currentData.services) currentData.services = [];
        currentData.services.push(serviceData);
      }

      await this.saveData("services", currentData);
      this.showNotification(
        `Service ${serviceIndex !== null ? "updated" : "added"} successfully!`,
        "success"
      );
      this.hideServiceForm();
      this.renderServicesEditor(currentData);
      this.loadDashboardStats(); // Refresh counts
    } catch (error) {
      this.showNotification("Error saving service!", "error");
    }
  }

  // Make sure hideServiceForm method exists and is working:
  hideServiceForm() {
    const container = document.getElementById("serviceFormContainer");
    if (container) {
      container.innerHTML = "";
    }
  }

  editService(index) {
    this.showServiceForm(index);
  }

  async deleteService(index) {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        const currentData = this.currentData.services;
        currentData.services.splice(index, 1);
        await this.saveData("services", currentData);
        this.showNotification("Service deleted successfully!", "success");
        this.renderServicesEditor(currentData);
        this.loadDashboardStats(); // Refresh counts
      } catch (error) {
        this.showNotification("Error deleting service!", "error");
      }
    }
  }

  // === EQUIPMENT EDITOR ===
  renderEquipmentEditor(data) {
    const container = document.getElementById("equipmentContainer");
    if (!container) return;

    container.innerHTML = `
    <div class="space-y-4">
      ${
        data.equipment
          ?.map(
            (item, index) => `
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-semibold text-lg">${item.name}</h4>
                <p class="text-gray-600 mt-1">${item.description}</p>
                <div class="mt-2">
                  <span class="text-green-600 font-semibold text-xl">${
                    item.price
                  }</span>
                  <span class="ml-4 text-sm ${
                    item.featured ? "text-blue-600" : "text-gray-500"
                  }">
                    ${item.featured ? "★ Featured" : "Not Featured"}
                  </span>
                </div>
                ${
                  item.images?.length > 0
                    ? `
                    <div class="mt-2 text-sm text-gray-500">
                      ${item.images.length} image(s)
                    </div>
                `
                    : ""
                }
              </div>
              <div class="flex space-x-2">
                <button onclick="admin.editEquipment(${index})" class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded">Edit</button>
                <button onclick="admin.deleteEquipment(${index})" class="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded">Delete</button>
              </div>
            </div>
          </div>
      `
          )
          .join("") ||
        '<p class="text-gray-500 text-center py-8">No equipment found. Click "Add New Equipment" to create one.</p>'
      }
    </div>
    <div id="equipmentFormContainer" class="mt-6"></div>
  `;
  }

  // === EQUIPMENT EDITOR ===
  showEquipmentForm(equipmentIndex = null) {
    const item =
      equipmentIndex !== null
        ? this.currentData.equipment.equipment[equipmentIndex]
        : null;
    const container = document.getElementById("equipmentFormContainer");

    let priceValue = "";
    if (item?.price) {
      priceValue = item.price.replace("₦", "").trim();
    }

    container.innerHTML = `
    <div class="bg-gray-50 p-6 rounded-lg border">
      <h4 class="text-lg font-semibold mb-4">${
        item ? "Edit Equipment" : "Add New Equipment"
      }</h4>
      <form id="equipmentForm">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 mb-2">Equipment Name</label>
            <input type="text" id="equipName" value="${
              item?.name || ""
            }" class="w-full p-3 border border-gray-300 rounded-lg" required>
          </div>
          <div>
            <label class="block text-gray-700 mb-2">Price</label>
            <div class="flex">
              <span class="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                ₦
              </span>
              <input type="text" id="equipPrice" value="${priceValue}" class="w-full p-3 border border-gray-300 rounded-r-lg" 
                     placeholder="200,000" required>
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="block text-gray-700 mb-2">Description</label>
            <textarea id="equipDescription" class="w-full p-3 border border-gray-300 rounded-lg" rows="3" required>${
              item?.description || ""
            }</textarea>
          </div>
          
          <!-- SIMPLIFIED & VISIBLE Image Upload Section -->
          <div class="md:col-span-2">
            <label class="block text-gray-700 mb-2 font-semibold">Equipment Images</label>
            
            <!-- Current Images Preview -->
            ${
              item?.images?.length > 0
                ? `
              <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <label class="block text-blue-700 mb-2 font-medium">Current Images:</label>
                <div class="flex space-x-2 mb-2 flex-wrap">
                  ${item.images
                    .map(
                      (img, index) => `
                    <div class="relative mb-2 group">
                      <img src="${img}" alt="Image ${
                        index + 1
                      }" class="w-20 h-16 object-cover rounded-lg border-2 border-blue-300">
                      <button type="button" onclick="admin.removeEquipmentImage(${equipmentIndex}, ${index})" 
                              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100">
                        ×
                      </button>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
            
            <!-- VISIBLE File Upload Option -->
            <div class="mb-4 p-4 bg-white border-2 border-dashed border-blue-300 rounded-lg">
              <label class="block text-blue-700 mb-3 font-medium">
                <i class="fas fa-upload mr-2"></i>Upload Images from Your Computer
              </label>
              
              <!-- Option 1: Simple File Input -->
              <div class="mb-3">
                <label class="block text-gray-700 mb-2 text-sm">Select image files:</label>
                <input type="file" id="equipImageUpload" 
                       accept="image/jpeg,image/png,image/webp,image/jpg" 
                       multiple 
                       class="w-full p-2 border border-gray-300 rounded-lg bg-white">
                <small class="text-gray-500 text-xs">You can select multiple images (Max 2MB each)</small>
              </div>
              
              <!-- Upload Button -->
              <button type="button" id="uploadImagesBtn" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                <i class="fas fa-cloud-upload-alt mr-2"></i>Upload Selected Images
              </button>
              
              <!-- Upload Progress -->
              <div id="uploadProgress" class="mt-3 hidden">
                <div class="flex items-center space-x-2 text-sm text-blue-600">
                  <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing images...</span>
                </div>
              </div>
            </div>
            
            <!-- Manual URL Input (Alternative) -->
            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
              <label class="block text-gray-700 mb-2">Or Add Image URLs Manually</label>
              <textarea id="equipImages" class="w-full p-3 border border-gray-300 rounded-lg" rows="2" 
                        placeholder="Paste image URLs here, one per line...">${
                          item?.images?.join("\n") || ""
                        }</textarea>
              <small class="text-gray-500 text-xs">Enter one image URL per line, or they will be auto-filled after upload</small>
            </div>
            
            <!-- Uploaded Files Preview -->
            <div id="filePreview" class="mt-3 space-y-2"></div>
          </div>
          
          <div class="flex items-center">
            <input type="checkbox" id="equipFeatured" ${
              item?.featured ? "checked" : ""
            } class="mr-2 w-5 h-5">
            <label for="equipFeatured" class="text-gray-700 font-medium">Featured (show on main page)</label>
          </div>
        </div>
        
        <div class="mt-6 flex space-x-4">
          <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
            <i class="fas fa-save mr-2"></i>${
              item ? "Update Equipment" : "Add Equipment"
            }
          </button>
          <button type="button" onclick="admin.hideEquipmentForm()" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
            <i class="fas fa-times mr-2"></i>Cancel
          </button>
        </div>
        ${
          equipmentIndex !== null
            ? `<input type="hidden" id="equipIndex" value="${equipmentIndex}">`
            : ""
        }
      </form>
    </div>
  `;

    // Setup file upload functionality
    this.setupSimpleEquipmentUpload(equipmentIndex);

    document.getElementById("equipmentForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveEquipment(equipmentIndex);
    });
  }

  // Add this SIMPLIFIED upload setup method
  setupSimpleEquipmentUpload(equipmentIndex) {
    const fileInput = document.getElementById("equipImageUpload");
    const uploadBtn = document.getElementById("uploadImagesBtn");
    const uploadProgress = document.getElementById("uploadProgress");

    if (!fileInput || !uploadBtn) {
      console.error("❌ File input or upload button not found!");
      return;
    }

    // Handle upload button click
    uploadBtn.addEventListener("click", async () => {
      const files = Array.from(fileInput.files);

      if (files.length === 0) {
        this.showNotification(
          "Please select some images to upload first!",
          "warning"
        );
        return;
      }

      await this.processEquipmentFiles(files, equipmentIndex);
      fileInput.value = ""; // Clear the file input
    });

    // Also allow direct file input change (optional)
    fileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        // Auto-upload when files are selected
        await this.processEquipmentFiles(files, equipmentIndex);
        fileInput.value = ""; // Clear the file input
      }
    });
  }

  async processEquipmentFiles(files, equipmentIndex) {
    const uploadProgress = document.getElementById("uploadProgress");
    const filePreview = document.getElementById("filePreview");

    // Show progress
    uploadProgress.classList.remove("hidden");
    filePreview.innerHTML = "";

    const currentUrls = document.getElementById("equipImages").value;
    const urlArray = currentUrls
      ? currentUrls.split("\n").filter((url) => url.trim() !== "")
      : [];

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        // Validate file
        this.validateImageFile(file);

        // Create preview item
        const previewItem = document.createElement("div");
        previewItem.className =
          "flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200";
        previewItem.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fas fa-image text-green-500"></i>
          <div>
            <span class="text-sm font-medium text-gray-700 block">${
              file.name
            }</span>
            <span class="text-xs text-gray-500">${Math.round(
              file.size / 1024
            )}KB</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-green-600">Uploading...</span>
        </div>
      `;
        filePreview.appendChild(previewItem);

        // Upload and resize image
        const compressedImage = await this.uploadAndResizeImage(file);
        urlArray.push(compressedImage);
        successCount++;

        // Update preview to show success
        previewItem.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fas fa-check-circle text-green-500 text-lg"></i>
          <div>
            <span class="text-sm font-medium text-gray-700 block">${
              file.name
            }</span>
            <span class="text-xs text-gray-500">${Math.round(
              file.size / 1024
            )}KB - Uploaded successfully</span>
          </div>
        </div>
        <i class="fas fa-check text-green-500"></i>
      `;
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errorCount++;

        // Create error preview
        const errorItem = document.createElement("div");
        errorItem.className =
          "flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200";
        errorItem.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="fas fa-exclamation-circle text-red-500 text-lg"></i>
          <div>
            <span class="text-sm font-medium text-gray-700 block">${file.name}</span>
            <span class="text-xs text-red-600">${error.message}</span>
          </div>
        </div>
        <i class="fas fa-times text-red-500"></i>
      `;
        filePreview.appendChild(errorItem);
      }
    }

    // Update the textarea with all image URLs
    document.getElementById("equipImages").value = urlArray.join("\n");

    // Hide progress
    uploadProgress.classList.add("hidden");

    // Show summary notification
    if (successCount > 0) {
      this.showNotification(
        `✅ Successfully uploaded ${successCount} image(s)!${
          errorCount > 0 ? ` (${errorCount} failed)` : ""
        }`,
        "success"
      );
    } else if (errorCount > 0) {
      this.showNotification(
        `❌ Failed to upload ${errorCount} image(s). Please check file sizes and types.`,
        "error"
      );
    }
  }

  // These should already exist from earlier, but double-check:
  uploadAndResizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const compressedImage = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedImage);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  validateImageFile(file) {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    if (file.size > maxSize) {
      throw new Error(`"${file.name}" is too large. Maximum size is 2MB.`);
    }
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `"${file.name}" is not a supported image type. Use JPG, PNG, or WebP.`
      );
    }
    return true;
  }

  removeEquipmentImage(equipmentIndex, imageIndex) {
    if (confirm("Are you sure you want to remove this image?")) {
      const currentData = this.currentData.equipment;
      currentData.equipment[equipmentIndex].images.splice(imageIndex, 1);
      this.renderEquipmentEditor(currentData);
      this.showEquipmentForm(equipmentIndex); // Refresh the form
    }
  }

  async saveEquipment(equipmentIndex) {
    try {
      console.log("💾 Starting to save equipment...");

      // Get form values
      const name = document.getElementById("equipName").value;
      const priceInput = document.getElementById("equipPrice").value;
      const description = document.getElementById("equipDescription").value;
      const imagesText = document.getElementById("equipImages").value;
      const featured = document.getElementById("equipFeatured").checked;

      // Basic validation
      if (!name || !priceInput || !description) {
        this.showNotification("Please fill in all required fields", "error");
        return;
      }

      // Format the price with ₦ symbol
      let formattedPrice = priceInput.trim();
      if (formattedPrice && !formattedPrice.startsWith("₦")) {
        formattedPrice = "₦" + formattedPrice;
      }

      // Process images
      const images = imagesText
        .split("\n")
        .filter((url) => url.trim() !== "")
        .map((url) => url.trim());

      // Create equipment data
      const equipmentData = {
        name: name,
        price: formattedPrice,
        description: description,
        images:
          images.length > 0
            ? images
            : ["assets/images/placeholder-equipment.jpg"],
        featured: featured,
      };

      console.log("📦 Equipment data to save:", equipmentData);

      // Get current data
      const currentData = this.currentData.equipment || { equipment: [] };
      console.log("📊 Current equipment data:", currentData);

      if (equipmentIndex !== null) {
        // Update existing equipment
        console.log(`🔄 Updating equipment at index: ${equipmentIndex}`);
        currentData.equipment[equipmentIndex] = equipmentData;
      } else {
        // Add new equipment
        console.log("➕ Adding new equipment");
        if (!currentData.equipment) {
          currentData.equipment = [];
        }
        currentData.equipment.push(equipmentData);
      }

      console.log("💾 Final data to save:", currentData);

      // Save the data
      await this.saveData("equipment", currentData);

      this.showNotification(
        `Equipment ${
          equipmentIndex !== null ? "updated" : "added"
        } successfully!`,
        "success"
      );

      // Clear the form
      const formContainer = document.getElementById("equipmentFormContainer");
      if (formContainer) {
        formContainer.innerHTML = "";
      }

      // Refresh the display
      this.renderEquipmentEditor(currentData);
      this.loadDashboardStats();

      // 🔥 ADD CAROUSEL REFRESH HERE 🔥
      this.triggerEquipmentRefresh();
    } catch (error) {
      console.error("❌ Error saving equipment:", error);
      console.error("Error details:", error.message);
      this.showNotification(
        `Error saving equipment: ${error.message}`,
        "error"
      );
    }
  }

  // 🔥 ADD THIS NEW METHOD FOR CAROUSEL REFRESH 🔥
  triggerEquipmentRefresh() {
    console.log("🔄 Triggering equipment refresh on main page...");

    // Method 1: Broadcast storage event (works if main page is open in another tab)
    localStorage.setItem("equipment_updated", Date.now().toString());

    // Method 2: Show notification
    this.showNotification(
      "Equipment saved! Carousels will update shortly...",
      "success"
    );

    // Optional: Auto-refresh after 2 seconds
    setTimeout(() => {
      console.log("⏰ Equipment refresh triggered");
    }, 2000);
  }

  // Remove the hideEquipmentForm method if it exists, or fix it:
  hideEquipmentForm() {
    const formContainer = document.getElementById("equipmentFormContainer");
    if (formContainer) {
      formContainer.innerHTML = "";
    }
  }

  editEquipment(index) {
    this.showEquipmentForm(index);
  }

  async deleteEquipment(index) {
    if (confirm("Are you sure you want to delete this equipment?")) {
      try {
        const currentData = this.currentData.equipment;
        currentData.equipment.splice(index, 1);
        await this.saveData("equipment", currentData);
        this.showNotification("Equipment deleted successfully!", "success");
        this.renderEquipmentEditor(currentData);
        this.loadDashboardStats();
      } catch (error) {
        this.showNotification("Error deleting equipment!", "error");
      }
    }
  }

  // === PROJECTS EDITOR ===
  renderProjectsEditor(data) {
    const container = document.getElementById("projectsContainer");
    if (!container) return;

    container.innerHTML = `
    <div class="space-y-4">
      ${
        data.projects
          ?.map(
            (project, index) => `
          <div class="border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div class="flex items-start space-x-4">
                <img src="${project.image}" alt="${project.title}" class="w-20 h-16 object-cover rounded-lg">
                <div class="flex-1">
                  <h4 class="font-semibold text-lg">${project.title}</h4>
                  <p class="text-gray-600 mt-1">${project.description}</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button onclick="admin.editProject(${index})" class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded">Edit</button>
                <button onclick="admin.deleteProject(${index})" class="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded">Delete</button>
              </div>
            </div>
          </div>
      `
          )
          .join("") ||
        '<p class="text-gray-500 text-center py-8">No projects found. Click "Add New Project" to create one.</p>'
      }
    </div>
    <div id="projectFormContainer" class="mt-6"></div>
  `;
  }

  showProjectForm(projectIndex = null) {
    const project =
      projectIndex !== null
        ? this.currentData.projects.projects[projectIndex]
        : null;
    const container = document.getElementById("projectFormContainer");

    container.innerHTML = `
    <div class="bg-gray-50 p-6 rounded-lg border">
      <h4 class="text-lg font-semibold mb-4">${
        project ? "Edit Project" : "Add New Project"
      }</h4>
      <form id="projectForm">
        <div class="space-y-4">
          <div>
            <label class="block text-gray-700 mb-2">Project Image URL</label>
            <div class="flex space-x-4 items-start">
              <div class="flex-1">
                <input type="text" id="projectImage" value="${
                  project?.image || ""
                }" class="w-full p-3 border border-gray-300 rounded-lg" 
                       placeholder="assets/images/project.jpg" required>
                <small class="text-gray-500">Image URL or upload file below</small>
              </div>
              ${
                project?.image
                  ? `
                <div class="text-center">
                  <img src="${project.image}" alt="Preview" class="w-16 h-12 object-cover rounded-lg mb-2">
                  <small class="text-gray-500">Current Image</small>
                </div>
              `
                  : ""
              }
            </div>
          </div>
          
          <div>
            <label class="block text-gray-700 mb-2">Upload New Image</label>
            <input type="file" id="projectImageUpload" accept="image/jpeg,image/png,image/webp,image/jpg" class="w-full p-3 border border-gray-300 rounded-lg">
            <small class="text-gray-500">Select an image file from your computer (Max 2MB)</small>
            
            <!-- Upload Progress -->
            <div id="projectUploadProgress" class="mt-2 hidden">
              <div class="flex items-center space-x-2 text-sm text-blue-600">
                <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Processing image...</span>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-gray-700 mb-2">Project Title</label>
            <input type="text" id="projectTitle" value="${
              project?.title || ""
            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                   placeholder="Borehole Drilling Project" required>
          </div>
          
          <div>
            <label class="block text-gray-700 mb-2">Project Description</label>
            <textarea id="projectDescription" class="w-full p-3 border border-gray-300 rounded-lg" rows="3" required>${
              project?.description || ""
            }</textarea>
          </div>
        </div>
        
        <div class="mt-6 flex space-x-4">
          <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            ${project ? "Update Project" : "Add Project"}
          </button>
          <button type="button" onclick="admin.hideProjectForm()" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
            Cancel
          </button>
        </div>
        ${
          projectIndex !== null
            ? `<input type="hidden" id="projectIndex" value="${projectIndex}">`
            : ""
        }
      </form>
    </div>
  `;

    // Setup image upload functionality
    this.setupProjectImageUpload(projectIndex);

    document.getElementById("projectForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveProject(projectIndex);
    });
  }
  hideProjectForm() {
    document.getElementById("projectFormContainer").innerHTML = "";
  }

  async saveProject(projectIndex) {
    const projectData = {
      image: document.getElementById("projectImage").value,
      title: document.getElementById("projectTitle").value,
      description: document.getElementById("projectDescription").value,
    };

    try {
      const currentData = this.currentData.projects;
      if (projectIndex !== null) {
        // Update existing project
        currentData.projects[projectIndex] = projectData;
      } else {
        // Add new project
        if (!currentData.projects) currentData.projects = [];
        currentData.projects.push(projectData);
      }

      await this.saveData("projects", currentData);
      this.showNotification(
        `Project ${projectIndex !== null ? "updated" : "added"} successfully!`,
        "success"
      );
      this.hideProjectForm();
      this.renderProjectsEditor(currentData);
    } catch (error) {
      this.showNotification("Error saving project!", "error");
    }
  }

  editProject(index) {
    this.showProjectForm(index);
  }

  async deleteProject(index) {
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const currentData = this.currentData.projects;
        currentData.projects.splice(index, 1);
        await this.saveData("projects", currentData);
        this.showNotification("Project deleted successfully!", "success");
        this.renderProjectsEditor(currentData);
      } catch (error) {
        this.showNotification("Error deleting project!", "error");
      }
    }
  }

  async uploadProjectImage(file) {
    return new Promise((resolve, reject) => {
      try {
        this.validateImageFile(file);

        const reader = new FileReader();

        reader.onload = (e) => {
          resolve(e.target.result);
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Setup project image upload
  setupProjectImageUpload(projectIndex) {
    const fileInput = document.getElementById("projectImageUpload");
    if (!fileInput) return;

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        this.showNotification("Uploading image...", "info");

        // Show progress
        const progressElement = document.getElementById(
          "projectUploadProgress"
        );
        if (progressElement) {
          progressElement.classList.remove("hidden");
        }

        // Upload image
        const imageUrl = await this.uploadProjectImage(file);

        // Update the image URL field
        document.getElementById("projectImage").value = imageUrl;

        // Update preview
        this.updateProjectImagePreview(imageUrl);

        this.showNotification("Image uploaded successfully!", "success");
      } catch (error) {
        console.error("❌ Project image upload error:", error);

        // Hide progress on error
        const progressElement = document.getElementById(
          "projectUploadProgress"
        );
        if (progressElement) {
          progressElement.classList.add("hidden");
        }

        this.showNotification(`Upload failed: ${error.message}`, "error");

        // Clear the file input
        fileInput.value = "";
      }
    });
  }

  // Update project image preview
  updateProjectImagePreview(imageUrl) {
    const previewContainer = document.querySelector(
      "#projectFormContainer .text-center"
    );
    if (!previewContainer) {
      // Create preview container if it doesn't exist
      const imageInput = document.getElementById("projectImage");
      const parent = imageInput.parentElement;

      const previewDiv = document.createElement("div");
      previewDiv.className = "text-center mt-2";
      previewDiv.innerHTML = `
        <img src="${imageUrl}" alt="Preview" class="w-16 h-12 object-cover rounded-lg mx-auto">
        <small class="text-gray-500">Image Preview</small>
      `;
      parent.appendChild(previewDiv);
    } else {
      // Update existing preview
      const img = previewContainer.querySelector("img");
      if (img) {
        img.src = imageUrl;
      }
    }
  }

  // === TESTIMONIALS EDITOR ===
  renderTestimonialsEditor(data) {
    const container = document.getElementById("testimonialsContainer");
    if (!container) return;

    container.innerHTML = `
            <div class="space-y-4">
                ${
                  data.testimonials
                    ?.map(
                      (testimonial, index) => `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div class="flex items-start space-x-4">
                                <div class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                    ${testimonial.initials}
                                </div>
                                <div>
                                    <h4 class="font-semibold">${
                                      testimonial.name
                                    }</h4>
                                    <p class="text-gray-600 text-sm">${
                                      testimonial.role
                                    }</p>
                                    <p class="text-gray-700 mt-2">${
                                      testimonial.text
                                    }</p>
                                    <div class="flex text-yellow-400 mt-2">
                                        ${this.renderStars(testimonial.rating)}
                                    </div>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="admin.editTestimonial(${index})" class="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-600 rounded">Edit</button>
                                <button onclick="admin.deleteTestimonial(${index})" class="text-red-600 hover:text-red-800 px-3 py-1 border border-red-600 rounded">Delete</button>
                            </div>
                        </div>
                    </div>
                `
                    )
                    .join("") ||
                  '<p class="text-gray-500 text-center py-8">No testimonials found. Click "Add New Testimonial" to create one.</p>'
                }
            </div>
            <div id="testimonialFormContainer" class="mt-6"></div>
        `;
  }

  showTestimonialForm(testimonialIndex = null) {
    const testimonial =
      testimonialIndex !== null
        ? this.currentData.testimonials.testimonials[testimonialIndex]
        : null;
    const container = document.getElementById("testimonialFormContainer");

    container.innerHTML = `
            <div class="bg-gray-50 p-6 rounded-lg border">
                <h4 class="text-lg font-semibold mb-4">${
                  testimonial ? "Edit Testimonial" : "Add New Testimonial"
                }</h4>
                <form id="testimonialForm">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-gray-700 mb-2">Customer Name</label>
                            <input type="text" id="testimonialName" value="${
                              testimonial?.name || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">Initials</label>
                            <input type="text" id="testimonialInitials" value="${
                              testimonial?.initials || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                   placeholder="JD" maxlength="2" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">Role/Company</label>
                            <input type="text" id="testimonialRole" value="${
                              testimonial?.role || ""
                            }" class="w-full p-3 border border-gray-300 rounded-lg" 
                                   placeholder="Residential Client" required>
                        </div>
                        <div>
                            <label class="block text-gray-700 mb-2">Rating (1-5)</label>
                            <select id="testimonialRating" class="w-full p-3 border border-gray-300 rounded-lg" required>
                                <option value="5" ${
                                  testimonial?.rating === 5 ? "selected" : ""
                                }>5 Stars</option>
                                <option value="4.5" ${
                                  testimonial?.rating === 4.5 ? "selected" : ""
                                }>4.5 Stars</option>
                                <option value="4" ${
                                  testimonial?.rating === 4 ? "selected" : ""
                                }>4 Stars</option>
                                <option value="3.5" ${
                                  testimonial?.rating === 3.5 ? "selected" : ""
                                }>3.5 Stars</option>
                                <option value="3" ${
                                  testimonial?.rating === 3 ? "selected" : ""
                                }>3 Stars</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-gray-700 mb-2">Testimonial Text</label>
                            <textarea id="testimonialText" class="w-full p-3 border border-gray-300 rounded-lg" rows="4" required>${
                              testimonial?.text || ""
                            }</textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex space-x-4">
                        <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                            ${
                              testimonial
                                ? "Update Testimonial"
                                : "Add Testimonial"
                            }
                        </button>
                        <button type="button" onclick="admin.hideTestimonialForm()" class="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600">
                            Cancel
                        </button>
                    </div>
                    ${
                      testimonialIndex !== null
                        ? `<input type="hidden" id="testimonialIndex" value="${testimonialIndex}">`
                        : ""
                    }
                </form>
            </div>
        `;

    document
      .getElementById("testimonialForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveTestimonial(testimonialIndex);
      });
  }

  hideTestimonialForm() {
    document.getElementById("testimonialFormContainer").innerHTML = "";
  }

  async saveTestimonial(testimonialIndex) {
    const testimonialData = {
      name: document.getElementById("testimonialName").value,
      initials: document.getElementById("testimonialInitials").value,
      role: document.getElementById("testimonialRole").value,
      text: document.getElementById("testimonialText").value,
      rating: parseFloat(document.getElementById("testimonialRating").value),
    };

    console.log("💾 Saving testimonial...", {
      testimonialIndex,
      data: testimonialData,
    });

    try {
      const currentData = this.currentData.testimonials;
      console.log("📊 Current data before save:", currentData);

      if (testimonialIndex !== null) {
        currentData.testimonials[testimonialIndex] = testimonialData;
      } else {
        if (!currentData.testimonials) currentData.testimonials = [];
        currentData.testimonials.push(testimonialData);
      }

      console.log("📤 Sending to server:", currentData);
      await this.saveData("testimonials", currentData);

      console.log("✅ Save successful!");
      this.showNotification(
        `Testimonial ${
          testimonialIndex !== null ? "updated" : "added"
        } successfully!`,
        "success"
      );
      this.hideTestimonialForm();
      this.renderTestimonialsEditor(currentData);
      this.loadDashboardStats();

      // 🔥 ADD THIS: Trigger main page refresh
      this.triggerMainPageRefresh();
    } catch (error) {
      console.error("❌ Save failed:", error);
      this.showNotification("Error saving testimonial!", "error");
    }
  }

  // 🔥 ADD THIS NEW METHOD:
  triggerMainPageRefresh() {
    console.log("🔄 Triggering main page refresh...");

    // Method 1: Broadcast storage event (works if main page is open in another tab)
    localStorage.setItem("testimonials_updated", Date.now().toString());

    // Method 2: If using the same browser, you could:
    // - Open main page in new tab and refresh it
    // - Or show a message to refresh manually

    this.showNotification(
      "Testimonial saved! Main page will update shortly...",
      "success"
    );

    // Optional: Auto-refresh after 2 seconds if you want
    setTimeout(() => {
      // This would refresh the main page if it's open in an iframe or something
      console.log("⏰ Auto-refresh triggered");
    }, 2000);
  }

  editTestimonial(index) {
    this.showTestimonialForm(index);
  }

  async deleteTestimonial(index) {
    if (confirm("Are you sure you want to delete this testimonial?")) {
      try {
        const currentData = this.currentData.testimonials;
        currentData.testimonials.splice(index, 1);
        await this.saveData("testimonials", currentData);
        this.showNotification("Testimonial deleted successfully!", "success");
        this.renderTestimonialsEditor(currentData);
        this.loadDashboardStats();
      } catch (error) {
        this.showNotification("Error deleting testimonial!", "error");
      }
    }
  }

  // === PLACEHOLDER METHODS FOR OTHER SECTIONS ===

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

  // === CONTACT EDITOR ===
  renderContactEditor(data) {
    const contact = data.contact || {};
    document.getElementById("contactAddress").value = contact.address || "";
    document.getElementById("contactPhone1").value = contact.phones?.[0] || "";
    document.getElementById("contactPhone2").value = contact.phones?.[1] || "";
    document.getElementById("contactEmail1").value = contact.emails?.[0] || "";
    document.getElementById("contactEmail2").value = contact.emails?.[1] || "";
    document.getElementById("contactWeekdays").value =
      contact.hours?.weekdays || "";
    document.getElementById("contactSaturday").value =
      contact.hours?.saturday || "";
  }

  async saveContactInfo() {
    const contactData = {
      contact: {
        address: document.getElementById("contactAddress").value,
        phones: [
          document.getElementById("contactPhone1").value,
          document.getElementById("contactPhone2").value,
        ],
        emails: [
          document.getElementById("contactEmail1").value,
          document.getElementById("contactEmail2").value,
        ],
        hours: {
          weekdays: document.getElementById("contactWeekdays").value,
          saturday: document.getElementById("contactSaturday").value,
        },
      },
    };

    try {
      await this.saveData("contact", contactData);
      this.showNotification("Contact information saved!", "success");

      // ✅ TRIGGER MAIN PAGE UPDATE
      this.triggerContactRefresh();
    } catch (error) {
      this.showNotification("Error saving contact info!", "error");
    }
  }

  // Add this method to trigger main page updates
  triggerContactRefresh() {
    console.log("🔄 Triggering contact refresh on main page...");

    // Method 1: Broadcast storage event
    localStorage.setItem("contact_updated", Date.now().toString());

    // Method 2: Show notification
    this.showNotification(
      "Contact info saved! Main page will update shortly...",
      "success"
    );
  }

  // === UTILITY METHODS ===
  async fetchData(type) {
    const response = await fetch(`${this.baseURL}/api/${type}`);
    return await response.json();
  }

  async saveData(type, data) {
    try {
      console.log(`💾 Saving ${type} data...`);
      console.log(`📏 Data size: ${JSON.stringify(data).length} bytes`);

      // Check if data contains base64 images and log their sizes
      if (type === "projects" && data.projects) {
        data.projects.forEach((project, index) => {
          if (project.image && project.image.startsWith("data:image")) {
            const sizeKB = Math.round((project.image.length * 0.75) / 1024);
            console.log(`🖼️ Project ${index} image size: ${sizeKB}KB`);
          }
        });
      }

      const response = await fetch(`${this.baseURL}/api/admin/${type}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 413) {
          // More detailed error message
          const dataSize = JSON.stringify(data).length;
          throw new Error(
            `Data too large (${Math.round(dataSize / 1024)}KB). ` +
              `Server rejected it. Try using image URLs instead of uploads.`
          );
        }
        throw new Error(`Save failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving data:", error);
      throw error;
    }
  }

  showNotification(message, type = "info") {
    // Remove existing notifications
    const existing = document.querySelectorAll(".notification");
    existing.forEach((n) => n.remove());

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize admin
const admin = new SimpleADEQAdmin();
