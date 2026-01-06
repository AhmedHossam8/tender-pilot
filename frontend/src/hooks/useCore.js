import { useQuery } from "@tanstack/react-query";
import { coreService } from "../services/core.services";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await coreService.getCategories();
      return res.data.results;
    },
  });
};

export const useSkills = () => {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await coreService.getSkills();
      return res.data.results;
    },
  });
};