// ─── State ────────────────────────────────────────────────────────────────────
const state = {
    currentStep: 1,
    totalSteps: 6, // 5 input steps + 1 results step
    inputMethod: 'files',
    selectedLayout: 'relational',
    selectedFiles: [],
    selectedDirectory: null,
    projectName: '',
    websiteType: '',
    databaseType: 'mysql',
    includeImages: true,
    includeMetadata: true,
    generateAPI: false,
    autoRelations: true,
    encoding: 'utf-8',
    tablePrefix: '',
    maxFileSize: 100,
    generatedSchema: null,
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    bindNavigation();
    bindInputMethod();
    bindLayoutCards();
    bindFileUpload();
    bindDirectoryUpload();
    bindAdvancedToggle();
    bindTabs();
    bindDownloads();
    renderStep(1);
});

// ─── Step navigation ──────────────────────────────────────────────────────────
function bindNavigation() {
    // Next buttons
    document.getElementById('next-1').addEventListener('click', () => tryAdvance(1));
    document.getElementById('next-2').addEventListener('click', () => tryAdvance(2));
    document.getElementById('next-3').addEventListener('click', () => tryAdvance(3));
    document.getElementById('next-4').addEventListener('click', () => tryAdvance(4));

    // Back buttons
    document.getElementById('back-2').addEventListener('click', () => goTo(1));
    document.getElementById('back-3').addEventListener('click', () => goTo(2));
    document.getElementById('back-4').addEventListener('click', () => goTo(3));
    document.getElementById('back-5').addEventListener('click', () => goTo(4));

    // Generate button
    document.getElementById('submitBtn').addEventListener('click', handleGenerate);

    // Reset
    document.getElementById('resetBtn').addEventListener('click', handleReset);
}

function tryAdvance(fromStep) {
    if (!validateStep(fromStep)) return;
    collectStep(fromStep);
    goTo(fromStep + 1);
}

function goTo(stepNumber) {
    const prev = state.currentStep;
    state.currentStep = stepNumber;

    // Direction for animation
    const dir = stepNumber > prev ? 'forward' : 'backward';
    animateTransition(prev, stepNumber, dir);
    renderStep(stepNumber);
}

function animateTransition(from, to, dir) {
    const fromEl = document.getElementById(`step-${from}`);
    const toEl   = document.getElementById(`step-${to}`);

    // Remove active from old step with exit animation
    fromEl.classList.remove('active');
    fromEl.classList.add(dir === 'forward' ? 'exit-left' : 'exit-right');

    // Prepare incoming step
    toEl.classList.remove('exit-left', 'exit-right');
    toEl.classList.add(dir === 'forward' ? 'enter-right' : 'enter-left');

    // Trigger reflow then animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toEl.classList.remove('enter-right', 'enter-left');
            toEl.classList.add('active');
        });
    });

    // Clean up exit class after transition
    setTimeout(() => fromEl.classList.remove('exit-left', 'exit-right'), 400);
}

function renderStep(stepNumber) {
    // Update stepper bubbles
    document.querySelectorAll('.step').forEach(el => {
        const n = parseInt(el.dataset.step);
        el.classList.toggle('active', n === stepNumber);
        el.classList.toggle('completed', n < stepNumber);
    });

    // Update connectors
    document.querySelectorAll('.step-connector').forEach((el, i) => {
        el.classList.toggle('filled', i + 1 < stepNumber);
    });

    // Step-specific setup
    if (stepNumber === 3) setupUploadStep();
    if (stepNumber === 5) renderReview();
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateStep(step) {
    if (step === 3) {
        if (state.inputMethod === 'files' && state.selectedFiles.length === 0) {
            flashError('Please add at least one file before continuing.');
            return false;
        }
        if (state.inputMethod === 'directory' && !state.selectedDirectory) {
            flashError('Please select a directory before continuing.');
            return false;
        }
    }
    if (step === 4) {
        const name = document.getElementById('projectName').value.trim();
        if (!name) {
            flashError('Please enter a project name.');
            document.getElementById('projectName').focus();
            return false;
        }
    }
    return true;
}

function flashError(msg) {
    let el = document.getElementById('wizard-error');
    if (!el) {
        el = document.createElement('div');
        el.id = 'wizard-error';
        el.className = 'wizard-error';
        document.querySelector('.wizard-stage .container').prepend(el);
    }
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 3000);
}

