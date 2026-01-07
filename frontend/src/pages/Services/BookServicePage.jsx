import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "../../services/services.service";
import { bookingService } from "../../services/booking.service";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/contexts/authStore";

// UI Components
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Button,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    Input,
    SkeletonCard,
    SkeletonText,
} from "@/components/ui";

const BookServicePage = () => {
    const { t } = useTranslation();
    const { id: serviceId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [selectedPackage, setSelectedPackage] = useState("");
    const [scheduledFor, setScheduledFor] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

    // --- Fetch service details ---
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["service", serviceId],
        queryFn: () => serviceService.getById(serviceId),
        enabled: !!serviceId,
    });

    // Normalize data: support both axios {data: ...} and direct object
    const service = data?.data ?? data;

    const selectedPackageObj = service?.packages?.find(
        (pkg) => String(pkg.id) === String(selectedPackage)
    );

    // --- Booking mutation ---
    const bookingMutation = useMutation({
        mutationFn: (bookingData) => bookingService.create(bookingData),
        onSuccess: () => {
            toast.success(t("services.bookingSuccess"));
            queryClient.invalidateQueries(["bookings"]);
            navigate("/bookings");
        },
        onError: (err) => {
            toast.error(
                err?.response?.data?.error || t("services.bookingError")
            );
        },
    });

    // --- Loading / Skeleton UI ---
    if (isLoading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
                <SkeletonText lines={2} />
                <SkeletonCard />
            </div>
        );
    }

    // --- Error UI ---
    if (isError) {
        return (
            <p className="text-center mt-10 text-red-500">
                {error?.message || t("services.errorFetchingService")}
            </p>
        );
    }

    // --- Handle case where service is undefined ---
    if (!service) {
        return (
            <p className="text-center mt-10 text-gray-500">
                {t("services.notFound") || "Service not found"}
            </p>
        );
    }

    // --- Booking handler ---
    const handleBooking = () => {
        if (!selectedPackage || !scheduledFor) {
            toast.error(t("services.selectPackageAndDate"));
            return;
        }

        if (!user) {
            toast.error(t("services.bookingError"));
            return;
        }

        if (user.id === service.created_by?.id) {
            toast.error(t("services.cannotBookOwnService"));
            return;
        }

        if (!isReviewing) {
            setIsReviewing(true);
            return;
        }

        bookingMutation.mutate({
            package: selectedPackage,
            scheduled_for: scheduledFor,
        });
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Service info */}
            <div>
                <h1 className="text-3xl font-bold">{service.name}</h1>
                <p className="text-muted-foreground">{service.description}</p>
            </div>

            {/* Booking card */}
            <Card>
                <CardHeader>
                    <CardTitle>{t("services.bookPackage")}</CardTitle>
                    <CardDescription>
                        {t("services.bookPackageDescription")}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Package select */}
                    <div>
                        <p className="text-sm font-medium mb-1">
                            {t("services.packages")}
                        </p>
                        <Select
                            value={selectedPackage}
                            onValueChange={setSelectedPackage}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={t("services.selectPackage")} />
                            </SelectTrigger>
                            <SelectContent>
                                {service.packages?.length > 0 ? (
                                    service.packages.map((pkg) => (
                                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                                            {pkg.name} — ${pkg.price}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="" disabled>
                                        {t("services.noPackagesAvailable")}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Schedule input */}
                    <div>
                        <p className="text-sm font-medium mb-1">
                            {t("services.scheduledFor")}
                        </p>
                        <Input
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                        />
                    </div>

                    {isReviewing && selectedPackageObj && (
                        <div className="mt-4 border-t pt-4 space-y-3">
                            <p className="text-sm font-semibold">
                                {t("services.reviewBooking")}
                            </p>
                            <div className="text-sm space-y-1">
                                <p>
                                    <span className="font-medium">{t("services.package")}:</span>{" "}
                                    {selectedPackageObj.name} — ${selectedPackageObj.price}
                                </p>
                                <p>
                                    <span className="font-medium">{t("services.scheduledFor")}:</span>{" "}
                                    {new Date(scheduledFor).toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded border bg-muted p-3 text-xs text-muted-foreground">
                                <p className="font-semibold mb-1">
                                    {t("services.paymentPlaceholderTitle")}
                                </p>
                                <p>{t("services.paymentPlaceholderDescription")}</p>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    {isReviewing && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => setIsReviewing(false)}
                            disabled={bookingMutation.isPending}
                        >
                            {t("common.back")}
                        </Button>
                    )}
                    <Button
                        className="w-full sm:w-auto"
                        onClick={handleBooking}
                        disabled={
                            bookingMutation.isPending ||
                            user?.id === service?.created_by?.id
                        }
                    >
                        {bookingMutation.isPending
                            ? t("common.loading")
                            : user?.id === service?.created_by?.id
                            ? t("services.cannotBookOwnService")
                            : isReviewing
                            ? t("services.confirmAndPay")
                            : t("services.reviewAndContinue")}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default BookServicePage;
