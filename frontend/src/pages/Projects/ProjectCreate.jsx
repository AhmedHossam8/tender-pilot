import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Textarea } from "@/components/ui";

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { createProject } = useProjects();

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProject.mutateAsync(form);
      toast.success("Project created successfully!");
      navigate("/projects");
    } catch {
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
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
            <Button type="submit">Create Project</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
