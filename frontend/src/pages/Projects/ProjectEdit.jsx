import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useProjects } from "../../hooks/useProjects";
import { projectService } from "../../services/project.services";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Textarea } from "@/components/ui";

export default function ProjectEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateProject } = useProjects();

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id),
  });

  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    if (data) setForm({ title: data.title, description: data.description });
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProject.mutateAsync({ id, data: form });
      toast.success("Project updated successfully!");
      navigate("/projects");
    } catch {
      toast.error("Failed to update project");
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
            />
            <Button type="submit">Update Project</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
