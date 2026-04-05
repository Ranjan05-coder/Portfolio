const API_BASE = "http://localhost:5000/api";
let token = localStorage.getItem("adminToken");
let currentPortfolio = {};

const id = (selector) => document.querySelector(selector);
const all = (selector) => document.querySelectorAll(selector);

// ============== IMAGE COMPRESSION ==============
async function compressImage(file, maxWidth = 600, maxHeight = 400, quality = 0.6) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions - more aggressive
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality compression
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // If still too large, compress more
        let attempts = 0;
        let currentQuality = quality;
        while (compressedBase64.length > 300000 && attempts < 3) {
          currentQuality -= 0.1;
          compressedBase64 = canvas.toDataURL('image/jpeg', currentQuality);
          attempts++;
        }
        
        console.log('[Compress] Original:', (file.size / 1024).toFixed(2), 'KB → Compressed:', (compressedBase64.length / 1024).toFixed(2), 'KB (Quality:', currentQuality.toFixed(2) + ')');
        resolve(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ============== AUTH ==============
function setupLoginForm() {
  const form = id("#loginForm");
  const emailInput = id("#loginEmail");
  const passwordInput = id("#loginPassword");
  const errorMsg = id("#loginError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.textContent = "";

    try {
      const email = emailInput.value;
      const password = passwordInput.value;
      
      console.log("[Login] Sending login request to:", `${API_BASE}/auth/login`);
      console.log("[Login] Email:", email);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include"
      });

      console.log("[Login] Response status:", response.status);
      console.log("[Login] Response ok:", response.ok);

      const data = await response.json();
      console.log("[Login] Response data:", data);

      if (response.ok && data.token) {
        console.log("[Login] ✓ Login successful! Token received");
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminEmail", email);
        token = data.token;
        emailInput.value = "";
        passwordInput.value = "";
        showDashboard();
        loadPortfolioData();
      } else {
        console.log("[Login] ❌ Failed:", data);
        errorMsg.textContent = data.message || "Invalid credentials.";
      }
    } catch (err) {
      console.error("[Login] ❌ Network/Fetch error:", err);
      console.error("[Login] Error details:", err.message);
      console.error("[Login] API_BASE:", API_BASE);
      errorMsg.textContent = "❌ Network error. Make sure backend is running at localhost:5000";
    }
  });
}

function logout() {
  localStorage.removeItem("adminToken");
  token = null;
  showLoginPage();
}

function showLoginPage() {
  id("#loginPage").classList.remove("hidden");
  id("#dashboardPage").classList.add("hidden");
}

function showDashboard() {
  id("#loginPage").classList.add("hidden");
  id("#dashboardPage").classList.remove("hidden");
  id("#adminEmail").textContent = localStorage.getItem("adminEmail") || "Admin";
}

// ============== SETUP ==============
function setupTabs() {
  all(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      all(".tab-btn").forEach((b) => b.classList.remove("active"));
      all(".tab-content").forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      id(`#${btn.dataset.tab}-tab`).classList.add("active");

      // Load messages when messages tab is clicked
      if (btn.dataset.tab === "messages") {
        loadMessages();
      }

      // Load analytics when analytics tab is clicked
      if (btn.dataset.tab === "analytics") {
        loadAnalytics();
      }
    });
  });
}

