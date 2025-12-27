import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { useTranslation } from "react-i18next";

const CompliancePanel = ({ items }) => {
    const { t } = useTranslation();

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{t("proposal.generateChecklist")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.length ? (
                    items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.label}</span>
                            <Badge variant={item.completed ? "success" : "destructive"}>
                                {item.completed ? t("common.completed", "Completed") : t("common.pending", "Pending")}
                            </Badge>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground">{t("proposal.noProposals")}</p>
                )}
            </CardContent>
        </Card>
    );
};

export default CompliancePanel;
