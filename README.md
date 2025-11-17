# Database Structure Generator

A powerful web application that automatically generates database structures from uploaded documents or directory contents. Perfect for quickly scaffolding database schemas for your website projects.

## Features

- 📁 **Multiple Input Methods**: Upload individual files or select entire directories
- 🎨 **Website Type Templates**: Pre-configured schemas for blogs, portfolios, e-commerce, documentation, corporate sites, and custom projects
- 💾 **Multi-Database Support**: Generate schemas for MySQL, PostgreSQL, MongoDB, and SQLite
- 🔄 **Smart Content Analysis**: Automatically analyzes JSON, CSV, XML, Markdown, and text files
- 📊 **Multiple Export Formats**: Download as SQL, JSON, Prisma schema, or TypeScript types
- ⚡ **Real-time Preview**: See your database structure before downloading
- 🎯 **Flexible Configuration**: Include metadata, images, API endpoints, and auto-detect relationships

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. Open your browser and navigate to:

```
http://localhost:3000
```

## Usage

### Basic Workflow

1. **Select Input Method**
   - Choose to upload individual files or select a directory
   - Supported file types: PDF, DOC, DOCX, TXT, JSON, XML, CSV, MD

2. **Configure Your Project**
   - Choose website type (blog, portfolio, e-commerce, etc.)
   - Enter project name
   - Select database type (MySQL, PostgreSQL, MongoDB, SQLite)

3. **Customize Options**
   - Toggle image management
   - Include metadata tables
   - Generate REST API endpoints
   - Auto-detect relationships

4. **Generate & Download**
   - Click "Generate Database Structure"
   - Review the generated schema
   - Download in your preferred format (SQL, JSON, Prisma, TypeScript)

### File Upload

- Drag and drop files onto the upload area
- Or click to browse and select files
- Remove unwanted files before generating

### Directory Selection

- Click "Browse" to select a folder
- All supported files in the directory will be processed
- View file count before generating

### Website Types

#### Blog
- Posts, categories, tags, authors, comments tables
- Perfect for content-driven websites

#### Portfolio
- Projects, skills, and relationships
- Ideal for showcasing work

#### E-commerce
- Products, categories, orders, customers
- Complete online store structure

#### Documentation
- Pages, sections, hierarchical structure
- Great for knowledge bases

#### Corporate
- Pages, team members, services
- Professional business websites

#### Custom
- Generic content tables
- Flexible structure for any project

## API Endpoints

### `POST /api/generate-schema`
Generate database schema from uploaded files

**Request**: multipart/form-data with files and configuration

**Response**:
```json
{
  "success": true,
  "projectName": "My Website",
  "databaseType": "mysql",
  "schema": "CREATE TABLE...",
  "tables": [...],
  "totalFields": 45,
  "metadata": {...}
}
```

### `GET /api/health`
Check server status

### `GET /api/supported-types`
Get list of supported file types and database options

## Configuration Options

### Basic Settings
- **Project Name**: Name of your website project
- **Website Type**: Template for database structure
- **Database Type**: Target database system

### Advanced Settings
- **File Encoding**: UTF-8, ASCII, or Latin-1
- **Table Prefix**: Add prefix to all table names (e.g., wp_, site_)
- **Max File Size**: Maximum upload size in MB

### Features
- **Include Images**: Add media management tables
- **Include Metadata**: Add flexible metadata tables
- **Generate API**: Plan for REST API endpoints
- **Auto Relations**: Automatically detect table relationships

## File Structure

```
.
├── index.html           # Main web interface
├── styles.css          # Styling and responsive design
├── app.js              # Client-side JavaScript
├── server.js           # Express server
├── schemaGenerator.js  # Schema generation logic
├── package.json        # Dependencies
└── README.md           # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **UI Framework**: HeroUI - Modern, dark-themed component library
- **Backend**: Node.js, Express
- **File Handling**: Multer
- **Database Support**: MySQL, PostgreSQL, MongoDB, SQLite

## Design

The application features a modern dark theme powered by HeroUI components:
- Gradient hero header with animated effects
- Dark-mode optimized cards and forms
- Smooth animations and transitions
- Responsive design for all screen sizes
- Custom scrollbar styling
- Interactive hover states and focus indicators

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

Run in development mode with auto-reload:

```bash
npm run dev
```

## Security Considerations

- File size limits enforced
- File type validation
- Temporary file cleanup after processing
- Input sanitization for SQL generation

## Future Enhancements

- [ ] Visual schema editor
- [ ] Import existing database structures
- [ ] Migration file generation
- [ ] Data seeding capabilities
- [ ] GraphQL schema generation
- [ ] Docker support
- [ ] Cloud deployment templates

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

Built with ❤️ for automated database structure generation
