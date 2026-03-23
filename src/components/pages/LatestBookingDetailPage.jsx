import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const LatestBookingDetailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const goToLatestDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = user?.token || JSON.parse(localStorage.getItem("user") || "null")?.token;
        if (!token) {
          throw new Error("Vui lòng đăng nhập để xem chi tiết lịch hẹn");
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
          throw new Error(result?.message || "Không thể tải lịch hẹn");
        }

        const bookings = result.data || [];
        if (bookings.length === 0) {
          throw new Error("Bạn chưa có lịch hẹn để xem chi tiết");
        }

        const latest = [...bookings].sort((a, b) => {
          const aDate = new Date(a?.createAt || a?.scheduledAt || 0).getTime();
          const bDate = new Date(b?.createAt || b?.scheduledAt || 0).getTime();
          return bDate - aDate;
        })[0];

        navigate(`/booking/details/${latest.id}`, { replace: true });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    goToLatestDetail();
  }, [navigate, user?.token]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 mb-0">Đang mở chi tiết lịch hẹn gần nhất...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="alert alert-warning mb-3">{error}</div>
      <button type="button" className="btn btn-outline-primary" onClick={() => navigate("/bookings")}>
        Mở danh sách lịch hẹn
      </button>
    </div>
  );
};

export default LatestBookingDetailPage;
