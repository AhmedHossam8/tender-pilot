import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTenders } from "../../hooks/useTenders"
import TenderServices from "../../services/Tenderservices"
import { useState } from "react"

export default function TenderEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateTender } = useTenders()

  const { data, isLoading } = useQuery({
    queryKey: ["tender", id],
    queryFn: () => TenderServices.getTenderById(id),
  })

  const [form, setForm] = useState(null)

  if (isLoading) return <p>Loading...</p>

  if (!form && data) setForm(data)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await updateTender.mutateAsync({ id, data: form })
    navigate("/tenders")
  }

  return (
    <div>
      <h1>Edit Tender</h1>

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
