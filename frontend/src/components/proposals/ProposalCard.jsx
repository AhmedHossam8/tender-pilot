import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { useTranslation } from "react-i18next";

const ProposalCard = ({ proposal, onClick }) => {
    const { t } = useTranslation();

    return (
        <Card className="p-4 cursor-pointer hover:shadow-md" onClick={onClick}>
            <CardHeader>
                <CardTitle>{proposal.title || `${t("proposal.title")} #${proposal.id}`}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {t("proposal.tender", "Tender")}: {proposal.tender_title}
                </p>
                <p className="text-xs text-muted-foreground">
                    {t("proposal.createdAt", "Created")}: {new Date(proposal.created_at).toLocaleDateString()}
                </p>
                <Badge className="mt-2">{proposal.status}</Badge>
            </CardContent>
        </Card>
    );
};

export default ProposalCard;
