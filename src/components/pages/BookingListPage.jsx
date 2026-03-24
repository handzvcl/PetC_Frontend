import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

const isWithinDateRange = (value, range) => {
  if (!value || range === "all") return true;
  const bookingDate = new Date(value).getTime();
  if (!Number.isFinite(bookingDate)) return false;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const rangeMap = {
    "30d": 30 * dayMs,
    "90d": 90 * dayMs,
    "365d": 365 * dayMs,
  };

  return now - bookingDate <= (rangeMap[range] || Number.MAX_SAFE_INTEGER);
};

const isBookingPaid = (booking) => Boolean(booking?.isPaid ?? booking?.paid);

const BookingListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const petIdFilter = searchParams.get("petId");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aDate = new Date(a?.createAt || a?.scheduledAt || 0).getTime();
      const bDate = new Date(b?.createAt || b?.scheduledAt || 0).getTime();
      return bDate - aDate;
    });
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return sortedBookings.filter((booking) => {
      const statusMatch =
        statusFilter === "all" || String(booking.bookingStatus) === String(statusFilter);
      const dateMatch = isWithinDateRange(booking.scheduledAt || booking.createAt, dateRangeFilter);
      const paymentMatch =
        paymentFilter === "all"
          ? true
          : paymentFilter === "paid"
            ? isBookingPaid(booking)
            : !isBookingPaid(booking);
      return statusMatch && dateMatch && paymentMatch;
    });
  }, [sortedBookings, statusFilter, dateRangeFilter, paymentFilter]);

  const totalSpent = useMemo(
    () =>
      sortedBookings.reduce((sum, booking) => {
        if (booking.bookingStatus === 5 || booking.bookingStatus === 6) return sum;
        return sum + Number(booking.totalPrice || 0);
      }, 0),
    [sortedBookings],
  );

  const latestBookingTime = sortedBookings[0]?.scheduledAt || sortedBookings[0]?.createAt || null;
  const petDisplayName =
    sortedBookings.find((booking) => booking?.petName)?.petName || `#${petIdFilter}`;

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          user?.token || JSON.parse(localStorage.getItem("user") || "null")?.token;

        if (!token) {
          throw new Error("Vui lòng đăng nhập để xem danh sách lịch hẹn");
        }

        const url = petIdFilter
          ? `http://localhost:8080/api/bookings/me?petId=${petIdFilter}`
          : "http://localhost:8080/api/bookings/me";

        const response = await fetch(url, {
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
  }, [user?.token, petIdFilter]);

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
        <h4 className="mb-0">
          {petIdFilter
            ? `Lịch sử chăm sóc của ${petDisplayName}`
            : "Danh sách lịch hẹn của tôi"}
        </h4>

        <div className="d-flex gap-2">
          {petIdFilter && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/bookings")}
            >
              Xem tất cả
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/booking")}
          >
            Đặt lịch mới
          </button>
        </div>
      </div>

      {petIdFilter && (
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Tổng lượt chăm sóc</div>
                <div className="fs-4 fw-semibold">{sortedBookings.length}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Lần chăm sóc gần nhất</div>
                <div className="fw-semibold">{latestBookingTime ? formatDateTime(latestBookingTime) : "-"}</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="text-muted small">Tổng chi phí đã chi</div>
                <div className="fs-5 fw-semibold text-danger">
                  {totalSpent.toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label mb-1">Lọc theo trạng thái</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="0">Chờ xác nhận</option>
                <option value="1">Chờ thanh toán</option>
                <option value="2">Đã xác nhận</option>
                <option value="3">Đang thực hiện</option>
                <option value="4">Hoàn thành</option>
                <option value="5">Đã hủy</option>
                <option value="6">Vắng mặt</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Khoảng thời gian</label>
              <select
                className="form-select"
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                }}
              >
                <option value="all">Toàn bộ thời gian</option>
                <option value="30d">30 ngày gần nhất</option>
                <option value="90d">3 tháng gần nhất</option>
                <option value="365d">1 năm gần nhất</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label mb-1">Thanh toán</label>
              <select
                className="form-select"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="paid">Đã thanh toán</option>
                <option value="unpaid">Chưa thanh toán</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setStatusFilter("all");
                  setDateRangeFilter("all");
                  setPaymentFilter("all");
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="alert alert-info mb-0">
          {petIdFilter
            ? "Không có lịch sử chăm sóc phù hợp với bộ lọc hiện tại."
            : "Bạn chưa có lịch hẹn nào."}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Mã booking</th>
                {!petIdFilter && <th>Thú cưng</th>}
                <th>Thời gian hẹn</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
                <th style={{ width: 170 }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.bookingCode}</td>
                  {!petIdFilter && <td>{booking.petName || "-"}</td>}
                  <td>{formatDateTime(booking.scheduledAt)}</td>
                  <td>{getStatusText(booking.bookingStatus)}</td>
                  <td>
                    <span className={`badge ${isBookingPaid(booking) ? "bg-success" : "bg-warning text-dark"}`}>
                      {isBookingPaid(booking) ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </td>
                  <td className="fw-semibold text-danger">
                    {Number(booking.totalPrice || 0).toLocaleString("vi-VN")}đ
                  </td>
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