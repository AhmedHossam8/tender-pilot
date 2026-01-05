// Example: How to add AI pages to your routing

import { AIDashboard, AIResultPanel } from './pages/ai';
import AppLayout from './layouts/AppLayout';

// In your main App.jsx or router configuration
const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // ... existing routes
      
      // AI Engine Routes
      {
        path: 'ai',
        children: [
          {
            path: 'dashboard',
            element: <AIDashboard />,
          },
          {
            path: 'results/:responseId',
            element: <AIResultPanel />,
          },
        ],
      },
    ],
  },
];

// Example: Using AI Processing Badge in your components
import { AIProcessingBadge } from '@/components/common';

function MyComponent() {
  const [status, setStatus] = useState('processing');
  
  return (
    <div>
      <h2>AI Request Status</h2>
      <AIProcessingBadge status={status} />
    </div>
  );
}

// Example: Using AI hooks to analyze a tender
import { useAnalyzeTender } from '@/hooks/useAI';
import { toast } from 'sonner';

function TenderAnalysisButton({ tenderId }) {
  const analyzeTender = useAnalyzeTender();
  
  const handleAnalyze = async () => {
    try {
      const result = await analyzeTender.mutateAsync({
        tenderId,
        payload: {
          analysis_depth: 'standard',
          include_documents: true,
        },
      });
      
      toast.success('Analysis completed!');
      // Navigate to results
      navigate(`/ai/results/${result.data.response_id}`);
    } catch (error) {
      toast.error('Analysis failed');
    }
  };
  
  return (
    <button onClick={handleAnalyze} disabled={analyzeTender.isPending}>
      {analyzeTender.isPending ? 'Analyzing...' : 'Analyze Tender'}
    </button>
  );
}

// Example: Adding to sidebar navigation
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function Sidebar() {
  const { t } = useTranslation();
  
  return (
    <nav>
      {/* ... other nav items */}
      
      <NavLink to="/ai/dashboard">
        <Sparkles className="h-5 w-5" />
        <span>{t('aiEngine.dashboard')}</span>
      </NavLink>
    </nav>
  );
}

// Example: Environment variable setup
// Create or update .env file in frontend directory:
/*
VITE_API_BASE_URL=http://localhost:8000/api/v1
*/