// ─── State collection ─────────────────────────────────────────────────────────
function collectStep(step) {
    if (step === 1) {
        state.inputMethod = document.querySelector('input[name="inputMethod"]:checked').value;
    }
    if (step === 2) {
        state.selectedLayout = document.getElementById('selectedLayout').value;
    }
    if (step === 4) {
        state.projectName   = document.getElementById('projectName').value.trim();
        state.websiteType   = document.getElementById('websiteType').value;
        state.databaseType  = document.getElementById('databaseType').value;
        state.includeImages = document.getElementById('includeImages').checked;
        state.includeMetadata = document.getElementById('includeMetadata').checked;
        state.generateAPI   = document.getElementById('generateAPI').checked;
        state.autoRelations = document.getElementById('autoRelations').checked;
        state.encoding      = document.getElementById('encoding').value;
        state.tablePrefix   = document.getElementById('tablePrefix').value;
        state.maxFileSize   = document.getElementById('maxFileSize').value;
    }
}

// ─── Input method ─────────────────────────────────────────────────────────────
function bindInputMethod() {
    document.querySelectorAll('input[name="inputMethod"]').forEach(r => {
        r.addEventListener('change', () => {
            state.inputMethod = r.value;
            // If we're already on step 3, refresh it
            if (state.currentStep === 3) setupUploadStep();
        });
    });
}

function setupUploadStep() {
    const isFiles = state.inputMethod === 'files';
    document.getElementById('fileUploadSection').classList.toggle('hidden', !isFiles);
    document.getElementById('directorySection').classList.toggle('hidden', isFiles);

    const title    = document.getElementById('upload-step-title');
    const subtitle = document.getElementById('upload-step-subtitle');
    if (isFiles) {
        title.textContent    = 'Upload your files';
        subtitle.textContent = 'Drop or browse for the source documents to analyse.';
    } else {
        title.textContent    = 'Select a directory';
        subtitle.textContent = 'All supported files in the folder will be processed automatically.';
    }
}

// ─── Layout cards ─────────────────────────────────────────────────────────────
function bindLayoutCards() {
    document.querySelectorAll('.layout-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedLayout = card.dataset.layout;
            document.getElementById('selectedLayout').value = state.selectedLayout;
        });
    });
}

// ─── File upload ──────────────────────────────────────────────────────────────
function bindFileUpload() {
    const fileInput  = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');

    fileInput.addEventListener('change', e => addFiles(Array.from(e.target.files)));
    uploadArea.addEventListener('dragover',  e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', e => { e.preventDefault(); uploadArea.classList.remove('dragover'); });
    uploadArea.addEventListener('drop', e => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        addFiles(Array.from(e.dataTransfer.files));
    });
}

function addFiles(files) {
    const valid = ['pdf','doc','docx','txt','json','xml','csv','md'];
    files.filter(f => valid.includes(f.name.split('.').pop().toLowerCase()))
         .forEach(f => {
             if (!state.selectedFiles.some(x => x.name === f.name && x.size === f.size))
                 state.selectedFiles.push(f);
         });
    renderFileList();
}

function renderFileList() {
    const list = document.getElementById('fileList');
    if (!state.selectedFiles.length) { list.innerHTML = ''; return; }
    list.innerHTML = state.selectedFiles.map((f, i) => `
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
    `).join('');
}

function removeFile(index) {
    state.selectedFiles.splice(index, 1);
    renderFileList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ─── Directory upload ─────────────────────────────────────────────────────────
function bindDirectoryUpload() {
    const browseBtn      = document.getElementById('browseBtn');
    const directoryInput = document.getElementById('directoryInput');

    browseBtn.addEventListener('click', () => directoryInput.click());
    directoryInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        state.selectedDirectory = files;
        const path = files[0].webkitRelativePath.split('/')[0];
        document.getElementById('directoryPath').value = path;
        document.getElementById('selectedPath').textContent = path;
        document.getElementById('fileCount').textContent = files.length;
        document.getElementById('directoryInfo').classList.remove('hidden');
    });
}

