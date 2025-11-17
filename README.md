# Data Schema Designer

An enterprise-grade database schema generator designed for business applications. Transform your data files into professionally designed database structures with intelligent layout templates and multi-platform support.

## Features

- 📊 **6 Professional Layout Templates**: Relational, Analytical Warehouse, Document Store, Denormalized Performance, Hybrid Multi-Model, and Time-Series Data
- 📁 **Flexible Input Methods**: Upload individual files or select entire directories
- � **Business-Centric Templates**: Pre-configured schemas for CRM, E-Commerce, Inventory, HR, Financial, Analytics, and more
- 💾 **Multi-Database Support**: Generate schemas for MySQL, PostgreSQL, MongoDB, and SQLite
- 🔄 **Smart Content Analysis**: Automatically analyzes JSON, CSV, XML, Markdown, PDF, DOC, and text files
- 📊 **Multiple Export Formats**: Download as SQL, JSON, Prisma schema, or TypeScript types
- ⚡ **Real-time Preview**: See your database structure before downloading
- � **Clean UI**: Professional light theme design inspired by Shopify's interface
- 🔧 **Advanced Configuration**: Encoding options, table prefixes, audit fields, and auto-relationships

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
   - Supported file types: JSON, CSV, XML, PDF, DOC, DOCX, TXT, MD

2. **Choose Data Layout Template**
   - Select from 6 professional layout options optimized for different use cases
   - Relational, Analytical, Document, Denormalized, Hybrid, or Time-Series

3. **Configure Your Project**
   - Choose business application type (CRM, E-Commerce, Analytics, HR, Financial, etc.)
   - Enter project name
   - Select target database platform (MySQL, PostgreSQL, MongoDB, SQLite)

4. **Customize Options**
   - Toggle media/asset management
   - Include audit fields (timestamps, authors, versions)
   - Generate REST API documentation
   - Auto-detect relationships and foreign keys

5. **Generate & Export**
   - Click "Generate Database Schema"
   - Review the generated structure
   - Export in your preferred format (SQL, JSON, Prisma, TypeScript)

### File Upload

- Drag and drop files onto the upload area
- Or click to browse and select files
- Remove unwanted files before generating

### Directory Selection

- Click "Browse" to select a folder
- All supported files in the directory will be processed
- View file count before generating

## Data Layout Templates

### Relational Standard (Recommended)
Traditional normalized schema with foreign keys and relationships. Best for transactional business applications with complex data relationships.

### Analytical Warehouse
Star schema optimized for data warehousing and business intelligence. Ideal for reporting and analytics workloads.

### Document Store
Flexible JSON-based schema for MongoDB and NoSQL databases. Perfect for semi-structured or rapidly evolving data models.

### Denormalized Performance
Optimized for read-heavy workloads with redundant data. Suitable for high-performance applications with minimal writes.

### Hybrid Multi-Model
Combines relational and document models for maximum flexibility. Great for applications requiring both structured and unstructured data.

### Time-Series Data
Optimized for temporal data with timestamps and metrics. Designed for IoT, monitoring, and analytics applications.

### Business Application Types

- **Content Management / Blog**: Posts, categories, tags, authors, comments
- **E-Commerce / Retail**: Products, orders, customers, inventory, payments
- **CRM / Customer Data**: Contacts, accounts, opportunities, activities
- **Inventory Management**: Stock, warehouses, suppliers, purchase orders
- **Analytics / Reporting**: Metrics, dimensions, facts, aggregations
- **HR / Employee Management**: Employees, departments, payroll, attendance
- **Financial / Accounting**: Transactions, accounts, ledgers, invoices
- **Portfolio / Projects**: Projects, skills, clients, deliverables
- **Documentation / Knowledge Base**: Articles, sections, categories, versions
- **Corporate Website**: Pages, team members, services, testimonials
- **Custom Business Logic**: Flexible schema for unique requirements

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

## API Endpoints

### Basic Settings
- **Project Name**: Name of your business application
- **Application Type**: Template for database structure
- **Database Platform**: Target database system
- **Layout Template**: Professional schema design pattern

### Advanced Settings
- **File Encoding**: UTF-8, ASCII, or Latin-1
- **Table Prefix**: Add prefix to all table names (e.g., app_, tbl_, prod_)
- **Max File Size**: Maximum upload size in MB (up to 500MB)

### Features
- **Include Media**: Add asset management tables for files and images
- **Include Audit Fields**: Add timestamps, authors, and version tracking
- **Generate API Docs**: Plan for REST API endpoints
- **Auto Relations**: Automatically detect table relationships and foreign keys

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
- **UI Design**: Custom light theme inspired by Shopify's design system
- **Backend**: Node.js, Express
- **File Handling**: Multer
- **Database Support**: MySQL, PostgreSQL, MongoDB, SQLite

## Design Philosophy

The application features a clean, professional light theme designed for business users:
- Modern Shopify-inspired layout with card-based interface
- Professional color palette (Shopify green primary: #008060)
- Clear visual hierarchy with numbered steps
- Interactive layout selection cards with visual previews
- Responsive design optimized for desktop and mobile
- Business-centric terminology and workflows

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

- [ ] Visual schema editor with drag-and-drop
- [ ] Import existing database structures for migration
- [ ] Automated migration file generation
- [ ] Sample data generation and seeding
- [ ] GraphQL schema generation support
- [ ] Real-time collaboration features
- [ ] Version control and schema history
- [ ] Docker deployment templates
- [ ] Cloud platform integration (AWS, Azure, GCP)
- [ ] Schema validation and optimization suggestions

## Target Users

- **Data Architects**: Design complex enterprise database schemas
- **Software Developers**: Quickly scaffold database structures for new projects
- **Business Analysts**: Transform business requirements into data models
- **Database Administrators**: Generate standardized schema templates
- **Product Managers**: Prototype data structures for new features

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

Built for enterprise data design and business application development
