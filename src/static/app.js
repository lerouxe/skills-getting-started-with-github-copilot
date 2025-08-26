document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const themeToggle = document.getElementById("theme-toggle");

  // Theme management
  function initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeToggleIcon(savedTheme);
  }

  function updateThemeToggleIcon(theme) {
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeToggleIcon(newTheme);
  }

  themeToggle.addEventListener("click", toggleTheme);

  // Function to create pie chart for availability
  function createAvailabilityChart(canvas, booked, total) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 5;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate angles
    const bookedAngle = (booked / total) * 2 * Math.PI;
    const availableAngle = ((total - booked) / total) * 2 * Math.PI;

    // Draw booked section (red)
    if (booked > 0) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + bookedAngle);
      ctx.closePath();
      ctx.fillStyle = '#f44336';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw available section (green)
    if (total - booked > 0) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, -Math.PI / 2 + bookedAngle, -Math.PI / 2 + bookedAngle + availableAngle);
      ctx.closePath();
      ctx.fillStyle = '#4caf50';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Add center circle for better appearance
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = 'var(--bg-secondary)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Add text in center showing ratio
    ctx.fillStyle = 'var(--text-primary)';
    ctx.font = '12px Poppins';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${booked}/${total}`, centerX, centerY);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const canvasId = `chart-${name.replace(/\s+/g, '-').toLowerCase()}`;
        const activityIcon = details.icon || "🎯"; // Use icon from API or default

        activityCard.innerHTML = `
          <div class="activity-header">
            <div class="activity-info">
              <h4><span class="activity-icon">${activityIcon}</span>${name}</h4>
              <p>${details.description}</p>
              <p><strong>Schedule:</strong> ${details.schedule}</p>
              <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            </div>
            <div class="availability-chart">
              <canvas id="${canvasId}" width="80" height="80"></canvas>
              <div class="chart-legend">
                <div class="legend-item">
                  <span class="legend-color booked"></span>
                  <span>Booked</span>
                </div>
                <div class="legend-item">
                  <span class="legend-color available"></span>
                  <span>Available</span>
                </div>
              </div>
            </div>
          </div>
          <div class="participants-section">
            <p><strong>Current Participants:</strong></p>
            <ul class="participants-list">
              ${details.participants.map(email => `<li>${email}</li>`).join('')}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Create pie chart after DOM element is added
        setTimeout(() => {
          const canvas = document.getElementById(canvasId);
          if (canvas) {
            createAvailabilityChart(canvas, details.participants.length, details.max_participants);
          }
        }, 0);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  initializeTheme();
  fetchActivities();
});
