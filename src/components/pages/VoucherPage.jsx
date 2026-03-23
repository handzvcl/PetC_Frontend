import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";

const formatCurrency = (value) => Number(value || 0).toLocaleString("vi-VN") + "đ";

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

const VoucherPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = user?.token || JSON.parse(localStorage.getItem("user") || "null")?.token;
        if (!token) {
          throw new Error("Vui lòng đăng nhập để xem voucher");
        }

        const response = await fetch("http://localhost:8080/api/bookings/me/vouchers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Không thể tải danh sách voucher");
        }

        setVouchers(result.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [user?.token]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 mb-0">Đang tải voucher...</p>
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
      <h4 className="mb-3">Voucher của tôi</h4>
      {vouchers.length === 0 ? (
        <div className="alert alert-info mb-0">Bạn chưa có voucher nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Mã voucher</th>
                <th>Số tiền</th>
                <th>Còn lại</th>
                <th>Hạn dùng</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((voucher) => (
                <tr key={voucher.id}>
                  <td><strong>{voucher.code}</strong></td>
                  <td>{formatCurrency(voucher.amount)}</td>
                  <td>{formatCurrency(voucher.remainingAmount)}</td>
                  <td>{formatDateTime(voucher.expiredAt)}</td>
                  <td>
                    <span className="badge bg-success">{voucher.status}</span>
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

export default VoucherPage;
