const fs = require('fs').promises;
const path = require('path');

class SchemaGenerator {
    constructor(config) {
        this.config = config;
        this.tables = [];
        this.relationships = [];
        this.metadata = {};
    }

    async generateFromFiles(fileInfos) {
        console.log(`Generating schema from ${fileInfos.length} files`);

        // Analyze files and extract structure
        const analyzedData = await this.analyzeFiles(fileInfos);

        // Generate database structure based on website type
        this.generateStructure(analyzedData);

        // Generate SQL
        const sql = this.generateSQL();

        return {
            sql,
            tables: this.tables,
            totalFields: this.tables.reduce((sum, table) => sum + table.fields.length, 0),
            metadata: this.metadata,
            relationships: this.relationships
        };
    }

    async analyzeFiles(fileInfos) {
        const analyzedData = {
            content: [],
            structure: {},
            commonFields: new Set(),
            mediaFiles: []
        };

        for (const fileInfo of fileInfos) {
            try {
                const content = await fs.readFile(fileInfo.path, 'utf-8');
                const analysis = this.analyzeContent(content, fileInfo);
                
                analyzedData.content.push({
                    ...fileInfo,
                    analysis
                });

                // Collect common fields
                Object.keys(analysis.fields).forEach(field => {
                    analyzedData.commonFields.add(field);
                });

            } catch (error) {
                console.error(`Error analyzing file ${fileInfo.originalName}:`, error);
            }
        }

        return analyzedData;
    }

    analyzeContent(content, fileInfo) {
        const analysis = {
            fields: {},
            type: 'unknown',
            hasMetadata: false,
            structure: null
        };

        // Analyze based on file extension
        switch (fileInfo.extension) {
            case '.json':
                analysis.structure = this.analyzeJSON(content);
                analysis.type = 'structured';
                break;
            case '.csv':
                analysis.structure = this.analyzeCSV(content);
                analysis.type = 'tabular';
                break;
            case '.xml':
                analysis.structure = this.analyzeXML(content);
                analysis.type = 'structured';
                break;
            case '.md':
            case '.txt':
                analysis.structure = this.analyzeText(content);
                analysis.type = 'content';
                break;
            default:
                analysis.structure = this.analyzeText(content);
                analysis.type = 'document';
        }

        return analysis;
    }

    analyzeJSON(content) {
        try {
            const data = JSON.parse(content);
            return this.inferStructureFromObject(data);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return null;
        }
    }

    analyzeCSV(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return null;

        const headers = lines[0].split(',').map(h => h.trim());
        const fields = {};

        headers.forEach(header => {
            fields[this.sanitizeFieldName(header)] = {
                type: 'string',
                required: false
            };
        });

        // Sample data to infer types
        if (lines.length > 1) {
            const sampleRow = lines[1].split(',');
            headers.forEach((header, index) => {
                const value = sampleRow[index]?.trim();
                fields[this.sanitizeFieldName(header)].type = this.inferType(value);
            });
        }

        return fields;
    }

    analyzeXML(content) {
        // Basic XML structure inference
        const tagPattern = /<(\w+)>([^<]*)<\/\1>/g;
        const fields = {};
        let match;

        while ((match = tagPattern.exec(content)) !== null) {
            const fieldName = this.sanitizeFieldName(match[1]);
            const value = match[2];
            
            if (!fields[fieldName]) {
                fields[fieldName] = {
                    type: this.inferType(value),
                    required: false
                };
            }
        }

        return fields;
    }

    analyzeText(content) {
        // Extract potential fields from text content
        const fields = {
            title: { type: 'string', required: true },
            content: { type: 'text', required: true },
            excerpt: { type: 'text', required: false }
        };

        // Look for common patterns
        if (content.includes('@') && content.includes('.')) {
            fields.author_email = { type: 'string', required: false };
        }

        if (/\d{4}-\d{2}-\d{2}/.test(content)) {
            fields.published_date = { type: 'date', required: false };
        }

        return fields;
    }

