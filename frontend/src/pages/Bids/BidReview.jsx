import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { useTranslation } from "react-i18next";

const BidReview = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-8 min-h-screen bg-background">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{t("bid.review", "Review Bid")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                        {t("bid.reviewPlaceholder", "Bid review functionality will be implemented in future iterations.")}
                    </p>
                    <Button onClick={() => navigate("/bids")}>
                        {t("common.goBack", "Go Back")}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default BidReview;
