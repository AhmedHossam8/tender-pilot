import * as React from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { bookingService } from "../../services/booking.service"
import { messagingService } from "../../services/messaging.service"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/contexts/authStore"

// UI Components
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
    StatusBadge,
    Button,
    SkeletonTable,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui"
import { Eye, RefreshCw, MessageCircle, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/common"

const BookingsList = () => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState(null);
    const [newStatus, setNewStatus] = React.useState("");

    const isProvider = user?.user_type === "provider" || user?.user_type === "both";

    const { data: bookings, isLoading, isError, error } = useQuery({
        queryKey: ["bookings"],
        queryFn: async () => {
            const res = await bookingService.getAll();
            return res.data.results ?? res.data;
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ bookingId, status }) => bookingService.update(bookingId, { status }),
        onSuccess: () => {
            toast.success(t("bookings.statusUpdated"));
            queryClient.invalidateQueries(["bookings"]);
            setStatusDialogOpen(false);
            setSelectedBooking(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || t("bookings.statusUpdateError"));
        },
    });

    const conversationMutation = useMutation({
        mutationFn: async (otherUserId) => {
            const conversations = await messagingService.getConversations();
            const existingConv = conversations.find(conv =>
                conv.participants.some(p => p.user === otherUserId)
            );
            if (existingConv) return { data: existingConv };
            return messagingService.createConversation([otherUserId]);
        },
        onSuccess: (response) => {
            const conversationId = response?.data?.id || response?.id;
            if (conversationId) {
                navigate(`/app/messages/${conversationId}`);
                toast.success(t("bookings.conversationCreated"));
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || t("bookings.conversationError"));
        },
    });

    const handleOpenStatusDialog = (booking) => {
        if (!isProvider) {
            toast.error(t("notifications.unauthorized"));
            return;
        }
        setSelectedBooking(booking);
        setNewStatus(booking.status);
        setStatusDialogOpen(true);
    };

    const handleUpdateStatus = () => {
        if (selectedBooking && newStatus) {
            statusMutation.mutate({ bookingId: selectedBooking.id, status: newStatus });
        }
    };

    const handleCreateConversation = (booking) => {
        const otherUserId = isProvider
            ? booking.user?.id
            : booking.package?.service?.created_by?.id;
        if (!otherUserId) {
            toast.error(t("bookings.conversationError"));
            return;
        }
        conversationMutation.mutate(otherUserId);
    };

    if (isLoading) return <SkeletonTable rows={5} columns={6} />
    if (isError) return <p className="text-center text-red-500">{t("bookings.loadError")}</p>

    if (!bookings?.length)
        return (
            <EmptyState
                title={t("bookings.noBookings")}
                description={t("bookings.noBookings")}
            />
        )

    return (
        <div className="p-6 min-h-screen bg-[#101825] text-white">
            <h1 className="text-2xl font-bold mb-6">{t("bookings.title")}</h1>

            <Table className="border border-gray-700">
                <TableHeader>
                    <TableRow>
                        <TableHead>{isProvider ? t("bookings.client") : t("bookings.provider")}</TableHead>
                        <TableHead>{t("bookings.service")}</TableHead>
                        <TableHead>{t("bookings.package", "Package")}</TableHead>
                        <TableHead>{t("bookings.amount")}</TableHead>
                        <TableHead>{t("bookings.status")}</TableHead>
                        <TableHead>{t("bookings.bookedAt")}</TableHead>
                        <TableHead className="text-right">{t("bookings.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bookings.map((booking) => {
                        const serviceName = booking.package?.service?.name || "-";
                        const packageName = booking.package?.name || "-";
                        const packagePrice = booking.package?.price ? `$${booking.package.price}` : "-";
                        const clientName = booking.user?.full_name || booking.user?.email || "Unknown";
                        const providerName = booking.package?.service?.created_by?.full_name ||
                            booking.package?.service?.created_by?.email ||
                            "Unknown";

                        return (
                            <TableRow key={booking.id} className="hover:bg-gray-900">
                                <TableCell className="font-medium">{isProvider ? clientName : providerName}</TableCell>
                                <TableCell>{serviceName}</TableCell>
                                <TableCell>{packageName}</TableCell>
                                <TableCell>{packagePrice}</TableCell>
                                <TableCell><StatusBadge status={booking.status} /></TableCell>
                                <TableCell>{new Date(booking.scheduled_for).toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title={t("bookings.viewBooking")}
                                            onClick={() => navigate(`/app/bookings/${booking.id}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        {isProvider && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                title={t("bookings.updateStatus")}
                                                onClick={() => handleOpenStatusDialog(booking)}
                                                disabled={statusMutation.isPending}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            title={t("bookings.contactProvider")}
                                            onClick={() => handleCreateConversation(booking)}
                                            disabled={conversationMutation.isPending}
                                        >
                                            {conversationMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <MessageCircle className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Status Change Dialog */}
            {isProvider && (
                <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                    <DialogContent className="bg-[#101825] border border-gray-700 text-white">
                        <DialogHeader>
                            <DialogTitle>{t("bookings.updateBookingStatus")}</DialogTitle>
                            <DialogDescription>
                                {t("bookings.status")}: <strong>{selectedBooking?.status}</strong>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{
                                    t("bookings.newStatus")
                                }</label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="bg-[#101825] border border-gray-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#101825] border border-gray-700">
                                        <SelectItem value="pending">{t("status.pending")}</SelectItem>
                                        <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
                                        <SelectItem value="completed">{t("status.completed")}</SelectItem>
                                        <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
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
                                disabled={statusMutation.isPending || newStatus === selectedBooking?.status}
                            >
                                {statusMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t("bookingsupdateStatus")}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

export default BookingsList