import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const getStatusText = (status) => {
  const statusMap = {
    0: "Chờ xác nhận",
    1: "Chờ thanh toán",
    2: "Đã xác nhận",
    3: "Đang thực hiện",
    4: "Hoàn thành",
    5: "Đã hủy",
    6: "Vắng mặt",
  };
  return statusMap[status] || "Không xác định";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BookingListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aDate = new Date(a?.createAt || a?.scheduledAt || 0).getTime();
      const bDate = new Date(b?.createAt || b?.scheduledAt || 0).getTime();
      return bDate - aDate;
    });
  }, [bookings]);

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = user?.token || JSON.parse(localStorage.getItem("user") || "null")?.token;
        if (!token) {
          throw new Error("Vui lòng đăng nhập để xem danh sách lịch hẹn");
        }

        const response = await fetch("http://localhost:8080/api/bookings/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Không thể tải danh sách lịch hẹn");
        }

        setBookings(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [user?.token]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 mb-0">Đang tải danh sách lịch hẹn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Danh sách lịch hẹn của tôi</h4>
        <button type="button" className="btn btn-primary" onClick={() => navigate("/booking")}>
          Đặt lịch mới
        </button>
      </div>

      {sortedBookings.length === 0 ? (
        <div className="alert alert-info mb-0">Bạn chưa có lịch hẹn nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Mã booking</th>
                <th>Thời gian hẹn</th>
                <th>Trạng thái</th>
                <th style={{ width: 170 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.bookingCode}</td>
                  <td>{formatDateTime(booking.scheduledAt)}</td>
                  <td>{getStatusText(booking.bookingStatus)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/booking/details/${booking.id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingListPage;
