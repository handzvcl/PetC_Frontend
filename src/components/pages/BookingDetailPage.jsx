import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../AuthContext";

const getStatusMeta = (status) => {
  const statusMap = {
    0: { label: "Chờ xác nhận", badge: "bg-warning text-dark" },
    1: { label: "Chờ thanh toán", badge: "bg-info text-dark" },
    2: { label: "Đã xác nhận", badge: "bg-primary" },
    3: { label: "Đang thực hiện", badge: "bg-secondary" },
    4: { label: "Hoàn thành", badge: "bg-success" },
    5: { label: "Đã hủy", badge: "bg-danger" },
    6: { label: "Vắng mặt", badge: "bg-dark" },
  };
  return statusMap[status] || { label: "Không xác định", badge: "bg-light text-dark" };
};

const formatDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSafeToken = (user) => user?.token || JSON.parse(localStorage.getItem("user") || "null")?.token;
const canCancelBooking = (bookingStatus) => ![3, 4, 5, 6].includes(bookingStatus);

const BookingDetailPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("MOMO_PREPAID");
  const [selectedVoucherCode, setSelectedVoucherCode] = useState("");
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const statusMeta = useMemo(
    () => getStatusMeta(booking?.bookingStatus),
    [booking?.bookingStatus],
  );

  useEffect(() => {
    const fetchBookingDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getSafeToken(user);
        if (!token) {
          throw new Error("Vui lòng đăng nhập để xem chi tiết lịch hẹn");
        }

        const [bookingResponse, paymentResponse, voucherResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/bookings/me/${bookingId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`http://localhost:8080/api/payments/booking/${bookingId}/summary`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:8080/api/bookings/me/vouchers", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const bookingResult = await bookingResponse.json().catch(() => null);
        if (!bookingResponse.ok || !bookingResult?.success) {
          throw new Error(bookingResult?.message || "Không thể tải chi tiết lịch hẹn");
        }

        const paymentResult = await paymentResponse.json().catch(() => null);
        if (paymentResponse.ok && paymentResult?.success) {
          setPaymentSummary(paymentResult.data);
        } else {
          setPaymentSummary(null);
        }

        const voucherResult = await voucherResponse.json().catch(() => null);
        if (voucherResponse.ok && voucherResult?.success) {
          setVouchers(voucherResult.data || []);
        } else {
          setVouchers([]);
        }

        setBooking(bookingResult.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetail();
  }, [bookingId, user?.token]);

  const handleRetryPayment = async () => {
    try {
      setPaying(true);
      setActionError(null);
      setActionMessage(null);

      const token = getSafeToken(user);
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(`http://localhost:8080/api/payments/booking/${bookingId}/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
          voucherCode: selectedVoucherCode || null,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể khởi tạo thanh toán");
      }

      if (result?.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
        return;
      }

      setActionMessage("Thanh toán đã được cập nhật thành công.");
      navigate(`/booking/details/${bookingId}`, { replace: true });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleCancelBooking = async () => {
    const ok = window.confirm("Bạn có chắc muốn hủy lịch hẹn này không?");
    if (!ok) {
      return;
    }

    try {
      setCancelling(true);
      setActionError(null);
      setActionMessage(null);

      const token = getSafeToken(user);
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(`http://localhost:8080/api/bookings/me/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể hủy lịch hẹn");
      }

      const payload = result?.data;
      if (payload?.booking) {
        setBooking(payload.booking);
      }

      if (payload?.voucherCreated) {
        setActionMessage(`Đã hủy lịch. Voucher ${payload.voucherCode} (${Number(payload.voucherAmount || 0).toLocaleString("vi-VN")}đ) đã được tạo cho lần đặt sau.`);
      } else {
        setActionMessage(payload?.message || "Đã hủy lịch hẹn thành công.");
      }

      setPaymentSummary((prev) => (prev ? { ...prev, canRetryPayment: false } : prev));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 mb-0">Đang tải chi tiết lịch hẹn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
        <button type="button" className="btn btn-outline-primary" onClick={() => navigate("/booking")}>
          Quay lại đặt lịch
        </button>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  const qrData = booking.bookingCode;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrData)}`;
  const showPaymentSection = (paymentSummary?.canRetryPayment || booking.bookingStatus === 1) && booking.bookingStatus !== 5;
  const selectedVoucher = vouchers.find((v) => v.code === selectedVoucherCode);
  const voucherDiscountPreview = Math.min(
    Number(selectedVoucher?.remainingAmount || 0),
    Number(booking.totalPrice || 0),
  );
  const payablePreview = Math.max(0, Number(booking.totalPrice || 0) - voucherDiscountPreview);

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">Chi tiết lịch hẹn</h4>
            </div>
            <div className="card-body">
              <table className="table table-bordered align-middle mb-0">
                <tbody>
                  <tr>
                    <th style={{ width: "38%" }}>Mã booking</th>
                    <td><strong className="text-primary">{booking.bookingCode}</strong></td>
                  </tr>
                  <tr>
                    <th>Khách hàng</th>
                    <td>{booking.userName}</td>
                  </tr>
                  <tr>
                    <th>Thú cưng</th>
                    <td>{booking.petName}</td>
                  </tr>
                  <tr>
                    <th>Bắt đầu</th>
                    <td>{formatDateTime(booking.scheduledAt)}</td>
                  </tr>
                  <tr>
                    <th>Kết thúc dự kiến</th>
                    <td>{formatDateTime(booking.expectedEndTime)}</td>
                  </tr>
                  <tr>
                    <th>Dịch vụ</th>
                    <td>
                      <ul className="mb-0 ps-3">
                        {(booking.services || []).map((service) => (
                          <li key={service.id || `${service.name}-${service.price}`}>
                            {service.name} - {Number(service.price || 0).toLocaleString("vi-VN")}đ
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>Tổng tiền</th>
                    <td><strong className="text-danger">{Number(booking.totalPrice || 0).toLocaleString("vi-VN")}đ</strong></td>
                  </tr>
                  {booking.notes && (
                    <tr>
                      <th>Ghi chú</th>
                      <td>{booking.notes}</td>
                    </tr>
                  )}
                  <tr>
                    <th>Trạng thái</th>
                    <td><span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Mã QR check-in</h5>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <img src={qrUrl} alt="QR Booking" className="img-fluid border rounded p-2 bg-white" style={{ maxWidth: 300 }} />
              <p className="text-muted text-center mt-3 mb-1">Nhân viên quét QR này để truy xuất lịch hẹn.</p>
              <p className="fw-semibold mb-0">{booking.bookingCode}</p>
            </div>
          </div>
        </div>
      </div>

      {(actionError || actionMessage) && (
        <div className="mt-4">
          {actionError && <div className="alert alert-danger mb-2">{actionError}</div>}
          {actionMessage && <div className="alert alert-success mb-0">{actionMessage}</div>}
        </div>
      )}

      {showPaymentSection && (
        <div className="card mt-4 shadow-sm">
          <div className="card-header bg-warning-subtle">
            <h6 className="mb-0">Thanh toán lịch hẹn</h6>
          </div>
          <div className="card-body">
            <p className="mb-3">
              {paymentSummary?.latestPaymentStatus === "FAILED"
                ? "Lần thanh toán trước thất bại. Vui lòng chọn phương thức và thanh toán lại."
                : "Lịch hẹn này chưa thanh toán trước. Bạn có thể thanh toán ngay tại đây."}
            </p>
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Phương thức thanh toán</label>
                <select
                  className="form-select"
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                >
                  <option value="MOMO_PREPAID">MoMo</option>
                  <option value="VNPAY_PREPAID">VNPay</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Áp dụng voucher</label>
                <select
                  className="form-select"
                  value={selectedVoucherCode}
                  onChange={(e) => setSelectedVoucherCode(e.target.value)}
                >
                  <option value="">Không dùng voucher</option>
                  {vouchers.map((voucher) => (
                    <option key={voucher.id} value={voucher.code}>
                      {voucher.code} - còn {Number(voucher.remainingAmount || 0).toLocaleString("vi-VN")}đ
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-success w-100"
                  onClick={handleRetryPayment}
                  disabled={paying || cancelling}
                >
                  {paying ? "Đang chuyển cổng..." : "Thanh toán ngay"}
                </button>
              </div>
            </div>
            <div className="mt-3 small text-muted">
              <div>Tổng tiền: <strong>{Number(booking.totalPrice || 0).toLocaleString("vi-VN")}đ</strong></div>
              <div>Giảm voucher: <strong>-{voucherDiscountPreview.toLocaleString("vi-VN")}đ</strong></div>
              <div>Số tiền cần thanh toán: <strong className="text-danger">{payablePreview.toLocaleString("vi-VN")}đ</strong></div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 d-flex gap-2 flex-wrap">
        {canCancelBooking(booking.bookingStatus) && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleCancelBooking}
            disabled={cancelling || paying}
          >
            {cancelling ? "Đang hủy..." : "Hủy lịch hẹn"}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={() => navigate("/booking")}>Đặt lịch mới</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/")}>Về trang chủ</button>
      </div>
    </div>
  );
};

export default BookingDetailPage;
