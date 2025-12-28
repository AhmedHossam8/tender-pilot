import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenderService } from "../services/Tenderservices";

export const useTenders = () => {
  const queryClient = useQueryClient();

  const { data: tenders = [], isLoading, isError, error } = useQuery({
    queryKey: ["tenders"],
    queryFn: async () => {
      const res = await tenderService.getTenders();
      return res.data.results || [];
    },
  });

  const createTender = useMutation({
    mutationFn: tenderService.createTender,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenders"] }),
  });

  const updateTender = useMutation({
    mutationFn: ({ id, data }) => tenderService.updateTender(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenders"] }),
  });

  const deleteTender = useMutation({
    mutationFn: tenderService.deleteTender,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenders"] }),
  });

  return {
    tenders,
    isLoading,
    isError,
    error,
    createTender,
    updateTender,
    deleteTender,
  };
};