    inferStructureFromObject(obj, depth = 0) {
        if (depth > 3) return null; // Prevent deep nesting

        const structure = {};

        if (Array.isArray(obj)) {
            if (obj.length > 0) {
                return this.inferStructureFromObject(obj[0], depth + 1);
            }
            return null;
        }

        if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
                const fieldName = this.sanitizeFieldName(key);
                
                if (Array.isArray(value)) {
                    structure[fieldName] = {
                        type: 'relation',
                        relatedTable: fieldName,
                        childStructure: value.length > 0 ? this.inferStructureFromObject(value[0], depth + 1) : null
                    };
                } else if (typeof value === 'object' && value !== null) {
                    structure[fieldName] = {
                        type: 'json',
                        required: false
                    };
                } else {
                    structure[fieldName] = {
                        type: this.inferType(value),
                        required: false
                    };
                }
            }
        }

        return structure;
    }

    inferType(value) {
        if (value === null || value === undefined) return 'string';
        
        const strValue = String(value).trim();
        
        if (strValue === 'true' || strValue === 'false') return 'boolean';
        if (!isNaN(strValue) && !isNaN(parseFloat(strValue))) {
            return strValue.includes('.') ? 'decimal' : 'integer';
        }
        if (this.isDate(strValue)) return 'date';
        if (this.isDateTime(strValue)) return 'timestamp';
        if (strValue.length > 255) return 'text';
        
        return 'string';
    }

    isDate(value) {
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
    }

    isDateTime(value) {
        return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(value);
    }

    sanitizeFieldName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_');
    }

    generateStructure(analyzedData) {
        const websiteType = this.config.websiteType;

        // Generate base tables based on website type
        switch (websiteType) {
            case 'blog':
                this.generateBlogStructure(analyzedData);
                break;
            case 'portfolio':
                this.generatePortfolioStructure(analyzedData);
                break;
            case 'ecommerce':
                this.generateEcommerceStructure(analyzedData);
                break;
            case 'documentation':
                this.generateDocumentationStructure(analyzedData);
                break;
            case 'corporate':
                this.generateCorporateStructure(analyzedData);
                break;
            default:
                this.generateCustomStructure(analyzedData);
        }

        // Add metadata tables if configured
        if (this.config.includeMetadata) {
            this.addMetadataTables();
        }

        // Add media tables if configured
        if (this.config.includeImages) {
            this.addMediaTables();
        }
    }

    generateBlogStructure(analyzedData) {
        // Posts table
        this.tables.push({
            name: this.tableName('posts'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'title', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'content', type: 'text', required: true },
                { name: 'excerpt', type: 'text', required: false },
                { name: 'author_id', type: 'integer', required: false },
                { name: 'category_id', type: 'integer', required: false },
                { name: 'status', type: 'string', required: true, default: 'draft', length: 20 },
                { name: 'published_at', type: 'timestamp', required: false },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });

        // Categories table
        this.tables.push({
            name: this.tableName('categories'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 100 },
                { name: 'slug', type: 'string', required: true, length: 100, unique: true },
                { name: 'description', type: 'text', required: false },
                { name: 'parent_id', type: 'integer', required: false },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Tags table
        this.tables.push({
            name: this.tableName('tags'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 50, unique: true },
                { name: 'slug', type: 'string', required: true, length: 50, unique: true },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Post-Tags relationship
        this.tables.push({
            name: this.tableName('post_tags'),
            fields: [
                { name: 'post_id', type: 'integer', required: true },
                { name: 'tag_id', type: 'integer', required: true },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Authors table
        this.tables.push({
            name: this.tableName('authors'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 100 },
                { name: 'email', type: 'string', required: true, length: 255, unique: true },
                { name: 'bio', type: 'text', required: false },
                { name: 'avatar_url', type: 'string', required: false, length: 500 },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Comments table
        this.tables.push({
            name: this.tableName('comments'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'post_id', type: 'integer', required: true },
                { name: 'author_name', type: 'string', required: true, length: 100 },
                { name: 'author_email', type: 'string', required: true, length: 255 },
                { name: 'content', type: 'text', required: true },
                { name: 'status', type: 'string', required: true, default: 'pending', length: 20 },
                { name: 'parent_id', type: 'integer', required: false },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });
    }

    generatePortfolioStructure(analyzedData) {
        // Projects table
        this.tables.push({
            name: this.tableName('projects'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'title', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'description', type: 'text', required: true },
                { name: 'client', type: 'string', required: false, length: 100 },
                { name: 'project_url', type: 'string', required: false, length: 500 },
                { name: 'github_url', type: 'string', required: false, length: 500 },
                { name: 'featured', type: 'boolean', required: true, default: false },
                { name: 'completed_at', type: 'date', required: false },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });

        // Skills table
        this.tables.push({
            name: this.tableName('skills'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 50, unique: true },
                { name: 'category', type: 'string', required: false, length: 50 },
                { name: 'proficiency', type: 'integer', required: false },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Project-Skills relationship
        this.tables.push({
            name: this.tableName('project_skills'),
            fields: [
                { name: 'project_id', type: 'integer', required: true },
                { name: 'skill_id', type: 'integer', required: true }
            ]
        });
    }

    generateEcommerceStructure(analyzedData) {
        // Products table
        this.tables.push({
            name: this.tableName('products'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'description', type: 'text', required: true },
                { name: 'price', type: 'decimal', required: true, precision: 10, scale: 2 },
                { name: 'compare_price', type: 'decimal', required: false, precision: 10, scale: 2 },
                { name: 'sku', type: 'string', required: false, length: 100, unique: true },
                { name: 'stock_quantity', type: 'integer', required: true, default: 0 },
                { name: 'category_id', type: 'integer', required: false },
                { name: 'status', type: 'string', required: true, default: 'active', length: 20 },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });

        // Categories table
        this.tables.push({
            name: this.tableName('categories'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 100 },
                { name: 'slug', type: 'string', required: true, length: 100, unique: true },
                { name: 'parent_id', type: 'integer', required: false },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Orders table
        this.tables.push({
            name: this.tableName('orders'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'order_number', type: 'string', required: true, length: 50, unique: true },
                { name: 'customer_id', type: 'integer', required: false },
                { name: 'total', type: 'decimal', required: true, precision: 10, scale: 2 },
                { name: 'status', type: 'string', required: true, default: 'pending', length: 20 },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });
    }

    generateDocumentationStructure(analyzedData) {
        // Pages table
        this.tables.push({
            name: this.tableName('pages'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'title', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'content', type: 'text', required: true },
                { name: 'parent_id', type: 'integer', required: false },
                { name: 'order', type: 'integer', required: true, default: 0 },
                { name: 'version', type: 'string', required: false, length: 20 },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });

        // Sections table
        this.tables.push({
            name: this.tableName('sections'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 100 },
                { name: 'slug', type: 'string', required: true, length: 100, unique: true },
                { name: 'order', type: 'integer', required: true, default: 0 },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });
    }

    generateCorporateStructure(analyzedData) {
        // Pages table
        this.tables.push({
            name: this.tableName('pages'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'title', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'content', type: 'text', required: true },
                { name: 'meta_title', type: 'string', required: false, length: 255 },
                { name: 'meta_description', type: 'text', required: false },
                { name: 'template', type: 'string', required: false, length: 50 },
                { name: 'status', type: 'string', required: true, default: 'draft', length: 20 },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });

        // Team members table
        this.tables.push({
            name: this.tableName('team_members'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'name', type: 'string', required: true, length: 100 },
                { name: 'position', type: 'string', required: true, length: 100 },
                { name: 'bio', type: 'text', required: false },
                { name: 'email', type: 'string', required: false, length: 255 },
                { name: 'photo_url', type: 'string', required: false, length: 500 },
                { name: 'order', type: 'integer', required: true, default: 0 },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });

        // Services table
        this.tables.push({
            name: this.tableName('services'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'title', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'description', type: 'text', required: true },
                { name: 'icon', type: 'string', required: false, length: 100 },
                { name: 'featured', type: 'boolean', required: true, default: false },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });
    }

    generateCustomStructure(analyzedData) {
        // Generic content table
        this.tables.push({
            name: this.tableName('content'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'title', type: 'string', required: true, length: 255 },
                { name: 'slug', type: 'string', required: true, length: 255, unique: true },
                { name: 'body', type: 'text', required: true },
                { name: 'type', type: 'string', required: true, length: 50 },
                { name: 'status', type: 'string', required: true, default: 'draft', length: 20 },
                { name: 'created_at', type: 'timestamp', required: true },
                { name: 'updated_at', type: 'timestamp', required: true }
            ]
        });
    }

    addMetadataTables() {
        this.tables.push({
            name: this.tableName('metadata'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'entity_type', type: 'string', required: true, length: 50 },
                { name: 'entity_id', type: 'integer', required: true },
                { name: 'meta_key', type: 'string', required: true, length: 100 },
                { name: 'meta_value', type: 'text', required: false },
                { name: 'created_at', type: 'timestamp', required: true }
            ]
        });
    }

    addMediaTables() {
        this.tables.push({
            name: this.tableName('media'),
            fields: [
                { name: 'id', type: 'integer', required: true, primaryKey: true, autoIncrement: true },
                { name: 'filename', type: 'string', required: true, length: 255 },
                { name: 'original_name', type: 'string', required: true, length: 255 },
                { name: 'mime_type', type: 'string', required: true, length: 100 },
                { name: 'size', type: 'integer', required: true },
                { name: 'url', type: 'string', required: true, length: 500 },
                { name: 'alt_text', type: 'string', required: false, length: 255 },
                { name: 'width', type: 'integer', required: false },
                { name: 'height', type: 'integer', required: false },
                { name: 'uploaded_at', type: 'timestamp', required: true }
            ]
        });
    }

    tableName(name) {
        return this.config.tablePrefix + name;
    }

    generateSQL() {
        const dbType = this.config.databaseType;

        switch (dbType) {
            case 'mysql':
                return this.generateMySQLSchema();
            case 'postgresql':
                return this.generatePostgreSQLSchema();
            case 'sqlite':
                return this.generateSQLiteSchema();
            case 'mongodb':
                return this.generateMongoDBSchema();
            default:
                return this.generateMySQLSchema();
        }
    }

    generateMySQLSchema() {
        let sql = `-- Generated MySQL Schema for ${this.config.projectName}\n`;
        sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

        this.tables.forEach(table => {
            sql += `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n`;
            
            const fieldDefinitions = table.fields.map(field => {
                let def = `  \`${field.name}\` ${this.mapTypeToMySQL(field)}`;
                
                if (field.required) def += ' NOT NULL';
                if (field.autoIncrement) def += ' AUTO_INCREMENT';
                if (field.default !== undefined) def += ` DEFAULT '${field.default}'`;
                if (field.unique) def += ' UNIQUE';
                
                return def;
            });

            // Add primary key
            const primaryKeys = table.fields.filter(f => f.primaryKey);
            if (primaryKeys.length > 0) {
                fieldDefinitions.push(`  PRIMARY KEY (\`${primaryKeys.map(f => f.name).join('`, `')}\`)`);
            }

            sql += fieldDefinitions.join(',\n');
            sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
        });

        return sql;
    }

    generatePostgreSQLSchema() {
        let sql = `-- Generated PostgreSQL Schema for ${this.config.projectName}\n`;
        sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

        this.tables.forEach(table => {
            sql += `CREATE TABLE IF NOT EXISTS "${table.name}" (\n`;
            
            const fieldDefinitions = table.fields.map(field => {
                let def = `  "${field.name}" ${this.mapTypeToPostgreSQL(field)}`;
                
                if (field.primaryKey && field.autoIncrement) def = `  "${field.name}" SERIAL PRIMARY KEY`;
                else {
                    if (field.required) def += ' NOT NULL';
                    if (field.default !== undefined) def += ` DEFAULT '${field.default}'`;
                    if (field.unique) def += ' UNIQUE';
                }
                
                return def;
            });

            sql += fieldDefinitions.join(',\n');
            sql += `\n);\n\n`;
        });

        return sql;
    }

    generateSQLiteSchema() {
        let sql = `-- Generated SQLite Schema for ${this.config.projectName}\n`;
        sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

        this.tables.forEach(table => {
            sql += `CREATE TABLE IF NOT EXISTS "${table.name}" (\n`;
            
            const fieldDefinitions = table.fields.map(field => {
                let def = `  "${field.name}" ${this.mapTypeToSQLite(field)}`;
                
                if (field.primaryKey) def += ' PRIMARY KEY';
                if (field.autoIncrement) def += ' AUTOINCREMENT';
                if (field.required) def += ' NOT NULL';
                if (field.default !== undefined) def += ` DEFAULT '${field.default}'`;
                if (field.unique) def += ' UNIQUE';
                
                return def;
            });

            sql += fieldDefinitions.join(',\n');
            sql += `\n);\n\n`;
        });

        return sql;
    }

    generateMongoDBSchema() {
        // Generate MongoDB JSON schema
        const schema = {
            database: this.config.projectName.toLowerCase().replace(/\s+/g, '_'),
            collections: this.tables.map(table => ({
                name: table.name,
                validator: {
                    $jsonSchema: {
                        bsonType: 'object',
                        required: table.fields.filter(f => f.required && !f.autoIncrement).map(f => f.name),
                        properties: this.generateMongoProperties(table.fields)
                    }
                }
            }))
        };

        return JSON.stringify(schema, null, 2);
    }

    generateMongoProperties(fields) {
        const properties = {};
        
        fields.forEach(field => {
            if (field.autoIncrement) return; // MongoDB uses _id

            properties[field.name] = {
                bsonType: this.mapTypeToMongo(field.type),
                description: `${field.name} field`
            };
        });

        return properties;
    }

    mapTypeToMySQL(field) {
        const typeMap = {
            'integer': 'INT',
            'string': `VARCHAR(${field.length || 255})`,
            'text': 'TEXT',
            'boolean': 'BOOLEAN',
            'date': 'DATE',
            'timestamp': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'decimal': `DECIMAL(${field.precision || 10},${field.scale || 2})`
        };
        return typeMap[field.type] || 'VARCHAR(255)';
    }

    mapTypeToPostgreSQL(field) {
        const typeMap = {
            'integer': 'INTEGER',
            'string': `VARCHAR(${field.length || 255})`,
            'text': 'TEXT',
            'boolean': 'BOOLEAN',
            'date': 'DATE',
            'timestamp': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'decimal': `DECIMAL(${field.precision || 10},${field.scale || 2})`
        };
        return typeMap[field.type] || 'VARCHAR(255)';
    }

    mapTypeToSQLite(field) {
        const typeMap = {
            'integer': 'INTEGER',
            'string': 'TEXT',
            'text': 'TEXT',
            'boolean': 'INTEGER',
            'date': 'TEXT',
            'timestamp': 'TEXT',
            'decimal': 'REAL'
        };
        return typeMap[field.type] || 'TEXT';
    }

    mapTypeToMongo(type) {
        const typeMap = {
            'integer': 'int',
            'string': 'string',
            'text': 'string',
            'boolean': 'bool',
            'date': 'date',
            'timestamp': 'date',
            'decimal': 'double'
        };
        return typeMap[type] || 'string';
    }
}

module.exports = SchemaGenerator;
