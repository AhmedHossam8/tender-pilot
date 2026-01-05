# 🚀 Project Transformation Plan: TenderPilot → ServiceHub

## Executive Summary

Transform the existing **TenderPilot** (tender review/proposal management system) into **ServiceHub** - a two-way marketplace where:
- **Clients** post projects they need completed
- **Service Providers** bid/apply for projects OR offer their services
- **Users** can hire services directly

This document outlines the transformation strategy, AI integration ideas, code reuse mapping, and a 1-week sprint plan for 4 developers.

---

## 📊 Current vs. Target Architecture

### Current System (TenderPilot)
| Module | Purpose |
|--------|---------|
| `tenders/` | Tender listings with documents, requirements, tags |
| `proposals/` | Proposals submitted against tenders, with sections and review workflow |
| `documents/` | Document upload, text extraction (PDF/DOCX) |
| `ai_engine/` | AI-powered analysis, compliance checks, proposal generation |
| `users/` | User auth with roles: Admin, Proposal Manager, Reviewer, Writer |

### Target System (ServiceHub)
| Module | Purpose | Reuse From |
|--------|---------|------------|
| `projects/` | Client-posted projects needing work | `tenders/` (80% reuse) |
| `bids/` | Service provider bids on projects | `proposals/` (70% reuse) |
| `services/` | Services offered by providers | NEW (30% from tenders) |
| `bookings/` | Hiring a service directly | NEW (use proposal workflow) |
| `documents/` | Attachments, portfolios | `documents/` (95% reuse) |
| `ai_engine/` | Smart matching, pricing, content generation | `ai_engine/` (60% reuse) |
| `users/` | Clients & Service Providers | `users/` (70% reuse) |
| `messaging/` | Chat between users | NEW |
| `reviews/` | Ratings & reviews | NEW |

---

## 🔄 Code Transformation Map

### 1. **Tenders → Projects** (High Reuse ~80%)

**Current `Tender` Model:**
```python
class Tender:
    title, issuing_entity, deadline, status, created_by, tags, requirements
```

**Transform to `Project` Model:**
```python
class Project:
    title             # KEEP
    description       # ADD (was in documents)
    client            # RENAME from created_by
    budget_min        # ADD
    budget_max        # ADD
    deadline          # KEEP
    status            # MODIFY choices: draft, open, in_progress, completed, cancelled
    category          # RENAME from issuing_entity → category FK
    skills_required   # ADD (M2M to Skill model)
    project_type      # ADD: fixed_price, hourly, milestone
    visibility        # ADD: public, private, invite_only
    created_at        # KEEP
    updated_at        # KEEP
```

**Reusable Components:**
- `TenderDocument` → `ProjectAttachment` (file upload, text extraction)
- `TenderRequirement` → `ProjectRequirement` (requirements list)
- `TenderTag` → `ProjectTag/Skill` (tagging system)
- All CRUD views/serializers with field renaming

### 2. **Proposals → Bids** (High Reuse ~70%)

**Current `Proposal` Model:**
```python
class Proposal:
    tender, created_by, title, status, ai_feedback, sections
```

**Transform to `Bid` Model:**
```python
class Bid:
    project           # RENAME from tender
    service_provider  # RENAME from created_by  
    cover_letter      # KEEP (was title + sections combined)
    proposed_amount   # ADD
    proposed_timeline # ADD (days to complete)
    status            # MODIFY: pending, shortlisted, accepted, rejected, withdrawn
    ai_score          # ADD (AI matching score)
    ai_feedback       # KEEP
    milestones        # ADD (JSON for milestone breakdown)
    created_at        # KEEP
    updated_at        # KEEP
```

**Reusable Components:**
- `ProposalSection` → `BidMilestone` or just JSON field
- `ProposalDocument` → `BidAttachment` (portfolio samples)
- `ProposalAuditLog` → `BidAuditLog` (tracking changes)
- Status workflow system with transitions

### 3. **Services Module** (New, ~30% from tenders)

