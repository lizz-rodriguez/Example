// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  currentStep: 1,
  totalSteps: 6, // 5 input steps + 1 results step
  inputMethod: "files",
  selectedLayout: "relational",
  selectedFiles: [],
  selectedDirectory: null,
  projectName: "",
  websiteType: "",
  databaseType: "mysql",
  includeImages: true,
  includeMetadata: true,
  generateAPI: false,
  autoRelations: true,
  encoding: "utf-8",
  tablePrefix: "",
  maxFileSize: 100,
  generatedSchema: null,
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initializeStepHeaders();
  bindDocumentationModal();
  bindNavigation();
  bindInputMethod();
  bindLayoutCards();
  bindFileUpload();
  bindDirectoryUpload();
  bindAdvancedToggle();
  bindResultsFullscreen();
  bindTabs();
  bindDownloads();
  window.addEventListener("resize", queueViewportFit);
  window.addEventListener("load", queueViewportFit);
  if (document.fonts?.ready) document.fonts.ready.then(queueViewportFit);
  renderStep(1);
});

function bindDocumentationModal() {
  const openButton = document.getElementById("documentationButton");
  const modal = document.getElementById("documentationModal");
  const closeButton = document.getElementById("documentationClose");
  const backdrop = document.getElementById("documentationBackdrop");

  if (!openButton || !modal || !closeButton || !backdrop) return;

  const openModal = () => {
    modal.classList.remove("hidden");
  };

  const closeModal = () => {
    modal.classList.add("hidden");
  };

  openButton.addEventListener("click", openModal);
  closeButton.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (modal.classList.contains("hidden")) return;
    closeModal();
  });
}

function initializeStepHeaders() {
  const stepperShell = document.getElementById("stepperShell");
  const stepperSlots = document.querySelectorAll(".step-header-stepper");

  if (!stepperShell || !stepperSlots.length) return;

  stepperSlots.forEach((slot) => {
    slot.innerHTML = stepperShell.innerHTML;
  });
}

let viewportFitFrame = 0;

function queueViewportFit() {
  cancelAnimationFrame(viewportFitFrame);
  viewportFitFrame = requestAnimationFrame(() => {
    viewportFitFrame = requestAnimationFrame(fitActiveStepToViewport);
  });
}

function fitActiveStepToViewport() {
  const stage = document.querySelector(".wizard-stage");
  const activeStep = document.querySelector(".wizard-step.active");

  if (!stage || !activeStep) return;

  if (activeStep.id === "step-6") {
    activeStep.style.setProperty("--step-scale", "1");
    return;
  }

  activeStep.style.setProperty("--step-scale", "1");

  const availableHeight = stage.clientHeight;
  const naturalHeight = activeStep.scrollHeight;

  if (!availableHeight || !naturalHeight) return;

  const scale = Math.min(1, availableHeight / naturalHeight);
  activeStep.style.setProperty("--step-scale", scale.toFixed(3));
}

// ─── Step navigation ──────────────────────────────────────────────────────────
function bindNavigation() {
  document.querySelectorAll(".step").forEach((stepEl) => {
    stepEl.addEventListener("click", () =>
      navigateToStep(parseInt(stepEl.dataset.step, 10)),
    );
    stepEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      navigateToStep(parseInt(stepEl.dataset.step, 10));
    });
  });

  document
    .getElementById("next-4")
    .addEventListener("click", () => tryAdvance(4));

  // Generate button
  document
    .getElementById("submitBtn")
    .addEventListener("click", handleGenerate);

  // Reset
  document.getElementById("resetBtn").addEventListener("click", handleReset);
}

function tryAdvance(fromStep) {
  if (!validateStep(fromStep)) return;
  collectStep(fromStep);
  goTo(fromStep + 1);
}

function navigateToStep(targetStep) {
  if (targetStep === state.currentStep) return;

  if (targetStep < state.currentStep) {
    goTo(targetStep);
    return;
  }

  for (let step = state.currentStep; step < targetStep; step += 1) {
    if (!validateStep(step)) return;
    collectStep(step);
  }

  goTo(targetStep);
}

