# AI Engine Frontend Pages

This document describes the three new pages created for the AI Engine frontend integration.

## Pages Created

### 1. AI Dashboard (`/pages/ai/AIDashboard.jsx`)

**Purpose:** Comprehensive dashboard for monitoring AI engine usage, performance, and costs.

**Features:**
- Real-time system health status
- Usage statistics (total requests, success rate, processing time, costs)
- Recent AI requests list with status badges
- Usage breakdown by AI provider
- Performance metrics (fastest, slowest, average request times)
- Cost analysis with token usage breakdown
- Failed requests alert
- Date range filtering
- Auto-refresh capability

**API Endpoints Used:**
- `GET /api/v1/ai/health/` - System health check
- `GET /api/v1/ai/analytics/usage` - Usage analytics
- `GET /api/v1/ai/analytics/performance` - Performance metrics
- `GET /api/v1/ai/analytics/costs` - Cost analytics

**Props:** None

**Usage:**
```jsx
import { AIDashboard } from '@/pages/ai';

<Route path="/ai/dashboard" element={<AIDashboard />} />
```

---

### 2. AI Result Panel (`/pages/ai/AIResultPanel.jsx`)

**Purpose:** Display detailed AI-generated results with analysis, history, and regeneration options.

**Features:**
- AI request information card (model, provider, tokens, cost)
- Three-tab interface:
  - **Result Tab:** Generated content with metadata
  - **History Tab:** Regeneration history with versions
  - **Metrics Tab:** Performance and cost analysis
- Regenerate content functionality
- Download result as text file
- Version tracking
- Processing time and confidence scores
- Error handling with user-friendly messages

**API Endpoints Used:**
- `GET /api/v1/ai/response/{responseId}/history/` - Get regeneration history
- `POST /api/v1/ai/response/{responseId}/regenerate/` - Regenerate content

**Props:**
- `responseId` (from URL params)

**Usage:**
```jsx
import { AIResultPanel } from '@/pages/ai';

<Route path="/ai/results/:responseId" element={<AIResultPanel />} />
```

---

### 3. AI Processing Badge Component (`/components/common/AIProcessingBadge.jsx`)

**Purpose:** Reusable components for displaying AI processing status and information.

**Components:**

#### `AIProcessingBadge`
Displays the current status of AI operations with animated icons.

**Props:**
- `status`: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
- `showIcon`: boolean (default: true)
- `animated`: boolean (default: true)
- `className`: string

**Usage:**
```jsx
<AIProcessingBadge status="processing" />
```

#### `AIRequestInfo`
Shows detailed information about an AI request in a card format.

**Props:**
- `request`: AI request object
- `className`: string

**Usage:**
```jsx
<AIRequestInfo request={aiRequest} />
```

#### `AIProcessingListItem`
Compact view of an AI processing item for lists.

**Props:**
- `request`: AI request object
- `onClick`: function
- `className`: string

**Usage:**
```jsx
<AIProcessingListItem 
  request={request} 
  onClick={() => navigate(`/ai/results/${request.id}`)}
/>
```

---

## Supporting Files Created

### Services

#### `services/ai.service.js`
API service for all AI-related endpoints.

**Methods:**
- `checkHealth()` - Health check
- `analyzeTender(tenderId, payload)` - Analyze tender
- `checkCompliance(tenderId, payload)` - Check compliance
- `generateOutline(tenderId, payload)` - Generate outline
- `regenerateResponse(responseId, payload)` - Regenerate response
- `getRegenerationHistory(responseId)` - Get history
- `getUsageAnalytics(params)` - Usage analytics
- `getUserUsageAnalytics(userId, params)` - User usage
- `getPerformanceAnalytics(params)` - Performance metrics
- `getCostAnalytics(params)` - Cost analytics
- `getPromptPerformance(params)` - Prompt performance

### Hooks

#### `hooks/useAI.js`
React Query hooks for AI operations.

**Available Hooks:**
- `useAIHealth()` - Health status
- `useAnalyzeTender()` - Tender analysis mutation
- `useCheckCompliance()` - Compliance check mutation
- `useGenerateOutline()` - Outline generation mutation
- `useRegenerateResponse()` - Regeneration mutation
- `useRegenerationHistory(responseId)` - History query
- `useUsageAnalytics(params)` - Usage query
- `useUserUsageAnalytics(userId, params)` - User usage query
- `usePerformanceAnalytics(params)` - Performance query
- `useCostAnalytics(params)` - Cost query
- `usePromptPerformance(params)` - Prompt performance query

