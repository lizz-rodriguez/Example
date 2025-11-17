// DOM Elements
const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const directoryInput = document.getElementById('directoryInput');
const uploadArea = document.getElementById('uploadArea');
const fileList = document.getElementById('fileList');
const fileUploadSection = document.getElementById('fileUploadSection');
const directorySection = document.getElementById('directorySection');
const directoryPath = document.getElementById('directoryPath');
const browseBtn = document.getElementById('browseBtn');
const directoryInfo = document.getElementById('directoryInfo');
const selectedPath = document.getElementById('selectedPath');
const fileCount = document.getElementById('fileCount');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const advancedToggle = document.getElementById('advancedToggle');
const advancedOptions = document.getElementById('advancedOptions');

// State
let selectedFiles = [];
let selectedDirectory = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Input method selection
    document.querySelectorAll('input[name="inputMethod"]').forEach(radio => {
        radio.addEventListener('change', handleInputMethodChange);
    });

    // File upload
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Directory selection
    browseBtn.addEventListener('click', () => directoryInput.click());
    directoryInput.addEventListener('change', handleDirectorySelect);

    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', handleReset);

    // Advanced options toggle
    advancedToggle.addEventListener('click', toggleAdvancedOptions);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });

    // Download buttons
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });
}

function handleInputMethodChange(e) {
    const method = e.target.value;
    if (method === 'files') {
        fileUploadSection.classList.remove('hidden');
        directorySection.classList.add('hidden');
        directoryInput.value = '';
        selectedDirectory = null;
    } else {
        fileUploadSection.classList.add('hidden');
        directorySection.classList.remove('hidden');
        fileInput.value = '';
        selectedFiles = [];
        updateFileList();
    }
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

function addFiles(files) {
    const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['pdf', 'doc', 'docx', 'txt', 'json', 'xml', 'csv', 'md'];
        return validExtensions.includes(ext);
    });

    validFiles.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });

    updateFileList();
}

function updateFileList() {
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="removeFile(${index})">Remove</button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function handleDirectorySelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        selectedDirectory = files;
        const path = files[0].webkitRelativePath.split('/')[0];
        directoryPath.value = path;
        selectedPath.textContent = path;
        fileCount.textContent = files.length;
        directoryInfo.classList.remove('hidden');
    }
}

