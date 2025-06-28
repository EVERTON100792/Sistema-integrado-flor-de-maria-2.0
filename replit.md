# Flor de Maria - Sistema de Gestão Integrado (SGI)

## Overview

Flor de Maria is a complete Integrated Management System (SGI) designed for a small retail store. This is a front-end only application built with vanilla HTML5, CSS3, and JavaScript, featuring a sophisticated "Black & Gold" design theme. The system provides comprehensive business management capabilities including inventory, sales, customer management, cash flow tracking, and financial reporting.

## System Architecture

### Frontend Architecture
- **Pure Vanilla JavaScript**: No frameworks or libraries except for UI enhancements
- **Modular Design**: Each business function (clients, inventory, sales, etc.) is implemented as a separate JavaScript class
- **Single Page Application (SPA)**: All modules are contained within a single HTML file with dynamic content switching
- **Component-Based UI**: Reusable UI components like modals, notifications, and forms

### Core Technologies
- HTML5 for structure
- CSS3 with custom properties for styling and theming
- Vanilla JavaScript (ES6+ classes and modules)
- Chart.js for dashboard analytics and reporting
- Font Awesome for iconography
- Local Storage API for data persistence

### Design System
- **Theme**: Black & Gold color scheme (#000000, #111111, #E6B800)
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Typography**: Clean, modern font hierarchy
- **Interactive Elements**: Smooth animations and transitions

## Key Components

### Authentication System (`auth.js`)
- Simple credential-based login (hardcoded: maria/flor123)
- Session management
- Login form validation and animation

### Module System (`app.js`)
- Central application controller
- Module routing and navigation
- Responsive layout management
- Sidebar toggle functionality

### Data Management (`storage.js`)
- Local Storage abstraction layer
- Data versioning and migration
- Backup and restore capabilities
- Default data structure initialization

### Business Modules
1. **Dashboard** (`dashboard.js`) - Overview with KPIs and charts
2. **Clients** (`clients.js`) - Customer management and history
3. **Inventory** (`inventory.js`) - Product and stock management
4. **Sales** (`sales.js`) - Point of Sale (POS) system
5. **Cash Flow** (`cashflow.js`) - Financial transaction tracking
6. **Receivables** (`receivables.js`) - Accounts receivable management
7. **Expenses** (`expenses.js`) - Business expense tracking
8. **Reports** (`reports.js`) - Financial and business reporting
9. **Settings** (`settings.js`) - System configuration

### UI Components (`components.css`)
- Modal system for forms and detailed views
- Notification system for user feedback
- Data tables with sorting and filtering
- Form controls and input validation
- Loading states and animations

### Utility System (`utils.js`)
- Currency formatting (Brazilian Real)
- Date/time formatting utilities
- String manipulation helpers
- Validation functions
- ID generation

## Data Flow

### Data Storage Pattern
- All data is stored in browser's Local Storage
- Central storage manager handles CRUD operations
- Each module manages its own data subset
- Automatic data migration between versions

### Module Communication
- Modules communicate through the main App controller
- Shared data accessed via StorageManager
- Event-driven updates between related modules
- Notification system for user feedback

### State Management
- Each module maintains its own state
- Filtering and search states are module-specific
- Authentication state is globally managed
- UI state (sidebar, active module) managed by App controller

## External Dependencies

### CDN Resources
- Font Awesome 6.4.0 for icons
- Chart.js for data visualization
- No other external dependencies

### Browser APIs Used
- Local Storage API for data persistence
- Intersection Observer API for animations
- Fetch API (prepared for future server integration)

## Deployment Strategy

### Current Deployment
- Static file deployment (HTML, CSS, JS)
- Can be hosted on any web server
- No server-side requirements
- Works offline after initial load

### Future Considerations
- Ready for backend integration
- Database migration path prepared
- API endpoints can be easily added
- Progressive Web App (PWA) capabilities ready

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

### Additional Architecture Notes
- The system uses a Brazilian Portuguese interface
- Currency formatting follows Brazilian Real (BRL) standards
- Date formatting uses Brazilian DD/MM/YYYY format
- Responsive breakpoint at 768px for mobile devices
- Print-ready receipt generation capability
- Export functionality for reports and data