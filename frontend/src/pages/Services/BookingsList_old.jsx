import * as React from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { bookingService } from "../../services/booking.service"
import { messagingService } from "../../services/messaging.service"
import { useTranslation } from "react-i18next"

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
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState(null);
    const [newStatus, setNewStatus] = React.useState("");

    const {
        data: bookings,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["bookings"],
        queryFn: async () => {
            const res = await bookingService.getAll();
            return res.data.results ?? res.data;
        },
    });

    // Status update mutation
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

    // Create conversation mutation
    const conversationMutation = useMutation({
        mutationFn: (userId) => messagingService.createConversation([userId]),
        onSuccess: (response) => {
            toast.success(t("bookings.conversationCreated"));
            const conversationId = response.data.id;
            navigate(`/app/messages/${conversationId}`);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || t("bookings.conversationError"));
        },
    });

    const handleOpenStatusDialog = (booking) => {
        setSelectedBooking(booking);
        setNewStatus(booking.status);
        setStatusDialogOpen(true);
    };

    const handleUpdateStatus = () => {
        if (selectedBooking && newStatus) {
            statusMutation.mutate({ bookingId: selectedBooking.id, status: newStatus });
        }
    };

    const handleCreateConversation = (userId) => {
        conversationMutation.mutate(userId);
    };

    if (isLoading) return <SkeletonTable rows={5} columns={6} />
    if (isError) return <p>Error: {error.message}</p>

    if (!bookings?.length)
        return (
            <EmptyState
                title={t("bookings.noBookings")}
                description="Bookings will appear here once created."
            />
        )

    return (
        <div className="p-6 min-h-screen bg-background">
            <h1 className="text-2xl font-bold mb-6">{t("bookings.title")}</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("bookings.user")}</TableHead>
                        <TableHead>{t("bookings.service")}</TableHead>
                        <TableHead>{t("bookings.package")}</TableHead>
                        <TableHead>{t("bookings.status")}</TableHead>
                        <TableHead>{t("bookings.scheduledFor")}</TableHead>
                        <TableHead className="text-right">{t("bookings.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                            <TableCell className="font-medium">{booking.user?.email || booking.user?.full_name || "Unknown"}</TableCell>
                            <TableCell>{booking.package?.service?.name || "-"}</TableCell>
                            <TableCell>{booking.package?.name || "-"}</TableCell>
                            <TableCell>
                                <StatusBadge status={booking.status} />
                            </TableCell>
                            <TableCell>
                                {new Date(booking.scheduled_for).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title={t("bookings.viewDetails")}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title={t("bookings.changeStatus")}
                                        onClick={() => handleOpenStatusDialog(booking)}
                                        disabled={statusMutation.isPending}
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title={t("bookings.createConversation")}
                                        onClick={() => handleCreateConversation(booking.user?.id)}
                                        disabled={conversationMutation.isPending || !booking.user?.id}
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
                    ))}
                </TableBody>
            </Table>

            {/* Status Change Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("bookings.changeStatus")}</DialogTitle>
                        <DialogDescription>
                            {t("bookings.currentStatus")}: <strong>{selectedBooking?.status}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t("bookings.selectNewStatus")}</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">{t("bookings.statusPending")}</SelectItem>
                                    <SelectItem value="confirmed">{t("bookings.statusConfirmed")}</SelectItem>
                                    <SelectItem value="completed">{t("bookings.statusCompleted")}</SelectItem>
                                    <SelectItem value="cancelled">{t("bookings.statusCancelled")}</SelectItem>
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
                            {t("bookings.updateStatus")}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default BookingsList
