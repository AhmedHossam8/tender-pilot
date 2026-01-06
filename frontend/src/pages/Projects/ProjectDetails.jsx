import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectService } from "../../services/project.services";
import bidService from "../../services/bid.service";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { AIMatchScore, AILoadingIndicator } from "../../components/ai";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [matchScore, setMatchScore] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [showMatchScore, setShowMatchScore] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id),
  });

  const calculateMyMatchScore = async () => {
    try {
      setLoadingMatch(true);
      setShowMatchScore(true);
      const response = await bidService.getAIMatches(id, 1);
      if (response.data.matches?.length > 0) setMatchScore(response.data.matches[0]);
      else toast.info(t("ai.noMatchData"));
    } catch {
      toast.error(t("ai.analysisFailed"));
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleBidOnProject = () => navigate(`/bids/create?project=${id}`);

  if (isLoading) return <p>Loading project...</p>;
  if (isError) return <p>Error loading project</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{data.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{data.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("ai.matchAnalysis")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!showMatchScore ? (
            <Button onClick={calculateMyMatchScore} disabled={loadingMatch}>
              {loadingMatch ? t("ai.analyzing") : t("ai.calculateMatch")}
            </Button>
          ) : matchScore ? (
            <AIMatchScore score={matchScore.match_score} feedback={matchScore} showDetails />
          ) : (
            <p>No match data available</p>
          )}
          {matchScore && (
            <Button className="mt-4" onClick={handleBidOnProject}>
              {t("ai.submitBid")}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link to={`/projects/${id}/edit`}>
            <Button>Edit Project</Button>
          </Link>
          <Link to={`/projects/${id}/delete`}>
            <Button variant="destructive">Delete Project</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
