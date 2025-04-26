# Overview  
Project Brain is a centralized platform for architects to efficiently manage their projects through a knowledge graph RAG (Retrieval-Augmented Generation) system. The platform serves as a single source of truth for all project information, eliminating double-handling of data and ensuring that information entered once automatically populates across all relevant components.

The platform provides different portals tailored to specific user roles (Director, Team, Client, Builder), ensuring appropriate access to project information based on permissions. This enables architects like Marc and his team to streamline project management, improve collaboration with clients and builders, and maintain consistent data across all project touchpoints.

# Core Features  
## Project Brain Knowledge Graph
- **What it does**: Serves as the central repository for all project data, creating a unique knowledge graph for each project
- **Why it's important**: Eliminates data silos and ensures a single source of truth for all project information
- **How it works**: Auto-populates data across all relevant components when entered once, dynamically updates when files are uploaded/deleted

## Role-Based Access Control
- **What it does**: Provides tailored interfaces for Directors, Team members, Clients, and Builders
- **Why it's important**: Ensures users can only access information relevant to their role
- **How it works**: Permission system that filters project information based on user role, with authentication via Supabase

## Project Template System
- **What it does**: Allows creation of new projects from templates with pre-defined phases, tasks, checklists, and fee structures
- **Why it's important**: Standardizes project setup and reduces manual work
- **How it works**: Directors can create templates which serve as blueprints for new projects

## Document Management
- **What it does**: Centralizes file storage and retrieval for all project documents
- **Why it's important**: Ensures all stakeholders have access to the documents they need
- **How it works**: Role-based permissions determine who can upload, view, and download documents

## Task Management
- **What it does**: Organizes tasks by project phases with assignees and due dates
- **Why it's important**: Keeps projects on track and ensures accountability
- **How it works**: Tasks are created by Directors and visible to relevant stakeholders based on their roles

# User Experience  
## User Personas

**Marc (Director)**
- Needs comprehensive access to all project information
- Creates projects, assigns team members, and manages templates
- Requires robust admin tools for project oversight

**Sophie (Team Member)**
- Needs access to assigned projects only
- Views tasks and ticks off QA checklists
- Requires simplified interface focused on task completion

**Jamie (Client)**
- Needs access to their project information only
- Fills briefs, approves fees, and uploads files
- Requires intuitive interface with minimal complexity

**Jake (Builder)**
- Needs access to assigned projects only
- Views tasks, downloads plans, submits variations
- Requires construction-focused interface with easy document access

## Key User Flows

### Onboarding Flow
1. User receives invitation email with temporary credentials
2. User creates account with email/password or OAuth
3. User profile setup (name, professional details, contact info)
4. Role assignment by Director
5. Project assignment (if applicable)

### Director Flow
1. Dashboard with all active projects
2. Create new project from template
   - Enter core project information (address, client, scope)
   - Assign team members, clients, and builders
3. Project management dashboard with task creation, document management, fee proposals, and QA checklists
4. User and template management

### Client Flow
1. Login to portal (single project view if only one project)
2. Brief submission forms
3. Fee proposal review and approval
4. Document upload/download interface
5. Communication channel with team

## UI/UX Considerations
- Clean, professional interface with clear hierarchy of information
- Role-specific dashboards showing only relevant information
- Consistent navigation and intuitive workflows
- Mobile-responsive design for on-site access
- Clear visual indicators for pending actions and approvals

# Technical Architecture  
## System Components
- **Frontend**: Next.js application with App Router
  - Component library for consistent UI
  - State management for complex interactions
  - Responsive design for desktop and mobile
  
- **Backend**: Supabase for authentication and database
  - PostgreSQL database with row-level security
  - API routes for business logic
  - Storage for documents and files
  
- **Authentication**: Supabase Auth
  - JWT token handling for session management
  - OAuth integration with Google (optional)
  - Magic links for client access (optional)
  
- **Knowledge Graph RAG System** (placeholder for future implementation)
  - Document indexing and vector storage
  - Natural language processing capabilities
  - Retrieval mechanisms for project information

## Data Models
### User Data
- User profiles (name, email, role, etc.)
- Project assignments (many-to-many relationship)
- Role assignments per project

### Project Data
- Core project details (address, client, scope)
- Project phases with tasks
- Documents and files
- Fee proposals
- QA checklists
- Variations
- Comments and discussions

## APIs and Integrations
- Supabase API for data access and authentication
- Next.js API routes for business logic
- Future integrations with external systems (placeholders):
  - Council District Plan Maps
  - LINZ/Title information
  - H1 calculators
  - BRANZ maps and tools
  - Coastal/flood zones maps

## Infrastructure Requirements
- Serverless deployment for Next.js application
- Supabase instance for database and authentication
- Storage solution for documents and files
- CI/CD pipeline for continuous deployment

# Development Roadmap  
## Phase 1: Authentication & User Management (MVP)
- Implement Supabase authentication
  - Email/password login
  - User registration
  - Password reset flow
