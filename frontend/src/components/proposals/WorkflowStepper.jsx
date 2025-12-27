import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui";

const WorkflowStepper = ({ currentStatus }) => {
    const { t } = useTranslation();
    const steps = ["draft", "in-review", "approved", "submitted"];

    return (
        <div className="flex gap-4 mb-4">
            {steps.map((step, idx) => (
                <Badge
                    key={idx}
                    variant={steps.indexOf(currentStatus) >= idx ? "success" : "outline"}
                >
                    {t(`proposal.status.${step}`, step)}
                </Badge>
            ))}
        </div>
    );
};

export default WorkflowStepper;
