import { useQuery } from "@tanstack/react-query";
import { projectMatchingService } from "../services/projectMatching.services";

export const useProjectMatches = (projectId, options = {}) => {
  const { limit = 10, useCache = true, onlyApplicants = true } = options;

  const { data = {}, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["projectMatches", projectId],
    queryFn: async () => {
      const res = await projectMatchingService.getMatches(projectId, {
        limit,
        use_cache: useCache,
        only_applicants: onlyApplicants,
      });
      return res.data || { matches: [] };
    },
    enabled: !!projectId, // only fetch if projectId exists
  });

  return { 
    data,
    matches: data?.matches || [], 
    isLoading, 
    isError, 
    error, 
    refetch 
  };
};