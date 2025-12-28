import React from "react";
import { useProposals } from "../../hooks/useProposals";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import { LoadingSpinner, EmptyState } from "@/components/common";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const ProposalList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: proposals, isLoading, error } = useProposals();

  if (isLoading) return <LoadingSpinner text={t("common.loading")} />;

  if (error) {
    console.error("Failed to fetch proposals:", error);
    return <EmptyState title={t("proposal.loadError", "Failed to load proposals")} />;
  }

  if (!proposals || proposals.length === 0) {
    return <EmptyState title={t("proposal.noProposals", "No proposals found")} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("proposal.title")}</h1>
        <Button
          variant="success"
          onClick={() => navigate("/proposals/create")}
        >
          {t("proposal.create")}
        </Button>
      </div>

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="p-4">
            <CardHeader className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {proposal.title || `${t("proposal.title")} #${proposal.id}`}
                </CardTitle>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground">
                    {t("proposal.tender", "Tender")}: {proposal.tender_title || proposal.tender}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("proposal.createdAt", "Created")}: {new Date(proposal.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => navigate(`/proposals/${proposal.id}`)}
                  >
                    {t("proposal.viewDetails", "View Details")}
                  </Button>
                </CardContent>
              </div>
              <Badge>{t(`proposal.status.${proposal.status}`)}</Badge>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProposalList;
