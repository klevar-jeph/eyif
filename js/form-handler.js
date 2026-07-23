// Base URL for API endpoints
const BASE_URL = "https://eyif-server-vuqh.onrender.com";

// ─── Utility Functions ───────────────────────────────────────────────

// Sanitize string to prevent XSS when inserting into DOM
function sanitizeText(str) {
  if (typeof str !== "string") return str;
  var div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Email validation
function isValidEmail(email) {
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Convert snake_case to camelCase (for form field names → backend model keys)
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, function (_, letter) {
    return letter.toUpperCase();
  });
}

// Map frontend edo_connection values to backend enum values
function mapEdoConnection(value) {
  var map = {
    resident: "Resident",
    indigene: "Indigene",
    business_based: "Business Based",
  };
  return map[value] || value;
}

function mapEdoConnections(value) {
  if (Array.isArray(value)) {
    return value.map(mapEdoConnection);
  }
  return value ? [mapEdoConnection(value)] : [];
}

function assignFormValue(target, key, value) {
  if (target[key] === undefined) {
    target[key] = value;
  } else if (Array.isArray(target[key])) {
    target[key].push(value);
  } else {
    target[key] = [target[key], value];
  }
}

// Helper function to convert category values to backend format
function convertCategoryFormat(category) {
  var categoryMap = {
    education: "basic-education",
    agriculture: "agriculture-food",
    environment: "waste-environment",
    culture: "culture-arts",
    health: "youth-wellbeing",
    skills: "skills-work",
    transport: "transportation",
  };
  return categoryMap[category] || category;
}

// ─── Toast Notification System ───────────────────────────────────────

var TOAST_CONTAINER_ID = "eyif-toast-container";

function getToastContainer() {
  var container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message - The message to display.
 * @param {"success"|"error"|"info"} type - Toast type.
 * @param {number} [duration=5000] - Auto-dismiss time in ms.
 */
function showToast(message, type, duration) {
  duration = duration || 5000;
  var container = getToastContainer();

  var toast = document.createElement("div");
  toast.className = "eyif-toast eyif-toast--" + type;

  // Icon
  var iconMap = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    info: "fa-info-circle",
  };
  var iconClass = iconMap[type] || iconMap.info;

  toast.innerHTML =
    '<div class="eyif-toast__icon"><i class="fa ' + iconClass + '"></i></div>' +
    '<div class="eyif-toast__body">' +
      '<span class="eyif-toast__title">' + (type === "success" ? "Success" : type === "error" ? "Error" : "Info") + '</span>' +
      '<span class="eyif-toast__message">' + sanitizeText(message) + '</span>' +
    '</div>' +
    '<button class="eyif-toast__close" aria-label="Close">&times;</button>' +
    '<div class="eyif-toast__progress"><div class="eyif-toast__progress-bar"></div></div>';

  container.appendChild(toast);

  // Trigger enter animation on next frame
  requestAnimationFrame(function () {
    toast.classList.add("eyif-toast--visible");
  });

  // Start progress bar
  var bar = toast.querySelector(".eyif-toast__progress-bar");
  bar.style.transition = "width " + duration + "ms linear";
  requestAnimationFrame(function () {
    bar.style.width = "0%";
  });

  // Close handler
  var dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    toast.classList.remove("eyif-toast--visible");
    toast.classList.add("eyif-toast--exit");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 350);
  }

  toast.querySelector(".eyif-toast__close").addEventListener("click", dismiss);

  // Auto-dismiss
  var autoTimer = setTimeout(dismiss, duration);

  // Pause on hover
  toast.addEventListener("mouseenter", function () {
    clearTimeout(autoTimer);
    bar.style.transitionPlayState = "paused";
  });
  toast.addEventListener("mouseleave", function () {
    autoTimer = setTimeout(dismiss, 1500);
    bar.style.transitionPlayState = "running";
  });
}

// ─── Feedback Display ────────────────────────────────────────────────

function showFormFeedback(form, message, type) {
  var feedbackElement = form.querySelector(".form-feedback, .form-message");
  if (!feedbackElement) {
    feedbackElement = document.createElement("div");
    feedbackElement.className = "form-feedback";
    form.appendChild(feedbackElement);
  }

  var icon =
    type === "success" ? "fa-check-circle" : "fa-exclamation-circle";
  feedbackElement.innerHTML =
    '<i class="fa ' + icon + '"></i> ' + sanitizeText(message);
  feedbackElement.className = "form-feedback " + type;

  // Support .form-message styling from seat-reservation pages
  if (feedbackElement.classList.contains("form-message")) {
    feedbackElement.classList.add("show");
    feedbackElement.style.opacity = 1;
    feedbackElement.style.display = "block";
  }
}

