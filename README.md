# Final Project Submission

Now it is time to put all these new tools to use to build something! ✨

## Details

**Team:** Zero Error Unit  
**Members:**  
- Yunhao Hu (yh2233)  
- Zizheng Dong (zd252)

## Project Links

- **Deployed Project:** cs5356-final-zeta.vercel.app
- **Source Code:** https://github.com/zizhengdong0412/cs5356-final

## Idea  
For now, we're creating a "Social Recipe Binders"
A Next.js full-stack web app that allows users to sign up and sign in
Users can create Recipe Binders, which contain many Recipes.
Domain: Recipes have a list of tuples of ingredients and amounts (in domain-specific units). They also have an ordered list of steps.
Users can share individual recipes or entire Recipe Binders with other users.

## Prototypes  
[Attach any prototype images or sketches you used to plan your project.]

## Starter Code  
[If applicable, mention any starter code or boilerplate you used.]

## Technology Choices  
[List major dependencies like: React, Vercel, Better Auth, Drizzle ORM, etc.]  
*If you used anything not covered in class, briefly explain why.*

## Learnings  
[Reflect on what surprised you – what was harder, easier, or most rewarding?]
## Logistics

1. run " npx drizzle-kit push "
2. run " npm run dev "

## Database & Data Layer

PostgreSQL database with Drizzle ORM
UUID primary keys for all tables
Required timestamp fields (created_at, updated_at) on all tables
Schema defined in /src/schema/* with specific files for users, sessions, recipes
Structured JSON for storing recipe and step details
Cascading deletes properly configured for foreign key relationships

## Authentication & Authorization
BetterAuth (NextAuth v5) for authentication
Multiple auth providers: Google OAuth + Email
Protected routes via middleware (all pages under /dashboard, /recipes, /binders)
Role/permission system for shared content access
Sharing links with different permission levels (view/edit/admin)

## Project Architecture
Next.js 14 with App Router
Domain-based structure (/auth, /recipes, /binders)
Separation between UI and logic layers
Server components by default with client components as needed
React Context for global auth state
React hooks for async logic
API routes under /src/app/api/* following RESTful conventions

## Frontend/UI
Semantic HTML with responsive design
Tailwind CSS for styling
Framer Motion for animations
Reusable atomic UI components
Advanced UI features like drag-and-drop or interactive editors
Optimistic UI updates for mutations

## Core Features
Recipe creation/editing/deletion with metadata and images
Organization of recipes into binders
Binder sharing via email or link
Permission-based access control
Audit logging for important actions

## Deployment & DevOps
CI/CD with GitHub Actions
Deployment to Vercel
Environment variables management
Database migrations through Drizzle Kit

## Project Flow
Users authenticate via sign-in/sign-up pages
Authenticated users access their dashboard
Users can create/edit/delete their recipes
Recipes can be organized into binders
Binders can be shared with different permission levels
All actions are tracked with proper error handling and loading states