```python
class Service:
    provider          # FK to User
    title             # Service name
    description       # Detailed description
    category          # FK to Category
    skills            # M2M to Skill
    pricing_type      # fixed, hourly, package
    base_price        # Starting price
    delivery_time     # Estimated delivery (days)
    packages          # JSON for Bronze/Silver/Gold packages
    portfolio_items   # M2M to PortfolioItem
    is_active         # Visibility toggle
    ai_optimized      # AI-improved description flag
    
class ServicePackage:
    service           # FK
    name              # Basic, Standard, Premium
    price
    delivery_days
    features          # JSON list
    revisions         # Number included
```

### 4. **Bookings Module** (New, uses Proposal workflow)

```python
class Booking:
    service           # FK to Service
    client            # FK to User
    package           # FK to ServicePackage (optional)
    custom_requirements # TextField
    agreed_price
    status            # pending, confirmed, in_progress, delivered, completed, disputed
    started_at
    delivered_at
    completed_at
```

### 5. **Users Module** (Modify ~70% reuse)

**Current Roles:**
```python
ADMIN, PROPOSAL_MANAGER, REVIEWER, WRITER
```

**New Roles & Profile:**
```python
class UserType(models.TextChoices):
    CLIENT = 'client', 'Client'
    PROVIDER = 'provider', 'Service Provider'
    BOTH = 'both', 'Both'
    ADMIN = 'admin', 'Admin'

class UserProfile:
    user              # OneToOne
    user_type         # Client/Provider/Both
    bio               # About me
    headline          # Professional tagline
    skills            # M2M to Skill
    hourly_rate       # For providers
    location          # City/Country
    languages         # JSON array
    portfolio_url     # External portfolio
    verified          # Identity verified
    ai_profile_score  # AI-calculated profile completeness
```

### 6. **Reviews Module** (New)

```python
class Review:
    reviewer          # FK to User
    reviewee          # FK to User
    project           # FK to Project (optional)
    booking           # FK to Booking (optional)
    rating            # 1-5
    comment           # Text
    ai_sentiment      # AI-analyzed sentiment score
    is_public         # Visibility

class ReviewResponse:
    review            # FK
    responder         # FK to User
    response_text
```

### 7. **Messaging Module** (New)

```python
class Conversation:
    participants      # M2M to User
    project           # FK to Project (optional context)
    booking           # FK to Booking (optional context)
    created_at

class Message:
    conversation      # FK
    sender            # FK to User
    content           # Text
    attachments       # JSON
    is_read           # Boolean
    ai_flagged        # AI moderation flag
    created_at
```

---

## 🤖 AI Integration Ideas (Creative & Functional)

### 1. **Smart Matching Engine** ⭐
Reuses: `analysis_service.py`, `ranking.py`

```python
class AIMatchingService:
    """
    Match projects with best-fit service providers
    Match clients with relevant services
    """
    
    def match_providers_to_project(self, project_id):
        """
        Analyze project requirements and find top matching providers
        Returns: ranked list with match scores and explanations
        """
        
    def match_services_to_client(self, client_id, query):
        """
        Based on client history and current query, recommend services
        """
        
    def calculate_compatibility_score(self, project, provider):
        """
        Multi-factor scoring: skills, experience, reviews, price, availability
        """
```

**Prompt Template:**
```
Analyze this project and rank these service providers by fit:

PROJECT:
{project_description}
Required Skills: {skills}
Budget: {budget_range}
Timeline: {deadline}

PROVIDERS:
{provider_profiles}

Return JSON with:
- provider_id
- match_score (0-100)
- matching_skills
- potential_concerns
- recommendation_reason
```

### 2. **AI-Powered Bid Assistant** ⭐
Reuses: `proposal_generation.py`, `text_generation.py`

```python
class AIBidAssistant:
    """Help service providers write winning bids"""
    
    def generate_cover_letter(self, project, provider_profile):
        """Generate personalized cover letter"""
        
    def suggest_pricing(self, project, market_data, provider_history):
        """AI-suggested competitive pricing"""
        
    def improve_bid(self, current_bid):
        """Suggestions to improve bid quality"""
        
    def generate_questions(self, project):
        """Smart questions to ask the client"""
```

### 3. **Service Description Optimizer** ⭐
Reuses: `summarization.py`

