// Use config.js API_BASE if available, otherwise set default
if (typeof API_BASE === 'undefined') {
  var API_BASE = (() => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    return 'https://my-portfolio-iram.onrender.com/api';
  })();
}
const id = (selector) => document.querySelector(selector);

// Image Viewer Modal Functions
function openImageModal(imageSrc) {
  const modal = id("#imageModal");
  const img = id("#modalImage");
  if (modal && img) {
    img.src = imageSrc;
    modal.style.display = "flex";
    // Track image view
    trackEvent("image_view");
  }
}

// ============== ANALYTICS TRACKING ==============
function trackEvent(eventType, details = {}) {
  try {
    navigator.sendBeacon(`${API_BASE}/analytics/track`, 
      JSON.stringify({
        type: eventType,
        ...details
      })
    );
  } catch (err) {
    console.log("Analytics tracking skipped");
  }
}

function closeImageModal() {
  const modal = id("#imageModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Close modal when clicking outside the image
document.addEventListener("DOMContentLoaded", () => {
  const modal = id("#imageModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeImageModal();
      }
    });
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeImageModal();
  }
  
  // Open admin panel with Ctrl+Alt+A (or Cmd+Alt+A on Mac)
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    window.location.href = 'admin.html';
  }
});

function renderHero(data) {
  // Error checking: if data is missing, show error message
  if (!data || !data.name) {
    console.error("❌ Hero data is missing or invalid:", data);
    id(".brand").textContent = "Portfolio";
    id("#heroName").textContent = "Portfolio Not Loaded";
    id("#heroRole").textContent = "Unable to fetch data from server";
    id("#heroSummary").textContent = "Check if the backend server is running on port 5000";
    id("#resumeLink").href = "#";
    return;
  }

  id("#heroTag").textContent = data.tag;
  id("#heroName").textContent = data.name;
  id("#heroRole").textContent = data.role;
  id("#heroSummary").textContent = data.summary;
  id("#resumeLink").href = data.resumeUrl;

  // Render profile image if available
  const profileImageContainer = id("#heroProfileImage");
  if (data.profileImage && data.profileImage.startsWith("data:")) {
    profileImageContainer.innerHTML = `<img src="${data.profileImage}" alt="${data.name}">`;
  } else {
    profileImageContainer.innerHTML = '';
  }

  const statsContainer = id("#heroStats");
  statsContainer.innerHTML = (data.stats || [])
    .map((item) => `<span class="stat">${item}</span>`)
    .join("");
}

function renderAbout(aboutText) {
  id("#aboutText").textContent = aboutText;
}

function renderSkills(skills) {
  id("#skillsChips").innerHTML = (skills || [])
    .map((skill) => {
      // Handle both old format (string) and new format (object with URL)
      if (typeof skill === 'string') {
        return `<span class="chip">${skill}</span>`;
      } else if (typeof skill === 'object' && skill.url) {
        return `<a href="${skill.url}" target="_blank" rel="noreferrer" class="chip" style="text-decoration: none; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(122, 240, 210, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">${skill.name} 🔗</a>`;
      } else {
        return `<span class="chip">${skill.name || skill}</span>`;
      }
    })
    .join("");
}

// ============== VIEW ALL STATE ==============
let showAllProjects = false;
let showAllExperience = false;
let showAllCertifications = false;
let currentPortfolioData = {}; // Store portfolio data for toggle functions

function renderProjects(projects) {
  const visibleProjects = (projects || [])
    .filter(project => project.visible !== false); // Only show visible projects (default to visible for backward compatibility)
  
  // Show limited by default (1st 2 projects), or all if View All is toggled
  const projectsToShow = showAllProjects ? visibleProjects : visibleProjects.slice(0, 2);
  
  const projectHtml = projectsToShow
    .map(
      (project) => {
        const screenshotHtml = project.imageUrl ? `<img data-src="${project.imageUrl}" alt="${project.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: transform 0.2s; background: rgba(255,255,255,0.1);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="openImageModal(this.src);">` : '';
        const liveButton = project.live ? `<a class="btn btn-secondary" href="${project.live}" target="_blank" rel="noreferrer">📱 Live Demo</a>` : '';
        const githubButton = project.github ? `<a class="btn btn-secondary" href="${project.github}" target="_blank" rel="noreferrer">💻 GitHub</a>` : '';
        return `
      <article class="project">
        ${screenshotHtml}
        <h4>${project.title}</h4>
        <p>${project.summary}</p>
        <p><strong>Tech:</strong> ${(project.tech || []).join(", ")}</p>
        <div class="project-links">
          ${liveButton}
          ${githubButton}
        </div>
      </article>`;
      }
    )
    .join("");

  id("#projectGrid").innerHTML = projectHtml;
  
  // Show View All button only if there are more than 2 projects
  const viewAllBtn = id("#viewAllProjectsBtn");
  if (viewAllBtn) {
    viewAllBtn.style.display = visibleProjects.length > 2 ? "inline-block" : "none";
    viewAllBtn.textContent = showAllProjects ? "Show Less Projects" : `View All Projects (${visibleProjects.length})`;
  }
}