function goTo(stepNumber) {
  const prev = state.currentStep;
  state.currentStep = stepNumber;

  // Direction for animation
  const dir = stepNumber > prev ? "forward" : "backward";
  animateTransition(prev, stepNumber, dir);
  renderStep(stepNumber);
}

function animateTransition(from, to, dir) {
  const fromEl = document.getElementById(`step-${from}`);
  const toEl = document.getElementById(`step-${to}`);

  // Remove active from old step with exit animation
  fromEl.classList.remove("active");
  fromEl.classList.add(dir === "forward" ? "exit-left" : "exit-right");

  // Prepare incoming step
  toEl.classList.remove("exit-left", "exit-right");
  toEl.classList.add(dir === "forward" ? "enter-right" : "enter-left");

  // Trigger reflow then animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toEl.classList.remove("enter-right", "enter-left");
      toEl.classList.add("active");
    });
  });

  // Clean up exit class after transition
  setTimeout(() => fromEl.classList.remove("exit-left", "exit-right"), 400);
}

function renderStep(stepNumber) {
  // Update stepper bubbles
  document.querySelectorAll(".step").forEach((el) => {
    const n = parseInt(el.dataset.step);
    el.classList.toggle("active", n === stepNumber);
    el.classList.toggle("completed", n < stepNumber);
  });

  // Update connectors
  document.querySelectorAll(".step-connector").forEach((el, i) => {
    el.classList.toggle("filled", i + 1 < stepNumber);
  });

  // Step-specific setup
  if (stepNumber === 3) setupUploadStep();
  if (stepNumber === 5) renderReview();
  queueViewportFit();
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(step) {
  if (step === 3) {
    if (state.inputMethod === "files" && state.selectedFiles.length === 0) {
      flashError("Please add at least one file before continuing.");
      return false;
    }
    if (state.inputMethod === "directory" && !state.selectedDirectory) {
      flashError("Please select a directory before continuing.");
      return false;
    }
  }
  if (step === 4) {
    const name = document.getElementById("projectName").value.trim();
    if (!name) {
      flashError("Please enter a project name.");
      document.getElementById("projectName").focus();
      return false;
    }
  }
  return true;
}

function flashError(msg) {
  let el = document.getElementById("wizard-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "wizard-error";
    el.className = "wizard-error";
    document.querySelector(".wizard-stage .container").prepend(el);
  }
  el.textContent = msg;
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 3000);
}

// ─── State collection ─────────────────────────────────────────────────────────
function collectStep(step) {
  if (step === 1) {
    state.inputMethod = document.querySelector(
      'input[name="inputMethod"]:checked',
    ).value;
  }
  if (step === 2) {
    state.selectedLayout = document.getElementById("selectedLayout").value;
  }
  if (step === 4) {
    state.projectName = document.getElementById("projectName").value.trim();
    state.websiteType = document.getElementById("websiteType").value;
    state.databaseType = document.getElementById("databaseType").value;
    state.includeImages = document.getElementById("includeImages").checked;
    state.includeMetadata = document.getElementById("includeMetadata").checked;
    state.generateAPI = document.getElementById("generateAPI").checked;
    state.autoRelations = document.getElementById("autoRelations").checked;
    state.encoding = document.getElementById("encoding").value;
    state.tablePrefix = document.getElementById("tablePrefix").value;
    state.maxFileSize = document.getElementById("maxFileSize").value;
  }
}

// ─── Input method ─────────────────────────────────────────────────────────────
function bindInputMethod() {
  document.querySelectorAll(".hero-radio").forEach((label) => {
    const input = label.querySelector('input[name="inputMethod"]');

    input.addEventListener("change", () => {
      state.inputMethod = input.value;
      if (state.currentStep === 3) setupUploadStep();
    });

    label.addEventListener("click", () => {
      requestAnimationFrame(() => {
        state.inputMethod = input.value;
        if (state.currentStep === 1) tryAdvance(1);
      });
    });
  });
}

