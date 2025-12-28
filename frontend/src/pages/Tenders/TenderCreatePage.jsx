import { useNavigate } from "react-router-dom"
import { useTenders } from "../../hooks/useTenders"
import { useState } from "react"

function TenderCreatePage() {
  const navigate = useNavigate()
  const { createTender } = useTenders()

  const [form, setForm] = useState({
    title: "",
    description: "",
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createTender.mutateAsync(form)
    navigate("/tenders")
  }

  return (
    <div>
      <h1>Create Tender</h1>

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
export default TenderCreatePage