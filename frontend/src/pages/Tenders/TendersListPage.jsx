import { Link } from "react-router-dom"
import { useTenders } from "../../hooks/useTenders"

function TenderListPage() {
  const { tenders, isLoading, isError, error } = useTenders()

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>{error.message}</p>

  return (
    <div>
      <h1>Tenders</h1>

      <Link to="/tenders/create">Create Tender</Link>

      <ul>
        {tenders.map((tender) => (
          <li key={tender.id}>
            <strong>{tender.title}</strong>
            <br />

            <Link to={`/tenders/${tender.id}`}>View</Link>{" | "}
            <Link to={`/tenders/${tender.id}/edit`}>Edit</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TenderListPage