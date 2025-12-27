import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "../services/proposal.service";

export const useProposals = (params) => {
  return useQuery({
    queryKey: ["proposals", params],
    queryFn: async () => {
      try {
        const res = await proposalService.getProposals(params);
        // return the array directly for the component
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

export const useProposal = (proposalId) => {
  return useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => {
      const res = await proposalService.getProposal(proposalId);
      return res.data.data || [];
    },
    enabled: !!proposalId,
  });
};

export const useGenerateProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenderId, payload }) =>
      proposalService.generateProposal(tenderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useSubmitForReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => proposalService.submitForReview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useApproveProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => proposalService.approveProposal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useRejectProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => proposalService.rejectProposal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useSubmitProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => proposalService.submitProposal(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
};

export const useRegenerateSection = (proposalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId }) =>
      proposalService.regenerateSection(proposalId, sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });
};

export const useGenerateFeedback = (proposalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => proposalService.generateFeedback(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });
};

export const useGenerateChecklist = (proposalId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => proposalService.generateChecklist(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
    },
  });
};

export const useGenerateDocument = (proposalId) => {
  return useMutation({
    mutationFn: () => proposalService.generateDocument(proposalId),
  });
};

export const usePreviewProposal = (proposalId) => {
  return useQuery({
    queryKey: ["proposal-preview", proposalId],
    queryFn: async () => {
      const res = await proposalService.previewProposal(proposalId);
      return res.data;
    },
    enabled: !!proposalId,
  });
};

export const useSectionFeedback = (sectionId) => {
  return useQuery({
    queryKey: ["section-feedback", sectionId],
    queryFn: async () => {
      const res = await proposalService.getSectionFeedback(sectionId);
      return res.data;
    },
    enabled: !!sectionId,
  });
};