```python
class AIServiceOptimizer:
    """Help providers create compelling service listings"""
    
    def optimize_description(self, raw_description):
        """Rewrite for clarity, SEO, and conversion"""
        
    def suggest_packages(self, service_type, market_data):
        """Suggest pricing tiers based on market"""
        
    def generate_faq(self, service):
        """Auto-generate relevant FAQs"""
```

### 4. **Project Scope Analyzer** ⭐
Reuses: `tender_analysis.py`, `compliance_check.py`

```python
class AIProjectAnalyzer:
    """Help clients define and refine projects"""
    
    def analyze_requirements(self, description):
        """
        Extract: required skills, estimated budget, timeline, complexity
        """
        
    def suggest_milestones(self, project):
        """Break down project into logical milestones"""
        
    def check_completeness(self, project):
        """Identify missing information in project posting"""
        
    def estimate_budget(self, project):
        """Market-based budget estimation"""
```

### 5. **Smart Search & Discovery**
New feature

```python
class AISearchService:
    """Natural language search for projects and services"""
    
    def semantic_search(self, query, search_type):
        """
        'I need someone to build a React dashboard'
        → Returns relevant services AND providers AND similar projects
        """
        
    def auto_categorize(self, content):
        """Automatically assign categories and tags"""
```

### 6. **Review Analyzer**
New feature

```python
class AIReviewAnalyzer:
    """Analyze and summarize reviews"""
    
    def summarize_reviews(self, user_id):
        """Generate summary of all reviews for a user"""
        
    def detect_sentiment(self, review_text):
        """Positive/negative/neutral with confidence"""
        
    def flag_suspicious(self, review):
        """Detect fake or policy-violating reviews"""
```

### 7. **Chat Assistant / Copilot**
New feature

```python
class AIChatCopilot:
    """Help users during conversations"""
    
    def suggest_response(self, conversation_context):
        """Suggest professional response"""
        
    def summarize_conversation(self, conversation):
        """TL;DR of long conversations"""
        
    def extract_action_items(self, conversation):
        """Pull out agreed deliverables, deadlines, prices"""
```

### 8. **Content Moderation**
New feature

```python
class AIModeration:
    """Keep platform safe"""
    
    def moderate_content(self, content):
        """Flag inappropriate content"""
        
    def detect_contact_sharing(self, text):
        """Detect attempts to share contact outside platform"""
        
    def spam_detection(self, user_activity):
        """Detect spam patterns"""
```

---

## 📱 Frontend Transformation

### Pages to Transform

| Current Page | New Page | Changes |
|-------------|----------|---------|
| `TendersListPage` | `ProjectsListPage` | Rename fields, add filters for budget/skills |
| `TenderCreatePage` | `ProjectCreatePage` | Add budget, skills picker, AI scope analyzer |
| `TenderDetailPage` | `ProjectDetailPage` | Show bids, AI match scores |
| `ProposalList` | `BidsListPage` | Show sent/received bids |
| `ProposalCreate` | `BidCreatePage` | Add AI bid assistant |
| `ProposalDetail` | `BidDetailPage` | Show AI score, comparison |
| `AIDashboard` | `AIDashboard` | Keep, add matching analytics |

### New Pages Needed

| Page | Purpose |
|------|---------|
| `ServicesListPage` | Browse services marketplace |
| `ServiceCreatePage` | Create service listing |
| `ServiceDetailPage` | View service with packages |
| `BookServicePage` | Book/hire a service |
| `ProviderProfilePage` | Public provider profile |
| `ClientDashboard` | Client's projects, bookings |
| `ProviderDashboard` | Provider's services, bids, earnings |
| `MessagesPage` | Conversations list |
| `ChatPage` | Individual conversation |
| `ReviewsPage` | User reviews list |

### Component Mapping

| Current Component | Reuse For |
|------------------|-----------|
| `proposals/` components | Bids components |
| `TenderCard` | `ProjectCard`, `ServiceCard` |
| `ProposalForm` | `BidForm`, `ServiceForm` |
| `AIProcessingBadge` | Keep for AI features |
| `LoadingSpinner`, `EmptyState` | Keep as-is |
| `auth/` components | Keep as-is |

---

## 🗓️ 1-Week Sprint Plan (4 Full-Stack Developers)

