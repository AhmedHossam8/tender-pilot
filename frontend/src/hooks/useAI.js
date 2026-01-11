import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";

/**
 * Hook for AI health check
 */
export const useAIHealth = () => {
  return useQuery({
    queryKey: ["ai", "health"],
    queryFn: async () => {
      const res = await aiService.checkHealth();
      return res.data;
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 2,
  });
};

/**
 * Hook for analyzing project
 */
export const useAnalyzeProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      aiService.analyzeProject(projectId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["ai", "analytics"] });
    },
  });
};

/**
 * Hook for analyzing tender (alias for backward compatibility)
 */
export const useAnalyzeTender = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenderId, payload }) =>
      aiService.analyzeTender(tenderId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tender", variables.tenderId] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.tenderId] });
      queryClient.invalidateQueries({ queryKey: ["ai", "analytics"] });
    },
  });
};

/**
 * Hook for compliance check
 */
export const useCheckCompliance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      aiService.checkCompliance(projectId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId, "compliance"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "analytics"] });
    },
  });
};

/**
 * Hook for generating proposal outline
 */
export const useGenerateOutline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, payload }) =>
      aiService.generateOutline(projectId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", variables.projectId, "outline"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "analytics"] });
    },
  });
};

/**
 * Hook for regenerating AI response
 */
export const useRegenerateResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ responseId, payload }) =>
      aiService.regenerateResponse(responseId, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "response", variables.responseId] });
      queryClient.invalidateQueries({ queryKey: ["ai", "analytics"] });
    },
  });
};

/**
 * Hook for getting regeneration history
 */
export const useRegenerationHistory = (responseId) => {
  return useQuery({
    queryKey: ["ai", "response", responseId, "history"],
    queryFn: async () => {
      const res = await aiService.getRegenerationHistory(responseId);
      return res.data;
    },
    enabled: !!responseId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for usage analytics
 */
export const useUsageAnalytics = (params) => {
  return useQuery({
    queryKey: ["ai", "analytics", "usage", params],
    queryFn: async () => {
      const res = await aiService.getUsageAnalytics(params);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

/**
 * Hook for user usage analytics
 */
export const useUserUsageAnalytics = (userId, params) => {
  return useQuery({
    queryKey: ["ai", "analytics", "usage", "user", userId, params],
    queryFn: async () => {
      const res = await aiService.getUserUsageAnalytics(userId, params);
      return res.data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for performance analytics
 */
export const usePerformanceAnalytics = (params) => {
  return useQuery({
    queryKey: ["ai", "analytics", "performance", params],
    queryFn: async () => {
      const res = await aiService.getPerformanceAnalytics(params);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for cost analytics
 */
export const useCostAnalytics = (params) => {
  return useQuery({
    queryKey: ["ai", "analytics", "costs", params],
    queryFn: async () => {
      const res = await aiService.getCostAnalytics(params);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook for prompt performance
 */
export const usePromptPerformance = (params) => {
  return useQuery({
    queryKey: ["ai", "analytics", "prompts", params],
    queryFn: async () => {
      const res = await aiService.getPromptPerformance(params);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