function toggleViewAllProjects() {
  showAllProjects = !showAllProjects;
  // Re-render projects
  const projectsSection = document.querySelector('#projects');
  if (projectsSection) {
    const projectGrid = id("#projectGrid");
    projectGrid.style.maxHeight = showAllProjects ? "none" : "450px";
  }
  // Trigger re-render of projects with new state
  const portfolioData = window.currentPortfolioData;
  if (portfolioData && portfolioData.projects) {
    renderProjects(portfolioData.projects);
  }
}

function renderExperience(experience) {
  console.log('[Experience] Raw data received:', JSON.stringify(experience, null, 2)); // DEBUG
  
  if (!experience || experience.length === 0) {
    console.log('[Experience] No experience data');
    id("#experienceTimeline").innerHTML = "<p>No experience yet</p>";
    return;
  }

  // Show limited by default (1st 2 experiences), or all if View All is toggled
  const experienceToShow = showAllExperience ? experience : experience.slice(0, 2);

  id("#experienceTimeline").innerHTML = experienceToShow
    .map(
      (item) => {
        console.log(`[Experience Render] Title: "${item.title}", workUrl: "${item.workUrl}", visible: ${item.visible}`); // DEBUG
        
        // Only show button if visible=true AND workUrl exists
        const hasUrl = item.workUrl && item.workUrl.trim();
        const isVisible = item.visible !== false; // default to true for backward compatibility
        const shouldShowButton = isVisible && hasUrl;
        
        const workButton = shouldShowButton
          ? `<a href="${item.workUrl}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 10px 18px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 12px; transition: all 0.3s; border: 1px solid rgba(102, 126, 234, 0.5); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';">🔗 View Work</a>`
          : '';
        
        return `
      <article class="timeline-item">
        <h4>${item.title}</h4>
        <p><strong>${item.org}</strong> | ${item.period}</p>
        <p>${item.details}</p>
        ${workButton}
      </article>`;
      }
    )
    .join("");
  
  // Show View All button only if there are more than 2 experiences
  const viewAllBtn = id("#viewAllExperienceBtn");
  if (viewAllBtn) {
    viewAllBtn.style.display = experience.length > 2 ? "inline-block" : "none";
    viewAllBtn.textContent = showAllExperience ? "Show Less Experience" : `View All Experience (${experience.length})`;
  }
}

function toggleViewAllExperience() {
  showAllExperience = !showAllExperience;
  // Trigger re-render of experience with new state
  const portfolioData = window.currentPortfolioData;
  if (portfolioData && portfolioData.experience) {
    renderExperience(portfolioData.experience);
  }
}