function clearFormFeedback(form) {
  var el = form.querySelector(".form-feedback, .form-message");
  if (el) {
    el.innerHTML = "";
    el.className = "form-feedback";
    el.style.opacity = 0;
  }
}

// ─── Success Messages ────────────────────────────────────────────────

function getSuccessMessage(endpoint, serverMessage) {
  if (serverMessage) return serverMessage;
  switch (endpoint) {
    case "/exhibition":
      return "Thank you for your exhibition inquiry! We'll contact you soon.";
    case "/grant-registration":
      return "Your grant application has been submitted successfully! We'll review it and get back to you.";
    case "/subscribe":
      return "Successfully subscribed to our newsletter!";
    case "/reserve-seat":
      return "Your seat has been reserved successfully! You'll receive a confirmation email shortly.";
    case "/apply/idea":
      return "Your Idea Track application has been submitted successfully! We'll review it and get back to you.";
    case "/apply/build":
      return "Your Build Track application has been submitted successfully! We'll review it and get back to you.";
    case "/apply/scale":
      return "Your Scale Track application has been submitted successfully! We'll review it and get back to you.";
    default:
      return "Form submitted successfully!";
  }
}

// Post-success actions
function handlePostSuccess(endpoint) {
  if (endpoint === "/grant-registration") {
    setTimeout(function () {
      if (confirm("Would you like to reserve a seat for the event?")) {
        window.location.href = "seat-reservation.html";
      }
    }, 2000);
  }
}

// ─── Generic Form Submission (real API calls) ────────────────────────

async function submitForm(formElement, endpoint, getData, options) {
  options = options || {};
  var submitBtn = formElement.querySelector(
    'button[type="submit"], .submit-btn, .theme-btn'
  );
  var originalBtnText = submitBtn ? submitBtn.innerHTML : "";
  var timeout = options.timeout || 30000;

  if (submitBtn) {
    submitBtn.innerHTML =
      '<span class="spinner"><i class="fa fa-spinner fa-spin"></i></span> Processing...';
    submitBtn.disabled = true;
  }

  clearFormFeedback(formElement);

  try {
    var data = typeof getData === "function" ? getData() : getData;

    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, timeout);

    var response = await fetch(BASE_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    var result = {};
    try {
      result = await response.json();
    } catch (_) {
      // response may not be JSON
    }

    if (!response.ok) {
      throw new Error(
        result.message || "Server error (" + response.status + ")"
      );
    }

    // Success
    var successMessage = getSuccessMessage(endpoint, result.message);
    showFormFeedback(formElement, successMessage, "success");
    showToast(successMessage, "success");
    formElement.reset();

    // Reset custom UI elements
    if (
      endpoint === "/grant-registration" ||
      endpoint.startsWith("/apply/")
    ) {
      document.querySelectorAll(".category-card").forEach(function (card) {
        card.classList.remove("active");
      });
    }

    handlePostSuccess(endpoint);
    return result;
  } catch (error) {
    var errorMessage = "Something went wrong. Please try again.";

    if (error.name === "AbortError") {
      errorMessage =
        "Request timed out. Please check your connection and try again.";
    } else if (typeof navigator !== "undefined" && !navigator.onLine) {
      errorMessage =
        "You appear to be offline. Please check your internet connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error("Form submission error:", error);
    showFormFeedback(formElement, errorMessage, "error");
    showToast(errorMessage, "error");
    throw error;
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  }
}

// ─── Contact Form ────────────────────────────────────────────────────

function initContactForm() {
  var form = document.getElementById("email-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var firstName = (
      form.querySelector('[name="firstName"]') || {}
    ).value;
    var lastName = (
      form.querySelector('[name="lastName"]') || {}
    ).value;
    var email = (form.querySelector('[name="email"]') || {}).value;
    var phone = (form.querySelector('[name="phone"]') || {}).value;
    var message = (
      form.querySelector('[name="message"]') || {}
    ).value;

    firstName = firstName ? firstName.trim() : "";
    lastName = lastName ? lastName.trim() : "";
    email = email ? email.trim() : "";
    phone = phone ? phone.trim() : "";
    message = message ? message.trim() : "";

    // Validation
    var errors = [];
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!email) errors.push("Email is required");
    else if (!isValidEmail(email)) errors.push("Please enter a valid email address");
    if (!phone) errors.push("Phone number is required");
    if (!message) errors.push("Message is required");

    if (errors.length) {
      showFormFeedback(form, errors.join(". "), "error");
      showToast(errors[0], "error");
      return;
    }

    submitForm(form, "/exhibition", {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
      message: message,
    });
  });
}

// ─── Newsletter Subscription ─────────────────────────────────────────

