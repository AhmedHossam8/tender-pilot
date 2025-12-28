import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Textarea, Button } from "@/components/ui";
import { useTranslation } from "react-i18next";

const SectionEditor = ({ section, onChange, onRegenerate }) => {
    const { t } = useTranslation();

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Textarea
                    value={section.content}
                    onChange={(e) => onChange(section.id, e.target.value)}
                />
                <Button variant="outline" onClick={() => onRegenerate(section.id)}>
                    {t("proposal.regenerateSection")}
                </Button>
            </CardContent>
        </Card>
    );
};

export default SectionEditor;