function renderCertifications(certifications) {
  const certList = id("#certList");
  if (!certList) return;
  
  if (!certifications || certifications.length === 0) {
    certList.innerHTML = "<li>No certifications yet</li>";
    return;
  }
  
  // Show limited by default (1st 2 certs), or all if View All is toggled
  const certsToShow = showAllCertifications ? certifications : certifications.slice(0, 2);
  
  certList.innerHTML = (certsToShow || [])
    .map((cert) => {
      // Handle both old format (string) and new format (object)
      if (typeof cert === 'string') {
        return `<li style="display: flex; align-items: center; justify-content: center; text-align: center; padding: 1rem; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border-left: 3px solid #667eea; min-height: 100px;">${cert}</li>`;
      } else if (typeof cert === 'object') {
        const certName = cert.name || 'Certificate';
        const certLink = cert.link || '#';
        const certImage = cert.imageUrl ? `<img data-src="${cert.imageUrl}" alt="${certName}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: transform 0.2s; background: rgba(255,255,255,0.1);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="openImageModal(this.src);">` : '';
        
        // Always show View button, but links only if cert has a link
        const viewButtonContent = cert.link 
          ? `<a href="${cert.link}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-top: 8px; transition: all 0.3s; border: 1px solid rgba(102, 126, 234, 0.5); box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.3)';">🌐 View Certificate</a>`
          : `<span style="display: inline-block; padding: 8px 16px; background: rgba(102, 126, 234, 0.3); color: #aaa; border-radius: 6px; font-size: 0.85rem; margin-top: 8px; cursor: not-allowed; opacity: 0.6;">🌐 No Link</span>`;
        
        return `
          <li style="display: flex; flex-direction: column; justify-content: space-between;">
            ${certImage}
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <strong style="font-size: 0.95rem; display: block; margin-bottom: 8px; line-height: 1.3;">${certName}</strong>
              ${viewButtonContent}
            </div>
          </li>
        `;
      }
      return `<li style="display: flex; align-items: center; justify-content: center; text-align: center; padding: 1rem; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border-left: 3px solid #667eea; min-height: 100px;">${cert}</li>`;
    })
    .join("");
  
  // Show View All button only if there are more than 2 certifications
  const viewAllBtn = id("#viewAllCertsBtn");
  if (viewAllBtn) {
    viewAllBtn.style.display = certifications.length > 2 ? "inline-block" : "none";
    viewAllBtn.textContent = showAllCertifications ? "Show Less Certifications" : `View All Certifications (${certifications.length})`;
  }
}

function toggleViewAllCertifications() {
  showAllCertifications = !showAllCertifications;
  // Trigger re-render of certifications with new state
  const portfolioData = window.currentPortfolioData;
  if (portfolioData && portfolioData.certifications) {
    renderCertifications(portfolioData.certifications);
  }
}

function renderEducation(education) {
  if (!education || education.length === 0) {
    console.warn("No education data provided");
    id("#educationCard").innerHTML = "<p>No education data available</p>";
    return;
  }
  
  const eduHtml = (education || [])
    .map(
      (edu) => {
        const urlButton = edu.url ? `<a href="${edu.url}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 6px 12px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 4px; font-size: 0.85rem; font-weight: 500; cursor: pointer; margin-top: 8px; transition: all 0.3s; border: 1px solid rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 15px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">🔗 Visit</a>` : '';
        return `
        <div style="margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h4 style="margin-bottom: 0.5rem;">${edu.degree || "N/A"}</h4>
          <p style="margin: 0.3rem 0;"><strong>${edu.college || "N/A"}</strong></p>
          <p style="margin: 0.3rem 0; color: var(--text-soft);">${edu.duration || "N/A"}</p>
          ${edu.cgpaValue ? `<p style="margin: 0.3rem 0; color: var(--text-soft);"><strong>${edu.cgpaType === 'percentage' ? 'Percentage' : 'CGPA'}:</strong> ${edu.cgpaValue}</p>` : ''}
          ${urlButton}
        </div>
      `;
      }
    )
    .join("");
    
  id("#educationCard").innerHTML = eduHtml;
}

// ============== JOURNEY/TIMELINE RENDERING ==============
function renderJourney(journey) {
  if (!journey || journey.length === 0) {
    console.warn("No journey data provided");
    id("#journeyTimeline").innerHTML = "";
    return;
  }

  // Sort journey by year and month
  const sortedJourney = [...journey].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months.indexOf(b.month) - months.indexOf(a.month);
  });

  const journeyHtml = sortedJourney
    .map((item, index) => {
      const urlButton = item.url ? `<a href="${item.url}" target="_blank" rel="noreferrer" style="display: inline-block; padding: 6px 12px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 4px; font-size: 0.85rem; font-weight: 500; cursor: pointer; margin-top: 8px; transition: all 0.3s; border: 1px solid rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 15px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">🔗 View Evidence</a>` : '';
      return `
      <div class="journey-item" style="animation-delay: ${index * 0.1}s;">
        <div class="journey-marker" style="background: ${item.color || 'var(--accent)'};"></div>
        <div class="journey-content">
          <div class="journey-header">
            <span class="journey-icon">${item.icon || '⭐'}</span>
            <h4 class="journey-title">${item.title}</h4>
            <span class="journey-date">${item.month} ${item.year}</span>
          </div>
          <p class="journey-category">${item.category || 'milestone'}</p>
          <p class="journey-description">${item.description || ''}</p>
          ${item.details ? `<p class="journey-details">${item.details}</p>` : ''}
          ${urlButton}
        </div>
      </div>
    `;
    })
    .join("");

  id("#journeyTimeline").innerHTML = `<div class="journey-timeline-container">${journeyHtml}</div>`;
}