function initNewsletterForms() {
  var forms = document.querySelectorAll(
    ".newsletter-form-two form, .subscribe-form form, #newsletter-form"
  );

  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var emailInput = form.querySelector('input[type="email"]');
      if (!emailInput) return;

      var email = emailInput.value.trim();
      if (!email) {
        showFormFeedback(form, "Email address is required.", "error");
        showToast("Email address is required.", "error");
        return;
      }
      if (!isValidEmail(email)) {
        showFormFeedback(
          form,
          "Please enter a valid email address.",
          "error"
        );
        showToast("Please enter a valid email address.", "error");
        return;
      }

      submitForm(form, "/subscribe", { email: email });
    });
  });
}

// ─── Seat Reservation ────────────────────────────────────────────────

function initSeatReservationForm() {
  var form = document.getElementById("seat-reservation-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var firstName = (
      form.querySelector('[name="first_name"]') || {}
    ).value;
    var lastName = (
      form.querySelector('[name="last_name"]') || {}
    ).value;
    var email = (form.querySelector('[name="email"]') || {}).value;
    var phone = (form.querySelector('[name="phone"]') || {}).value;

    firstName = firstName ? firstName.trim() : "";
    lastName = lastName ? lastName.trim() : "";
    email = email ? email.trim() : "";
    phone = phone ? phone.trim() : "";

    var errors = [];
    if (!firstName) errors.push("First name is required");
    if (!lastName) errors.push("Last name is required");
    if (!email) errors.push("Email is required");
    else if (!isValidEmail(email)) errors.push("Please enter a valid email address");
    if (!phone) errors.push("Phone number is required");

    if (errors.length) {
      showFormFeedback(form, errors.join(". "), "error");
      showToast(errors[0], "error");
      return;
    }

    submitForm(form, "/reserve-seat", {
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone,
    });
  });
}

// ─── Grant Registration (old 2025 form) ──────────────────────────────

function initGrantRegistrationForm() {
  var form = document.getElementById("grant-registration-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var formData = new FormData(form);
    var jsonData = {};
    formData.forEach(function (value, key) {
      if (key === "category") {
        jsonData[key] = convertCategoryFormat(value);
      } else {
        jsonData[key] = value;
      }
    });

    submitForm(form, "/grant-registration", jsonData);
  });
}

// ─── 2026 Grant Track Applications (Idea / Build / Scale) ───────────

// Numeric fields that need type conversion before sending to backend
var NUMERIC_FIELDS = [
  "age",
  "customersSpoken",
  "jobsCreated",
  "currentUsers",
  "monthlyActiveUsers",
  "monthlyRevenue",
  "teamSize",
  "totalUsers",
  "annualRevenue",
  "growthRate",
  "cac",
  "ltv",
  "burnRate",
  "runway",
  "yearFounded",
];