function setupForms() {
  // Hero Form
  id("#heroForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(id("#heroForm"));
    const data = Object.fromEntries(formData);

    const oldHero = JSON.stringify(currentPortfolio.hero);
    currentPortfolio.hero = {
      name: data["hero.name"],
      role: data["hero.role"],
      summary: data["hero.summary"],
      tag: data["hero.tag"],
      resumeUrl: data["hero.resumeUrl"],
      profileImage: currentPortfolio.hero?.profileImage || "",
      stats: Array.from(all('input[name="heroStat"]')).map((input) => input.value)
    };

    // Handle profile image upload if present
    const profileImageInput = id("#profileImageFile");
    if (profileImageInput && profileImageInput.files.length > 0) {
      try {
        const file = profileImageInput.files[0];
        console.log('[ProfileImage] Original file size:', (file.size / 1024).toFixed(2), 'KB');
        
        // Compress image
        const compressedBase64 = await compressImage(file, 300, 300, 0.8);
        currentPortfolio.hero.profileImage = compressedBase64;
        
        console.log('[ProfileImage] Compressed size:', (compressedBase64.length / 1024).toFixed(2), 'KB');
      } catch (err) {
        alert("Failed to upload profile image: " + err.message);
        return;
      }
    }

    if (oldHero !== JSON.stringify(currentPortfolio.hero)) {
      await createHistoryEntry('EDIT_HERO', 'hero', `${data["hero.name"]} - ${data["hero.role"]}`);
    }

    savePortfolio();
  });

  // About Form
  id("#aboutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldAbout = currentPortfolio.about;
    currentPortfolio.about = id('textarea[name="about"]').value;
    if (oldAbout !== currentPortfolio.about) {
      await createHistoryEntry('EDIT_ABOUT', 'about', 'About Section Updated');
    }
    savePortfolio();
  });

  // ============== FILE PREVIEW HANDLERS ==============
  // Certification image preview
  const certImageFile = id("#certImageFile");
  if (certImageFile) {
    certImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = id("#certImagePreview");
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          preview.innerHTML = `
            <img src="${evt.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 8px; margin-bottom: 0.8rem;">
          `;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Project screenshot preview
  const projectScreenshot = id("#projectScreenshot");
  if (projectScreenshot) {
    projectScreenshot.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = id("#projectScreenshotPreview");
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          preview.innerHTML = `
            <img src="${evt.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 0.8rem;">
          `;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Profile image preview
  const profileImageFile = id("#profileImageFile");
  if (profileImageFile) {
    profileImageFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const preview = id("#profileImagePreview");
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          preview.innerHTML = `
            <img src="${evt.target.result}" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 3px solid #0066ff; margin-bottom: 0.8rem;">
          `;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// ============== DYNAMIC LIST MANAGEMENT ==============
function addHeroStat() {
  const container = id("#heroStats");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "heroStat";
  input.placeholder = "e.g., 10+ Projects Built";
  input.required = true;
  container.appendChild(input);
}

function addSkill() {
  const container = id("#skillsList");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "skill";
  input.placeholder = "e.g., Python";
  input.required = true;
  container.appendChild(input);
}

function addProject() {
  const container = id("#projectsList");
  const item = document.createElement("div");
  item.className = "list-item project-item";
  item.innerHTML = `
    <div class="list-item-header">
      <h4>New Project</h4>
      <button type="button" class="remove-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>
    </div>
    <input type="text" name="project-title" placeholder="Project Title" required />
    <textarea name="project-summary" rows="3" placeholder="Project Summary" required></textarea>
    <input type="text" name="project-tech" placeholder="Tech Stack (comma-separated)" required />
    <input type="url" name="project-live" placeholder="Live Demo URL" required />
  `;
  container.appendChild(item);
}

function addExperience() {
  const container = id("#experienceList");
  const item = document.createElement("div");
  item.className = "list-item experience-item";
  item.innerHTML = `
    <div class="list-item-header">
      <h4>New Experience</h4>
      <button type="button" class="remove-btn" onclick="this.parentElement.parentElement.remove()">Remove</button>
    </div>
    <input type="text" name="exp-title" placeholder="Job Title" required />
    <input type="text" name="exp-org" placeholder="Organization/Company" required />
    <input type="text" name="exp-period" placeholder="May 2025 - Jul 2025" required />
    <textarea name="exp-details" rows="3" placeholder="Job Details" required></textarea>
  `;
  container.appendChild(item);
}

function addCertification() {
  const container = id("#certificationsList");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "cert";
  input.placeholder = "Certification Name";
  input.required = true;
  container.appendChild(input);
}

// ============== MODAL MANAGEMENT ==============
let deletePending = { section: null, index: null };

// Skill Modal Functions
function openSkillModal(index = null) {
  const modal = id("#skillModal");
  const titleEl = id("#skillModalTitle");
  const indexInput = id("#skillIndex");
  const skillInput = id("#skillInput");
  const skillUrl = id("#skillUrl");

  if (index !== null) {
    titleEl.textContent = "Edit Skill";
    indexInput.value = index;
    const skill = currentPortfolio.skills[index];
    // Handle both old format (string) and new format (object)
    if (typeof skill === 'string') {
      skillInput.value = skill;
      skillUrl.value = "";
    } else if (typeof skill === 'object') {
      skillInput.value = skill.name || "";
      skillUrl.value = skill.url || "";
    }
  } else {
    titleEl.textContent = "Add Skill";
    indexInput.value = "";
    skillInput.value = "";
    skillUrl.value = "";
  }
  modal.classList.add("active");
  skillInput.focus();
}

function closeSkillModal() {
  id("#skillModal").classList.remove("active");
  id("#skillModalForm").reset();
}

// Project Modal Functions
function openProjectModal(index = null) {
  const modal = id("#projectModal");
  const titleEl = id("#projectModalTitle");
  const indexInput = id("#projectIndex");
  const projectScreenshot = id("#projectScreenshot");
  const projectScreenshotPreview = id("#projectScreenshotPreview");

  // Clear file input and preview
  if (projectScreenshot) projectScreenshot.value = "";
  if (projectScreenshotPreview) projectScreenshotPreview.innerHTML = "";

  if (index !== null) {
    titleEl.textContent = "Edit Project";
    indexInput.value = index;
    const project = currentPortfolio.projects[index];
    id("#projectTitle").value = project.title || "";
    id("#projectSummary").value = project.summary || "";
    id("#projectTech").value = (project.tech || []).join(", ");
    id("#projectLive").value = project.live || "";
    id("#projectGithub").value = project.github || "";
    id("#projectVisible").checked = project.visible !== false;
    // Show screenshot preview if exists and is base64
    if (project.imageUrl && project.imageUrl.startsWith("data:")) {
      if (projectScreenshotPreview) {
        projectScreenshotPreview.innerHTML = `
          <img src="${project.imageUrl}" style="max-width: 100%; max-height: 200px; border-radius: 8px; margin-bottom: 0.8rem;">
        `;
      }
    }
  } else {
    titleEl.textContent = "Add Project";
    indexInput.value = "";
    id("#projectModalForm").reset();
    id("#projectVisible").checked = true; // Default new projects to visible
  }
  modal.classList.add("active");
  id("#projectTitle").focus();
}

function closeProjectModal() {
  id("#projectModal").classList.remove("active");
  id("#projectModalForm").reset();
}

// Experience Modal Functions
function openExperienceModal(index = null) {
  const modal = id("#experienceModal");
  const titleEl = id("#experienceModalTitle");
  const indexInput = id("#experienceIndex");

  if (index !== null) {
    titleEl.textContent = "Edit Experience";
    indexInput.value = index;
    const exp = currentPortfolio.experience[index];
    console.log(`[Open Modal] Experience data:`, exp); // DEBUG
    id("#expTitle").value = exp.title || "";
    id("#expOrg").value = exp.org || "";
    id("#expPeriod").value = exp.period || "";
    id("#expDetails").value = exp.details || "";
    id("#expWorkUrl").value = exp.workUrl || "";
    console.log(`[Open Modal] Set workUrl input to: "${exp.workUrl}" (display value: "${id("#expWorkUrl").value}")`); // DEBUG
    id("#expVisible").checked = exp.visible !== false; // Default to true for backward compatibility
    console.log(`[Open Modal] Set visible checkbox to: ${exp.visible !== false}`); // DEBUG
  } else {
    titleEl.textContent = "Add Experience";
    indexInput.value = "";
    id("#experienceModalForm").reset();
    id("#expVisible").checked = true; // Default new entries to visible
  }
  modal.classList.add("active");
  id("#expTitle").focus();
}

function closeExperienceModal() {
  id("#experienceModal").classList.remove("active");
  id("#experienceModalForm").reset();
}

// Certification Modal Functions
function openCertificationModal(index = null) {
  const modal = id("#certificationModal");
  const titleEl = id("#certificationModalTitle");
  const indexInput = id("#certIndex");
  const certInput = id("#certInput");
  const certImageUrl = id("#certImageUrl");
  const certLink = id("#certLink");
  const certImageFile = id("#certImageFile");
  const certImagePreview = id("#certImagePreview");

  // Clear file input and preview
  if (certImageFile) certImageFile.value = "";
  if (certImagePreview) certImagePreview.innerHTML = "";

  if (index !== null) {
    titleEl.textContent = "Edit Certification";
    indexInput.value = index;
    const cert = currentPortfolio.certifications[index];
    if (typeof cert === "object") {
      certInput.value = cert.name || "";
      certImageUrl.value = cert.imageUrl || "";
      certLink.value = cert.link || "";
      // Show preview if image is base64
      if (cert.imageUrl && cert.imageUrl.startsWith("data:")) {
        if (certImagePreview) {
          certImagePreview.innerHTML = `
            <img src="${cert.imageUrl}" style="max-width: 200px; max-height: 150px; border-radius: 8px; margin-bottom: 0.8rem;">
          `;
        }
      }
    } else {
      certInput.value = cert || "";
      certImageUrl.value = "";
      certLink.value = "";
    }
  } else {
    titleEl.textContent = "Add Certification";
    indexInput.value = "";
    certInput.value = "";
    certImageUrl.value = "";
    certLink.value = "";
  }
  modal.classList.add("active");
  certInput.focus();
}

function closeCertificationModal() {
  id("#certificationModal").classList.remove("active");
  id("#certificationModalForm").reset();
}

// Hero Stat Modal Functions
function openHeroStatModal(index = null) {
  const modal = id("#heroStatModal");
  const titleEl = id("#heroStatModalTitle");
  const indexInput = id("#heroStatIndex");
  const statInput = id("#heroStatInput");

  if (index !== null) {
    titleEl.textContent = "Edit Hero Stat";
    indexInput.value = index;
    statInput.value = currentPortfolio.hero?.stats[index] || "";
  } else {
    titleEl.textContent = "Add Hero Stat";
    indexInput.value = "";
    statInput.value = "";
  }
  modal.classList.add("active");
  statInput.focus();
}

function closeHeroStatModal() {
  id("#heroStatModal").classList.remove("active");
  id("#heroStatModalForm").reset();
}

// Contact Modal Functions
function openContactModal() {
  const modal = id("#contactModal");
  const contact = currentPortfolio.contact || {};
  
  id("#contactEmailInput").value = contact.email || "";
  id("#contactPhoneInput").value = contact.phone || "";
  id("#contactLocationInput").value = contact.location || "";
  id("#contactLinkedinInput").value = contact.linkedin || "";
  id("#contactGithubInput").value = contact.github || "";
  
  modal.classList.add("active");
  id("#contactEmailInput").focus();
}

function closeContactModal() {
  id("#contactModal").classList.remove("active");
  id("#contactModalForm").reset();
}

// Education Modal Functions
function openEducationModal(index = null) {
  const modal = id("#educationModal");
  const titleEl = id("#educationModalTitle");
  const indexInput = id("#educationIndex");

  if (index !== null) {
    titleEl.textContent = "Edit Education";
    indexInput.value = index;
    const edu = currentPortfolio.education[index];
    id("#educationType").value = edu.type || "primary";
    id("#educationDegree").value = edu.degree || "";
    id("#educationCollege").value = edu.college || "";
    id("#educationDuration").value = edu.duration || "";
    id("#educationMarksType").value = edu.cgpaType || "cgpa";
    id("#educationMarksValue").value = edu.cgpaValue || "";
    id("#educationUrl").value = edu.url || "";
  } else {
    titleEl.textContent = "Add Education";
    indexInput.value = "";
    id("#educationModalForm").reset();
  }
  modal.classList.add("active");
  id("#educationType").focus();
}

function closeEducationModal() {
  id("#educationModal").classList.remove("active");
  id("#educationModalForm").reset();
}

// Add Contact Field Modal Functions
function openAddContactFieldModal() {
  const modal = id("#addContactFieldModal");
  id("#addContactFieldForm").reset();
  modal.classList.add("active");
  id("#contactFieldLabel").focus();
}

function closeAddContactFieldModal() {
  id("#addContactFieldModal").classList.remove("active");
  id("#addContactFieldForm").reset();
}

// Delete Modal Functions
function openDeleteModal(section, index) {
  deletePending = { section, index };
  id("#deleteModal").classList.add("active");
}

function closeDeleteModal() {
  id("#deleteModal").classList.remove("active");
  deletePending = { section: null, index: null };
}

async function confirmDelete() {
  const { section, index } = deletePending;
  if (!section || index === null) return;

  try {
    // Get item details before deleting for history
    let itemTitle = '';
    let itemData = null;
    
    if (section === 'certifications') {
      const cert = currentPortfolio.certifications[index];
      itemTitle = typeof cert === 'object' ? cert.name : cert;
      itemData = cert;
    } else if (section === 'projects') {
      const project = currentPortfolio.projects[index];
      itemTitle = project?.title || 'Project';
      itemData = project;
    } else if (section === 'experience') {
      const exp = currentPortfolio.experience[index];
      itemTitle = exp?.title || 'Experience';
      itemData = exp;
    }

    // Handle nested sections like "hero.stats"
    if (section.includes(".")) {
      const [mainSection, subSection] = section.split(".");
      if (mainSection === "hero" && subSection === "stats") {
        currentPortfolio.hero.stats.splice(index, 1);
        await createHistoryEntry('DELETE_STAT', 'hero', itemTitle || 'Hero Stat');
        savePortfolio();
        showSuccessNotification("Stat deleted!");
        closeDeleteModal();
        return;
      }
    }

    // Handle regular sections via API
    const response = await fetch(`${API_BASE}/portfolio/${section}/${index}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      // Log delete to history with file info if available
      let filesToCapture = [];
      if (itemData) {
        if (itemData.imageUrl && itemData.imageUrl.startsWith('data:')) {
          filesToCapture.push({
            name: `${itemTitle}-image.png`,
            type: 'image',
            mimeType: 'image/png',
            data: itemData.imageUrl,
            purpose: section === 'certifications' ? 'certificate' : 'screenshot',
            size: itemData.imageUrl.length
          });
        }
        if (itemData.screenshot && itemData.screenshot.startsWith('data:')) {
          filesToCapture.push({
            name: `${itemTitle}-screenshot.png`,
            type: 'image',
            mimeType: 'image/png',
            data: itemData.screenshot,
            purpose: 'screenshot',
            size: itemData.screenshot.length
          });
        }
      }

      const actionName = `DELETE_${section.toUpperCase().replace('IFICATIONS', '')}`;
      await createHistoryEntry(actionName, section, itemTitle, filesToCapture);

      showSuccessNotification(`Item deleted from ${section}!`);
      loadPortfolioData();
      closeDeleteModal();
    } else {
      alert("Failed to delete item");
    }
  } catch (err) {
    console.error("Error deleting item:", err);
    alert("Error deleting item");
  }
}

// Remove contact field function
function removeContactField(index) {
  if (!confirm("Delete this contact field?")) return;
  
  if (currentPortfolio.contact && Array.isArray(currentPortfolio.contact)) {
    currentPortfolio.contact.splice(index, 1);
    savePortfolio();
  }
}

// Modal Form Submissions
function setupModalForms() {
  // Skill Modal
  id("#skillModalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = id("#skillIndex").value;
    const skillName = id("#skillInput").value.trim();
    const skillUrl = id("#skillUrl").value.trim();

    if (!skillName) {
      alert("Please enter a skill name");
      return;
    }

    // Create skill object if URL is provided, otherwise keep as string for backward compatibility
    const skill = skillUrl ? { name: skillName, url: skillUrl } : skillName;

    const isNewEntry = index === "" || index === null;
    if (!currentPortfolio.skills) {
      currentPortfolio.skills = [];
    }
    if (isNewEntry) {
      currentPortfolio.skills.push(skill);
      await createHistoryEntry('ADD_SKILL', 'skills', skillName);
    } else {
      currentPortfolio.skills[parseInt(index)] = skill;
      await createHistoryEntry('EDIT_SKILL', 'skills', skillName);
    }

    savePortfolio();
    closeSkillModal();
  });

  // Project Modal
  id("#projectModalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = id("#projectIndex").value;
    const project = {
      title: id("#projectTitle").value.trim(),
      summary: id("#projectSummary").value.trim(),
      tech: id("#projectTech").value.split(",").map(t => t.trim()),
      live: id("#projectLive").value.trim(),
      github: id("#projectGithub").value.trim(),
      visible: id("#projectVisible").checked,
      imageUrl: "" // Will be filled if file uploaded
    };

    if (!project.title || !project.summary) {
      alert("Please fill in required fields");
      return;
    }

    // Handle file upload if present
    const fileInput = id("#projectScreenshot");
    let fileData = null;
    if (fileInput && fileInput.files.length > 0) {
      try {
        const file = fileInput.files[0];
        console.log('[Project] Original file size:', (file.size / 1024).toFixed(2), 'KB');
        
        // Compress image first
        const compressedBase64 = await compressImage(file, 800, 600, 0.7);
        project.imageUrl = compressedBase64; // Store as compressed base64
        
        fileData = {
          name: file.name,
          type: 'image',
          mimeType: 'image/jpeg',
          data: compressedBase64,
          purpose: 'screenshot',
          size: compressedBase64.length
        };
      } catch (err) {
        alert("Failed to upload screenshot: " + err.message);
        return;
      }
    }

    const isNew = index === "" || index === null;
    if (!currentPortfolio.projects) {
      currentPortfolio.projects = [];
    }
    if (isNew) {
      currentPortfolio.projects.push(project);
    } else {
      currentPortfolio.projects[parseInt(index)] = project;
    }

    // Create history entry
    await createHistoryEntry(
      isNew ? 'ADD_PROJECT' : 'EDIT_PROJECT',
      'projects',
      project.title,
      fileData ? [fileData] : []
    );

    savePortfolio();
    closeProjectModal();
  });

  // Experience Modal
  id("#experienceModalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = id("#experienceIndex").value;
    const checkboxElement = id("#expVisible");
    const isChecked = checkboxElement.checked;
    
    const experience = {
      title: id("#expTitle").value.trim(),
      org: id("#expOrg").value.trim(),
      period: id("#expPeriod").value.trim(),
      details: id("#expDetails").value.trim(),
      workUrl: id("#expWorkUrl").value.trim(),
      visible: isChecked
    };

    console.log("[Experience Form] Checkbox element:", checkboxElement); // DEBUG
    console.log("[Experience Form] Checkbox checked property:", isChecked); // DEBUG
    console.log("[Experience Form] Data being saved:", experience); // DEBUG
    console.log("[Experience Form] Visible value type:", typeof experience.visible, "Value:", experience.visible); // DEBUG
    console.log("[Experience Form] workUrl value:", experience.workUrl); // DEBUG

    if (!experience.title || !experience.org) {
      alert("Please fill in required fields");
      return;
    }

    const isNewEntry = index === "" || index === null;
    if (!currentPortfolio.experience) {
      currentPortfolio.experience = [];
    }
    if (isNewEntry) {
      currentPortfolio.experience.push(experience);
      await createHistoryEntry('ADD_EXPERIENCE', 'experience', `${experience.title} at ${experience.org}`);
    } else {
      currentPortfolio.experience[parseInt(index)] = experience;
      await createHistoryEntry('EDIT_EXPERIENCE', 'experience', `${experience.title} at ${experience.org}`);
    }

    console.log("[Experience Form] Portfolio experience after save:", currentPortfolio.experience); // DEBUG
    savePortfolio();
    closeExperienceModal();
  });

  // Certification Modal
  id("#certificationModalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = id("#certIndex").value;
    const cert = {
      name: id("#certInput").value.trim(),
      imageUrl: id("#certImageUrl").value.trim(),
      link: id("#certLink").value.trim()
    };

    if (!cert.name) {
      alert("Please enter a certification name");
      return;
    }

    // Handle file upload if present
    const fileInput = id("#certImageFile");
    let fileData = null;
    if (fileInput && fileInput.files.length > 0) {
      try {
        const file = fileInput.files[0];
        console.log('[Cert] Original file size:', (file.size / 1024).toFixed(2), 'KB');
        
        // Compress image first
        const compressedBase64 = await compressImage(file, 800, 600, 0.7);
        cert.imageUrl = compressedBase64; // Store as compressed base64
        
        fileData = {
          name: file.name,
          type: 'image',
          mimeType: 'image/jpeg',
          data: compressedBase64,
          purpose: 'certificate',
          size: compressedBase64.length
        };
      } catch (err) {
        alert("Failed to upload image: " + err.message);
        return;
      }
    }

    const isNew = index === "" || index === null;
    if (!currentPortfolio.certifications) {
      currentPortfolio.certifications = [];
    }
    if (isNew) {
      currentPortfolio.certifications.push(cert);
    } else {
      currentPortfolio.certifications[parseInt(index)] = cert;
    }

    // Create history entry
    await createHistoryEntry(
      isNew ? 'ADD_CERTIFICATION' : 'EDIT_CERTIFICATION',
      'certifications',
      cert.name,
      fileData ? [fileData] : []
    );

    savePortfolio();
    closeCertificationModal();
  });

  // Hero Stat Modal
  id("#heroStatModalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const index = id("#heroStatIndex").value;
    const stat = id("#heroStatInput").value.trim();

    if (!stat) {
      alert("Please enter a stat");
      return;
    }

    if (!currentPortfolio.hero) {
      currentPortfolio.hero = {};
    }
    if (!currentPortfolio.hero.stats) {
      currentPortfolio.hero.stats = [];
    }

    if (index === "" || index === null) {
      currentPortfolio.hero.stats.push(stat);
    } else {
      currentPortfolio.hero.stats[parseInt(index)] = stat;
    }

    savePortfolio();
    closeHeroStatModal();
  });

  // Education Modal
  id("#educationModalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const index = id("#educationIndex").value;
    const education = {
      type: id("#educationType").value,
      degree: id("#educationDegree").value.trim(),
      college: id("#educationCollege").value.trim(),
      duration: id("#educationDuration").value.trim(),
      cgpaType: id("#educationMarksType").value,
      cgpaValue: id("#educationMarksValue").value.trim(),
      url: id("#educationUrl").value.trim()
    };

    if (!education.degree || !education.college || !education.duration) {
      alert("Please fill in degree, college, and duration");
      return;
    }

    if (!currentPortfolio.education) {
      currentPortfolio.education = [];
    }

    const isNewEntry = index === "" || index === null;
    if (isNewEntry) {
      currentPortfolio.education.push(education);
      await createHistoryEntry('ADD_EDUCATION', 'education', `${education.degree} from ${education.college}`);
    } else {
      const oldEducation = currentPortfolio.education[parseInt(index)];
      currentPortfolio.education[parseInt(index)] = education;
      const changeDetails = [];
      if (oldEducation.degree !== education.degree) changeDetails.push(`degree: ${education.degree}`);
      if (oldEducation.college !== education.college) changeDetails.push(`college: ${education.college}`);
      if (oldEducation.duration !== education.duration) changeDetails.push(`duration: ${education.duration}`);
      await createHistoryEntry('EDIT_EDUCATION', 'education', `${education.degree} from ${education.college}`, []);
    }

    savePortfolio();
    closeEducationModal();
  });

  // Add Contact Field Modal
  id("#addContactFieldForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const label = id("#contactFieldLabel").value.trim();
    const value = id("#contactFieldValue").value.trim();
    const type = id("#contactFieldType").value;

    if (!label || !value) {
      alert("Please fill in all fields");
      return;
    }

    if (!currentPortfolio.contact) {
      currentPortfolio.contact = [];
    }

    currentPortfolio.contact.push({
      label,
      value,
      type
    });

    savePortfolio();
    closeAddContactFieldModal();
  });

  // Contact Modal
  id("#contactModalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldContact = JSON.stringify(currentPortfolio.contact);
    currentPortfolio.contact = [
      {
        label: "Email",
        value: id("#contactEmailInput").value.trim(),
        contactType: "email"
      },
      {
        label: "Phone",
        value: id("#contactPhoneInput").value.trim(),
        contactType: "phone"
      },
      {
        label: "Location",
        value: id("#contactLocationInput").value.trim(),
        contactType: "location"
      },
      {
        label: "LinkedIn",
        value: id("#contactLinkedinInput").value.trim(),
        contactType: "custom"
      },
      {
        label: "GitHub",
        value: id("#contactGithubInput").value.trim(),
        contactType: "custom"
      },
      {
        label: "X",
        value: id("#contactXInput") ? id("#contactXInput").value.trim() : "https://x.com/p_ranjan05",
        contactType: "custom"
      }
    ];
    
    if (oldContact !== JSON.stringify(currentPortfolio.contact)) {
      await createHistoryEntry('EDIT_CONTACT', 'contact', 'Contact Information Updated');
    }
    
    savePortfolio();
    closeContactModal();
  });

  // Close modals on overlay click
  all(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });
}

// ============== API CALLS ==============
async function loadPortfolioData() {
  try {
    const response = await fetch(`${API_BASE}/portfolio`);
    currentPortfolio = await response.json();
    
    console.log('[Load] Experience data from backend:', currentPortfolio.experience); // DEBUG
    
    // Ensure education is always an array for consistency
    if (!Array.isArray(currentPortfolio.education)) {
      if (currentPortfolio.education && typeof currentPortfolio.education === 'object') {
        // Convert old single object format to array
        currentPortfolio.education = [currentPortfolio.education];
      } else {
        currentPortfolio.education = [];
      }
    }

    // Ensure journey is always an array
    if (!Array.isArray(currentPortfolio.journey)) {
      currentPortfolio.journey = [];
    }

    // Ensure skillsProgression is always an array
    if (!Array.isArray(currentPortfolio.skillsProgression)) {
      currentPortfolio.skillsProgression = [];
    }
    
    populateForms();
    loadHistory();
  } catch (err) {
    console.error("Error loading portfolio:", err);
  }
}

function populateForms() {
  // Hero
  const heroName = id('input[name="hero.name"]');
  if (heroName) heroName.value = currentPortfolio.hero?.name || "";
  
  const heroRole = id('input[name="hero.role"]');
  if (heroRole) heroRole.value = currentPortfolio.hero?.role || "";
  
  const heroSummary = id('textarea[name="hero.summary"]');
  if (heroSummary) heroSummary.value = currentPortfolio.hero?.summary || "";
  
  const heroTag = id('input[name="hero.tag"]');
  if (heroTag) heroTag.value = currentPortfolio.hero?.tag || "";
  
  const heroResume = id('input[name="hero.resumeUrl"]');
  if (heroResume) heroResume.value = currentPortfolio.hero?.resumeUrl || "";

  const heroStatsContainer = id("#heroStats");
  if (heroStatsContainer) {
    heroStatsContainer.innerHTML = "";
    (currentPortfolio.hero?.stats || []).forEach((stat, index) => {
      const item = document.createElement("div");
      item.className = "item-display";
      item.innerHTML = `
        <h4>${stat}</h4>
        <div class="item-actions">
          <button type="button" class="btn-edit" onclick="openHeroStatModal(${index})">✏️ Edit</button>
          <button type="button" class="btn-delete" onclick="openDeleteModal('hero.stats', ${index})">🗑️ Delete</button>
        </div>
      `;
      heroStatsContainer.appendChild(item);
    });
  }

  // About
  const aboutField = id('textarea[name="about"]');
  if (aboutField) aboutField.value = currentPortfolio.about || "";

  // Skills
  const skillsContainer = id("#skillsList");
  skillsContainer.innerHTML = "";
  (currentPortfolio.skills || []).forEach((skill, index) => {
    const item = document.createElement("div");
    item.className = "item-display";
    // Handle both old format (string) and new format (object)
    const skillName = typeof skill === 'string' ? skill : (skill.name || 'Skill');
    const skillUrl = typeof skill === 'object' ? skill.url : null;
    const urlDisplay = skillUrl ? `<p><strong>URL:</strong> <a href="${skillUrl}" target="_blank" style="color: #667eea;">${skillUrl}</a></p>` : '<p><strong>URL:</strong> <span style="color: #999;">Not set</span></p>';
    item.innerHTML = `
      <h4>${skillName}</h4>
      ${urlDisplay}
      <div class="item-actions">
        <button type="button" class="btn-edit" onclick="openSkillModal(${index})">✏️ Edit</button>
        <button type="button" class="btn-delete" onclick="openDeleteModal('skills', ${index})">🗑️ Delete</button>
      </div>
    `;
    skillsContainer.appendChild(item);
  });

  // Projects
  const projectsContainer = id("#projectsList");
  projectsContainer.innerHTML = "";
  (currentPortfolio.projects || []).forEach((project, index) => {
    const item = document.createElement("div");
    item.className = "item-display";
    item.innerHTML = `
      <h4>${project.title}</h4>
      <p><strong>Summary:</strong> ${project.summary}</p>
      <p><strong>Tech:</strong> ${(project.tech || []).join(", ")}</p>
      <div class="item-actions">
        <button type="button" class="btn-edit" onclick="openProjectModal(${index})">✏️ Edit</button>
        <button type="button" class="btn-delete" onclick="openDeleteModal('projects', ${index})">🗑️ Delete</button>
      </div>
    `;
    projectsContainer.appendChild(item);
  });

  // Experience
  const expContainer = id("#experienceList");
  expContainer.innerHTML = "";
  (currentPortfolio.experience || []).forEach((exp, index) => {
    const item = document.createElement("div");
    item.className = "item-display";
    const visibilityBadge = exp.visible !== false ? '✅ Visible' : '🔒 Hidden';
    console.log(`[Admin Display] Experience "${exp.title}": workUrl="${exp.workUrl}", visible=${exp.visible}`); // DEBUG
    const urlDisplay = exp.workUrl ? `<p><strong>Work URL:</strong> <a href="${exp.workUrl}" target="_blank" style="color: #667eea;">${exp.workUrl}</a></p>` : '<p><strong>Work URL:</strong> <span style="color: #999;">Not set</span></p>';
    item.innerHTML = `
      <h4>${exp.title} @ ${exp.org}</h4>
      <p><strong>Duration:</strong> ${exp.period}</p>
      <p><strong>Details:</strong> ${exp.details}</p>
      ${urlDisplay}
      <p><strong>Status:</strong> <span style="padding: 4px 8px; border-radius: 4px; background: ${exp.visible !== false ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}; color: ${exp.visible !== false ? '#4caf50' : '#f44336'};"> ${visibilityBadge}</span></p>
      <div class="item-actions">
        <button type="button" class="btn-edit" onclick="openExperienceModal(${index})">✏️ Edit</button>
        <button type="button" class="btn-delete" onclick="openDeleteModal('experience', ${index})">🗑️ Delete</button>
      </div>
    `;
    expContainer.appendChild(item);
  });

  // Certifications
  const certsContainer = id("#certificationsList");
  certsContainer.innerHTML = "";
  (currentPortfolio.certifications || []).forEach((cert, index) => {
    const item = document.createElement("div");
    item.className = "item-display";
    const certName = typeof cert === "string" ? cert : (cert.name || cert);
    const certImage = typeof cert === "object" ? cert.imageUrl : null;
    const certLink = typeof cert === "object" ? cert.link : null;
    
    item.innerHTML = `
      <h4>${certName}</h4>
      ${certImage ? `<p><strong>Image:</strong> <img src="${certImage}" style="max-width: 100px; max-height: 100px; border-radius: 4px;"></p>` : ""}
      ${certLink ? `<p><strong>Link:</strong> <a href="${certLink}" target="_blank">${certLink}</a></p>` : ""}
      <div class="item-actions">
        <button type="button" class="btn-edit" onclick="openCertificationModal(${index})">✏️ Edit</button>
        <button type="button" class="btn-delete" onclick="openDeleteModal('certifications', ${index})">🗑️ Delete</button>
      </div>
    `;
    certsContainer.appendChild(item);
  });

  // Education
  const educationList = id("#educationList");
  if (educationList) {
    educationList.innerHTML = "";
    (currentPortfolio.education || []).forEach((edu, index) => {
      const item = document.createElement("div");
      item.className = "item-display";
      const marksLabel = edu.cgpaType === "percentage" ? "Percentage" : "CGPA";
      const marksDisplay = edu.cgpaValue ? `<p><strong>${marksLabel}:</strong> ${edu.cgpaValue}</p>` : '';
      item.innerHTML = `
        <h4>${edu.degree} • ${edu.college}</h4>
        <p><strong>Type:</strong> ${edu.type === "primary" ? "Primary/Higher Secondary" : "Higher Education"}</p>
        <p><strong>Duration:</strong> ${edu.duration}</p>
        ${marksDisplay}
        <div class="item-actions">
          <button type="button" class="btn-edit" onclick="openEducationModal(${index})">✏️ Edit</button>
          <button type="button" class="btn-delete" onclick="openDeleteModal('education', ${index})">🗑️ Delete</button>
        </div>
      `;
      educationList.appendChild(item);
    });
  }

  // Contact - Display with custom fields
  const contact = currentPortfolio.contact || [];
  const contactDisplay = id("#contactDisplay");
  if (Array.isArray(contact)) {
    let html = `<h4>Current Contact Information</h4>`;
    contact.forEach(c => {
      const icon = {email: "📧", phone: "📱", location: "📍", custom: "🔗"}[c.type] || "🔗";
      if (c.value) {
        html += `<p><strong>${icon} ${c.label}:</strong> ${c.value}</p>`;
      }
    });
    contactDisplay.innerHTML = html || "<p>No contact information set</p>";
  } else {
    // Handle old format
    const oldContact = contact;
    contactDisplay.innerHTML = `
      <h4>Current Contact Information</h4>
      <p><strong>📧 Email:</strong> ${oldContact.email || "Not set"}</p>
      <p><strong>📱 Phone:</strong> ${oldContact.phone || "Not set"}</p>
      <p><strong>📍 Location:</strong> ${oldContact.location || "Not set"}</p>
      <p><strong>💼 LinkedIn:</strong> ${oldContact.linkedin ? `<a href="${oldContact.linkedin}" target="_blank">${oldContact.linkedin}</a>` : "Not set"}</p>
      <p><strong>💻 GitHub:</strong> ${oldContact.github ? `<a href="${oldContact.github}" target="_blank">${oldContact.github}</a>` : "Not set"}</p>
    `;
  }

  // Contact Fields Management
  const contactFieldsList = id("#contactFieldsList");
  if (contactFieldsList && Array.isArray(contact)) {
    contactFieldsList.innerHTML = "";
    contact.forEach((field, index) => {
      const item = document.createElement("div");
      item.className = "item-display";
      item.innerHTML = `
        <h4>${field.label}</h4>
        <p><strong>Value:</strong> ${field.value}</p>
        <div class="item-actions">
          <button type="button" class="btn-delete" onclick="removeContactField(${index})">🗑️ Remove</button>
        </div>
      `;
      contactFieldsList.appendChild(item);
    });
  }

  // Journey Milestones
  const journeyList = id("#journeyList");
  if (journeyList) {
    journeyList.innerHTML = "";
    (currentPortfolio.journey || []).forEach((item, index) => {
      const elem = document.createElement("div");
      elem.className = "item-display";
      elem.innerHTML = `
        <h4>${item.icon} ${item.title} (${item.month} ${item.year})</h4>
        <p><strong>Category:</strong> ${item.category}</p>
        <p><strong>Description:</strong> ${item.description}</p>
        <div class="item-actions">
          <button type="button" class="btn-edit" onclick="openJourneyModal(${index})">✏️ Edit</button>
          <button type="button" class="btn-delete" onclick="openDeleteModal('journey', ${index})">🗑️ Delete</button>
        </div>
      `;
      journeyList.appendChild(elem);
    });
  }

  // Skills Progression
  const skillsProgList = id("#skillsProgressionList");
  if (skillsProgList) {
    skillsProgList.innerHTML = "";
    (currentPortfolio.skillsProgression || []).forEach((item, index) => {
      const elem = document.createElement("div");
      elem.className = "item-display";
      elem.innerHTML = `
        <h4>${item.skill} - ${item.category}</h4>
        <p><strong>Started:</strong> ${item.startDate} | <strong>Proficiency:</strong> ${item.proficiency}%</p>
        <div class="item-actions">
          <button type="button" class="btn-edit" onclick="openSkillProgressionModal(${index})">✏️ Edit</button>
          <button type="button" class="btn-delete" onclick="openDeleteModal('skillsProgression', ${index})">🗑️ Delete</button>
        </div>
      `;
      skillsProgList.appendChild(elem);
    });
  }
}

// ============== JOURNEY MODAL ==============
function openJourneyModal(index = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${index !== null ? "Edit Journey Milestone" : "Add Journey Milestone"}</h3>
      <form>
        <label>Title (what happened) <input type="text" id="journeyTitle" required /></label>
        <label>Month <input type="text" id="journeyMonth" placeholder="January, February, etc." required /></label>
        <label>Year <input type="number" id="journeyYear" required /></label>
        <label>Category <input type="text" id="journeyCategory" placeholder="milestone, learning, achievement, project" /></label>
        <label>Description <textarea id="journeyDescription" rows="3" required></textarea></label>
        <label>Details (optional) <textarea id="journeyDetails" rows="2"></textarea></label>
        <label>URL (optional) <input type="url" id="journeyUrl" placeholder="https://example.com or evidence link" /></label>
        <label>Icon (emoji) <input type="text" id="journeyIcon" placeholder="⭐" value="⭐" /></label>
        <label>Color (hex) <input type="color" id="journeyColor" value="#7af0d2" /></label>
        <div style="display: flex; gap: 1rem;">
          <button type="button" class="btn btn-primary" onclick="saveJourneyItem(${index})">Save</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  if (index !== null) {
    const item = currentPortfolio.journey[index];
    document.getElementById("journeyTitle").value = item.title;
    document.getElementById("journeyMonth").value = item.month;
    document.getElementById("journeyYear").value = item.year;
    document.getElementById("journeyCategory").value = item.category;
    document.getElementById("journeyDescription").value = item.description;
    document.getElementById("journeyDetails").value = item.details || "";
    document.getElementById("journeyUrl").value = item.url || "";
    document.getElementById("journeyIcon").value = item.icon || "⭐";
    document.getElementById("journeyColor").value = item.color || "#7af0d2";
  }
}

function saveJourneyItem(index) {
  if (!currentPortfolio.journey) currentPortfolio.journey = [];

  const item = {
    title: document.getElementById("journeyTitle").value,
    month: document.getElementById("journeyMonth").value,
    year: parseInt(document.getElementById("journeyYear").value),
    category: document.getElementById("journeyCategory").value,
    description: document.getElementById("journeyDescription").value,
    details: document.getElementById("journeyDetails").value,
    url: document.getElementById("journeyUrl").value,
    icon: document.getElementById("journeyIcon").value,
    color: document.getElementById("journeyColor").value
  };

  if (index !== null) {
    currentPortfolio.journey[index] = item;
  } else {
    currentPortfolio.journey.push(item);
  }

  savePortfolio();
  closeModal();
}

// ============== SKILLS PROGRESSION MODAL ==============
function openSkillProgressionModal(index = null) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${index !== null ? "Edit Skill Progression" : "Add Skill Progression"}</h3>
      <form>
        <label>Skill Name <input type="text" id="skillProgName" required /></label>
        <label>Category <input type="text" id="skillProgCategory" placeholder="frontend, backend, ai/ml, tools, etc." /></label>
        <label>Start Date (YYYY-MM) <input type="text" id="skillProgStartDate" placeholder="2023-01" required /></label>
        <label>Proficiency Level (0-100) <input type="range" id="skillProgProficiency" min="0" max="100" value="50" oninput="document.getElementById('profValue').textContent = this.value + '%'" /></label>
        <p style="text-align: center; color: var(--accent);"><strong>Proficiency: <span id="profValue">50%</span></strong></p>
        <div style="display: flex; gap: 1rem;">
          <button type="button" class="btn btn-primary" onclick="saveSkillProgressionItem(${index})">Save</button>
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  if (index !== null) {
    const item = currentPortfolio.skillsProgression[index];
    document.getElementById("skillProgName").value = item.skill;
    document.getElementById("skillProgCategory").value = item.category;
    document.getElementById("skillProgStartDate").value = item.startDate;
    document.getElementById("skillProgProficiency").value = item.proficiency;
    document.getElementById("profValue").textContent = item.proficiency + "%";
  }
}

function saveSkillProgressionItem(index) {
  if (!currentPortfolio.skillsProgression) currentPortfolio.skillsProgression = [];

  const item = {
    skill: document.getElementById("skillProgName").value,
    category: document.getElementById("skillProgCategory").value,
    startDate: document.getElementById("skillProgStartDate").value,
    proficiency: parseInt(document.getElementById("skillProgProficiency").value)
  };

  if (index !== null) {
    currentPortfolio.skillsProgression[index] = item;
  } else {
    currentPortfolio.skillsProgression.push(item);
  }

  savePortfolio();
  closeModal();
}

async function savePortfolio() {
  if (!token) {
    alert("Session expired. Please login again.");
    showLoginPage();
    return;
  }

  try {
    console.log("[Save] Sending portfolio data to /portfolio/update:", currentPortfolio);
    console.log("[Save] Experience array being sent:", JSON.stringify(currentPortfolio.experience, null, 2)); // DEBUG
    
    const response = await fetch(`${API_BASE}/portfolio/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(currentPortfolio),
      credentials: "include"
    });

    const data = await response.json();
    console.log("[Save] Response:", data, "Status:", response.status);
    console.log("[Save] Experience data in response:", data.experience); // DEBUG

    if (response.ok) {
      showSuccessNotification("✅ Portfolio saved! Main page will refresh in 3 seconds...");
      loadHistory();
      
      // Force refresh of main page by reloading parent window if available
      setTimeout(() => {
        console.log("[Save] Auto-refreshing main page...");
        if (window.opener) {
          window.opener.location.reload();
        }
        // Also try reloading via localStorage trigger for same-domain pages
        localStorage.setItem("portfolioUpdated", new Date().getTime());
      }, 3000);
    } else {
      console.error("[Save] Error response:", data);
      alert("❌ Error: " + (data.error || "Failed to save"));
    }
  } catch (err) {
    console.error("[Save] Exception:", err);
    alert("❌ Error: " + err.message);
  }
}

// ============== HISTORY MANAGEMENT ==============
let allHistoryData = []; // Store all history for filtering
let selectedHistorySection = 'certifications'; // Track selected section filter (default to certifications)

function filterHistoryBySection(section) {
  console.log('Filtering history by section:', section);
  selectedHistorySection = section;
  
  // Update button styles
  const filterButtons = document.querySelectorAll('.history-filter-btn');
  filterButtons.forEach(btn => {
    if (btn.dataset.section === section) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Re-render history with filter - ONLY show selected section
  displayHistoryData(allHistoryData, section);
}

function displayHistoryData(changes, filterSection) {
  const historyContainer = id("#historyList");
  historyContainer.innerHTML = "";

  if (!changes || changes.length === 0) {
    historyContainer.innerHTML = "<p style='color: #999; padding: 20px;'>No history found</p>";
    return;
  }

  // Filter by the selected section ONLY
  const filteredChanges = changes.filter(change => change.section === filterSection);

  if (filteredChanges.length === 0) {
    historyContainer.innerHTML = `<p style='color: #999; padding: 20px;'>No changes in ${filterSection} section yet</p>`;
    return;
  }

  const sectionIcon = {
    'certifications': '🏆',
    'projects': '💼',
    'skills': '⚙️',
    'experience': '💼',
    'education': '🎓',
    'hero': '👤',
    'about': '📝',
    'contact': '📧',
    'messages': '💬'
  }[filterSection] || '📁';

  const sectionTitle = filterSection.toUpperCase().replace(/_/g, ' ');
  
  // Add section header with count
  const sectionHeader = document.createElement("div");
  sectionHeader.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 15px 20px;
    margin: 0 0 15px 0;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  sectionHeader.innerHTML = `
    <span style="font-weight: 600; font-size: 1.1rem;">${sectionIcon} ${sectionTitle}</span>
    <span style="background: rgba(255,255,255,0.2); padding: 5px 10px; border-radius: 4px; font-size: 0.85rem;">${filteredChanges.length} change${filteredChanges.length !== 1 ? 's' : ''}</span>
  `;
  historyContainer.appendChild(sectionHeader);

  // Add entries for this section
  filteredChanges.forEach((change, index) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.style.cssText = `
      margin: 10px 0;
      padding: 15px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(122, 240, 210, 0.2);
      border-radius: 6px;
      border-left: 3px solid #7af0d2;
    `;

    const time = new Date(change.timestamp).toLocaleString();
    const actionLabel = change.action.replace(/_/g, ' ');

    let filesHTML = '';
    if (change.attachedFiles && change.attachedFiles.length > 0) {
      filesHTML = `
        <div class="history-files" style="margin-top: 12px;">
          <p style="margin: 0.5rem 0; font-weight: 600; font-size: 0.9rem;">📎 Attached Files:</p>
          ${change.attachedFiles.map((file, idx) => `
            <div class="history-file-item" style="margin: 0.5rem 0; padding: 0.8rem; background: rgba(0,0,0,0.2); border-radius: 6px; border-left: 3px solid #4fb589;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <p style="margin: 0; font-weight: 600;">📄 ${file.fileName}</p>
                  <small style="color: #b7c4e5;">Type: ${file.fileType} | Size: ${(file.fileSize / 1024).toFixed(2)} KB</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  ${getFileActionButtons(file.fileData, file.fileName, file.mimeType, change._id, idx)}
                </div>
              </div>
              ${getFilePreview(file.fileData, file.mimeType)}
            </div>
          `).join('')}
        </div>
      `;
    }

    item.innerHTML = `
      <div class="history-meta" style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <span style="background: rgba(122, 240, 210, 0.2); color: #7af0d2; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">${actionLabel}</span>
            <span style="margin-left: 0.5rem; font-weight: 600; font-size: 1rem;">${change.title || change.section}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-info" onclick="viewHistoryEntry('${change._id}')" style="font-size: 0.8rem; padding: 6px 10px; background: rgba(102, 126, 234, 0.6); border: none; border-radius: 4px; color: white; cursor: pointer; transition: all 0.2s;" title="View details">👁️ View</button>
            <button class="btn btn-warning" onclick="rollbackChange('${change._id}')" style="font-size: 0.8rem; padding: 6px 10px; background: rgba(255, 193, 7, 0.6); border: none; border-radius: 4px; color: white; cursor: pointer; transition: all 0.2s;" title="Rollback to this version">↩️ Rollback</button>
            <button class="btn btn-danger" onclick="deleteHistoryEntry('${change._id}', '${index}')" style="font-size: 0.8rem; padding: 6px 10px; background: rgba(220,53,69,0.6); border: none; border-radius: 4px; color: white; cursor: pointer; transition: all 0.2s;" title="Delete this entry">🗑️ Delete</button>
          </div>
        </div>
        <div style="margin-top: 8px; display: flex; gap: 15px; font-size: 0.85rem; color: #b7c4e5;">
          <span>⏰ ${time}</span>
          <span>👤 ${change.adminEmail || 'admin'}</span>
        </div>
      </div>
      ${filesHTML}
    `;
    historyContainer.appendChild(item);
  });
}

async function createHistoryEntry(action, section, title, files = []) {
  if (!token) return;

  try {
    const entry = {
      action,
      section,
      title,
      attachedFiles: files.map(file => ({
        fileName: file.name,
        fileType: file.type || 'unknown',
        mimeType: file.mimeType,
        fileData: file.data,  // base64
        purpose: file.purpose,
        fileSize: file.size,
        uploadedAt: new Date()
      }))
    };

    const response = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(entry)
    });

    if (response.ok) {
      console.log(`✓ History entry created: ${action} - ${title}`);
      loadHistory();  // Refresh history
    }
  } catch (err) {
    console.error('Error creating history entry:', err);
  }
}

async function loadHistory() {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const changes = await response.json();
    
    // Store all history data globally for filtering
    allHistoryData = changes || [];
    
    // Display with current filter
    displayHistoryData(allHistoryData, selectedHistorySection);
    
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

function getFileActionButtons(fileData, fileName, mimeType, historyId, fileIndex) {
  return `
    <button class="btn btn-small btn-primary" onclick="downloadHistoryFile('${fileData.substring(0, 100)}...', '${fileName}')" title="Download">📥</button>
    ${getMimeTypeIcon(mimeType)}
  `;
}

function getFilePreview(fileData, mimeType) {
  if (!fileData) return '';
  
  // Show image preview
  if (mimeType && mimeType.startsWith('image/')) {
    return `
      <div style="margin-top: 0.8rem; max-height: 200px; overflow: hidden; border-radius: 6px;">
        <img src="${fileData}" style="max-width: 100%; max-height: 200px; display: block; border-radius: 6px;">
      </div>
    `;
  }
  
  // Show PDF preview
  if (mimeType === 'application/pdf') {
    return `
      <div style="margin-top: 0.8rem; color: #b7c4e5; font-size: 0.85rem;">
        📄 PDF Document (Click download to view)
      </div>
    `;
  }
  
  return '';
}

function getMimeTypeIcon(mimeType) {
  if (!mimeType) return '';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  return '📎';
}

function downloadHistoryFile(fileData, fileName) {
  try {
    // Extract full base64 from file data
    const fullData = fileData.includes('...') ? 
      currentHistoryData.find(h => h.fileName === fileName)?.fileData : 
      fileData;

    const link = document.createElement('a');
    link.href = fullData || fileData;
    link.download = fileName;
    link.click();
  } catch (err) {
    console.error('Download error:', err);
    alert('Failed to download file');
  }
}

async function deleteHistoryEntry(entryId, index) {
  if (!confirm('Delete this history entry?')) return;

  try {
    console.log('Deleting history entry:', entryId);
    const response = await fetch(`${API_BASE}/history/${entryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Delete response status:', response.status);
    
    if (response.ok) {
      showSuccessNotification('✓ History entry deleted');
      loadHistory();
    } else {
      const error = await response.text();
      console.error('Delete failed:', error);
      alert('Failed to delete: ' + error);
    }
  } catch (err) {
    console.error('Error deleting history:', err);
    alert('Failed to delete: ' + err.message);
  }
}

// Store history data for downloads
let currentHistoryData = [];
// Load messages from contact form submissions
async function loadMessages() {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const messages = await response.json();
    const messagesContainer = id("#messagesList");
    messagesContainer.innerHTML = "";

    if (!messages || messages.length === 0) {
      messagesContainer.innerHTML = "<p style='color: #999;'>No messages yet</p>";
      return;
    }

    messages.forEach((msg) => {
      const item = document.createElement("div");
      item.className = `message-item ${msg.status === "new" ? "message-new" : ""}`;
      item.style.cssText = `
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        background-color: ${msg.status === "new" ? "#fff3cd" : "#f8f9fa"};
      `;

      const time = new Date(msg.createdAt).toLocaleString();
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div>
            <h4 style="margin: 0; color: #333;">${msg.name}</h4>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">📧 ${msg.email}</p>
            <p style="margin: 5px 0; color: #999; font-size: 12px;">⏰ ${time}</p>
          </div>
          <span style="background: ${msg.status === "new" ? "#ffc107" : "#6c757d"}; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">
            ${msg.status.toUpperCase()}
          </span>
        </div>
        <div style="background: white; padding: 10px; border-left: 3px solid #007bff; margin: 10px 0; border-radius: 4px;">
          <p style="margin: 0; color: #333; line-height: 1.6;">${msg.message}</p>
        </div>
        <div style="display: flex; gap: 10px;">
          ${msg.status === "new" ? `<button onclick="markMessageAsRead('${msg._id}')" class="btn btn-secondary" style="font-size: 12px; padding: 5px 10px;">✓ Mark as Read</button>` : ""}
          <button onclick="deleteMessage('${msg._id}')" class="btn btn-danger" style="font-size: 12px; padding: 5px 10px; background: #dc3545;">🗑️ Delete</button>
        </div>
      `;
      messagesContainer.appendChild(item);
    });
  } catch (err) {
    console.error("Error loading messages:", err);
    id("#messagesList").innerHTML = "<p style='color: red;'>Error loading messages</p>";
  }
}

// Refresh messages manually
function refreshMessages() {
  loadMessages();
}

// Delete a message
async function deleteMessage(messageId) {
  if (!token || !confirm("Delete this message?")) return;

  try {
    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      showSuccessNotification("Message deleted!");
      loadMessages();
    } else {
      alert("Failed to delete message");
    }
  } catch (err) {
    console.error("Error deleting message:", err);
    alert("Error deleting message");
  }
}

