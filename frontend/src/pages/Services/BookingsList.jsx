import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { bookingService } from "../../services/booking.service"
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
} from "@/components/ui"
import { Eye, Edit } from "lucide-react"
import { EmptyState, LoadingSpinner } from "@/components/common"

const BookingsList = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [updatingId, setUpdatingId] = React.useState(null);

    const {
        data: bookings,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["bookings"],
        queryFn: async () => {
            const res = await bookingService.getAll();
            // Supports both paginated { results: [] } and plain array
            return res.data.results ?? res.data;
        },
    });

    // Handle booking status change
    const handleStatusChange = async (bookingId, newStatus) => {
        setUpdatingId(bookingId);
        try {
            await bookingService.update(bookingId, { status: newStatus });
            toast.success(t("bookings.statusUpdated"));
            queryClient.invalidateQueries(["bookings"]);
        } catch (err) {
            toast.error(
                err.response?.data?.error || t("bookings.statusUpdateError")
            );
        } finally {
            setUpdatingId(null);
        }
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
                                        title="View Booking"
                                        disabled={updatingId === booking.id}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        title="Edit Status"
                                        disabled={updatingId === booking.id}
                                        onClick={() =>
                                            handleStatusChange(
                                                booking.id,
                                                booking.status === "pending"
                                                    ? "confirmed"
                                                    : "completed"
                                            )
                                        }
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default BookingsList
