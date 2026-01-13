/**
 * AI Components Index
 * 
 * Central export point for all AI-related components.
 * Makes it easy to import components throughout the app.
 * 
 * Usage:
 * import { AIMatchScore, AILoadingIndicator } from '@/components/ai';
 */

// Basic AI Components
export {
  AIComplexityBadge,
  AISummaryCard,
  AIFeedbackDisplay,
  AIProcessingIndicator,
  AIMatchScoreBadge,
} from "./AIComponents";

// Detailed AI Match Score component
export { default as AIMatchScore } from "./AIMatchScore";

// Advanced AI Features
export { AIAssistant } from "./AIAssistant";
export { AIAnalyticsDashboard } from "./AIAnalyticsDashboard";
export { SmartRecommendations } from "./SmartRecommendations";
export { RealTimeBidOptimizer } from "./RealTimeBidOptimizer";

// Legacy / utility exports
export { default as AILoadingIndicator } from "./AILoadingIndicator";
