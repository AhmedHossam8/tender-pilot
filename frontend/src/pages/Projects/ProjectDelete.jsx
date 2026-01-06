import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export default function ProjectDelete() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteProject } = useProjects();

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(id);
      toast.success(t("project.deleteSuccess"));
      navigate("/projects");
    } catch {
      toast.error(t("project.deleteError"));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("project.delete")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{t("project.confirmDeleteDescription")}</p>
          <div className="flex gap-4">
            <Button variant="destructive" onClick={handleDelete}>{t("confirm.yesDelete")}</Button>
            <Button onClick={() => navigate(-1)}>{t("confirm.cancel")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
