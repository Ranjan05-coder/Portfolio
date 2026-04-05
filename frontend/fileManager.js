// File Manager Module
const FileManager = {
  apiBase: "http://localhost:5000/api/files",

  // Get auth token
  getAuthHeader() {
    const token = localStorage.getItem("adminToken");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  },

  // Initialize file manager
  init() {
    this.setupEventListeners();
    this.loadFiles();
    this.loadFileStats();
  },

  // Setup event listeners
  setupEventListeners() {
    const uploadForm = document.getElementById("fileUploadForm");
    const fileInput = document.getElementById("fileInput");
    const fileSection = document.getElementById("fileSection");
    const fileType = document.getElementById("fileType");
    const searchInput = document.getElementById("fileSearch");
    const filterSection = document.getElementById("filterSection");

    // File upload handling
    uploadForm?.addEventListener("submit", (e) => this.handleFileUpload(e));
    
    // File preview
    fileInput?.addEventListener("change", (e) => this.showFilePreview(e));
    
    // Drag and drop
    const fileInputWrapper = document.querySelector(".file-input-wrapper");
    if (fileInputWrapper) {
      fileInputWrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        fileInputWrapper.classList.add("drag-over");
      });

      fileInputWrapper.addEventListener("dragleave", () => {
        fileInputWrapper.classList.remove("drag-over");
      });

      fileInputWrapper.addEventListener("drop", (e) => {
        e.preventDefault();
        fileInputWrapper.classList.remove("drag-over");
        fileInput.files = e.dataTransfer.files;
        this.showFilePreview({ target: { files: e.dataTransfer.files } });
      });
    }

    // Search and filter
    searchInput?.addEventListener("input", () => this.filterFiles());
    filterSection?.addEventListener("change", () => this.filterFiles());
  },

  // Handle file upload
  async handleFileUpload(e) {
    e.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const fileSection = document.getElementById("fileSection");
    const fileType = document.getElementById("fileType");
    const file = fileInput.files[0];

    if (!file || !fileSection.value || !fileType.value) {
      alert("Please select file, section, and type");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];

        const response = await fetch(`${this.apiBase}/upload`, {
          method: "POST",
          headers: this.getAuthHeader(),
          body: JSON.stringify({
            filename: file.name,
            fileData: base64,
            fileType: fileType.value,
            section: fileSection.value
          })
        });

        if (!response.ok) throw new Error("Upload failed");

        const result = await response.json();
        console.log("File uploaded:", result);

        // Reset form
        e.target.reset();
        document.getElementById("filePreview").innerHTML = "";

        // Reload files
        await this.loadFiles();
        alert("File uploaded successfully!");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file: " + err.message);
    }
  },

  // Show file preview
  showFilePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById("filePreview");

    if (!file) {
      preview.innerHTML = "";
      return;
    }

    const fileExt = file.name.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif"].includes(fileExt);

    let previewHTML = `
      <div class="preview-item">
        <strong>${file.name}</strong> (${(file.size / 1024).toFixed(2)} KB)
    `;

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = document.createElement("img");
        img.src = evt.target.result;
        img.style.maxWidth = "200px";
        img.style.marginTop = "10px";
        preview.innerHTML += `<img src="${evt.target.result}" style="max-width: 200px; margin-top: 10px;">`;
      };
      reader.readAsDataURL(file);
    }

    previewHTML += "</div>";
    preview.innerHTML = previewHTML;
  },

  // Load files
  async loadFiles() {
    try {
      const response = await fetch(`${this.apiBase}/section/portfolio`, {
        headers: this.getAuthHeader()
      });
      if (!response.ok) throw new Error("Failed to load files");

      const files = await response.json();
      this.displayFiles(files);
    } catch (err) {
      console.error("Load files error:", err);
      document.getElementById("filesGrid").innerHTML =
        '<p class="error">Failed to load files</p>';
    }
  },

  // Display files
  displayFiles(files) {
    const grid = document.getElementById("filesGrid");

    if (!files || files.length === 0) {
      grid.innerHTML = "<p>No files uploaded yet.</p>";
      return;
    }

    grid.innerHTML = files
      .map(
        (file) => `
        <div class="file-card">
          <div class="file-icon">${this.getFileIcon(file.fileType)}</div>
          <div class="file-info">
            <strong>${file.originalName}</strong>
            <small>${(file.size / 1024).toFixed(2)} KB</small>
            <small>Section: ${file.section}</small>
            <small>Uploaded: ${new Date(file.uploadedAt).toLocaleDateString()}</small>
            <small>Downloads: ${file.downloads}</small>
          </div>
          <div class="file-actions">
            <a href="${this.apiBase}/download/${file._id}" class="btn btn-small btn-primary" download>
              📥 Download
            </a>
            <button onclick="FileManager.deleteFile('${file._id}')" class="btn btn-small btn-danger">
              🗑️ Delete
            </button>
            ${this.getPreviewButton(file)}
          </div>
        </div>
      `
      )
      .join("");
  },

  // Get file icon
  getFileIcon(fileType) {
    const icons = {
      image: "🖼️",
      pdf: "📄",
      document: "📃"
    };
    return icons[fileType] || "📋";
  },

  // Get preview button
  getPreviewButton(file) {
    if (file.fileType === "image" || file.fileType === "pdf") {
      return `
        <a href="${this.apiBase}/view/${file._id}" target="_blank" class="btn btn-small btn-secondary">
          👁️ Preview
        </a>
      `;
    }
    return "";
  },

  // Delete file
  async deleteFile(fileId) {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const response = await fetch(`${this.apiBase}/${fileId}`, {
        method: "DELETE",
        headers: this.getAuthHeader()
      });

      if (!response.ok) throw new Error("Delete failed");

      alert("File deleted successfully!");
      await this.loadFiles();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete file: " + err.message);
    }
  },

  // Filter files
  filterFiles() {
    const searchTerm = document
      .getElementById("fileSearch")
      ?.value.toLowerCase() || "";
    const filterSectionValue = document.getElementById("filterSection")?.value;

    const cards = document.querySelectorAll(".file-card");
    cards.forEach((card) => {
      const name = card
        .querySelector(".file-info strong")
        ?.textContent.toLowerCase() || "";
      const section = card.querySelector(".file-info small:nth-child(3)")?.textContent || "";

      const matchesSearch = name.includes(searchTerm);
      const matchesSection =
        !filterSectionValue || section.includes(filterSectionValue);

      card.style.display = matchesSearch && matchesSection ? "block" : "none";
    });
  },

  // Load file statistics
  async loadFileStats() {
    try {
      const response = await fetch(`${this.apiBase}/stats`, {
        headers: this.getAuthHeader()
      });
      if (!response.ok) throw new Error("Failed to load stats");

      const stats = await response.json();
      this.displayStats(stats);
    } catch (err) {
      console.error("Stats error:", err);
    }
  },

  // Display file statistics
  displayStats(stats) {
    const statsContent = document.getElementById("statsContent");

    if (!stats || stats.length === 0) {
      statsContent.innerHTML = "<p>No file statistics available.</p>";
      return;
    }

    const html = stats
      .map(
        (stat) => `
        <div class="stat-item">
          <span class="stat-label">${stat._id || "Unknown"}:</span>
          <span class="stat-value">${stat.count} files</span>
          <span class="stat-size">${(stat.totalSize / 1024 / 1024).toFixed(2)} MB</span>
          <span class="stat-downloads">${stat.totalDownloads} downloads</span>
        </div>
      `
      )
      .join("");

    statsContent.innerHTML = html;
  }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("files-tab")) {
    FileManager.init();
  }
});
