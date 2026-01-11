import { useQuery } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";
import { toast } from "sonner";

/**
 * Hook to get personalized project recommendations for current user
 */
export const usePersonalizedRecommendations = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["recommendations", "personalized", params],
    queryFn: () => aiService.getPersonalizedRecommendations(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to load recommendations");
    },
    ...options,
  });
};

/**
 * Hook to get trending opportunities
 */
export const useTrendingOpportunities = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["recommendations", "trending", params],
    queryFn: () => aiService.getTrendingOpportunities(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to load trending opportunities");
    },
    ...options,
  });
};

/**
 * Hook to get project optimization suggestions for clients
 */
export const useProjectOptimization = (projectId, options = {}) => {
  return useQuery({
    queryKey: ["recommendations", "project-optimization", projectId],
    queryFn: () => aiService.getProjectOptimization(projectId),
    enabled: !!projectId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    onError: (error) => {
      console.error('Project optimization error:', error);
      if (error?.response?.status === 405) {
        toast.error("API endpoint method error - please refresh the page");
      } else {
        toast.error(error?.response?.data?.error || "Failed to load optimization suggestions");
      }
    },
    ...options,
  });
};
