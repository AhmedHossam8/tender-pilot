import { useProposals } from "../hooks/useProposals";
import { Card, Badge } from "../components/ui";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const ProposalList = () => {
  const { data, isLoading, error } = useProposals();

  if (isLoading) return <LoadingSpinner />;

  if (error) return <EmptyState title="Failed to load proposals" />;

  if (!data || data.length === 0) return <EmptyState title="No proposals found" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Proposals</h1>
      <div className="space-y-4">
        {data.map((proposal) => (
          <Card key={proposal.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {proposal.title || `Proposal #${proposal.id}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tender: {proposal.tender_title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(proposal.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge>{proposal.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProposalList;
