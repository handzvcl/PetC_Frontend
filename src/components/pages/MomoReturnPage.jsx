import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const MomoReturnPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processReturn = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = searchParams.toString();
        if (!query) {
          throw new Error("Thiếu dữ liệu thanh toán từ MoMo");
        }

        const response = await fetch(`http://localhost:8080/api/payments/momo/return?${query}`);
        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Xác nhận thanh toán MoMo thất bại");
        }

        const bookingId = result?.data?.id;
        if (!bookingId) {
          throw new Error("Không nhận được thông tin lịch hẹn sau thanh toán");
        }

        navigate(`/booking/details/${bookingId}?fromPayment=1&method=MOMO`, { replace: true });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    processReturn();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 mb-0">Đang xác nhận thanh toán MoMo...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="alert alert-danger">{error || "Có lỗi xảy ra khi xử lý kết quả thanh toán."}</div>
      <button type="button" className="btn btn-primary" onClick={() => navigate("/booking")}>Quay lại đặt lịch</button>
    </div>
  );
};

export default MomoReturnPage;