function setupUploadStep() {
  const isFiles = state.inputMethod === "files";
  document
    .getElementById("fileUploadSection")
    .classList.toggle("hidden", !isFiles);
  document
    .getElementById("directorySection")
    .classList.toggle("hidden", isFiles);

  const title = document.getElementById("upload-step-title");
  const subtitle = document.getElementById("upload-step-subtitle");
  if (isFiles) {
    title.textContent = "Upload your files";
    subtitle.textContent =
      "Drop or browse for the source documents to analyse.";
  } else {
    title.textContent = "Select a directory";
    subtitle.textContent =
      "All supported files in the folder will be processed automatically.";
  }

  queueViewportFit();
}

// ─── Layout cards ─────────────────────────────────────────────────────────────
function bindLayoutCards() {
  document.querySelectorAll(".layout-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".layout-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      state.selectedLayout = card.dataset.layout;
      document.getElementById("selectedLayout").value = state.selectedLayout;

      if (state.currentStep === 2) {
        requestAnimationFrame(() => tryAdvance(2));
      }
    });
  });
}

// ─── File upload ──────────────────────────────────────────────────────────────
function bindFileUpload() {
  const fileInput = document.getElementById("fileInput");
  const uploadArea = document.getElementById("uploadArea");
  const sampleBox = document.getElementById("uploadSamples");

  fileInput.addEventListener("change", (e) =>
    addFiles(Array.from(e.target.files)),
  );
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
  });
  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
  });
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    addFiles(Array.from(e.dataTransfer.files));
  });

  sampleBox?.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-sample-type]");
    if (!btn) return;

    const type = btn.dataset.sampleType;
    if (!type) return;

    const sampleTypes =
      type === "all"
        ? ["json", "csv", "xml", "md", "txt", "doc", "docx", "pdf"]
        : [type];

    const files = sampleTypes.map(buildSampleFile).filter(Boolean);
    addFiles(files);
  });
}

function buildSampleFile(type) {
  const map = {
    json: {
      name: "sample-products.json",
      mime: "application/json",
      content: JSON.stringify(
        [
          {
            id: 1,
            name: "Ocean Lamp",
            category: "lighting",
            price: 49.99,
            in_stock: true,
          },
          {
            id: 2,
            name: "Coral Shelf",
            category: "storage",
            price: 89.0,
            in_stock: false,
          },
        ],
        null,
        2,
      ),
    },
    csv: {
      name: "sample-orders.csv",
      mime: "text/csv",
      content:
        "order_id,customer,total,status\n1001,Avery,120.50,paid\n1002,Riley,88.00,pending\n1003,Jordan,42.75,shipped\n",
    },
    xml: {
      name: "sample-catalog.xml",
      mime: "application/xml",
      content:
        '<catalog>\n  <item id="1">\n    <title>Wave Journal</title>\n    <author>Sam Lee</author>\n    <published>2026-07-20</published>\n  </item>\n  <item id="2">\n    <title>Sky Atlas</title>\n    <author>Jules Park</author>\n    <published>2026-08-01</published>\n  </item>\n</catalog>\n',
    },
    md: {
      name: "sample-notes.md",
      mime: "text/markdown",
      content:
        "# Product Notes\n\n## Launch Checklist\n- Validate schema\n- Review field naming\n- Export SQL and JSON\n\n## Owners\n- Data Team\n- API Team\n",
    },
    txt: {
      name: "sample-support.txt",
      mime: "text/plain",
      content:
        "Support ticket summary:\nCustomer asked for order history, preferred language, and retention policy fields.\nInclude timestamps and status flags for records.\n",
    },
    doc: {
      name: "sample-policy.doc",
      mime: "application/msword",
      content:
        "Sample DOC content: policy overview, revision history, and approval owners.",
    },
    docx: {
      name: "sample-brief.docx",
      mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      content:
        "Sample DOCX content: project brief with objectives, milestones, and budget sections.",
    },
    pdf: {
      name: "sample-report.pdf",
      mime: "application/pdf",
      content: "Sample PDF content: monthly reporting summary and KPI notes.",
    },
  };

  const sample = map[type];
  if (!sample) return null;

  return new File([sample.content], sample.name, {
    type: sample.mime,
    lastModified: Date.now(),
  });
}