### Team Roles (Feature-Based Ownership)

| Developer | Feature Domain | Responsibilities |
|-----------|---------------|------------------|
| **Dev A** | Projects & Categories | Full-stack: Projects module (backend models, APIs, frontend pages) |
| **Dev B** | Bids & AI Matching | Full-stack: Bids module + AI matching/scoring integration |
| **Dev C** | Services & Bookings | Full-stack: Services marketplace + booking system |
| **Dev D** | Users, Messaging & Reviews | Full-stack: Profiles, chat system, reviews |

**All developers need:** Django, DRF, React, TailwindCSS, basic AI/API integration

---

### 📅 Day 1 (Monday): Foundation & Setup

#### Dev A - Projects Foundation (Full-Stack)
**Backend:**
- [ ] Create `Category` and `Skill` models
- [ ] Transform `Tender` → `Project` model (add budget, skills, visibility fields)
- [ ] Create `ProjectAttachment`, `ProjectRequirement` models
- [ ] Basic serializers for Project, Category, Skill

**Frontend:**
- [ ] Copy `pages/Tenders/` → `pages/Projects/`
- [ ] Rename components and update imports
- [ ] Create `project.service.js` API service
- [ ] Update `App.jsx` routing for `/projects/*`

#### Dev B - Bids Foundation (Full-Stack)
**Backend:**
- [ ] Transform `Proposal` → `Bid` model (add amount, timeline, ai_score)
- [ ] Create `BidMilestone`, `BidAttachment` models
- [ ] Update status workflow (pending → shortlisted → accepted/rejected)
- [ ] Basic serializers for Bid models

**Frontend:**
- [ ] Copy `pages/proposals/` → `pages/Bids/`
- [ ] Rename components and update imports
- [ ] Create `bid.service.js` API service
- [ ] Update `App.jsx` routing for `/bids/*`

#### Dev C - Services Foundation (Full-Stack)
**Backend:**
- [ ] Create new `services` Django app
- [ ] Create `Service`, `ServicePackage` models
- [ ] Create `Booking` model with status workflow
- [ ] Basic serializers for Service, Package, Booking

**Frontend:**
- [ ] Create `pages/Services/` directory structure
- [ ] Create `service.service.js`, `booking.service.js` API services
- [ ] Create base `ServiceCard` component
- [ ] Update `App.jsx` routing for `/services/*`, `/bookings/*`

#### Dev D - Users & Profiles Foundation (Full-Stack)
**Backend:**
- [ ] Update `User` model with `user_type` (client/provider/both)
- [ ] Create `UserProfile` model (bio, skills, hourly_rate, etc.)
- [ ] Update user serializers with profile data
- [ ] Create profile API endpoints

**Frontend:**
- [ ] Create `pages/Profile/` directory structure
- [ ] Update auth context for new user types
- [ ] Create `ProviderCard`, `SkillBadge` components
- [ ] Update registration flow for user type selection

---

### 📅 Day 2 (Tuesday): Core CRUD & APIs

#### Dev A - Projects CRUD (Full-Stack)
**Backend:**
- [ ] Projects ViewSet (list, create, retrieve, update, delete)
- [ ] Categories & Skills CRUD APIs
- [ ] Search & filter endpoints (by category, budget, skills, status)
- [ ] Permissions (only client can edit own projects)

**Frontend:**
- [ ] `ProjectsListPage` with filters (category, budget range, skills)
- [ ] `ProjectCreatePage` with multi-step form
- [ ] `ProjectDetailPage` showing project info
- [ ] `ProjectEditPage` for project owners
- [ ] Wire all pages to backend APIs

#### Dev B - Bids CRUD + AI Setup (Full-Stack)
**Backend:**
- [ ] Bids ViewSet with status transitions
- [ ] Endpoint: Submit bid, Accept/Reject bid, Withdraw bid
- [ ] Create AI prompt templates for matching & bid generation
- [ ] Set up `AIMatchingService` stub with basic scoring

**Frontend:**
- [ ] `BidsListPage` with tabs (Sent Bids / Received Bids)
- [ ] `BidCreatePage` with form + AI assist button placeholder
- [ ] `BidDetailPage` with status actions
- [ ] Wire to backend APIs

