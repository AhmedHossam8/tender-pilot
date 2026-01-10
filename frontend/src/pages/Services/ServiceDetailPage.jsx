import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "../../services/services.service";
import { useAuthStore } from "@/contexts/authStore";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
    Button,
    SkeletonCard,
    SkeletonText,
} from "@/components/ui";
import { toast } from "sonner";
import { ConfirmDialog, LoadingSpinner } from "@/components/common";

const ServiceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["service", id],
        queryFn: () => serviceService.getById(id),
        enabled: !!id,
    });

    const service = data?.data;
    const isOwner = user?.id && service?.created_by?.id === user.id;

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => serviceService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["services"]);
            // Close dialog first, then show toast and navigate
            setConfirmDialogOpen(false);
            setTimeout(() => {
                toast.success("Service deleted successfully");
                navigate("/app/services");
            }, 100);
        },
        onError: () => {
            setConfirmDialogOpen(false);
            setTimeout(() => {
                toast.error("Failed to delete service");
            }, 100);
        },
    });

    const handleDelete = async () => {
        // Don't close dialog immediately, wait for mutation
        await deleteMutation.mutateAsync();
    };

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                <SkeletonText lines={2} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-center mt-10 text-red-500">
                {error?.message || "Failed to load service"}
            </p>
        );
    }

    if (!service) {
        return (
            <p className="text-center mt-10 text-gray-500">Service not found</p>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{service.name}</h1>
                    <p className="text-muted-foreground">{service.description}</p>
                </div>

                {isOwner && (
                    <>
                        <Button
                            variant="destructive"
                            onClick={() => setConfirmDialogOpen(true)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete Service"}
                        </Button>

                        <ConfirmDialog
                            open={confirmDialogOpen}
                            onOpenChange={setConfirmDialogOpen}
                            title="Delete Service?"
                            description="This action cannot be undone. Are you sure you want to delete this service?"
                            confirmLabel="Delete"
                            variant="destructive"
                            onConfirm={handleDelete}
                            loading={deleteMutation.isPending}
                        />
                    </>
                )}
            </div>

            {/* Packages */}
            <div>
                <h2 className="text-2xl font-semibold mb-2">Packages</h2>

                {service.packages?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No packages available</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.packages?.map((pkg) => (
                        <Card key={pkg.id}>
                            <CardHeader>
                                <CardTitle>{pkg.name}</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-1">
                                <p>
                                    <strong>Price:</strong> ${pkg.price}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Duration: {pkg.duration_hours} hours
                                </p>
                            </CardContent>

                            <CardFooter>
                                <Button disabled variant="outline">
                                    Provider View
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailPage;
