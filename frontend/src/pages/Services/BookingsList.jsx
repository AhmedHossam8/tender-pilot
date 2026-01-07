import React from "react";
import { useQuery } from "@tanstack/react-query";
import { bookingService } from "../../services/booking.service";

const BookingsList = () => {
    const { data, isLoading, isError, error } = useQuery(
        ["bookings"],
        bookingService.getAll
    );

    if (isLoading) return <p>Loading bookings...</p>;
    if (isError) return <p>Error: {error.message}</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Bookings</h1>
            <div className="space-y-4">
                {data?.data?.map((booking) => (
                    <div
                        key={booking.id}
                        className="p-4 border rounded shadow hover:shadow-lg transition"
                    >
                        <p>
                            <strong>User:</strong> {booking.user}
                        </p>
                        <p>
                            <strong>Service:</strong> {booking.package?.service?.name}
                        </p>
                        <p>
                            <strong>Package:</strong> {booking.package?.name}
                        </p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <span
                                className={`font-semibold ${booking.status === "pending"
                                        ? "text-yellow-600"
                                        : booking.status === "confirmed"
                                            ? "text-blue-600"
                                            : booking.status === "completed"
                                                ? "text-green-600"
                                                : "text-red-600"
                                    }`}
                            >
                                {booking.status}
                            </span>
                        </p>
                        <p>
                            <strong>Scheduled For:</strong>{" "}
                            {new Date(booking.scheduled_for).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookingsList;
