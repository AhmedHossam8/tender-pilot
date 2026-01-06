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
      toast.success("Project deleted successfully!");
      navigate("/projects");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Delete Project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          <div className="flex gap-4">
            <Button variant="destructive" onClick={handleDelete}>Yes, Delete</Button>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