// Mark message as read
async function markMessageAsRead(messageId) {
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/messages/${messageId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: "read" })
    });

    if (response.ok) {
      showSuccessNotification("Marked as read!");
      loadMessages();
    } else {
      alert("Failed to update message");
    }
  } catch (err) {
    console.error("Error updating message:", err);
    alert("Error updating message");
  }
}

async function viewHistoryEntry(changeId) {
  try {
    // Find the entry in allHistoryData
    const entry = allHistoryData.find(e => e._id === changeId);
    
    if (!entry) {
      alert("History entry not found");
      return;
    }

    // Create modal to display entry details
    const modalId = 'history-modal-' + Date.now();
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      overflow-y: auto;
    `;

    const time = new Date(entry.timestamp).toLocaleString();
    const actionLabel = entry.action.replace(/_/g, ' ');

    let beforeHTML = '';
    let afterHTML = '';

    // Helper function to extract images from object
    function extractImages(obj) {
      const images = [];
      const findImages = (item) => {
        if (typeof item === 'object' && item !== null) {
          for (let key in item) {
            if (typeof item[key] === 'string' && item[key].startsWith('data:image')) {
              images.push({key, data: item[key]});
            } else if (typeof item[key] === 'object') {
              findImages(item[key]);
            }
          }
        }
      };
      findImages(obj);
      return images;
    }

    // Helper function to format JSON for display (hide base64 data)
    function formatDataForDisplay(obj) {
      if (!obj) return '';
      
      const cleaned = JSON.parse(JSON.stringify(obj));
      
      // Remove or truncate base64 data
      const removeBase64 = (item) => {
        if (typeof item === 'object' && item !== null) {
          for (let key in item) {
            if (typeof item[key] === 'string' && item[key].startsWith('data:image')) {
              item[key] = '[Image Displayed Below ↓]';
            } else if (typeof item[key] === 'object') {
              removeBase64(item[key]);
            }
          }
        }
      };
      
      removeBase64(cleaned);
      return JSON.stringify(cleaned, null, 2);
    }

    if (entry.before) {
      const beforeImages = extractImages(entry.before);
      const cleanedBefore = formatDataForDisplay(entry.before);
      const beforePreview = cleanedBefore.substring(0, 1200) + (cleanedBefore.length > 1200 ? '\n... (truncated)' : '');
      let imagesHTML = '';
      if (beforeImages.length > 0) {
        imagesHTML = `
          <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
            ${beforeImages.map((img, idx) => `
              <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; text-align: center;">
                <img src="${img.data}" style="max-width: 150px; max-height: 150px; border-radius: 6px; border: 2px solid #ff9800; cursor: pointer;" onclick="window.open('${img.data}', '_blank')" title="Click to view full size">
                <small style="color: #ff9800; font-size: 0.75rem; display: block; margin-top: 5px; word-break: break-word;">${img.key}</small>
                <button onclick="downloadImageFromHistory('${img.data}', '${img.key}-before.jpg')" style="background: rgba(255, 152, 0, 0.6); border: 1px solid #ff9800; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.75rem; margin-top: 5px; white-space: nowrap; font-weight: 600;">📥 Download</button>
              </div>
            `).join('')}
          </div>
        `;
      }
      beforeHTML = `
        <div style="margin-top: 15px; padding: 15px; background: rgba(255, 152, 0, 0.1); border-radius: 6px; border-left: 4px solid #ff9800;">
          <h4 style="color: #ff9800; margin: 0 0 10px 0;">📌 Before</h4>
          ${imagesHTML}
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; overflow-x: auto; border-left: 3px solid #ff9800; font-size: 0.75rem; line-height: 1.3; margin-top: 10px;">
${beforePreview}
          </pre>
        </div>
      `;
    }

    if (entry.after) {
      const afterImages = extractImages(entry.after);
      const cleanedAfter = formatDataForDisplay(entry.after);
      const afterPreview = cleanedAfter.substring(0, 1200) + (cleanedAfter.length > 1200 ? '\n... (truncated)' : '');
      let imagesHTML = '';
      if (afterImages.length > 0) {
        imagesHTML = `
          <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
            ${afterImages.map((img, idx) => `
              <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; text-align: center;">
                <img src="${img.data}" style="max-width: 150px; max-height: 150px; border-radius: 6px; border: 2px solid #4caf50; cursor: pointer;" onclick="window.open('${img.data}', '_blank')" title="Click to view full size">
                <small style="color: #4caf50; font-size: 0.75rem; display: block; margin-top: 5px; word-break: break-word;">${img.key}</small>
                <button onclick="downloadImageFromHistory('${img.data}', '${img.key}-after.jpg')" style="background: rgba(76, 175, 80, 0.6); border: 1px solid #4caf50; color: white; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.75rem; margin-top: 5px; white-space: nowrap; font-weight: 600;">📥 Download</button>
              </div>
            `).join('')}
          </div>
        `;
      }
      afterHTML = `
        <div style="margin-top: 15px; padding: 15px; background: rgba(76, 175, 80, 0.1); border-radius: 6px; border-left: 4px solid #4caf50;">
          <h4 style="color: #4caf50; margin: 0 0 10px 0;">✓ After</h4>
          ${imagesHTML}
          <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; overflow-x: auto; border-left: 3px solid #4caf50; font-size: 0.75rem; line-height: 1.3; margin-top: 10px;">
${afterPreview}
          </pre>
        </div>
      `;
    }

    // Profile Image Section
    let profileImageHTML = '';
    const beforeProfileImage = entry.before?.hero?.profileImage;
    const afterProfileImage = entry.after?.hero?.profileImage;
    
    if (beforeProfileImage || afterProfileImage) {
      let profileImages = '';
      
      if (beforeProfileImage) {
        profileImages += `
          <div style="background: rgba(0,0,0,0.2); padding: 12px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #ff9800; text-align: center;">
            <p style="margin: 5px 0; color: #ff9800; font-weight: 600;">📌 Before Profile Image</p>
            <img src="${beforeProfileImage}" style="max-width: 200px; max-height: 200px; border-radius: 50%; border: 3px solid #ff9800; cursor: pointer;" onclick="window.open('${beforeProfileImage}', '_blank')" title="Click to view full size">
            <div style="margin-top: 8px;">
              <button onclick="downloadImageFromHistory('${beforeProfileImage}', 'profile-image-before.jpg')" style="background: rgba(255, 152, 0, 0.6); border: 1px solid #ff9800; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">📥 Download</button>
            </div>
          </div>
        `;
      }
      
      if (afterProfileImage) {
        profileImages += `
          <div style="background: rgba(0,0,0,0.2); padding: 12px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #4caf50; text-align: center;">
            <p style="margin: 5px 0; color: #4caf50; font-weight: 600;">✓ After Profile Image</p>
            <img src="${afterProfileImage}" style="max-width: 200px; max-height: 200px; border-radius: 50%; border: 3px solid #4caf50; cursor: pointer;" onclick="window.open('${afterProfileImage}', '_blank')" title="Click to view full size">
            <div style="margin-top: 8px;">
              <button onclick="downloadImageFromHistory('${afterProfileImage}', 'profile-image-after.jpg')" style="background: rgba(76, 175, 80, 0.6); border: 1px solid #4caf50; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600;">📥 Download</button>
            </div>
          </div>
        `;
      }
      
      profileImageHTML = `
        <div style="margin-top: 15px; padding: 15px; background: rgba(233, 30, 99, 0.1); border-radius: 6px; border-left: 4px solid #e91e63;">
          <h4 style="color: #e91e63; margin: 0 0 10px 0;">👤 Profile Image</h4>
          ${profileImages}
        </div>
      `;
    }

    let filesHTML = '';
    if (entry.attachedFiles && entry.attachedFiles.length > 0) {
      filesHTML = `
        <div style="margin-top: 15px; padding: 15px; background: rgba(33, 150, 243, 0.1); border-radius: 6px; border-left: 4px solid #2196f3;">
          <h4 style="color: #2196f3; margin: 0 0 10px 0;">📎 Attached Files (${entry.attachedFiles.length})</h4>
          ${entry.attachedFiles.map((file, idx) => {
            const isImage = file.mimeType && file.mimeType.startsWith('image');
            const imagePreview = isImage && file.fileData ? `
              <div style="margin: 10px 0; text-align: center;">
                <img src="${file.fileData}" style="max-width: 200px; max-height: 200px; border-radius: 6px; border: 2px solid #2196f3; cursor: pointer;" onclick="window.open('${file.fileData}', '_blank')" title="Click to view full size">
              </div>
            ` : '';
            
            return `
              <div style="background: rgba(0,0,0,0.2); padding: 12px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #2196f3;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <p style="margin: 5px 0; font-weight: 600; color: #7af0d2;">📄 ${file.fileName}</p>
                    <small style="color: #b7c4e5;">Type: ${file.fileType} | Size: ${(file.fileSize / 1024).toFixed(2)} KB | MIME: ${file.mimeType}</small>
                  </div>
                  <button onclick="downloadFileFromHistory('${file.fileData}', '${file.fileName}')" style="background: rgba(33, 150, 243, 0.6); border: 1px solid #2196f3; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; white-space: nowrap;">📥 Download</button>
                </div>
                ${imagePreview}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        border-radius: 12px;
        padding: 30px;
        max-width: 900px;
        max-height: 85vh;
        overflow-y: auto;
        width: 90%;
        border: 2px solid rgba(102, 126, 234, 0.3);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #7af0d2;">📋 History Entry Details</h3>
          <button onclick="document.getElementById('${modalId}').remove()" style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.3); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 1rem;">✕</button>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; border-left: 3px solid #667eea;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px;">
            <div>
              <label style="color: #b7c4e5; font-size: 0.9rem;">Action</label>
              <p style="margin: 5px 0; color: #7af0d2; font-weight: 600;">${actionLabel}</p>
            </div>
            <div>
              <label style="color: #b7c4e5; font-size: 0.9rem;">Section</label>
              <p style="margin: 5px 0; color: #7af0d2; font-weight: 600;">${entry.section.toUpperCase()}</p>
            </div>
            <div>
              <label style="color: #b7c4e5; font-size: 0.9rem;">Time</label>
              <p style="margin: 5px 0; color: #b7c4e5;">⏰ ${time}</p>
            </div>
            <div>
              <label style="color: #b7c4e5; font-size: 0.9rem;">Admin</label>
              <p style="margin: 5px 0; color: #b7c4e5;">👤 ${entry.adminEmail || 'system'}</p>
            </div>
          </div>
          ${entry.title ? `<p style="margin: 5px 0; color: #b7c4e5;"><strong>Title:</strong> ${entry.title}</p>` : ''}
        </div>

        ${profileImageHTML}
        ${beforeHTML}
        ${afterHTML}
        ${filesHTML}

        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="document.getElementById('${modalId}').remove()" style="background: rgba(102, 126, 234, 0.6); border: 1px solid #667eea; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">Close</button>
          <button onclick="rollbackChange('${changeId}'); document.getElementById('${modalId}').remove();" style="background: rgba(255, 193, 7, 0.6); border: 1px solid #ffc107; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">↩️ Rollback</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

  } catch (err) {
    console.error("Error viewing history entry:", err);
    alert("Error viewing entry");
  }
}

async function rollbackChange(changeId) {
  if (!token || !confirm("Are you sure you want to rollback to this version?")) return;

  try {
    const response = await fetch(`${API_BASE}/history/rollback/${changeId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      showSuccessNotification("Rolled back successfully!");
      loadPortfolioData();
    } else {
      alert("Rollback failed.");
    }
  } catch (err) {
    alert("Rollback failed. Server unavailable.");
    console.error("Rollback error:", err);
  }
}

function downloadFileFromHistory(fileData, fileName) {
  try {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download file");
  }
}

// Download image from data URL
function downloadImageFromHistory(imageData, imageName = 'image.jpg') {
  try {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = imageName || 'portfolio-image-' + Date.now() + '.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Image download error:", err);
    alert("Failed to download image");
  }
}

function showSuccessNotification(message) {
  const notification = document.createElement("div");
  notification.className = "success-notification";
  notification.textContent = message;

  const container = id(".dashboard-main");
  container.insertBefore(notification, container.firstChild);

  setTimeout(() => notification.remove(), 3000);
}

// ============== INIT ==============
function initAdmin() {
  if (token) {
    showDashboard();
    loadPortfolioData();
  } else {
    showLoginPage();
  }

  setupLoginForm();
  setupTabs();
  setupForms();
  setupModalForms();
  setupAnalyticsRefresh();

  id("#logoutBtn").addEventListener("click", logout);
}

// ============== ANALYTICS DASHBOARD ==============
async function loadAnalytics() {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      console.error("❌ No auth token found");
      id("#topProjectsList").innerHTML = "<p style=\"color: red;\">⚠️ Authentication required</p>";
      return;
    }

    const response = await fetch(`${API_BASE}/analytics/dashboard`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Analytics response status:", response.status);
    
    if (!response.ok) {
      console.error(`❌ Analytics API error: ${response.status}`);
      if (response.status === 401) {
        id("#topProjectsList").innerHTML = "<p style=\"color: red;\">⚠️ Session expired. Please login again.</p>";
      } else if (response.status === 404) {
        id("#topProjectsList").innerHTML = "<p style=\"color: red;\">⚠️ Analytics endpoint not found. Check backend.</p>";
      }
      return;
    }
    
    const data = await response.json();
    console.log("Analytics data:", data);
    
    if (data.success && data.stats) {
      // Update stat cards
      id("#statTotalViews").textContent = data.stats.totalPageViews || 0;
      id("#statUniqueVisitors").textContent = data.stats.uniqueVisitors || 0;
      id("#statContactSubmissions").textContent = data.stats.contactSubmissions || 0;
      
      // Display top projects
      const projectsList = id("#topProjectsList");
      if (data.stats.topProjects && data.stats.topProjects.length > 0) {
        projectsList.innerHTML = data.stats.topProjects
          .map(p => `
            <div class="project-stat">
              <strong>${p._id || 'Unknown'}</strong>
              <span>${p.count} views</span>
            </div>
          `)
          .join("");
      } else {
        projectsList.innerHTML = "<p style=\"color: var(--text-soft);\">No project views yet. Check back after visitors explore your portfolio!</p>";
      }
      
      // Display daily stats as simple table
      const dailyChart = id("#dailyStatsChart");
      if (data.stats.dailyStats && data.stats.dailyStats.length > 0) {
        dailyChart.innerHTML = `
          <table style="width: 100%; color: var(--text-soft); border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <th style="text-align: left; padding: 0.75rem;">Date</th>
              <th style="text-align: right; padding: 0.75rem;">Visits</th>
            </tr>
            ${data.stats.dailyStats.map(d => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 0.75rem;">${d._id}</td>
                <td style="text-align: right; padding: 0.75rem; color: var(--accent); font-weight: 600;">${d.count}</td>
              </tr>
            `).join("")}
          </table>
        `;
      } else {
        dailyChart.innerHTML = "<p style=\"color: var(--text-soft);\">No daily stats available yet</p>";
      }
      
      console.log("✅ Analytics loaded successfully");
    } else {
      console.error("❌ Invalid analytics response format");
      id("#topProjectsList").innerHTML = "<p style=\"color: red;\">⚠️ Invalid response format</p>";
    }
  } catch (err) {
    console.error("❌ Error loading analytics:", err);
    id("#topProjectsList").innerHTML = `<p style="color: red;">⚠️ Error: ${err.message}</p>`;
  }
}

function setupAnalyticsRefresh() {
  const btn = id("#refreshAnalyticsBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      btn.textContent = "⏳ Loading...";
      loadAnalytics().then(() => {
        btn.textContent = "✅ Updated!";
        setTimeout(() => {
          btn.textContent = "🔄 Refresh Analytics";
        }, 2000);
      });
    });
  }
}

initAdmin();