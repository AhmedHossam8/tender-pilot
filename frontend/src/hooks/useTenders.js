import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TenderServices from "../services/Tenderservices";

export const useTenders = () => {
  const queryClient = useQueryClient();

  const { data: tenders = [], isLoading, isError, error } = useQuery({
    queryKey: ["tenders"],
    queryFn: TenderServices.getAllTenders,
  });

  const createTender = useMutation({
    mutationFn: TenderServices.createTender,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenders"] }),
  });

  const updateTender = useMutation({
    mutationFn: ({ id, data }) => TenderServices.updateTender(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenders"] }),
  });

  const deleteTender = useMutation({
    mutationFn: TenderServices.deleteTender,
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
