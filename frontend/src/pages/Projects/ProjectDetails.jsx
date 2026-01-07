import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "../../services/project.services";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { ConfirmDialog, LoadingSpinner } from "@/components/common";
import { useProjects } from "../../hooks/useProjects";
import { useAuthStore } from "@/contexts/authStore";
import { useTranslation } from "react-i18next";
import ProjectEditModal from "./ProjectEditModal";
import { useProjectMatches } from "../../hooks/useProjectMatches";

export default function ProjectDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const formatStatus = (status) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'open':
        return 'Open';
      case 'deleted':
        return 'Deleted';
      default:
        return status;
    }
  };
  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch project
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await projectService.getProject(id);
      return res.data;
    },
  });

  // Fetch AI matched providers
  const { data: matchesData, isLoading: matchesLoading } = useProjectMatches(id);
  const matches = matchesData?.matches ?? []; // ensure array

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteProject.mutateAsync(id);
      toast.success(t("project.deleteSuccess"));
      navigate("/projects");
    } catch {
      toast.error(t("project.deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (isError) {
    return <p className="text-center text-red-500">{t("project.loadError")}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{project.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Budget:</strong> ${project.budget ?? "-"}
            </div>
            <div>
              <strong>Category:</strong> {project.category_name || project.category?.name || "-"}
            </div>
            <div>
              <strong>Status:</strong> {formatStatus(project.status)}
            </div>
            <div>
              <strong>Visibility:</strong> {project.visibility}
            </div>
            <div>
              <strong>Created At:</strong> {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Skills */}
          <div>
            <strong>Skills:</strong>
            {project.skills_names?.length ? (
              <ul className="list-disc ml-6 mt-2">
                {project.skills_names.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : project.skills?.length ? (
              <ul className="list-disc ml-6 mt-2">
                {project.skills.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground mt-1">-</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("project.actions")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button disabled={updateStatusLoading || project.status !== 'open'} onClick={() => updateStatus(id, 'in_progress')}>Start Project</Button>
          <Button disabled={updateStatusLoading || project.status !== 'in_progress'} onClick={() => updateStatus(id, 'completed')}>Complete Project</Button>
          <Button onClick={() => setEditOpen(true)}>{t("project.edit")}</Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            {deleting && <LoadingSpinner size="sm" className="mr-2" />}
            {t("project.delete")}
          </Button>
        </CardContent>
      </Card>

      {/* AI Matched Providers */}
      <Card>
        <CardHeader>
          <CardTitle>AI Matched Providers</CardTitle>
        </CardHeader>
        <CardContent>
          {matchesLoading ? (
            <LoadingSpinner />
          ) : matches.length === 0 ? (
            <p className="text-muted-foreground">No matches found.</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((match) => (
                <li key={match.provider_id || match.id} className="border p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{match.provider_name || match.name}</span>
                    {match.match_score !== undefined && (
                      <span className="text-sm text-gray-500">
                        Score: {match.match_score}%
                      </span>
                    )}
                  </div>
                  {match.recommendation && <p className="text-sm mt-1">{match.recommendation}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <ProjectEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSuccess={() => setEditOpen(false)}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("project.confirmDeleteTitle")}
        description={t("project.confirmDeleteDescription")}
        confirmLabel={t("confirm.delete")}
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
