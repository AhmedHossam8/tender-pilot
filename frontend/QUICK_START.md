# Quick Start Guide - AI Pages Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Backend is Running
```bash
# Make sure your Django backend is running
cd backend
python manage.py runserver
```

### Step 2: Configure Environment
```bash
# In frontend directory, create or update .env file
cd ../frontend
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env
```

### Step 3: Add Routes to Your App

Open your main routing file (e.g., `App.jsx` or `routes.jsx`) and add:

```jsx
import { AIDashboard, AIResultPanel } from './pages/ai';

// Add these routes
<Route path="/ai/dashboard" element={<AIDashboard />} />
<Route path="/ai/results/:responseId" element={<AIResultPanel />} />
```

### Step 4: Add to Sidebar Navigation

Update your sidebar component:

```jsx
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Sidebar() {
  const { t } = useTranslation();
  
  return (
    <nav>
      {/* Add this to your nav items */}
      <Link to="/ai/dashboard">
        <Sparkles className="h-5 w-5" />
        <span>{t('aiEngine.dashboard')}</span>
      </Link>
    </nav>
  );
}
```

### Step 5: Test It Out

1. Start your frontend:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/ai/dashboard`

3. You should see the AI Dashboard!

## 📋 What You Get

### ✅ Pages
- **AI Dashboard** (`/ai/dashboard`)
  - Monitor AI usage, performance, and costs
  - View recent requests
  - Track system health

- **AI Result Panel** (`/ai/results/:id`)
  - View AI-generated content
  - See regeneration history
  - Download results

### ✅ Components
- **AIProcessingBadge** - Status indicator
- **AIRequestInfo** - Request details card
- **AIProcessingListItem** - List item component

### ✅ Hooks
- `useAIHealth()` - System health
- `useAnalyzeTender()` - Analyze tenders
- `useRegenerateResponse()` - Regenerate content
- `useUsageAnalytics()` - Usage stats
- And 7 more...

### ✅ Services
- Complete API integration for all AI endpoints

### ✅ Translations
- 75+ English terms
- 75+ Arabic terms
- Full RTL support

## 🎯 Quick Usage Examples

### Display AI Status Badge
```jsx
import { AIProcessingBadge } from '@/components/common';

<AIProcessingBadge status="processing" />
```

### Analyze a Tender
```jsx
import { useAnalyzeTender } from '@/hooks/useAI';

function AnalyzeButton({ tenderId }) {
  const analyze = useAnalyzeTender();
  
  return (
    <button onClick={() => analyze.mutate({ tenderId, payload: {} })}>
      Analyze
    </button>
  );
}
```

### Show Recent AI Requests
```jsx
import { useUsageAnalytics } from '@/hooks/useAI';
import { AIProcessingListItem } from '@/components/common';

function RecentRequests() {
  const { data } = useUsageAnalytics();
  
  return (
    <div>
      {data?.recent_requests?.map(request => (
        <AIProcessingListItem key={request.id} request={request} />
      ))}
    </div>
  );
}
```

## 🔧 Troubleshooting

### Issue: Pages don't load
**Solution**: Check that VITE_API_BASE_URL is set correctly in .env

### Issue: API calls fail
**Solution**: 
1. Verify backend is running
2. Check CORS settings in Django
3. Test health endpoint: `curl http://localhost:8000/api/v1/ai/health/`

### Issue: Translations don't work
**Solution**: Translation files are already updated. Just restart your dev server.

### Issue: Dark mode issues
**Solution**: The pages use existing dark mode classes. Ensure your app has dark mode configured.

## 📖 Next Steps

1. **Explore Documentation**: Read `AI_PAGES_DOCUMENTATION.md` for details
2. **Check Examples**: See `AI_PAGES_USAGE_EXAMPLES.jsx` for code samples
3. **Customize**: Modify colors, layouts, or features as needed
4. **Add Features**: Extend with your own AI operations

## 🆘 Need Help?

- Check the comprehensive documentation in `AI_PAGES_DOCUMENTATION.md`
- Review usage examples in `AI_PAGES_USAGE_EXAMPLES.jsx`
- Look at the summary in `AI_PAGES_SUMMARY.md`

## ✨ Features Overview

| Feature | Dashboard | Result Panel |
|---------|-----------|--------------|
| System Health | ✅ | - |
| Usage Stats | ✅ | - |
| Performance Metrics | ✅ | ✅ |
| Cost Analysis | ✅ | ✅ |
| Recent Requests | ✅ | - |
| View Results | - | ✅ |
| Regenerate | - | ✅ |
| Download | - | ✅ |
| History | - | ✅ |
| Dark Mode | ✅ | ✅ |
| RTL Support | ✅ | ✅ |
| Responsive | ✅ | ✅ |

## 🎉 You're All Set!

Your AI Engine frontend is now integrated and ready to use. Navigate to `/ai/dashboard` to see it in action!

---

**Questions?** Check the documentation files in the frontend directory.
