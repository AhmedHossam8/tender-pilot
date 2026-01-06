import { useNavigate } from "react-router-dom"
import { useProjects } from "../../hooks/useProjects"
import { useState } from "react"

function ProjectCreatePage() {
  const navigate = useNavigate()
  const { createProject } = useProjects()

  const [form, setForm] = useState({
    title: "",
    description: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createProject.mutateAsync(form)
    navigate("/projects")
  }

  return (
    <div>
      <h1>Create Project</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button type="submit">Create</button>
      </form>
    </div>
  )
}
export default ProjectCreatePage