#### Dev C - Services CRUD (Full-Stack)
**Backend:**
- [ ] Services ViewSet (CRUD for service listings)
- [ ] ServicePackage nested endpoints
- [ ] Booking ViewSet with status workflow
- [ ] Search/filter services by category, price, skills

**Frontend:**
- [ ] `ServicesListPage` (marketplace grid view)
- [ ] `ServiceCreatePage` with package builder UI
- [ ] `ServiceDetailPage` with packages display
- [ ] `BookServicePage` booking flow

#### Dev D - Profiles & Dashboard (Full-Stack)
**Backend:**
- [ ] Profile ViewSet (view/update profile)
- [ ] Public profile endpoint (for viewing other users)
- [ ] Provider stats endpoint (completed projects, rating)
- [ ] Client stats endpoint (posted projects, hired count)

**Frontend:**
- [ ] `ProviderProfilePage` (public view with portfolio)
- [ ] `EditProfilePage` for updating profile/skills
- [ ] `ClientDashboard` (my projects, my bookings)
- [ ] `ProviderDashboard` (my services, my bids, earnings)

---

### 📅 Day 3 (Wednesday): AI Integration & Advanced Features

#### Dev A - Project AI Features (Full-Stack)
**Backend:**
- [ ] Implement `AIProjectAnalyzer.analyze_requirements()`
- [ ] Implement `AIProjectAnalyzer.estimate_budget()`
- [ ] Implement `AIProjectAnalyzer.suggest_milestones()`
- [ ] API endpoints: `/api/v1/ai/project/{id}/analyze/`

**Frontend:**
- [ ] Add AI "Analyze My Project" button on create/edit
- [ ] Display AI suggestions (skills, budget, milestones)
- [ ] "Accept suggestion" flow to auto-fill fields
- [ ] AI loading states and error handling

#### Dev B - AI Matching & Bid Assistant (Full-Stack)
**Backend:**
- [ ] Implement `AIMatchingService.match_providers_to_project()`
- [ ] Implement `AIBidAssistant.generate_cover_letter()`
- [ ] Implement `AIBidAssistant.suggest_pricing()`
- [ ] API endpoints: `/api/v1/ai/match/`, `/api/v1/ai/bid/generate/`

**Frontend:**
- [ ] Show AI match scores on `ProjectDetailPage` (for providers)
- [ ] "AI Write Cover Letter" button on `BidCreatePage`
- [ ] "AI Suggest Price" feature
- [ ] Display match score badges on bid cards

#### Dev C - Service AI & Booking Flow (Full-Stack)
**Backend:**
- [ ] Implement `AIServiceOptimizer.optimize_description()`
- [ ] Implement `AIServiceOptimizer.suggest_packages()`
- [ ] Booking confirmation/notification logic
- [ ] API endpoint: `/api/v1/ai/service/optimize/`

**Frontend:**
- [ ] "AI Improve Description" button on `ServiceCreatePage`
- [ ] AI-suggested packages display
- [ ] Complete booking flow (select package → confirm → payment placeholder)
- [ ] Booking status tracking UI

#### Dev D - Search & Discovery (Full-Stack)
**Backend:**
- [ ] Implement `AISearchService.semantic_search()`
- [ ] Unified search endpoint (projects + services + providers)
- [ ] Auto-categorization for new content
- [ ] API endpoint: `/api/v1/search/`

**Frontend:**
- [ ] Global search bar in header
- [ ] Search results page with tabs (Projects/Services/Providers)
- [ ] AI-powered "Similar to this" recommendations
- [ ] Recent searches / saved searches

---

### 📅 Day 4 (Thursday): Communication & Social Features

#### Dev A - Notifications System (Full-Stack)
**Backend:**
- [ ] Create `Notification` model
- [ ] Notification triggers (new bid, bid accepted, project awarded)
- [ ] Notification API endpoints
- [ ] Mark as read functionality

**Frontend:**
- [ ] Notification bell icon in header
- [ ] Notifications dropdown/panel
- [ ] Notifications page (all notifications)
- [ ] Real-time badge count update