function renderSkillsProgression(skillsProgression) {
  if (!skillsProgression || skillsProgression.length === 0) {
    id("#skillsProgression").innerHTML = "";
    return;
  }

  // Group skills by category
  const grouped = {};
  skillsProgression.forEach(skill => {
    const cat = skill.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  });

  let html = '<div class="skills-grid">';
  
  Object.entries(grouped).forEach(([category, skills]) => {
    html += `
      <div class="skill-category">
        <h4 style="color: var(--accent); margin-bottom: 1rem;">${category}</h4>
        <div class="skill-bars">
          ${skills.map(skill => `
            <div class="skill-bar-item">
              <div class="skill-name">${skill.skill}</div>
              <div class="skill-bar-container">
                <div class="skill-bar-fill" style="width: ${skill.proficiency}%; background: linear-gradient(90deg, var(--accent), var(--accent-2));"></div>
              </div>
              <div class="skill-percentage">${skill.proficiency}%</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  html += '</div>';
  id("#skillsProgression").innerHTML = html;
}

// Listen for updates from admin panel
window.addEventListener('storage', (e) => {
  if (e.key === 'portfolioUpdated') {
    console.log("[StorageSync] Portfolio updated from admin panel, reloading...");
    location.reload();
  }
});

// Auto-refresh portfolio every 30 seconds to catch admin changes
setInterval(() => {
  console.log("[AutoRefresh] Checking for updates...");
  fetch(`${API_BASE}/portfolio?t=${new Date().getTime()}`)
    .then(res => res.json())
    .then(data => {
      console.log("[AutoRefresh] Portfolio updated");
      renderHero(data.hero);
      renderSkills(data.skills);
      renderProjects(data.projects);
      renderExperience(data.experience);
      renderCertifications(data.certifications);
      renderEducation(data.education);
      
      const contact = data.contact || [];
      renderContact(contact);
    })
    .catch(err => console.log("[AutoRefresh] Error:", err));
}, 30000);

function renderContact(contact) {
  if (!contact) {
    console.warn("No contact data provided");
    return;
  }
  
  const contactList = id("#contactList");
  if (!contactList) {
    console.error("contactList element not found");
    return;
  }
  
  let html = "";
  let linkedinUrl = "";
  let githubUrl = "";
  let xUrl = "";
  
  // Handle array format
  if (Array.isArray(contact) && contact.length > 0) {
    contact.forEach(item => {
      if (!item || !item.value) return;
      
      const type = (item.contactType || item.type || '').toLowerCase();
      const label = (item.label || '').toLowerCase();
      const value = item.value.toLowerCase();
      
      // Regular contact items
      if (type === 'email') {
        html += `<li>📧 <strong>${item.label}:</strong> <a href="mailto:${item.value}">${item.value}</a></li>`;
      } else if (type === 'phone') {
        html += `<li>📱 <strong>${item.label}:</strong> <a href="tel:${item.value}">${item.value}</a></li>`;
      } else if (type === 'location') {
        html += `<li>📍 <strong>${item.label}:</strong> ${item.value}</li>`;
      }
      
      // Social URLs - extract separately
      if (value.includes('linkedin')) linkedinUrl = item.value;
      if (value.includes('github')) githubUrl = item.value;
      if (value.includes('x.com') || value.includes('twitter.com') || label === 'x' || label === 'twitter') xUrl = item.value;
    });
  } else if (contact && typeof contact === 'object') {
    // Handle object format
    if (contact.email) html += `<li>📧 <strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></li>`;
    if (contact.phone) html += `<li>📱 <strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></li>`;
    if (contact.location) html += `<li>📍 <strong>Location:</strong> ${contact.location}</li>`;
    
    linkedinUrl = contact.linkedin || "";
    githubUrl = contact.github || "";
    xUrl = contact.x || contact.twitter || "";
  }
  
  if (!html) {
    html = `<li>📧 <strong>Email:</strong> p5123ranjan@gmail.com</li>
            <li>📱 <strong>Phone:</strong> +91-9973305771</li>
            <li>📍 <strong>Location:</strong> Patna, Bihar, India</li>`;
    linkedinUrl = "https://www.linkedin.com/in/prem-ranjan-6b0277253/";
    githubUrl = "https://github.com/Ranjan05-coder";
    xUrl = "https://x.com/p_ranjan05";
  }
  
  // Add social icons at the bottom
  if (linkedinUrl || githubUrl || xUrl) {
    html += `<div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 1.5rem; align-items: center; justify-content: center; flex-wrap: wrap;">`;
    
    if (linkedinUrl) {
      html += `<a href="${linkedinUrl}" target="_blank" rel="noreferrer" title="LinkedIn" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: linear-gradient(135deg, #0a66c2, #0a5db8); border-radius: 50%; text-decoration: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(10, 102, 194, 0.3);" onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 6px 20px rgba(10, 102, 194, 0.5)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(10, 102, 194, 0.3)';">
        <span style="color: white; font-weight: bold; font-size: 1.3rem;">in</span>
      </a>`;
    }
    
    if (githubUrl) {
      html += `<a href="${githubUrl}" target="_blank" rel="noreferrer" title="GitHub" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: linear-gradient(135deg, #333, #000); border-radius: 50%; text-decoration: none; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);" onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 6px 20px rgba(255, 255, 255, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.5)';">
        <svg style="width: 28px; height: 28px; fill: white;" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
      </a>`;
    }
    
    if (xUrl) {
      html += `<a href="${xUrl}" target="_blank" rel="noreferrer" title="X" style="display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; background: linear-gradient(135deg, #000, #1a1a1a); border-radius: 50%; text-decoration: none; border: 2px solid rgba(255,255,255,0.3); transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);" onmouseover="this.style.transform='scale(1.15)'; this.style.boxShadow='0 6px 20px rgba(255, 255, 255, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.5)';">
        <svg style="width: 28px; height: 28px; fill: white;" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.627l-5.1-6.694-5.867 6.694h-3.31l7.732-8.835L.424 2.25h6.813l4.882 6.45L17.887 2.25zM17.478 20.221h1.822L6.369 3.897H4.432L17.478 20.221z"/></svg>
      </a>`;
    }
    
    html += `</div>`;
  }
  
  contactList.innerHTML = html || "<li>No contact information available</li>";
}

function setupFooter(name) {
  id("#footerText").textContent = `Copyright ${new Date().getFullYear()} ${name}. Built with focus and consistency.`;
}

function setupMobileMenu() {
  const toggle = id("#menuToggle");
  const nav = id("#mainNav");

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function setupActiveNavLinks() {
  const navLinks = document.querySelectorAll("#mainNav a");
  
  // Set active link on page load based on scroll position
  function updateActiveLink() {
    let current = "";
    
    navLinks.forEach((link) => {
      link.classList.remove("active");
      const sectionId = link.getAttribute("href").substring(1);
      const section = document.getElementById(sectionId);
      
      if (section) {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
          current = sectionId;
        }
      }
    });
    
    // Add active class to current section link
    if (current) {
      document.querySelector(`#mainNav a[href="#${current}"]`)?.classList.add("active");
    }
  }
  
  // Update on scroll
  window.addEventListener("scroll", updateActiveLink);
  
  // Update on page load
  updateActiveLink();
  
  // Smooth scroll for nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href.startsWith("#")) {
        e.preventDefault();
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}
function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

// ============== IMAGE LAZY LOADING ==============
function setupLazyLoading() {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.getAttribute("data-src");
        img.removeAttribute("data-src");
        img.classList.add("loaded");
        observer.unobserve(img);
      }
    });
  });

  // Observe all images with data-src attribute
  document.querySelectorAll("img[data-src]").forEach((img) => {
    imageObserver.observe(img);
  });
}

