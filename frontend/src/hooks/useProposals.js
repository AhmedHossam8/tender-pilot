import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { proposalService } from "../services/proposal.service";

export const useProposals = (params) => {
  return useQuery({
    queryKey: ["proposals", params],
    queryFn: async () => {
      const res = await proposalService.getProposals(params);
      return res.data;
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