---

## Translations

### English (`i18n/en.json`)
Added `aiEngine` section with 75+ translation keys covering:
- Dashboard labels and descriptions
- Status labels (pending, processing, completed, failed, cancelled)
- Metrics and analytics terms
- Button labels and actions
- Error messages
- Success messages

### Arabic (`i18n/ar.json`)
Complete Arabic translations for all AI Engine terms with proper RTL support.

**Key Sections:**
- `aiEngine.dashboard` - Dashboard terms
- `aiEngine.status` - Status labels
- `aiEngine.metrics` - Performance metrics
- `aiEngine.cost*` - Cost-related terms
- Common actions (regenerate, download, etc.)

---

## Integration with Backend

### API Base URL
Configured in `services/api.js` using environment variable:
```javascript
baseURL: import.meta.env.VITE_API_BASE_URL
```

### Expected Backend Structure

**AI Request Object:**
```json
{
  "id": "uuid",
  "status": "completed",
  "prompt_name": "string",
  "model": "gpt-4",
  "provider": "openai",
  "input_tokens": 1234,
  "output_tokens": 567,
  "cost": 0.0123,
  "error_message": "string",
  "created_at": "ISO timestamp",
  "metadata": {}
}
```

**AI Response Object:**
```json
{
  "id": "uuid",
  "content": "Generated text",
  "version": 1,
  "output_tokens": 567,
  "processing_time": 3456,
  "confidence_score": 0.95,
  "created_at": "ISO timestamp",
  "metadata": {}
}
```

**Analytics Summary:**
```json
{
  "summary": {
    "total_requests": 1234,
    "successful_requests": 1200,
    "failed_requests": 34,
    "total_tokens": 50000,
    "total_input_tokens": 30000,
    "total_output_tokens": 20000,
    "request_growth": 12.5
  },
  "recent_requests": [],
  "breakdown_by_provider": []
}
```

---

## Routing Setup

Add these routes to your router configuration:

```jsx
import { AIDashboard, AIResultPanel } from '@/pages/ai';

// In your router
<Routes>
  <Route path="/ai/dashboard" element={<AIDashboard />} />
  <Route path="/ai/results/:responseId" element={<AIResultPanel />} />
</Routes>
```

---

## Navigation

Add to sidebar navigation:

```jsx
<NavLink to="/ai/dashboard">
  <Sparkles className="h-4 w-4" />
  {t('aiEngine.dashboard')}
</NavLink>
```

---

## Dependencies

All pages use existing project dependencies:
- `react-router-dom` - Routing
- `react-i18next` - Internationalization
- `@tanstack/react-query` - Data fetching
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `@radix-ui` - UI components (via existing UI library)

---

## Styling

All components use Tailwind CSS classes consistent with the existing design system:
- Dark mode support via `dark:` variants
- RTL support for Arabic via `dir` attribute
- Responsive design with mobile-first approach
- Consistent spacing and typography from existing patterns

---

## Error Handling

All pages include comprehensive error handling:
- Network errors with retry mechanisms
- Empty states for no data
- Loading states with spinners
- User-friendly error messages
- Toast notifications for actions

---

## Performance Optimizations

- React Query caching (5-minute stale time for analytics)
- Automatic cache invalidation on mutations
- Conditional queries (only run when needed)
- Lazy loading of heavy components
- Optimized re-renders with proper dependencies

---

## Accessibility

- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Color contrast compliance
- RTL language support

---

## Testing Considerations

When testing these pages:
1. Verify API endpoints are correctly configured
2. Test with both English and Arabic languages
3. Test all status states (pending, processing, completed, failed)
4. Verify regeneration functionality
5. Check responsive design on mobile devices
6. Test error scenarios (network failures, empty data)
7. Verify toast notifications appear correctly
8. Test download functionality

---

## Future Enhancements

Potential improvements:
- Real-time updates via WebSocket for processing status
- Export analytics as CSV/PDF
- Advanced filtering options
- Custom date range picker
- Comparison between different time periods
- Cost budgeting and alerts
- Detailed token usage breakdown by prompt type
- A/B testing for different prompts

---

## Support

For issues or questions:
1. Check backend API endpoints are accessible
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Ensure React Query DevTools for debugging
5. Review backend logs for API errors