function setupScrollToTop() {
  const scrollBtn = id("#scrollToTop");
  if (!scrollBtn) return;

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

function setupContactForm(email) {
  const form = id("#contactForm");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    const name = formData.get("name");
    const visitorEmail = formData.get("email");
    const message = formData.get("message");

    console.log("[Contact Form] Submitting:", { name, visitorEmail, message });

    try {
      const response = await fetch(`${API_BASE}/portfolio/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: visitorEmail, message }),
        credentials: "include"
      });

      console.log("[Contact Form] Response status:", response.status);
      const data = await response.json();
      console.log("[Contact Form] Response:", data);

      if (response.ok) {
        alert("✅ Message sent successfully!\n\n📧 A confirmation email has been sent to: " + visitorEmail + "\n\n⚠️ Check your SPAM/JUNK folder if you don't see it in your inbox.");
        form.reset();
      } else {
        alert("❌ Failed: " + (data.error || data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("[Contact Form] ❌ Error:", err);
      alert("❌ Network error. Check browser console for details.");
    }
  });
}

// Fetch portfolio from backend API
async function loadPortfolio() {
  return new Promise((resolve) => {
    // Show loading skeleton
    const skeleton = id("#loadingSkeleton");
    if (skeleton) skeleton.style.display = "block";
    
    try {
      fetch(`${API_BASE}/portfolio?t=${new Date().getTime()}`)
        .then((response) => {
          if (!response.ok) {
            console.error(`❌ Backend error: HTTP ${response.status}`);
            throw new Error(`Backend returned ${response.status}`);
          }
          return response.json();
        })
        .then((portfolioData) => {
          // Hide loading skeleton
          if (skeleton) skeleton.style.display = "none";
          
          // Check if response contains an error
          if (portfolioData.error) {
            console.error("❌ Backend API Error:", portfolioData.error);
            console.log("📝 Error details:", portfolioData);
            
            // Show error state in UI
            id(".brand").textContent = "Portfolio";
            id("#heroName").textContent = "⚠️ Server Connection Error";
            id("#heroRole").textContent = "MongoDB timeout or backend issue";
            id("#heroSummary").textContent = `Error: ${portfolioData.error}\n\nMake sure:\n1. Backend server is running (npm start)\n2. MongoDB is connected and accessible`;
            id("#resumeLink").href = "#";
            
            resolve();
            return;
          }
          
          console.log("✅ Portfolio data loaded successfully:", portfolioData);
          
          // Store portfolio data globally for View All toggles
          window.currentPortfolioData = portfolioData;
          
          // Fallback to ensure contact always has data
          const contact = portfolioData.contact || {
            email: "p5123ranjan@gmail.com",
            phone: "9973305771",
            location: "Patna, Bihar",
            linkedin: "https://www.linkedin.com/in/prem-ranjan-6b0277253/",
            github: "https://github.com/Ranjan05-coder"
          };
          
          renderHero(portfolioData.hero);
          renderAbout(portfolioData.about);
          renderSkills(portfolioData.skills);
          renderProjects(portfolioData.projects);
          console.log("[Portfolio] Experience data from API:", JSON.stringify(portfolioData.experience, null, 2)); // DEBUG
          renderExperience(portfolioData.experience);
          renderJourney(portfolioData.journey);
          renderSkillsProgression(portfolioData.skillsProgression);
          renderCertifications(portfolioData.certifications);
          renderEducation(portfolioData.education);
          
          console.log("Contact data:", contact);
          renderContact(contact);
          
          if (portfolioData.hero && portfolioData.hero.name) {
            setupFooter(portfolioData.hero.name);
          } else {
            setupFooter("Portfolio");
          }

          setupMobileMenu();
          setupActiveNavLinks();
          setupReveal();
          setupLazyLoading();
          setupScrollToTop();
          setupContactForm(contact.email);
          resolve();
        })
        .catch((err) => {
          console.error("❌ API Error:", err);
          console.log("🔧 Troubleshooting: Check if backend is running at http://localhost:5000");
          
          // Show error state
          id(".brand").textContent = "Portfolio";
          id("#heroName").textContent = "⚠️ Backend Server Not Responding";
          id("#heroRole").textContent = `Unable to fetch data`;
          id("#heroSummary").textContent = `${err.message}\n\nFixing steps:\n1. Make sure backend is running\n2. Check MongoDB connection\n3. Refresh the page`;
          id("#resumeLink").href = "#";
          
          resolve();
        });
    } catch (err) {
      console.error("❌ Fatal Error loading portfolio:", err);
      resolve();
    }
  });
}

(function init() {
  trackEvent("page_view");
  loadPortfolio();
})();