import { useParams, useNavigate } from "react-router-dom"
import { useTenders } from "../../hooks/useTenders"

export default function TenderDeletePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteTender } = useTenders()

  const handleDelete = async () => {
    await deleteTender.mutateAsync(id)
    navigate("/tenders")
  }

  return (
    <div>
      <h1>Delete Tender</h1>
      <p>Are you sure?</p>

      <button onClick={handleDelete}>Yes, delete</button>
      <button onClick={() => navigate(-1)}>Cancel</button>
    </div>
  )
}
