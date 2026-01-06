import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../hooks/useProjects";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Textarea,
} from "@/components/ui";

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { createProject } = useProjects();

  const [form, setForm] = useState({
    title: "",
    description: "",
    attachment: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);

      // only attach file if provided
      if (form.attachment) {
        formData.append("attachment", form.attachment);
      }

      await createProject.mutateAsync(formData);

      toast.success(t("project.createSuccess"));
      navigate("/projects");
    } catch (error) {
      toast.error(t("project.createError"));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t("project.create")}</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
              required
            />

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={6}
            />

            {/* Optional attachment */}
            <Input
              type="file"
              aria-label={t("project.attachment")}
              onChange={(e) =>
                setForm({
                  ...form,
                  attachment: e.target.files?.[0] || null,
                })
              }
            />

            <Button type="submit">Create Project</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
