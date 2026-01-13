import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui";
import { useTranslation } from "react-i18next";

const BidReview = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="p-8 min-h-screen bg-[#101825] text-white">
            <Card className="max-w-2xl mx-auto bg-[#101825] border border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-white">
                        {t("bid.review", "Review Bid")}
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <p className="mb-4 text-white/70">
                        {t(
                            "bid.reviewPlaceholder",
                            "Bid review functionality will be implemented in future iterations."
                        )}
                    </p>

                    <Button
                        onClick={() => navigate("/app/bids")}
                        className="bg-white text-black hover:bg-white/90"
                    >
                        {t("common.goBack", "Go Back")}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default BidReview;