- Create user roles and permissions system
  - Role definition (Director, Team, Client, Builder)
  - Permission assignment per project
- Build login and account management UIs
  - Login screen
  - Registration screen
  - User profile page
- Basic user administration
  - User invitation system
  - Role assignment interface

## Phase 2: Project Dashboard & Basic Flows
- Create project creation workflow
  - Project information form
  - Template selection
  - User assignment interface
- Implement dashboard views for all roles
  - Director dashboard with all projects
  - Team dashboard with assigned projects
  - Client portal with single project view
  - Builder portal with assigned projects
- Basic document upload/download
  - Storage integration
  - Permission-based access control
  - Basic file organization
- Project overview screens
  - Project details display
  - Phase and task visualization
  - Team member listing

## Phase 3: Advanced Features
- Project template system
  - Template creation interface
  - Template management
  - Template application to new projects
- Task management system
  - Task creation and assignment
  - Due date tracking
  - Task status updates
- QA checklist system
  - Checklist creation
  - Permission-based marking
  - Completion tracking
- Fee proposal generator (placeholder)
  - Basic fee structure setup
  - Client approval workflow
- Variation tracker (placeholder)
  - Variation submission form
  - Approval workflow
  - Cost tracking

## Phase 4: Knowledge Graph RAG Integration (Future)
- Document indexing system
- Natural language processing for document content
- Search and retrieval mechanisms
- Automatic data population across components
- External system integrations

# Logical Dependency Chain
## Foundation Layer (Must be built first)
1. Authentication and user management system
   - This is the cornerstone of the application as all features depend on knowing who the user is and what they can access
   - Supabase auth implementation
   - User roles and permissions framework

2. Database schema and row-level security
   - Core data models for users and projects
   - Security policies that enforce permissions
   - Basic data access patterns

## Usable Frontend Layer (Getting to visible functionality)
3. Project creation and basic dashboard
   - Simple project creation form
   - Role-specific dashboard views
   - Project card displays
   - This provides immediate visual feedback that the system works

4. Document management basics
   - Simple upload/download functionality
   - Permission-based access controls
   - Basic file organization
   - This gives users tangible value right away

## Feature Enhancement Layer (Building upon foundation)
5. Task management system
   - Depends on project creation and user roles
   - Provides structure to project workflows
   - Enables assignment and tracking

6. Project templates
   - Depends on project creation being functional
   - Streamlines repetitive setup
   - Enforces standardization

7. QA checklists
   - Depends on task management
   - Adds quality control dimension
   - Provides accountability

## Advanced Features Layer (Progressive enhancement)
8. Fee proposals and variations
   - Builds on project data foundation
   - Adds financial dimension to projects
   - Requires client interaction flows to be in place

9. Knowledge graph RAG integration
   - Relies on all previous data structures
   - Enhances existing features rather than creating new ones
   - Can be incrementally implemented

# Risks and Mitigations  
## Technical Challenges
- **Risk**: Complexity of knowledge graph RAG implementation
  - **Mitigation**: Implement as placeholder first, with clear interfaces for future integration; focus on data structures that will support it later

- **Risk**: Performance issues with large projects and documents
  - **Mitigation**: Implement pagination, lazy loading, and efficient database queries; consider caching strategies

- **Risk**: Security vulnerabilities in permission system
  - **Mitigation**: Extensive testing of row-level security policies; regular security audits; implement principle of least privilege

## MVP Scoping
- **Risk**: Feature creep extending MVP timeline
  - **Mitigation**: Strictly define MVP as authentication and basic project viewing; prioritize features based on user value

- **Risk**: Building features that don't address core user needs
  - **Mitigation**: Focus on high-value, low-complexity features first; implement feedback mechanisms for early users

- **Risk**: Over-engineering initial implementation
  - **Mitigation**: Use proven patterns and libraries; avoid premature optimization; build for extensibility but start simple

## Resource Constraints
- **Risk**: Limited development resources for comprehensive platform
  - **Mitigation**: Modular architecture allowing for incremental development; leverage Supabase for rapid backend implementation

- **Risk**: UX design complexity across multiple user roles
  - **Mitigation**: Start with core user journeys; establish design system early; reuse components across different user interfaces

- **Risk**: Integration complexity with external systems
  - **Mitigation**: Begin with hardcoded links; design clean API interfaces for future integration; prioritize most valuable integrations

# Appendix  
## Success Metrics
- User adoption rates by role
- Time saved vs. previous workflow
- Reduction in data entry errors
- Project completion efficiency
- Client satisfaction scores

## Technical Specifications
- Next.js 14+ with App Router
- Supabase latest version with Row Level Security
- TypeScript for type safety
- Responsive design breakpoints (mobile, tablet, desktop)
- Progressive Web App capabilities
- Accessibility compliance (WCAG 2.1 AA)

## Future Considerations
- Mobile application development
- Offline capabilities for site visits
- Advanced reporting and analytics
- AI-assisted project planning
- Integration with BIM software
- Extended knowledge graph capabilities
