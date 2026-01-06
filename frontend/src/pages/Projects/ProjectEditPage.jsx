import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useProjects } from "../../hooks/useProjects"
import { projectService } from "../../services/project.services";
import { useState } from "react"

export default function ProjectEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateProject } = useProjects()

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id),
  })

  const [form, setForm] = useState(null)

  if (isLoading) return <p>Loading...</p>

  if (!form && data) setForm(data)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await updateProject.mutateAsync({ id, data: form })
    navigate("/projects")
  }

  return (
    <div>
      <h1>Edit Project</h1>

      {form && (
        <form onSubmit={handleSubmit}>
          <input
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <button type="submit">Update</button>
        </form>
      )}
    </div>
  )
}