#### Dev B - AI Analytics & Dashboard (Full-Stack)
**Backend:**
- [ ] Update AI analytics for new content types
- [ ] Match success rate tracking
- [ ] AI usage per feature tracking
- [ ] Cost analytics updates

**Frontend:**
- [ ] Update `AIDashboard` with new metrics
- [ ] Match analytics charts
- [ ] AI feature usage breakdown
- [ ] Cost monitoring display

#### Dev C - Messaging System (Full-Stack)
**Backend:**
- [ ] Create `Conversation`, `Message` models
- [ ] Messaging API (create conversation, send message, get messages)
- [ ] Unread count endpoint
- [ ] Optional: Django Channels for real-time

**Frontend:**
- [ ] `MessagesPage` (conversation list)
- [ ] `ChatPage` (individual conversation)
- [ ] Message input with send button
- [ ] Unread indicators

#### Dev D - Reviews System (Full-Stack)
**Backend:**
- [ ] Create `Review`, `ReviewResponse` models
- [ ] Review API (create, list, respond)
- [ ] Average rating calculation
- [ ] AI sentiment analysis integration

**Frontend:**
- [ ] Star rating component
- [ ] Review form (after project/booking completion)
- [ ] Reviews list on profile pages
- [ ] Review response UI

---

### 📅 Day 5 (Friday): Polish & Integration

#### Dev A - Projects Polish (Full-Stack)
- [ ] Project status transitions (open → in_progress → completed)
- [ ] Project completion flow
- [ ] Invite-only projects feature
- [ ] Unit tests for Project APIs
- [ ] Fix any project-related bugs

#### Dev B - Bids & AI Polish (Full-Stack)
- [ ] Bid comparison view for clients
- [ ] AI confidence scores display
- [ ] Improve AI prompts based on testing
- [ ] Unit tests for Bid & AI APIs
- [ ] Fix any bid/AI-related bugs

#### Dev C - Services Polish (Full-Stack)
- [ ] Service analytics (views, bookings)
- [ ] Favorite/save services feature
- [ ] Booking calendar/availability (basic)
- [ ] Unit tests for Service & Booking APIs
- [ ] Fix any service-related bugs

#### Dev D - Social & UX Polish (Full-Stack)
- [ ] AI-powered chat suggestions (basic)
- [ ] Review summary on profiles
- [ ] Profile completeness indicator
- [ ] Unit tests for Profile, Message, Review APIs
- [ ] Fix any related bugs

---

### 📅 Day 6 (Saturday): Testing & Integration

#### All Developers - Morning
- [ ] **Dev A:** Integration test: Project → Bid flow
- [ ] **Dev B:** Integration test: AI matching accuracy
- [ ] **Dev C:** Integration test: Service → Booking flow
- [ ] **Dev D:** Integration test: User journey (register → post → hire)

#### All Developers - Afternoon
- [ ] Cross-feature bug fixes
- [ ] Performance testing (API response times)
- [ ] Security review (permissions, rate limits)
- [ ] i18n: Add new translation strings
- [ ] Mobile responsiveness fixes

---

### 📅 Day 7 (Sunday): Launch Prep

#### Dev A - Database & Backend Prep
- [ ] Final migration review
- [ ] Database indexes optimization
- [ ] Seed data script for demo
- [ ] Environment variables documentation

#### Dev B - AI & Monitoring
- [ ] AI rate limits configuration
- [ ] AI caching verification
- [ ] Monitoring dashboards setup
- [ ] Error alerting setup

#### Dev C - Frontend Build & Deploy
- [ ] Production build testing
- [ ] Asset optimization
- [ ] Loading/error states audit
- [ ] Browser compatibility check

#### Dev D - Documentation & Demo
- [ ] Update README with new features
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Demo flow script
- [ ] Screenshot gallery for docs

#### All Developers - Final Hour
- [ ] Smoke test all features
- [ ] Final bug fixes
- [ ] Git tags / release notes
- [ ] Celebrate! 🎉

---

## 🔧 Database Migration Strategy

### Phase 1: Non-Destructive
```bash
# Add new fields to existing models (nullable)
python manage.py makemigrations
python manage.py migrate
```