// Called from onsubmit="submitApplication(event, 'idea')" etc. in grant-registration.html
function submitApplication(event, tier) {
  event.preventDefault();
  var form = event.target;

  var invalidCheckboxGroup = null;
  var checkboxGroups = form.querySelectorAll("[data-required-checkbox-group]");
  Array.prototype.some.call(checkboxGroups, function (group) {
    if (!group.querySelector("input:checked")) {
      invalidCheckboxGroup = group;
      return true;
    }
    return false;
  });
  if (invalidCheckboxGroup) {
    showFormFeedback(
      form,
      "Please select at least one Edo State connection.",
      "error"
    );
    showToast("Please select at least one Edo State connection.", "error");
    invalidCheckboxGroup.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  var formData = new FormData(form);
  var rawData = {};
  formData.forEach(function (value, key) {
    assignFormValue(rawData, key, value);
  });

  // Convert snake_case form field names to camelCase backend keys
  var data = {};
  Object.keys(rawData).forEach(function (key) {
    var camelKey = snakeToCamel(key);
    var value = rawData[key];

    // Keep the legacy enum field while also sending all selected values.
    if (camelKey === "edoConnection") {
      var edoConnections = mapEdoConnections(value);
      data.edoConnection = edoConnections[0] || "";
      data.edoConnections = edoConnections;
    } else {
      data[camelKey] = value;
    }
  });

  // Convert numeric fields from string to number
  NUMERIC_FIELDS.forEach(function (field) {
    if (data[field] !== undefined && data[field] !== "") {
      data[field] = Number(data[field]);
    }
  });

  var endpoint = "/apply/" + tier;
  submitForm(form, endpoint, data);
}

// ─── Initialization ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  initContactForm();
  initGrantRegistrationForm();
  initNewsletterForms();
  initSeatReservationForm();

  // Inject feedback, spinner & toast styles
  var style = document.createElement("style");
  style.textContent =
    /* ── Inline feedback ── */
    ".form-feedback, .form-message {" +
    "  margin-top: 15px; padding: 10px 15px; border-radius: 5px; display: none;" +
    "}" +
    ".form-feedback.success, .form-message.success {" +
    "  display: block; background-color: rgba(40,167,69,0.1);" +
    "  border-left: 4px solid #28a745; color: #28a745;" +
    "}" +
    ".form-feedback.error, .form-message.error {" +
    "  display: block; background-color: rgba(220,53,69,0.1);" +
    "  border-left: 4px solid #dc3545; color: #dc3545;" +
    "}" +
    ".form-message.show { display: block !important; }" +
    ".spinner { margin-right: 8px; display: inline-block; }" +
    "button:disabled { opacity: 0.7; cursor: not-allowed; }" +

    /* ── Toast container ── */
    "#eyif-toast-container {" +
    "  position: fixed; top: 24px; right: 24px; z-index: 99999;" +
    "  display: flex; flex-direction: column; gap: 12px;" +
    "  pointer-events: none; max-width: 420px; width: 100%;" +
    "}" +
    "@media (max-width: 480px) {" +
    "  #eyif-toast-container { top: 12px; right: 12px; left: 12px; max-width: none; }" +
    "}" +

    /* ── Toast base ── */
    ".eyif-toast {" +
    "  pointer-events: auto; display: flex; align-items: flex-start;" +
    "  position: relative; overflow: hidden; border-radius: 10px;" +
    "  padding: 16px 40px 16px 16px; min-width: 300px;" +
    "  background: #fff; color: #1a1a2e;" +
    "  box-shadow: 0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);" +
    "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;" +
    "  transform: translateX(calc(100% + 32px)); opacity: 0;" +
    "  transition: transform 0.4s cubic-bezier(0.2,0.9,0.3,1), opacity 0.4s ease;" +
    "}" +
    ".eyif-toast--visible {" +
    "  transform: translateX(0); opacity: 1;" +
    "}" +
    ".eyif-toast--exit {" +
    "  transform: translateX(calc(100% + 32px)); opacity: 0;" +
    "  transition: transform 0.35s cubic-bezier(0.5,0,0.7,0.2), opacity 0.3s ease;" +
    "}" +

    /* ── Toast icon ── */
    ".eyif-toast__icon {" +
    "  flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%;" +
    "  display: flex; align-items: center; justify-content: center;" +
    "  margin-right: 14px; font-size: 18px;" +
    "}" +
    ".eyif-toast--success .eyif-toast__icon { background: rgba(40,167,69,0.12); color: #28a745; }" +
    ".eyif-toast--error .eyif-toast__icon { background: rgba(220,53,69,0.12); color: #dc3545; }" +
    ".eyif-toast--info .eyif-toast__icon { background: rgba(13,110,253,0.12); color: #0d6efd; }" +

    /* ── Toast body ── */
    ".eyif-toast__body {" +
    "  display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0;" +
    "}" +
    ".eyif-toast__title {" +
    "  font-weight: 700; font-size: 14px; line-height: 1.3; text-transform: uppercase;" +
    "  letter-spacing: 0.4px;" +
    "}" +
    ".eyif-toast--success .eyif-toast__title { color: #28a745; }" +
    ".eyif-toast--error .eyif-toast__title { color: #dc3545; }" +
    ".eyif-toast--info .eyif-toast__title { color: #0d6efd; }" +
    ".eyif-toast__message {" +
    "  font-size: 13px; line-height: 1.45; color: #555; word-break: break-word;" +
    "}" +

    /* ── Close button ── */
    ".eyif-toast__close {" +
    "  position: absolute; top: 8px; right: 10px; border: none; background: none;" +
    "  font-size: 20px; line-height: 1; color: #999; cursor: pointer;" +
    "  padding: 4px 6px; border-radius: 4px; transition: background 0.2s, color 0.2s;" +
    "}" +
    ".eyif-toast__close:hover { background: rgba(0,0,0,0.06); color: #333; }" +

    /* ── Progress bar ── */
    ".eyif-toast__progress {" +
    "  position: absolute; bottom: 0; left: 0; right: 0; height: 4px;" +
    "  background: rgba(0,0,0,0.06);" +
    "}" +
    ".eyif-toast__progress-bar {" +
    "  height: 100%; width: 100%; border-radius: 0 0 10px 10px;" +
    "}" +
    ".eyif-toast--success .eyif-toast__progress-bar { background: #28a745; }" +
    ".eyif-toast--error .eyif-toast__progress-bar { background: #dc3545; }" +
    ".eyif-toast--info .eyif-toast__progress-bar { background: #0d6efd; }";
  document.head.appendChild(style);
});
