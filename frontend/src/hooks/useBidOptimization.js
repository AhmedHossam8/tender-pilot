import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiService } from "../services/ai.service";
import { toast } from "sonner";

/**
 * Hook to analyze bid strength and get comprehensive feedback
 */
export const useAnalyzeBidStrength = (bidId, options = {}) => {
  return useMutation({
    mutationFn: () => aiService.analyzeBidStrength(bidId),
    onSuccess: (data) => {
      toast.success("Bid analysis complete");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to analyze bid");
    },
    ...options,
  });
};

/**
 * Hook to get real-time suggestions during bid creation
 */
export const useRealtimeBidSuggestions = (options = {}) => {
  return useMutation({
    mutationFn: (bidData) => aiService.getRealtimeBidSuggestions(bidData),
    ...options,
  });
};

/**
 * Hook to optimize bid pricing based on market data
 */
export const useOptimizeBidPricing = (bidId, options = {}) => {
  return useMutation({
    mutationFn: () => aiService.optimizeBidPricing(bidId),
    onSuccess: (data) => {
      toast.success("Pricing optimization complete");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to optimize pricing");
    },
    ...options,
  });
};

/**
 * Hook to predict bid success probability
 */
export const usePredictBidSuccess = (bidId, options = {}) => {
  return useMutation({
    mutationFn: () => aiService.predictBidSuccess(bidId),
    onSuccess: (data) => {
      toast.success("Success prediction complete");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.detail || "Failed to predict success");
    },
    ...options,
  });
};
