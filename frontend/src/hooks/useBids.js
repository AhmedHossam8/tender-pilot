/**
 * useBids Hook
 * 
 * Custom hook for managing bids data with React Query.
 * Provides:
 * - Automatic data fetching
 * - Loading and error states
 * - Automatic refetching on window focus
 * - Cache management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import bidService from '../services/bid.service';
import { toast } from 'sonner';

/**
 * Fetch bids with filters
 * 
 * @param {Object} params - Query parameters
 * @param {string} params.type - 'sent', 'received', or 'all'
 * @param {string} params.status - Filter by status
 * @param {number} params.project - Filter by project ID
 * @returns {Object} Query result with bids data
 */
export const useBids = (params = {}) => {
  return useQuery({
    queryKey: ['bids', params],
    queryFn: () => bidService.getBids(params),
    select: (response) => {
      // Handle both array and paginated response formats
      const data = response.data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    },
  });
};

/**
 * Fetch single bid by ID
 * 
 * @param {number} id - Bid ID
 * @returns {Object} Query result with bid details
 */
export const useBid = (id) => {
  return useQuery({
    queryKey: ['bid', id],
    queryFn: () => bidService.getBidById(id),
    select: (response) => response.data,
    enabled: !!id, // Only run if ID exists
  });
};

/**
 * Create a new bid
 * 
 * @returns {Object} Mutation object with mutate function
 */
export const useCreateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bidData) => bidService.createBid(bidData),
    onSuccess: () => {
      // Invalidate bids cache to refetch
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Bid submitted successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to submit bid';
      toast.error(message);
    },
  });
};

/**
 * Update an existing bid
 * 
 * @returns {Object} Mutation object with mutate function
 */
export const useUpdateBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => bidService.updateBid(id, data),
    onSuccess: (response, variables) => {
      // Update cache for this specific bid
      queryClient.invalidateQueries({ queryKey: ['bid', variables.id] });
      // Update bids list cache
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Bid updated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to update bid';
      toast.error(message);
    },
  });
};

/**
 * Change bid status
 * 
 * @returns {Object} Mutation object with mutate function
 */
export const useChangeBidStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, reason }) => 
      bidService.changeBidStatus(id, status, reason),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bid', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      // Don't show toast here - let the component handle it
    },
    onError: (error) => {
      // Don't show toast here - let the component handle it with better context
      throw error;
    },
  });
};

/**
 * Withdraw a bid
 * 
 * @returns {Object} Mutation object with mutate function
 */
export const useWithdrawBid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }) => bidService.withdrawBid(id, reason),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bid', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['bids'] });
      toast.success('Bid withdrawn successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to withdraw bid';
      toast.error(message);
    },
  });
};

/**
 * Get bid statistics
 * 
 * @returns {Object} Query result with statistics
 */
export const useBidStatistics = () => {
  return useQuery({
    queryKey: ['bid-statistics'],
    queryFn: () => bidService.getBidStatistics(),
    select: (response) => response.data,
  });
};

/**
 * Fetch bid milestones
 * 
 * @param {number} bidId - Bid ID
 * @returns {Object} Query result with milestones
 */
export const useBidMilestones = (bidId) => {
  return useQuery({
    queryKey: ['bid-milestones', bidId],
    queryFn: () => bidService.getBidMilestones(bidId),
    select: (response) => response.data,
    enabled: !!bidId,
  });
};

/**
 * Fetch bid attachments
 * 
 * @param {number} bidId - Bid ID
 * @returns {Object} Query result with attachments
 */
export const useBidAttachments = (bidId) => {
  return useQuery({
    queryKey: ['bid-attachments', bidId],
    queryFn: () => bidService.getBidAttachments(bidId),
    select: (response) => response.data,
    enabled: !!bidId,
  });
};

export default useBids;