function addFiles(files) {
  const valid = ["pdf", "doc", "docx", "txt", "json", "xml", "csv", "md"];
  files
    .filter((f) => valid.includes(f.name.split(".").pop().toLowerCase()))
    .forEach((f) => {
      if (
        !state.selectedFiles.some((x) => x.name === f.name && x.size === f.size)
      )
        state.selectedFiles.push(f);
    });
  renderFileList();

  if (state.currentStep === 3 && state.selectedFiles.length > 0) {
    requestAnimationFrame(() => tryAdvance(3));
  }
}

function renderFileList() {
  const list = document.getElementById("fileList");
  if (!state.selectedFiles.length) {
    list.innerHTML = "";
    queueViewportFit();
    return;
  }
  list.innerHTML = state.selectedFiles
    .map(
      (f, i) => `
        <div class="file-item">
            <div class="file-info">
                <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div class="file-details">
                    <div class="file-name">${f.name}</div>
                    <div class="file-size">${formatFileSize(f.size)}</div>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="removeFile(${i})">Remove</button>
        </div>
    `,
    )
    .join("");
  queueViewportFit();
}

function removeFile(index) {
  state.selectedFiles.splice(index, 1);
  renderFileList();
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024,
    sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ─── Directory upload ─────────────────────────────────────────────────────────
function bindDirectoryUpload() {
  const browseBtn = document.getElementById("browseBtn");
  const directoryInput = document.getElementById("directoryInput");

  browseBtn.addEventListener("click", () => directoryInput.click());
  directoryInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    state.selectedDirectory = files;
    const path = files[0].webkitRelativePath.split("/")[0];
    document.getElementById("directoryPath").value = path;
    document.getElementById("selectedPath").textContent = path;
    document.getElementById("fileCount").textContent = files.length;
    document.getElementById("directoryInfo").classList.remove("hidden");
    queueViewportFit();

    if (state.currentStep === 3) {
      requestAnimationFrame(() => tryAdvance(3));
    }
  });
}

// ─── Advanced toggle ──────────────────────────────────────────────────────────
function bindAdvancedToggle() {
  const slider = document.getElementById("configSlider");
  const openButton = document.getElementById("advancedToggle");
  const backButton = document.getElementById("advancedBack");

  openButton.addEventListener("click", () => {
    slider.classList.add("show-advanced");
    queueViewportFit();
  });

  backButton.addEventListener("click", () => {
    slider.classList.remove("show-advanced");
    queueViewportFit();
  });
}

function bindResultsFullscreen() {
  const toggle = document.getElementById("resultsFullscreenToggle");
  const toggleIcon = document.getElementById("resultsFullscreenIcon");
  const resultsBody = document.querySelector(".results-step-body");
  const resultsStep = document.getElementById("step-6");

  if (!toggle || !toggleIcon || !resultsBody || !resultsStep) return;

  toggle.addEventListener("click", () => {
    const isFullscreen = resultsBody.classList.toggle("is-fullscreen");
    resultsStep.classList.toggle("is-fullscreen-host", isFullscreen);
    toggleIcon.classList.add("fa-solid");
    toggleIcon.classList.remove("fa-regular");
    toggleIcon.classList.toggle("fa-expand", !isFullscreen);
    toggleIcon.classList.toggle("fa-compress", isFullscreen);
    toggle.setAttribute(
      "aria-label",
      isFullscreen ? "Exit full page mode" : "Enter full page mode",
    );
    toggle.setAttribute(
      "title",
      isFullscreen ? "Minimize full page" : "Full page",
    );
    queueViewportFit();
  });
}

