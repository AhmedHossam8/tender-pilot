import { useProposals } from "../hooks/useProposals";
import { Card, Badge } from "../components/ui";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { useTranslation } from "react-i18next";

const ProposalList = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useProposals();

  if (isLoading) {
    return <LoadingSpinner text={t("common.loading")} />;
  }

  if (error) {
    return <EmptyState title={t("proposal.loadError", "Failed to load proposals")} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={t("proposal.noProposals", "No proposals found")} />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">
        {t("proposal.title")}
      </h1>

      <div className="space-y-4">
        {data.map((proposal) => (
          <Card key={proposal.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {proposal.title || `${t("proposal.title")} #${proposal.id}`}
                </h3>

                <p className="text-sm text-muted-foreground">
                  {t("proposal.tender", "Tender")}: {proposal.tender_title}
                </p>

                <p className="text-xs text-muted-foreground">
                  {t("proposal.createdAt", "Created")}:{" "}
                  {new Date(proposal.created_at).toLocaleDateString()}
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