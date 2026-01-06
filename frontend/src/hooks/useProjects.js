import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/project.services";

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectService.getProjects();
      return res.data.results || [];
    },
  });

  const createProject = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => projectService.updateProject(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteProject = useMutation({
    mutationFn: projectService.deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  return {
    projects,
    isLoading,
    isError,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
};
