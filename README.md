# Tender Pilot 🚀

> **AI-Powered Service Marketplace** — Connect. Collaborate. Create.

Tender Pilot (ServiceHub) is a modern web application that connects clients with service providers using artificial intelligence. The platform features smart recommendations, automated bid analysis, and seamless project management.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-4.x-092E20?logo=django)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Features

### For Clients
- 📋 **Post Projects** — Create detailed project listings with requirements and budget
- 🔍 **Review Bids** — AI-scored bids help identify the best providers
- 📅 **Book Services** — Schedule service packages directly from the marketplace
- 💬 **Real-time Messaging** — Communicate with providers seamlessly

### For Service Providers
- 🎯 **AI Recommendations** — Get personalized project matches based on your skills
- 📈 **Bid Optimization** — AI-powered suggestions to improve your proposals
- 🛒 **Service Marketplace** — Create and manage service packages
- 📊 **Dashboard Analytics** — Track your bids, earnings, and performance

### AI-Powered Capabilities
- 🤖 **Smart Matching** — Intelligent project-provider matching
- 📊 **Bid Analysis** — Automated strength scoring and feedback
- 💰 **Pricing Suggestions** — AI-optimized pricing recommendations
- 🔥 **Trending Opportunities** — Discover high-demand projects

### Platform Features
- 🌐 **Multi-language** — English and Arabic (RTL) support
- 🌙 **Dark Theme** — Modern, eye-friendly interface
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🔒 **Secure Auth** — JWT-based authentication with role management

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, React Router, TanStack Query, i18next |
| **Backend** | Django 4.x, Django REST Framework, JWT Authentication |
| **Database** | PostgreSQL (Neon) |
| **AI Services** | Google Gemini API, OpenAI API (fallback) |
| **DevOps** | Docker, Docker Compose |

---

## 📁 Project Structure

```
tender-pilot/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── ai_engine/      # AI services & recommendations
│   │   ├── bids/           # Bid management
│   │   ├── projects/       # Project management
│   │   ├── services/       # Service marketplace
│   │   ├── users/          # User authentication
│   │   └── messaging/      # Real-time messaging
│   ├── config/             # Django settings
│   └── requirements.txt
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # State management
│   │   └── i18n/           # Translations (en/ar)
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (or use Neon cloud)
- Docker (optional)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database and API keys

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

### Docker Setup (Alternative)

```bash
cd backend
docker-compose up -d
```

---

## ⚙️ Environment Variables

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=tender_pilot
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# AI Services
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key  # Optional

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=ServiceHub
```

---

## 🔗 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login/` | User login |
| POST | `/api/v1/auth/register/` | User registration |
| POST | `/api/v1/auth/refresh/` | Refresh JWT token |

### Projects & Bids
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/projects/` | List/Create projects |
| GET/PATCH | `/api/v1/projects/{id}/` | Retrieve/Update project |
| GET/POST | `/api/v1/bids/` | List/Create bids |
| POST | `/api/v1/bids/{id}/change-status/` | Update bid status |

### Services & Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/services/services/` | List/Create services |
| GET/POST | `/api/v1/services/bookings/` | List/Create bookings |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/recommendations/for-me/` | Personalized recommendations |
| GET | `/api/v1/ai/recommendations/trending/` | Trending opportunities |
| POST | `/api/v1/ai/bids/{id}/analyze-strength/` | Analyze bid strength |
| POST | `/api/v1/ai/bids/{id}/optimize-pricing/` | Get pricing suggestions |

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Client** | Post projects, review bids, book services, manage bookings |
| **Provider** | Browse projects, submit bids, create services, manage bookings |
| **Both** | Full access to client and provider features |

---

## 🖼️ Screenshots

> *Screenshots coming soon*

- Landing Page
- Client Dashboard
- Provider Dashboard  
- Project Details with AI-Scored Bids
- Service Booking Flow
- AI Recommendations Panel

---

## 🛣️ Roadmap

- [x] Core marketplace functionality
- [x] AI-powered recommendations
- [x] Bid analysis and optimization
- [x] Multi-language support (EN/AR)
- [x] Real-time messaging
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Mobile application
- [ ] Video consultations

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- ITI (Information Technology Institute) for the learning opportunity
- Google Gemini API for AI capabilities
- The open-source community for amazing tools and libraries

---

<p align="center">
  <b>Built with ❤️ as an ITI Final Project</b><br>
  <i>January 2026</i>
</p>
