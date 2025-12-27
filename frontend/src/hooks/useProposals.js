import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "../services/proposal.service";

/**
 * Fetch all proposals (paginated)
 */
export const useProposals = (params = {}) => {
  return useQuery({
    queryKey: ["proposals", params],
    queryFn: async () => {
      try {
        const res = await proposalService.getProposals(params);
        return res.data.results || [];
      } catch (err) {
        console.error("Error fetching proposals:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

/**
 * Fetch a single proposal by ID
 */
export const useProposal = (proposalId) => {
  return useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      try {
        const res = await proposalService.getProposal(proposalId);
        return res.data;
      } catch (err) {
        console.error(`Error fetching proposal ${proposalId}:`, err);
        throw err;
      }
    },
    enabled: !!proposalId,
  });
};

/**
 * Generic mutation hook for proposal actions (approve, reject, submit, etc.)
 */
const useProposalAction = (actionName) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => proposalService[actionName](id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(["proposal", id]);
      queryClient.invalidateQueries(["proposals"]);
    },
    onError: (err) => console.error(`Error performing ${actionName}:`, err),
  });
};

export const useApproveProposal = () => useProposalAction("approveProposal");
export const useRejectProposal = () => useProposalAction("rejectProposal");
export const useSubmitProposal = () => useProposalAction("submitProposal");
export const useSubmitForReview = () => useProposalAction("submitForReview");

/**
 * Generate a new proposal from a tender
 */
export const useGenerateProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenderId, payload }) =>
      proposalService.generateProposal(tenderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["proposals"]);
    },
    onError: (err) => console.error("Error generating proposal:", err),
  });
};

/**
 * Regenerate a proposal section
 */
export const useRegenerateSection = (proposalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId }) =>
      proposalService.regenerateSection(proposalId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries(["proposal", proposalId]);
    },
    onError: (err) =>
      console.error(`Error regenerating section for proposal ${proposalId}:`, err),
  });
};

/**
 * Generate document, feedback, or checklist for a proposal
 */
const useProposalResource = (resourceName, proposalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => proposalService[resourceName](proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries(["proposal", proposalId]);
    },
    onError: (err) =>
      console.error(`Error generating ${resourceName} for proposal ${proposalId}:`, err),
  });
};

export const useGenerateDocument = (proposalId) =>
  useProposalResource("generateDocument", proposalId);
export const useGenerateFeedback = (proposalId) =>
  useProposalResource("generateFeedback", proposalId);
export const useGenerateChecklist = (proposalId) =>
  useProposalResource("generateChecklist", proposalId);

/**
 * Preview a proposal (returns blob)
 */
export const usePreviewProposal = (proposalId) => {
  return useQuery({
    queryKey: ["proposal-preview", proposalId],
    queryFn: async () => {
      try {
        const res = await proposalService.previewProposal(proposalId);
        return res.data;
      } catch (err) {
        console.error(`Error previewing proposal ${proposalId}:`, err);
        throw err;
      }
    },
    enabled: !!proposalId,
  });
};

/**
 * Get AI feedback for a specific proposal section
 */
export const useSectionFeedback = (sectionId) => {
  return useQuery({
    queryKey: ["section-feedback", sectionId],
    queryFn: async () => {
      try {
        const res = await proposalService.getSectionFeedback(sectionId);
        return res.data;
      } catch (err) {
        console.error(`Error fetching feedback for section ${sectionId}:`, err);
        throw err;
      }
    },
    enabled: !!sectionId,
  });
};