// ─── Advanced toggle ──────────────────────────────────────────────────────────
function bindAdvancedToggle() {
    document.getElementById('advancedToggle').addEventListener('click', () => {
        const opts = document.getElementById('advancedOptions');
        const icon = document.querySelector('#advancedToggle .toggle-icon');
        opts.classList.toggle('hidden');
        icon.style.transform = opts.classList.contains('hidden') ? '' : 'rotate(180deg)';
    });
}

// ─── Review panel ─────────────────────────────────────────────────────────────
function renderReview() {
    collectStep(4); // make sure step-4 values are captured
    const s = state;
    const fileInfo = s.inputMethod === 'files'
        ? `${s.selectedFiles.length} file(s) selected`
        : `Directory: ${document.getElementById('directoryPath').value || '—'} (${s.selectedDirectory ? s.selectedDirectory.length : 0} files)`;

    const features = [
        s.includeImages   && 'Media tables',
        s.includeMetadata && 'Audit fields',
        s.generateAPI     && 'REST API docs',
        s.autoRelations   && 'Auto-relations',
    ].filter(Boolean);

    document.getElementById('reviewSummary').innerHTML = `
        <div class="review-grid">
            <div class="review-item">
                <div class="review-item-label">Input</div>
                <div class="review-item-value">${s.inputMethod === 'files' ? 'File Upload' : 'Directory'}</div>
                <div class="review-item-sub">${fileInfo}</div>
            </div>
            <div class="review-item">
                <div class="review-item-label">Template</div>
                <div class="review-item-value">${titleCase(s.selectedLayout)}</div>
            </div>
            <div class="review-item">
                <div class="review-item-label">Project</div>
                <div class="review-item-value">${s.projectName || '—'}</div>
                <div class="review-item-sub">${s.websiteType ? titleCase(s.websiteType) : ''}</div>
            </div>
            <div class="review-item">
                <div class="review-item-label">Database</div>
                <div class="review-item-value">${s.databaseType.toUpperCase()}</div>
            </div>
            <div class="review-item review-item-wide">
                <div class="review-item-label">Features</div>
                <div class="review-tags">${features.map(f => `<span class="review-tag">${f}</span>`).join('')}</div>
            </div>
        </div>
    `;
}