// ─── Review panel ─────────────────────────────────────────────────────────────
function renderReview() {
  collectStep(4); // make sure step-4 values are captured
  const s = state;
  const fileInfo =
    s.inputMethod === "files"
      ? `${s.selectedFiles.length} file(s) selected`
      : `Directory: ${document.getElementById("directoryPath").value || "—"} (${s.selectedDirectory ? s.selectedDirectory.length : 0} files)`;

  const features = [
    s.includeImages && "Media tables",
    s.includeMetadata && "Audit fields",
    s.generateAPI && "REST API docs",
    s.autoRelations && "Auto-relations",
  ].filter(Boolean);

  document.getElementById("reviewSummary").innerHTML = `
        <div class="review-grid">
            <div class="review-item">
                <div class="review-item-label">Input</div>
                <div class="review-item-value">${s.inputMethod === "files" ? "File Upload" : "Directory"}</div>
                <div class="review-item-sub">${fileInfo}</div>
            </div>
            <div class="review-item">
                <div class="review-item-label">Template</div>
                <div class="review-item-value">${titleCase(s.selectedLayout)}</div>
            </div>
            <div class="review-item">
                <div class="review-item-label">Project</div>
                <div class="review-item-value">${s.projectName || "—"}</div>
                <div class="review-item-sub">${s.websiteType ? titleCase(s.websiteType) : ""}</div>
            </div>
            <div class="review-item">
                <div class="review-item-label">Database</div>
                <div class="review-item-value">${s.databaseType.toUpperCase()}</div>
            </div>
            <div class="review-item review-item-wide">
                <div class="review-item-label">Features</div>
                <div class="review-tags">${features.map((f) => `<span class="review-tag">${f}</span>`).join("")}</div>
            </div>
        </div>
    `;

  queueViewportFit();
}

function titleCase(str) {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Generate ─────────────────────────────────────────────────────────────────
async function handleGenerate() {
  const progressSection = document.getElementById("progressSection");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");

  progressSection.classList.remove("hidden");
  submitBtn.disabled = true;
  btnText.textContent = "Generating…";
  btnLoader.classList.remove("hidden");
  queueViewportFit();

  updateProgress(10, "Uploading files…");

  const formData = new FormData();
  formData.append("inputMethod", state.inputMethod);
  formData.append("selectedLayout", state.selectedLayout);
  formData.append("websiteType", state.websiteType);
  formData.append("projectName", state.projectName);
  formData.append("databaseType", state.databaseType);
  formData.append("includeImages", state.includeImages);
  formData.append("includeMetadata", state.includeMetadata);
  formData.append("generateAPI", state.generateAPI);
  formData.append("autoRelations", state.autoRelations);
  formData.append("encoding", state.encoding);
  formData.append("tablePrefix", state.tablePrefix);
  formData.append("maxFileSize", state.maxFileSize);

  const files =
    state.inputMethod === "files"
      ? state.selectedFiles
      : state.selectedDirectory || [];
  files.forEach((f) => formData.append("files", f));

  try {
    updateProgress(30, "Analysing content…");

    const response = await fetch("/api/generate-schema", {
      method: "POST",
      body: formData,
    });

    updateProgress(70, "Building schema…");

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const result = await response.json();
    updateProgress(100, "Complete!");

    state.generatedSchema = result;

    setTimeout(() => {
      progressSection.classList.add("hidden");
      submitBtn.disabled = false;
      btnText.textContent = "Generate Schema";
      btnLoader.classList.add("hidden");
      displayResults(result);
      goTo(6);
      requestAnimationFrame(() => {
        launchCandyConfetti({
          count: 140,
          x: window.innerWidth * 0.5,
          y: Math.max(120, window.innerHeight * 0.3),
        });
        window.setTimeout(() => {
          launchCandyConfetti({
            count: 92,
            x: window.innerWidth * 0.56,
            y: Math.max(140, window.innerHeight * 0.35),
          });
        }, 240);
      });
    }, 500);
  } catch (err) {
    console.error(err);
    flashError("Something went wrong — please try again.");
    progressSection.classList.add("hidden");
    submitBtn.disabled = false;
    btnText.textContent = "Generate Schema";
    btnLoader.classList.add("hidden");
    updateProgress(0, "");
    queueViewportFit();
  }
}

function updateProgress(percent, text) {
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressText").textContent = text;
}

// ─── Results ──────────────────────────────────────────────────────────────────
function displayResults(result) {
  const code = document.querySelector("#schemaOutput code");
  code.textContent = result.schema || "-- No schema generated --";

  document.getElementById("previewContent").innerHTML = generatePreview(result);
  window.generatedSchema = result;
}

function generatePreview(result) {
  if (!result.tables || !result.tables.length)
    return "<p>No tables generated.</p>";
  return `
        <div class="preview-summary">
            <h3>Database Summary</h3>
            <p><strong>Project:</strong> ${result.projectName}</p>
            <p><strong>Database:</strong> ${result.databaseType}</p>
            <p><strong>Tables:</strong> ${result.tables.length}</p>
            <p><strong>Fields:</strong> ${result.totalFields || 0}</p>
        </div>
        <div class="tables-preview">
            <h3>Tables</h3>
            ${result.tables
              .map(
                (t) => `
                <div class="table-preview">
                    <h4>${t.name}</h4>
                    <ul>${t.fields
                      .map(
                        (f) =>
                          `<li><strong>${f.name}</strong>: ${f.type}${f.required ? " (required)" : ""}</li>`,
                      )
                      .join("")}</ul>
                </div>
            `,
              )
              .join("")}
        </div>
    `;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll(".hero-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document
        .querySelectorAll(".hero-tab")
        .forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".hero-tab-content").forEach((c) => {
        c.classList.add("hidden");
        c.classList.remove("active");
      });
      btn.classList.add("active");
      const el = document.getElementById(tab + "Tab");
      el.classList.remove("hidden");
      el.classList.add("active");
      queueViewportFit();
    });
  });
}

