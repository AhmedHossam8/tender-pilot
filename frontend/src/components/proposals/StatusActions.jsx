import React from "react";
import { Button } from "@/components/ui";
import { useTranslation } from "react-i18next";

const StatusActions = ({ status, onApprove, onReject, onSubmit }) => {
    const { t } = useTranslation();

    return (
        <div className="flex gap-2 mt-4">
            {status === "draft" && (
                <Button onClick={onSubmit}>{t("proposal.submit")}</Button>
            )}
            {status === "in-review" && (
                <>
                    <Button onClick={onApprove}>{t("proposal.approve")}</Button>
                    <Button variant="destructive" onClick={onReject}>
                        {t("proposal.reject")}
                    </Button>
                </>
            )}
        </div>
    );
};

export default StatusActions;
