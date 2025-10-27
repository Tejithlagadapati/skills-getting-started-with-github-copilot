document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options when reloading
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML (safe-escaped). Add a small unregister button for each participant.
        const participants = details.participants || [];
        const participantsHtml = participants.length
          ? participants
              .map((p) =>
                `<li data-email="${escapeAttr(p)}">${escapeHtml(p)} <button class="unregister" data-activity="${escapeAttr(
                  name
                )}" data-email="${escapeAttr(p)}" aria-label="Remove ${escapeHtml(
                  p
                )}">&times;</button></li>`
              )
              .join("")
          : '<li class="muted">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description || "")}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule || "")}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <h5>Participants</h5>
            <ul>${participantsHtml}</ul>
          </div>
        `;

        // After inserting, wire up unregister button handlers inside this card
        activitiesList.appendChild(activityCard);

        activityCard.querySelectorAll(".unregister").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const activity = btn.getAttribute("data-activity");
            const email = btn.getAttribute("data-email");

            if (!activity || !email) return;

            // Call unregister endpoint
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(
                  email
                )}`,
                { method: "POST" }
              );

              if (resp.ok) {
                // Remove the participant element from UI
                const li = btn.closest("li");
                if (li) li.remove();

                // Optionally refresh the activities list to update availability
                // Here we reload everything to keep state consistent
                fetchActivities();
              } else {
                const body = await resp.json().catch(() => ({}));
                console.error("Failed to unregister:", body.detail || body.message || resp.statusText);
                alert(body.detail || body.message || "Failed to remove participant");
              }
            } catch (err) {
              console.error("Error unregistering:", err);
              alert("Failed to remove participant. Please try again.");
            }
          });
        });

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

  // Helper to escape user-provided strings before injecting into innerHTML
  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Escape for attribute values (slightly different to ensure quotes are encoded)
  function escapeAttr(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
        // Refresh activities so the new participant appears without a full page reload
        fetchActivities();
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
  fetchActivities();
});