function toggleAdvancedOptions() {
    advancedOptions.classList.toggle('hidden');
    advancedToggle.classList.toggle('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate
    const inputMethod = document.querySelector('input[name="inputMethod"]:checked').value;
    if (inputMethod === 'files' && selectedFiles.length === 0) {
        alert('Please select at least one file to upload.');
        return;
    }
    if (inputMethod === 'directory' && !selectedDirectory) {
        alert('Please select a directory.');
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('inputMethod', inputMethod);
    formData.append('websiteType', document.getElementById('websiteType').value);
    formData.append('projectName', document.getElementById('projectName').value);
    formData.append('databaseType', document.getElementById('databaseType').value);
    formData.append('includeImages', document.getElementById('includeImages').checked);
    formData.append('includeMetadata', document.getElementById('includeMetadata').checked);
    formData.append('generateAPI', document.getElementById('generateAPI').checked);
    formData.append('autoRelations', document.getElementById('autoRelations').checked);
    formData.append('encoding', document.getElementById('encoding').value);
    formData.append('tablePrefix', document.getElementById('tablePrefix').value);
    formData.append('maxFileSize', document.getElementById('maxFileSize').value);

    // Add files
    if (inputMethod === 'files') {
        selectedFiles.forEach(file => {
            formData.append('files', file);
        });
    } else {
        selectedDirectory.forEach(file => {
            formData.append('files', file);
        });
    }

    // Show progress
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Processing...';
    submitBtn.querySelector('.btn-loader').classList.remove('hidden');

    try {
        // Simulate progress
        updateProgress(20, 'Uploading files...');

        // Send request
        const response = await fetch('/api/generate-schema', {
            method: 'POST',
            body: formData
        });

        updateProgress(60, 'Analyzing content...');

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();

        updateProgress(100, 'Complete!');

        // Display results
        setTimeout(() => {
            displayResults(result);
            progressSection.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'Generate Database Structure';
            submitBtn.querySelector('.btn-loader').classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while processing your request. Please try again.');
        progressSection.classList.add('hidden');
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Generate Database Structure';
        submitBtn.querySelector('.btn-loader').classList.add('hidden');
    }
}

function updateProgress(percent, text) {
    progressFill.style.width = percent + '%';
    progressText.textContent = text;
}

function displayResults(result) {
    // Display schema
    const schemaOutput = document.querySelector('#schemaOutput code');
    schemaOutput.textContent = result.schema || '-- Schema will be generated here --';

    // Display preview
    const previewContent = document.getElementById('previewContent');
    previewContent.innerHTML = generatePreview(result);

    // Store result for downloads
    window.generatedSchema = result;

    // Show results section
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function generatePreview(result) {
    if (!result.tables || result.tables.length === 0) {
        return '<p>No tables generated</p>';
    }

    return `
        <div class="preview-summary">
            <h3>Database Summary</h3>
            <p><strong>Project:</strong> ${result.projectName}</p>
            <p><strong>Database Type:</strong> ${result.databaseType}</p>
            <p><strong>Tables:</strong> ${result.tables.length}</p>
            <p><strong>Total Fields:</strong> ${result.totalFields || 0}</p>
        </div>
        <div class="tables-preview">
            <h3>Tables</h3>
            ${result.tables.map(table => `
                <div class="table-preview">
                    <h4>${table.name}</h4>
                    <ul>
                        ${table.fields.map(field => 
                            `<li><strong>${field.name}</strong>: ${field.type}${field.required ? ' (required)' : ''}</li>`
                        ).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    `;
}

function handleTabChange(e) {
    const targetTab = e.target.dataset.tab;

    // Update tab buttons
    document.querySelectorAll('.hero-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.hero-tab-content').forEach(content => {
        content.classList.add('hidden');
        content.classList.remove('active');
    });
    const targetContent = document.getElementById(targetTab + 'Tab');
    targetContent.classList.remove('hidden');
    targetContent.classList.add('active');
}

function handleDownload(e) {
    const format = e.target.dataset.format;
    const schema = window.generatedSchema;

    if (!schema) {
        alert('No schema available to download');
        return;
    }

    let content, filename, mimeType;

    switch (format) {
        case 'sql':
            content = schema.schema;
            filename = `${schema.projectName}_schema.sql`;
            mimeType = 'text/plain';
            break;
        case 'json':
            content = JSON.stringify(schema, null, 2);
            filename = `${schema.projectName}_schema.json`;
            mimeType = 'application/json';
            break;
        case 'prisma':
            content = generatePrismaSchema(schema);
            filename = `schema.prisma`;
            mimeType = 'text/plain';
            break;
        case 'typescript':
            content = generateTypeScriptTypes(schema);
            filename = `${schema.projectName}_types.ts`;
            mimeType = 'text/plain';
            break;
    }

    downloadFile(content, filename, mimeType);
}

function generatePrismaSchema(schema) {
    // Basic Prisma schema generation
    let prisma = `datasource db {\n  provider = "${schema.databaseType}"\n  url      = env("DATABASE_URL")\n}\n\n`;
    prisma += `generator client {\n  provider = "prisma-client-js"\n}\n\n`;

    schema.tables.forEach(table => {
        prisma += `model ${capitalize(table.name)} {\n`;
        table.fields.forEach(field => {
            prisma += `  ${field.name} ${mapTypeToPrisma(field.type)}\n`;
        });
        prisma += `}\n\n`;
    });

    return prisma;
}

function generateTypeScriptTypes(schema) {
    // Basic TypeScript types generation
    let types = `// Generated TypeScript types for ${schema.projectName}\n\n`;

    schema.tables.forEach(table => {
        types += `export interface ${capitalize(table.name)} {\n`;
        table.fields.forEach(field => {
            const optional = field.required ? '' : '?';
            types += `  ${field.name}${optional}: ${mapTypeToTypeScript(field.type)};\n`;
        });
        types += `}\n\n`;
    });

    return types;
}

function mapTypeToPrisma(type) {
    const typeMap = {
        'integer': 'Int',
        'string': 'String',
        'text': 'String',
        'boolean': 'Boolean',
        'date': 'DateTime',
        'timestamp': 'DateTime'
    };
    return typeMap[type.toLowerCase()] || 'String';
}

function mapTypeToTypeScript(type) {
    const typeMap = {
        'integer': 'number',
        'string': 'string',
        'text': 'string',
        'boolean': 'boolean',
        'date': 'Date',
        'timestamp': 'Date'
    };
    return typeMap[type.toLowerCase()] || 'any';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function handleReset() {
    selectedFiles = [];
    selectedDirectory = null;
    updateFileList();
    directoryInfo.classList.add('hidden');
    directoryPath.value = '';
    resultsSection.classList.add('hidden');
    progressSection.classList.add('hidden');
    fileUploadSection.classList.remove('hidden');
    directorySection.classList.add('hidden');
}