function titleCase(str) {
    return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Generate ─────────────────────────────────────────────────────────────────
async function handleGenerate() {
    const progressSection = document.getElementById('progressSection');
    const submitBtn       = document.getElementById('submitBtn');
    const btnText         = submitBtn.querySelector('.btn-text');
    const btnLoader       = submitBtn.querySelector('.btn-loader');

    progressSection.classList.remove('hidden');
    submitBtn.disabled = true;
    btnText.textContent = 'Generating…';
    btnLoader.classList.remove('hidden');

    updateProgress(10, 'Uploading files…');

    const formData = new FormData();
    formData.append('inputMethod',    state.inputMethod);
    formData.append('selectedLayout', state.selectedLayout);
    formData.append('websiteType',    state.websiteType);
    formData.append('projectName',    state.projectName);
    formData.append('databaseType',   state.databaseType);
    formData.append('includeImages',  state.includeImages);
    formData.append('includeMetadata',state.includeMetadata);
    formData.append('generateAPI',    state.generateAPI);
    formData.append('autoRelations',  state.autoRelations);
    formData.append('encoding',       state.encoding);
    formData.append('tablePrefix',    state.tablePrefix);
    formData.append('maxFileSize',    state.maxFileSize);

    const files = state.inputMethod === 'files' ? state.selectedFiles : (state.selectedDirectory || []);
    files.forEach(f => formData.append('files', f));

    try {
        updateProgress(30, 'Analysing content…');

        const response = await fetch('/api/generate-schema', {
            method: 'POST',
            body: formData,
        });

        updateProgress(70, 'Building schema…');

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const result = await response.json();
        updateProgress(100, 'Complete!');

        state.generatedSchema = result;

        setTimeout(() => {
            progressSection.classList.add('hidden');
            submitBtn.disabled = false;
            btnText.textContent = 'Generate Schema';
            btnLoader.classList.add('hidden');
            displayResults(result);
            goTo(6);
        }, 500);

    } catch (err) {
        console.error(err);
        flashError('Something went wrong — please try again.');
        progressSection.classList.add('hidden');
        submitBtn.disabled = false;
        btnText.textContent = 'Generate Schema';
        btnLoader.classList.add('hidden');
        updateProgress(0, '');
    }
}

function updateProgress(percent, text) {
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('progressText').textContent = text;
}

// ─── Results ──────────────────────────────────────────────────────────────────
function displayResults(result) {
    const code = document.querySelector('#schemaOutput code');
    code.textContent = result.schema || '-- No schema generated --';

    document.getElementById('previewContent').innerHTML = generatePreview(result);
    window.generatedSchema = result;
}

function generatePreview(result) {
    if (!result.tables || !result.tables.length) return '<p>No tables generated.</p>';
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
            ${result.tables.map(t => `
                <div class="table-preview">
                    <h4>${t.name}</h4>
                    <ul>${t.fields.map(f =>
                        `<li><strong>${f.name}</strong>: ${f.type}${f.required ? ' (required)' : ''}</li>`
                    ).join('')}</ul>
                </div>
            `).join('')}
        </div>
    `;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function bindTabs() {
    document.querySelectorAll('.hero-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.hero-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.hero-tab-content').forEach(c => {
                c.classList.add('hidden');
                c.classList.remove('active');
            });
            btn.classList.add('active');
            const el = document.getElementById(tab + 'Tab');
            el.classList.remove('hidden');
            el.classList.add('active');
        });
    });
}

// ─── Downloads ────────────────────────────────────────────────────────────────
function bindDownloads() {
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.dataset.format;
            const schema = window.generatedSchema;
            if (!schema) { flashError('No schema available to download.'); return; }

            let content, filename, mime;
            switch (format) {
                case 'sql':
                    content  = schema.schema;
                    filename = `${schema.projectName}_schema.sql`;
                    mime     = 'text/plain'; break;
                case 'json':
                    content  = JSON.stringify(schema, null, 2);
                    filename = `${schema.projectName}_schema.json`;
                    mime     = 'application/json'; break;
                case 'prisma':
                    content  = generatePrismaSchema(schema);
                    filename = 'schema.prisma';
                    mime     = 'text/plain'; break;
                case 'typescript':
                    content  = generateTypeScriptTypes(schema);
                    filename = `${schema.projectName}_types.ts`;
                    mime     = 'text/plain'; break;
            }
            downloadFile(content, filename, mime);
        });
    });
}

function generatePrismaSchema(schema) {
    let out = `datasource db {\n  provider = "${schema.databaseType}"\n  url = env("DATABASE_URL")\n}\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\n`;
    schema.tables.forEach(t => {
        out += `model ${capitalize(t.name)} {\n`;
        t.fields.forEach(f => { out += `  ${f.name} ${mapTypeToPrisma(f.type)}\n`; });
        out += `}\n\n`;
    });
    return out;
}

function generateTypeScriptTypes(schema) {
    let out = `// Generated TypeScript types for ${schema.projectName}\n\n`;
    schema.tables.forEach(t => {
        out += `export interface ${capitalize(t.name)} {\n`;
        t.fields.forEach(f => {
            out += `  ${f.name}${f.required ? '' : '?'}: ${mapTypeToTypeScript(f.type)};\n`;
        });
        out += `}\n\n`;
    });
    return out;
}

function mapTypeToPrisma(type) {
    return { integer:'Int', string:'String', text:'String', boolean:'Boolean', date:'DateTime', timestamp:'DateTime' }[type.toLowerCase()] || 'String';
}
function mapTypeToTypeScript(type) {
    return { integer:'number', string:'string', text:'string', boolean:'boolean', date:'Date', timestamp:'Date' }[type.toLowerCase()] || 'any';
}
function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function downloadFile(content, filename, mime) {
    const a = Object.assign(document.createElement('a'), {
        href: URL.createObjectURL(new Blob([content], { type: mime })),
        download: filename,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ─── Reset ────────────────────────────────────────────────────────────────────
function handleReset() {
    state.selectedFiles    = [];
    state.selectedDirectory= null;
    state.generatedSchema  = null;

    document.getElementById('fileList').innerHTML     = '';
    document.getElementById('directoryPath').value    = '';
    document.getElementById('directoryInfo').classList.add('hidden');
    document.getElementById('projectName').value      = '';
    document.getElementById('websiteType').value      = '';

    // Reset radios
    document.querySelector('input[name="inputMethod"][value="files"]').checked = true;

    goTo(1);
}