// ─── Downloads ────────────────────────────────────────────────────────────────
function bindDownloads() {
  document.querySelectorAll(".btn-download").forEach((btn) => {
    btn.addEventListener("click", () => {
      const format = btn.dataset.format;
      const schema = window.generatedSchema;
      if (!schema) {
        flashError("No schema available to download.");
        return;
      }

      let content, filename, mime;
      switch (format) {
        case "sql":
          content = schema.schema;
          filename = `${schema.projectName}_schema.sql`;
          mime = "text/plain";
          break;
        case "json":
          content = JSON.stringify(schema, null, 2);
          filename = `${schema.projectName}_schema.json`;
          mime = "application/json";
          break;
        case "prisma":
          content = generatePrismaSchema(schema);
          filename = "schema.prisma";
          mime = "text/plain";
          break;
        case "typescript":
          content = generateTypeScriptTypes(schema);
          filename = `${schema.projectName}_types.ts`;
          mime = "text/plain";
          break;
      }
      const rect = btn.getBoundingClientRect();
      launchHeartBubbles({
        count: 20,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      downloadFile(content, filename, mime);
    });
  });
}

function launchCandyConfetti(options = {}) {
  const layer = getConfettiLayer();
  const count = options.count || 80;
  const originX = options.x || window.innerWidth / 2;
  const originY = options.y || window.innerHeight * 0.32;
  const palette = [
    "#ff5fab",
    "#ff9863",
    "#ffe267",
    "#59d6ff",
    "#8ef1d8",
    "#b99dff",
    "#ffffff",
  ];

  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "candy-confetti";

    if (i % 3 === 0) piece.classList.add("candy-confetti-circle");
    if (i % 5 === 0) piece.classList.add("candy-confetti-ribbon");

    const size = 10 + Math.random() * 12;
    const drift = (Math.random() - 0.5) * 440;
    const lift = -(180 + Math.random() * 260);
    const settle = drift * (1.42 + Math.random() * 0.34);
    const fall = 300 + Math.random() * 360;
    const spin = `${Math.round((Math.random() - 0.5) * 980)}deg`;
    const duration = 1250 + Math.random() * 980;
    const delay = Math.random() * 160;

    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.setProperty("--size", `${size}px`);
    piece.style.setProperty("--x1", `${drift}px`);
    piece.style.setProperty("--y1", `${lift}px`);
    piece.style.setProperty("--x2", `${settle}px`);
    piece.style.setProperty("--y2", `${fall}px`);
    piece.style.setProperty("--rot", spin);
    piece.style.setProperty("--dur", `${duration}ms`);
    piece.style.setProperty("--delay", `${delay}ms`);
    piece.style.background =
      palette[Math.floor(Math.random() * palette.length)];
    if (Math.random() < 0.24) piece.classList.add("candy-confetti-glow");

    layer.appendChild(piece);
    window.setTimeout(() => piece.remove(), duration + delay + 120);
  }
}

function getConfettiLayer() {
  let layer = document.getElementById("confettiLayer");
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = "confettiLayer";
  layer.className = "confetti-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function launchHeartBubbles(options = {}) {
  const layer = getHeartBubbleLayer();
  const count = options.count || 18;
  const originX = options.x || window.innerWidth / 2;
  const originY = options.y || window.innerHeight * 0.6;
  const palette = ["#ff68ad", "#ff96cc", "#ff8a8a", "#ffc4de", "#ffd5ef"];

  for (let i = 0; i < count; i += 1) {
    const bubble = document.createElement("span");
    bubble.className = "heart-bubble";

    const size = 16 + Math.random() * 18;
    const drift = (Math.random() - 0.5) * 180;
    const rise = -(170 + Math.random() * 150);
    const spin = `${Math.round((Math.random() - 0.5) * 12)}deg`;
    const duration = 2600 + Math.random() * 1600;
    const delay = Math.random() * 280;

    bubble.style.left = `${originX}px`;
    bubble.style.top = `${originY}px`;
    bubble.style.setProperty("--bubble-size", `${size}px`);
    bubble.style.setProperty("--heart-size", `${Math.round(size * 0.52)}px`);
    bubble.style.setProperty("--x", `${drift}px`);
    bubble.style.setProperty("--y", `${rise}px`);
    bubble.style.setProperty("--rot", spin);
    bubble.style.setProperty("--dur", `${duration}ms`);
    bubble.style.setProperty("--delay", `${delay}ms`);
    bubble.style.setProperty(
      "--heart-color",
      palette[Math.floor(Math.random() * palette.length)],
    );

    layer.appendChild(bubble);
    window.setTimeout(() => bubble.remove(), duration + delay + 180);
  }
}

function getHeartBubbleLayer() {
  let layer = document.getElementById("heartBubbleLayer");
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = "heartBubbleLayer";
  layer.className = "heart-bubble-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  return layer;
}

function generatePrismaSchema(schema) {
  let out = `datasource db {\n  provider = "${schema.databaseType}"\n  url = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;
  schema.tables.forEach((t) => {
    out += `model ${capitalize(t.name)} {\n`;
    t.fields.forEach((f) => {
      out += `  ${f.name} ${mapTypeToPrisma(f.type)}\n`;
    });
    out += `}\n\n`;
  });
  return out;
}

function generateTypeScriptTypes(schema) {
  let out = `// Generated TypeScript types for ${schema.projectName}\n\n`;
  schema.tables.forEach((t) => {
    out += `export interface ${capitalize(t.name)} {\n`;
    t.fields.forEach((f) => {
      out += `  ${f.name}${f.required ? "" : "?"}: ${mapTypeToTypeScript(f.type)};\n`;
    });
    out += `}\n\n`;
  });
  return out;
}

function mapTypeToPrisma(type) {
  return (
    {
      integer: "Int",
      string: "String",
      text: "String",
      boolean: "Boolean",
      date: "DateTime",
      timestamp: "DateTime",
    }[type.toLowerCase()] || "String"
  );
}
function mapTypeToTypeScript(type) {
  return (
    {
      integer: "number",
      string: "string",
      text: "string",
      boolean: "boolean",
      date: "Date",
      timestamp: "Date",
    }[type.toLowerCase()] || "any"
  );
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function downloadFile(content, filename, mime) {
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([content], { type: mime })),
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function handleReset() {
  state.selectedFiles = [];
  state.selectedDirectory = null;
  state.generatedSchema = null;

  document.getElementById("fileList").innerHTML = "";
  document.getElementById("directoryPath").value = "";
  document.getElementById("directoryInfo").classList.add("hidden");
  document.getElementById("projectName").value = "";
  document.getElementById("websiteType").value = "";

  // Reset radios
  document.querySelector('input[name="inputMethod"][value="files"]').checked =
    true;

  goTo(1);
}
