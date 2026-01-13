import React, { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useServices } from "../../hooks/useServices";
import {
    Button,
    Input,
    Textarea,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui";
import { Loader2 } from "lucide-react";

function ServicesCreate({ isOpen, setOpen }) {
    const { t } = useTranslation();
    const { createServiceMutation } = useServices();

    // Local form state for service + packages
    const [localServiceData, setLocalServiceData] = useState({
        name: "",
        description: "",
    });

    const [localPackages, setLocalPackages] = useState([{ price: "", duration_hours: "" }]);

    const handlePackageFieldChange = (index, field, value) => {
        const newPackages = [...localPackages];
        newPackages[index][field] = value;
        setLocalPackages(newPackages);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedPackages = localPackages.map((pkg, idx) => ({
            name: `Package ${idx + 1}`,
            price: Number(pkg.price),
            duration_hours: Number(pkg.duration_hours),
        }));

        createServiceMutation.mutate(
            { serviceData: localServiceData, packages: formattedPackages },
            {
                onSuccess: () => {
                    toast.success(t("notifications.success"));
                    setTimeout(() => {
                        setLocalServiceData({ name: "", description: "" });
                        setLocalPackages([{ price: "", duration_hours: "" }]);
                        setOpen(false);
                    }, 0);
                },
                onError: (error) => {
                    console.error("Service creation error:", error);
                    toast.error(t("notifications.error"));
                },
            }
        );
    };

    const isLoading = createServiceMutation.isPending ?? createServiceMutation.isLoading ?? false;

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl bg-[#101825] text-white rounded-xl shadow-lg p-6">
                <DialogHeader>
                    <DialogTitle className="text-white">{t("services.createTitle")}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {t("services.createDescription")}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <Input
                        placeholder={t("services.serviceName")}
                        value={localServiceData.name}
                        onChange={(e) =>
                            setLocalServiceData({ ...localServiceData, name: e.target.value })
                        }
                        required
                    />

                    <Textarea
                        placeholder={t("services.serviceDescription")}
                        value={localServiceData.description}
                        onChange={(e) =>
                            setLocalServiceData({ ...localServiceData, description: e.target.value })
                        }
                        rows={5}
                    />

                    {localPackages.map((pkg, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={t("services.price")}
                                value={pkg.price}
                                onChange={(e) => handlePackageFieldChange(idx, "price", e.target.value)}
                                required
                                className="flex-1"
                            />
                            <Input
                                type="number"
                                step="0.5"
                                min="0.5"
                                placeholder={t("services.hours")}
                                value={pkg.duration_hours}
                                onChange={(e) => handlePackageFieldChange(idx, "duration_hours", e.target.value)}
                                required
                                className="flex-1"
                            />
                            {localPackages.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() =>
                                        setLocalPackages(localPackages.filter((_, i) => i !== idx))
                                    }
                                >
                                    {t("services.remove")}
                                </Button>
                            )}
                        </div>
                    ))}

                    <Button
                        type="button"
                        onClick={() =>
                            setLocalPackages([...localPackages, { price: "", duration_hours: "" }])
                        }
                        className="w-full"
                        variant="outline"
                    >
                        {t("services.addPackage")}
                    </Button>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        variant="success"
                        className="w-full mt-4"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? t("services.creating") : t("services.createService")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ServicesCreate;
