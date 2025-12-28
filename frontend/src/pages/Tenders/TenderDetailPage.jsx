import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { tenderService } from "../../services/Tenderservices";

function TenderDetailPage() {
  const { id } = useParams()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tender", id],
    queryFn: () => tenderService.getTender(id),
  })

  if (isLoading) return <p>Loading...</p>
  if (isError) return <p>Error loading tender</p>

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.description}</p>

      <Link to={`/tenders/${id}/edit`}>Edit</Link>
    </div>
  )
}
export default TenderDetailPage
