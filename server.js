const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const SchemaGenerator = require('./schemaGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.json', '.xml', '.csv', '.md'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${ext} is not supported`));
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Main API endpoint for schema generation
app.post('/api/generate-schema', upload.array('files', 100), async (req, res) => {
    try {
        console.log('Received schema generation request');
        console.log('Files:', req.files?.length || 0);
        console.log('Body:', req.body);

        // Validate request
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No files uploaded',
                message: 'Please upload at least one file'
            });
        }

        // Extract configuration from request
        const config = {
            inputMethod: req.body.inputMethod || 'files',
            websiteType: req.body.websiteType,
            projectName: req.body.projectName,
            databaseType: req.body.databaseType || 'mysql',
            includeImages: req.body.includeImages === 'true',
            includeMetadata: req.body.includeMetadata === 'true',
            generateAPI: req.body.generateAPI === 'true',
            autoRelations: req.body.autoRelations === 'true',
            encoding: req.body.encoding || 'utf-8',
            tablePrefix: req.body.tablePrefix || '',
            maxFileSize: parseInt(req.body.maxFileSize) || 10
        };

        // Process files
        const fileInfos = req.files.map(file => ({
            path: file.path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            extension: path.extname(file.originalname).toLowerCase()
        }));

        // Generate schema
        const generator = new SchemaGenerator(config);
        const schema = await generator.generateFromFiles(fileInfos);

        // Clean up uploaded files
        await cleanupFiles(req.files);

        // Send response
        res.json({
            success: true,
            projectName: config.projectName,
            databaseType: config.databaseType,
            schema: schema.sql,
            tables: schema.tables,
            totalFields: schema.totalFields,
            metadata: schema.metadata,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating schema:', error);
        
        // Clean up files on error
        if (req.files) {
            await cleanupFiles(req.files);
        }

        res.status(500).json({
            error: 'Schema generation failed',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Get supported file types
app.get('/api/supported-types', (req, res) => {
    res.json({
        fileTypes: [
            { extension: '.pdf', description: 'PDF Documents' },
            { extension: '.doc', description: 'Microsoft Word (Legacy)' },
            { extension: '.docx', description: 'Microsoft Word' },
            { extension: '.txt', description: 'Text Files' },
            { extension: '.json', description: 'JSON Files' },
            { extension: '.xml', description: 'XML Files' },
            { extension: '.csv', description: 'CSV Files' },
            { extension: '.md', description: 'Markdown Files' }
        ],
        databaseTypes: ['mysql', 'postgresql', 'mongodb', 'sqlite'],
        websiteTypes: ['blog', 'portfolio', 'ecommerce', 'documentation', 'corporate', 'custom']
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large',
                message: 'Please upload files smaller than the maximum allowed size'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                error: 'Too many files',
                message: 'Please upload fewer files'
            });
        }
    }

    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: 'The requested resource does not exist'
    });
});

// Utility function to clean up uploaded files
async function cleanupFiles(files) {
    if (!files || files.length === 0) return;

    const cleanupPromises = files.map(async (file) => {
        try {
            await fs.unlink(file.path);
            console.log(`Cleaned up file: ${file.path}`);
        } catch (error) {
            console.error(`Failed to clean up file ${file.path}:`, error);
        }
    });

    await Promise.all(cleanupPromises);
}

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════════════════╗
    ║  Database Structure Generator Server                  ║
    ║                                                       ║
    ║  Server running on: http://localhost:${PORT}           ║
    ║  Environment: ${process.env.NODE_ENV || 'development'}                          ║
    ║                                                       ║
    ║  API Endpoints:                                       ║
    ║  - POST /api/generate-schema                          ║
    ║  - GET  /api/health                                   ║
    ║  - GET  /api/supported-types                          ║
    ╚═══════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    
    // Clean up uploads directory
    try {
        const uploadDir = path.join(__dirname, 'uploads');
        const files = await fs.readdir(uploadDir);
        await Promise.all(files.map(file => fs.unlink(path.join(uploadDir, file))));
        console.log('Cleaned up uploads directory');
    } catch (error) {
        console.error('Error cleaning up uploads:', error);
    }
    
    process.exit(0);
});

module.exports = app;
