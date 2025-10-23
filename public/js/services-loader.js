// Services Loader for ADEQ
class ServicesLoader {
  constructor() {
    this.baseURL = window.location.origin;
  }

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

  renderServices(services) {
    const container = document.getElementById("services-container");
    if (!container) return;

    container.innerHTML = services
      .map(
        (service) => `
            <div class="bg-light p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-2">
                <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <i class="${service.icon} text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-primary mb-3">${service.title}</h3>
                <p class="text-gray-600 mb-4">${service.description}</p>
                ${service.price ? `<p class="text-secondary font-bold mb-2">${service.price}</p>` : ""}
                <a href="${service.link}" class="text-accent font-medium flex items-center">
                    Learn more <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        `
      )
      .join("");
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  const loader = new ServicesLoader();
  loader.loadServices();
});
