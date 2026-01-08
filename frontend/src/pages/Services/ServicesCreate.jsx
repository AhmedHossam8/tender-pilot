import React, { useState } from "react";
import { toast } from "sonner";
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

function ServicesCreate({ isOpen, setOpen }) {
    const { createServiceMutation } = useServices();

    // Local form state for the service + packages
    const [localServiceData, setLocalServiceData] = useState({
        name: "",
        description: "",
    });

    const [localPackages, setLocalPackages] = useState([
        { price: "", duration: "00:01" },
    ]);

    const handlePackageFieldChange = (index, field, value) => {
        const newPackages = [...localPackages];
        newPackages[index][field] = value;
        setLocalPackages(newPackages);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedPackages = localPackages.map((pkg) => {
            const [hours, minutes] = pkg.duration.split(":").map(Number);
            return {
                price: Number(pkg.price),
                duration_hours: hours + minutes / 60,
            };
        });

        createServiceMutation.mutate(
            { serviceData: localServiceData, packages: formattedPackages },
            {
                onSuccess: () => {
                    toast.success("Service created successfully!");
                    setOpen(false); // close modal
                    setLocalServiceData({ name: "", description: "" }); // reset form
                    setLocalPackages([{ price: "", duration: "00:01" }]);
                },
                onError: () => toast.error("Failed to create service"),
            }
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Service</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to create a new service.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        placeholder="Service Name"
                        value={localServiceData.name}
                        onChange={(e) =>
                            setLocalServiceData({ ...localServiceData, name: e.target.value })
                        }
                        required
                    />

                    <Textarea
                        placeholder="Description"
                        value={localServiceData.description}
                        onChange={(e) =>
                            setLocalServiceData({
                                ...localServiceData,
                                description: e.target.value,
                            })
                        }
                        rows={5}
                    />

                    {localPackages.map((pkg, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                value={pkg.price}
                                onChange={(e) =>
                                    handlePackageFieldChange(idx, "price", e.target.value)
                                }
                                required
                            />
                            <Input
                                type="time"
                                step="60"
                                value={pkg.duration}
                                onChange={(e) =>
                                    handlePackageFieldChange(idx, "duration", e.target.value)
                                }
                                required
                            />
                            {localPackages.length > 1 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() =>
                                        setLocalPackages(localPackages.filter((_, i) => i !== idx))
                                    }
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}

                    <Button
                        type="button"
                        onClick={() =>
                            setLocalPackages([
                                ...localPackages,
                                { price: "", duration: "00:01" },
                            ])
                        }
                        className="w-full"
                        variant="outline"
                    >
                        + Add Package
                    </Button>

                    <Button
                        type="submit"
                        disabled={createServiceMutation.isLoading}
                        variant="success"
                        className="w-full mt-4"
                    >
                        {createServiceMutation.isLoading && (
                            <LoadingSpinner size="sm" className="mr-2" />
                        )}
                        Create Service
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ServicesCreate;
