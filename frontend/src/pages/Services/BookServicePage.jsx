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

// Generate time slots (e.g., 8:00 AM - 8:00 PM in 30-minute intervals)
const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const period = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            const time12 = `${hour12}:${String(minute).padStart(2, '0')} ${period}`;
            slots.push({ value: time24, label: time12 });
        }
    }
    return slots;
};

const timeSlots = generateTimeSlots();

const BookServicePage = () => {
    const { t } = useTranslation();
    const { id: serviceId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const canBookService =
        user?.user_type === "client" || user?.user_type === "both";
    const [selectedPackage, setSelectedPackage] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);

    // Fetch service details
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["service", serviceId],
        queryFn: () => serviceService.getById(serviceId),
        enabled: !!serviceId,
    });

    const service = data?.data ?? data;
    const selectedPackageObj = service?.packages?.find(
        (pkg) => String(pkg.id) === String(selectedPackage)
    );
    const scheduledFor = scheduledDate && scheduledTime
        ? `${scheduledDate}T${scheduledTime}`
        : "";

    // Booking mutation
    const bookingMutation = useMutation({
        mutationFn: (bookingData) => bookingService.create(bookingData),
        onSuccess: () => {
            toast.success(t("services.bookingSuccess"));
            queryClient.invalidateQueries(["bookings"]);
            navigate("/app/bookings");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.error || t("services.bookingError"));
        },
    });

    if (isLoading) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-4">
                <SkeletonText lines={2} />
                <SkeletonCard />
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-center mt-10 text-red-500">
                {error?.message || t("services.errorFetchingService")}
            </p>
        );
    }

    if (!service) {
        return (
            <p className="text-center mt-10 text-gray-500">
                {t("services.notFound") || "Service not found"}
            </p>
        );
    }

    const handleBooking = () => {
        if (!selectedPackage || !scheduledDate || !scheduledTime) {
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
            package_id: Number(selectedPackage),
            scheduled_for: scheduledFor,
        });
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Service info */}
            <div>
                <h1 className="text-3xl font-bold text-white">{service.name}</h1>
                <p className="text-slate-400">{service.description}</p>
            </div>

            {/* Booking card */}
            {canBookService ? (
                <Card className="bg-[#101825] border border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-white">{t("services.bookPackage")}</CardTitle>
                        <CardDescription className="text-slate-400">
                            {t("services.bookPackageDescription")}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Package select */}
                        <div>
                            <p className="text-sm font-medium mb-1 text-white">
                                {t("services.packages")}
                            </p>
                            <Select
                                value={selectedPackage}
                                onValueChange={setSelectedPackage}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("services.selectPackage")} />
                                </SelectTrigger>
                                <SelectContent className="bg-[#101825] border border-gray-700">
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

                        {/* Date & Time inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium mb-1 text-white">
                                    {t("services.date") || "Date"}
                                </p>
                                <Input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div>
                                <p className="text-sm font-medium mb-1 text-white">
                                    {t("services.time") || "Time"}
                                </p>
                                <Select
                                    value={scheduledTime}
                                    onValueChange={setScheduledTime}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("services.selectTime") || "Select time"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#101825] border border-gray-700 max-h-[300px]">
                                        {timeSlots.map((slot) => (
                                            <SelectItem key={slot.value} value={slot.value}>
                                                {slot.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isReviewing && selectedPackageObj && (
                            <div className="mt-4 border-t border-gray-700 pt-4 space-y-3">
                                <p className="text-sm font-semibold text-white">
                                    {t("services.reviewBooking")}
                                </p>
                                <div className="text-sm space-y-1 text-slate-400">
                                    <p>
                                        <span className="font-medium">Package:</span>{" "}
                                        {selectedPackageObj.name} — ${selectedPackageObj.price}
                                    </p>
                                    <p>
                                        <span className="font-medium">Scheduled For:</span>{" "}
                                        {new Date(scheduledFor).toLocaleString()}
                                    </p>
                                </div>
                                <div className="rounded border border-gray-700 bg-[#101825] p-3 text-xs text-slate-400">
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
                                user?.id === service?.created_by?.id ||
                                !canBookService
                            }
                        >
                            {bookingMutation.isPending
                                ? t("common.loading")
                                : !canBookService
                                    ? t("services.notAuthorized")
                                    : user?.id === service?.created_by?.id
                                        ? t("services.cannotBookOwnService")
                                        : isReviewing
                                            ? t("services.confirmAndPay")
                                            : t("services.reviewAndContinue")}
                        </Button>
                    </CardFooter>
                </Card>
            ) : (
                <p className="text-center text-gray-500 mt-4">
                    {t("services.notAuthorized")}
                </p>
            )}
        </div>
    );
};

export default BookServicePage;