import { useParams, useNavigate } from "react-router-dom"
import { useProjects } from "../../hooks/useProjects"

export default function ProjectDeletePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteProject } = useProjects()

  const handleDelete = async () => {
    await deleteProject.mutateAsync(id)
    navigate("/projects")
  }

  return (
    <div>
      <h1>Delete Project</h1>
      <p>Are you sure?</p>

      <button onClick={handleDelete}>Yes, delete</button>
      <button onClick={() => navigate(-1)}>Cancel</button>
    </div>
  )
}