### Phase 2: Data Migration
```python
# migrations/0002_transform_data.py
def migrate_tenders_to_projects(apps, schema_editor):
    Tender = apps.get_model('tenders', 'Tender')
    Project = apps.get_model('projects', 'Project')
    
    for tender in Tender.objects.all():
        Project.objects.create(
            title=tender.title,
            client=tender.created_by,
            deadline=tender.deadline,
            status=map_status(tender.status),
            # ... other fields
        )
```

### Phase 3: Cleanup
```bash
# After verification, remove old tables
# OR keep for reference with deprecation flag
```

---

## 📋 Environment Variables (New)

```env
# Existing
GEMINI_API_KEY=xxx
OPENAI_API_KEY=xxx

# New
PLATFORM_FEE_PERCENT=10
MIN_PROJECT_BUDGET=50
MAX_PROJECT_BUDGET=100000
AI_MATCH_CACHE_TTL=3600
ENABLE_MESSAGING=true
ENABLE_AI_SUGGESTIONS=true
```

---

## ✅ Definition of Done (Week End)

### Must Have (MVP)
- [ ] Users can register as Client or Provider
- [ ] Clients can post projects with requirements
- [ ] Providers can browse and bid on projects
- [ ] Basic AI matching showing compatibility scores
- [ ] Providers can create service listings
- [ ] Basic messaging between users
- [ ] Status workflow for bids (accept/reject)

### Should Have
- [ ] AI-powered bid suggestions
- [ ] Search with filters
- [ ] User profiles with skills
- [ ] Service packages

### Nice to Have
- [ ] Reviews system
- [ ] AI content optimization
- [ ] Advanced analytics
- [ ] Real-time notifications

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Project posting flow works | ✅ |
| Bid submission flow works | ✅ |
| AI matching returns results | ✅ |
| Service listing flow works | ✅ |
| Basic messaging works | ✅ |
| No critical bugs | ✅ |
| Mobile responsive | ✅ |

---

## 🚨 Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Migration breaks existing data | Test on staging first, keep backups |
| AI costs spike | Implement strict rate limits, caching |
| Feature creep | Strict MVP scope, backlog extras |
| Integration issues | Daily standups, clear API contracts |
| Timeline slip | Cut nice-to-haves, focus on core |

---

## 📚 Quick Reference: File Renaming

```
# Backend
apps/tenders/     → apps/projects/
apps/proposals/   → apps/bids/
apps/services/    → NEW
apps/bookings/    → NEW  
apps/messaging/   → NEW
apps/reviews/     → NEW

# Frontend
pages/Tenders/    → pages/Projects/
pages/proposals/  → pages/Bids/
pages/Services/   → NEW
pages/Messages/   → NEW
pages/Profile/    → NEW
```

---

## 💡 Naming Conventions

| Old Term | New Term |
|----------|----------|
| Tender | Project |
| Proposal | Bid |
| Issuing Entity | Category |
| Requirement | Requirement (keep) |
| Proposal Manager | Client |
| Writer | Service Provider |
| Reviewer | (remove role) |

---

## 🔗 API Endpoints Mapping

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/api/v1/tenders/` | `/api/v1/projects/` |
| `/api/v1/proposals/` | `/api/v1/bids/` |
| `/api/v1/ai/tender/{id}/analyze` | `/api/v1/ai/project/{id}/analyze` |
| `/api/v1/ai/tender/{id}/outline` | `/api/v1/ai/bid/generate` |
| NEW | `/api/v1/services/` |
| NEW | `/api/v1/bookings/` |
| NEW | `/api/v1/messages/` |
| NEW | `/api/v1/ai/match/` |

---

## 🎉 Conclusion

This transformation maximizes code reuse (~60-70% overall) while creating a modern two-way marketplace. The AI engine becomes a powerful differentiator with smart matching, content generation, and assistance features.

**Total Effort Estimate:** 
- 4 developers × 7 days = 28 developer-days
- MVP achievable with focused execution
- Full feature set may extend 1-2 additional weeks

**Recommended Next Steps:**
1. Review this plan with the team
2. Set up project board with tasks
3. Create feature branches
4. Begin Day 1 tasks

---

*Document Version: 1.0*
*Created: January 1, 2026*
*Platform Codename: ServiceHub*
