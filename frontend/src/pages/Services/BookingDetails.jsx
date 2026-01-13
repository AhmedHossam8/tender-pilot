import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "../../services/services.service";
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
    StatusBadge,
    SkeletonCard,
    SkeletonText,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Select,
    SelectItem,
    SelectTrigger,
    SelectContent,
    SelectValue
} from "@/components/ui";

// Icons
import {
    MessageCircle,
    Calendar,
    Clock,
    DollarSign,
    User,
    Package,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2
} from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";

const BookingDetails = () => {
    const { t } = useTranslation();
    const { id: bookingId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["booking", bookingId],
        queryFn: () => serviceService.getBookingById(bookingId),
        enabled: !!bookingId,
    });

    const booking = data?.data ?? data;
    const ALL_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
    const allowedStatuses = booking
        ? ALL_STATUSES.filter((status) => status !== booking.status)
        : [];

    const isProvider = booking?.package?.service?.created_by?.id === user?.id;
    const isClient = booking?.user?.id === user?.id;

    const canCancelBooking =
        booking &&
        ((isClient && booking.status === "pending") ||
            (isProvider && ["pending", "confirmed"].includes(booking.status)));

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, package_id }) =>
            serviceService.updateBooking(id, { status, package_id }),
        onSuccess: () => {
            toast.success(t("bookings.statusUpdated"));
            queryClient.invalidateQueries(["booking", bookingId]);
            queryClient.invalidateQueries(["bookings"]);
            setStatusDialogOpen(false);
        },
        onError: (err) => {
            console.error(err.response?.data);
            toast.error(
                "Failed to update status: " + JSON.stringify(err.response?.data)
            );
        },
    });

    const cancelBookingMutation = useMutation({
        mutationFn: (id) => serviceService.updateBooking(id, { status: "cancelled" }),
        onSuccess: () => {
            toast.success(t("bookings.cancelled"));
            queryClient.invalidateQueries(["booking", bookingId]);
            queryClient.invalidateQueries(["bookings"]);
            setCancelDialogOpen(false);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.error || t("bookings.cancelError"));
        },
    });

    const handleStartChat = () => {
        const otherUserId = isProvider
            ? booking.user?.id
            : booking.package?.service?.created_by?.id;

        if (otherUserId) {
            navigate(`/app/messages?userId=${otherUserId}`);
        } else {
            toast.error(t("bookings.chatError"));
        }
    };

    const handleUpdateStatus = () => {
        if (!selectedStatus || selectedStatus === booking.status) return;

        updateStatusMutation.mutate({
            id: bookingId,
            status: selectedStatus,
            package_id: booking.package?.id,
        });
    };

    useEffect(() => {
        if (booking && statusDialogOpen) {
            setSelectedStatus(booking.status);
        }
    }, [booking, statusDialogOpen]);

    if (isLoading) {
        return (
            <div className="p-6 max-w-4xl mx-auto space-y-4">
                <SkeletonText lines={2} />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="border border-gray-700 bg-[#101825] text-white">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                        <p className="text-red-500">
                            {error?.message || t("bookings.errorFetchingBooking")}
                        </p>
                        <Button
                            onClick={() => navigate("/app/bookings")}
                            variant="outline"
                            className="mt-4"
                        >
                            {t("common.backToBookings")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <Card className="border border-gray-700 bg-[#101825] text-white">
                    <CardContent className="pt-6 text-center">
                        <p className="text-gray-400">{t("bookings.notFound")}</p>
                        <Button
                            onClick={() => navigate("/app/bookings")}
                            variant="outline"
                            className="mt-4"
                        >
                            {t("common.backToBookings")}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 bg-[#101825] text-white">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{t("bookings.bookingDetails")}</h1>
                    <p className="text-gray-400 mt-1">
                        {t("bookings.bookingId")}: #{booking.id}
                    </p>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Service & Package Info */}
            <Card className="border border-gray-700 bg-[#101825] text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {t("bookings.serviceDetails")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400">{t("bookings.service")}</p>
                            <p className="font-semibold">{booking.package?.service?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t("bookings.package")}</p>
                            <p className="font-semibold">{booking.package?.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {t("bookings.price")}
                            </p>
                            <p className="font-semibold text-lg">${booking.package?.price}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {t("bookings.duration")}
                            </p>
                            <p className="font-semibold">
                                {booking.package?.duration_hours} {t("bookings.hours")}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Booking Info */}
            <Card className="border border-gray-700 bg-[#101825] text-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {t("bookings.bookingInformation")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {isProvider ? t("bookings.client") : t("bookings.provider")}
                            </p>
                            <p className="font-semibold">
                                {isProvider
                                    ? `${booking.user?.first_name || ""} ${booking.user?.last_name || ""}`.trim() || booking.user?.email
                                    : `${booking.package?.service?.created_by?.first_name || ""} ${booking.package?.service?.created_by?.last_name || ""}`.trim() || booking.package?.service?.created_by?.email}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {t("bookings.scheduledFor")}
                            </p>
                            <p className="font-semibold">{new Date(booking.scheduled_for).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t("bookings.bookedOn")}</p>
                            <p className="font-semibold">{new Date(booking.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t("bookings.status")}</p>
                            <div className="mt-1">
                                <StatusBadge status={booking.status} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <Card className="border border-gray-700 bg-[#101825] text-white">
                <CardHeader>
                    <CardTitle>{t("bookings.actions")}</CardTitle>
                    <CardDescription>
                        {isProvider
                            ? t("bookings.providerActionsDescription")
                            : t("bookings.clientActionsDescription")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button onClick={handleStartChat} className="w-full" variant="outline">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {isProvider ? t("bookings.chatWithClient") : t("bookings.chatWithProvider")}
                    </Button>

                    {isProvider && allowedStatuses.length > 0 && (
                        <Button
                            onClick={() => setStatusDialogOpen(true)}
                            className="w-full"
                            disabled={updateStatusMutation.isPending}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {updateStatusMutation.isPending
                                ? t("common.updating")
                                : t("bookings.updateStatus")}
                        </Button>
                    )}

                    {canCancelBooking && (
                        <Button
                            onClick={() => setCancelDialogOpen(true)}
                            className="w-full"
                            variant="destructive"
                            disabled={cancelBookingMutation.isPending}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {cancelBookingMutation.isPending
                                ? t("common.cancelling")
                                : t("bookings.cancelBooking")}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Status Update Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="bg-[#101825] border border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle>{t("bookings.changeStatus")}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("bookings.selectNewStatus")}</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="bg-[#101825] border border-gray-700">
                                    <SelectValue placeholder={t("bookings.selectStatus")} />
                                </SelectTrigger>
                                <SelectContent className="bg-[#101825] border border-gray-700">
                                    {allowedStatuses.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {t(`bookings.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={handleUpdateStatus}
                            disabled={updateStatusMutation.isPending || !selectedStatus || selectedStatus === booking.status}
                        >
                            {updateStatusMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t("bookings.updateStatus")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Cancel Booking Dialog */}
            <ConfirmDialog
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                title={t("bookings.cancelBookingTitle")}
                description={t("bookings.cancelBookingDescription")}
                confirmLabel={t("bookings.cancelBooking")}
                variant="destructive"
                onConfirm={() => cancelBookingMutation.mutate(bookingId)}
                loading={cancelBookingMutation.isPending}
            />
        </div>
    );
};

export default BookingDetails;
