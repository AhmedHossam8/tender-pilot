import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services/project.services";
import { toast } from "sonner";

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectService.getProjects();
      return res.data.results || [];
    },
  });

  const updateStatus = (id, newStatus) => {
    updateProject.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success(`Project status updated to ${newStatus}`);
        },
        onError: (err) => {
          toast.error("Failed to update project status");
          console.error(err);
        },
      }
    );
  };

  const createProject = useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => projectService.patchProject(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
    },
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
    updateStatus,
    updateStatusLoading: updateProject.isPending,
    deleteProject,
  };
};
