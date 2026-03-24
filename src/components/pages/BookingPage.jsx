import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./BookingPage.css";

const BookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ===================== STATE ===================== */
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(true);
  const [loadingPetTypes, setLoadingPetTypes] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [petError, setPetError] = useState(null);
  const [slotError, setSlotError] = useState(null);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("MOMO_PREPAID");
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherError, setVoucherError] = useState(null);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState("");

  // Payment category: "online" | "store"
  const [paymentCategory, setPaymentCategory] = useState("online");

  // Add pet form
  const [newPet, setNewPet] = useState({
    name: "",
    petTypeId: "",
    age: "",
    breed: "",
    weight: "",
  });
  const [addingPet, setAddingPet] = useState(false);
  const [addPetError, setAddPetError] = useState(null);

  // Personal info
  const [phone, setPhone] = useState(user?.phone || "");

  // Form-level error
  const [formError, setFormError] = useState(null);

  /* =================== EFFECTS =================== */
  useEffect(() => {
    fetchServices();
    fetchUserPets();
    fetchPetTypes();
  }, [user]);

  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate, selectedServices]);

  useEffect(() => {
    setPhone(user?.phone || "");
  }, [user]);

  /* ================= API FUNCTIONS ================ */
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/service");
      if (!response.ok) throw new Error("Không thể tải danh sách dịch vụ");
      const result = await response.json();
      if (result.success) {
        setServices(result.data);
        setError(null);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPets = async () => {
    try {
      setLoadingPets(true);
      const currentUserId = Number(user?.userId ?? user?.id);
      if (!Number.isFinite(currentUserId)) {
        setPets([]);
        setPetError("Vui lòng đăng nhập để tải danh sách thú cưng");
        return;
      }
      const response = await fetch(
        `http://localhost:8080/api/pet/user/${currentUserId}`,
        { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } },
      );
      if (!response.ok) throw new Error("Không thể tải danh sách thú cưng");
      const result = await response.json();
      if (result.success) {
        setPets(result.data);
        setPetError(null);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setPetError(err.message);
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchPetTypes = async () => {
    try {
      setLoadingPetTypes(true);
      const response = await fetch("http://localhost:8080/api/pet-type");
      if (!response.ok) throw new Error("Không thể tải danh sách loại thú cưng");
      const result = await response.json();
      if (result.success) {
        setPetTypes(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error fetching pet types:", err);
    } finally {
      setLoadingPetTypes(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      setSlotError(null);
      const totalDuration = selectedServices.reduce(
        (sum, s) => sum + s.durationInMinutes,
        0,
      );
      const response = await fetch(
        `http://localhost:8080/api/bookings/available-slots?selectedDay=${selectedDate}&durationInMinutes=${totalDuration}`,
      );
      if (!response.ok) throw new Error("Không thể tải danh sách khung giờ");
      const result = await response.json();
      if (result.success) {
        setAvailableSlots(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setSlotError(err.message);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchMyVouchers = async (token) => {
    try {
      setLoadingVouchers(true);
      setVoucherError(null);
      const response = await fetch("http://localhost:8080/api/bookings/me/vouchers", {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể tải danh sách voucher");
      }
      setVouchers(result.data || []);
    } catch (err) {
      setVoucherError(err.message);
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  /* ================== HANDLERS =================== */
  const handleOpenAddPetModal = () => {
    setAddPetError(null);
    setShowAddPetModal(true);
    if (petTypes.length === 0) fetchPetTypes();
  };

  const handleAddPet = async (e) => {
    e.preventDefault();
    try {
      setAddingPet(true);
      setAddPetError(null);
      const currentUserId = Number(user?.userId ?? user?.id);
      if (!Number.isFinite(currentUserId))
        throw new Error("Không xác định được người dùng hiện tại");
      const response = await fetch(
        `http://localhost:8080/api/pet/user/${currentUserId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newPet.name,
            petTypeId: newPet.petTypeId,
            age: parseInt(newPet.age),
          }),
        },
      );
      if (!response.ok) throw new Error("Không thể thêm thú cưng");
      setNewPet({ name: "", petTypeId: "", age: "", breed: "", weight: "" });
      await fetchUserPets();
      setShowAddPetModal(false);
    } catch (err) {
      setAddPetError(err.message);
    } finally {
      setAddingPet(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedPet || selectedServices.length === 0 || !selectedSlot) {
      setFormError("Vui lòng chọn đầy đủ thú cưng, dịch vụ và khung giờ trước khi đặt lịch.");
      return;
    }
    setFormError(null);

    try {
      setSubmitting(true);
      const currentUserId = Number(user?.userId ?? user?.id);
      if (!Number.isFinite(currentUserId))
        throw new Error("Vui lòng đăng nhập trước khi đặt lịch");

      const response = await fetch(
        `http://localhost:8080/api/bookings/user/${currentUserId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: selectedSlot.startAt,
            notes,
            petId: selectedPet,
            services: selectedServices.map((s) => s.id),
          }),
        },
      );
      if (!response.ok) throw new Error("Không thể tạo lịch hẹn");
      const result = await response.json();
      if (result.success) {
        const token = user?.token;
        if (token) await fetchMyVouchers(token);
        setSelectedVoucherCode("");
        setBookingResult(result.data);
        setShowConfirmModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setFormError("Lỗi: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setConfirming(true);
      const token = user?.token;
      if (!token) throw new Error("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");

      const finalMethod =
        paymentCategory === "store" ? "PAY_LATER" : paymentMethod;

      const response = await fetch(
        `http://localhost:8080/api/payments/booking/${bookingResult.id}/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod: finalMethod,
            voucherCode:
              finalMethod === "MOMO_PREPAID" || finalMethod === "VNPAY_PREPAID"
                ? selectedVoucherCode || null
                : null,
          }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success)
        throw new Error(result?.message || "Không thể khởi tạo thanh toán");

      const paymentData = result.data;

      if (
        (finalMethod === "MOMO_PREPAID" || finalMethod === "VNPAY_PREPAID") &&
        paymentData?.paymentUrl
      ) {
        window.location.href = paymentData.paymentUrl;
        return;
      }

      setShowConfirmModal(false);
      navigate(`/booking/details/${bookingResult.id}?fromPayment=0&method=PAY_LATER`);
    } catch (err) {
      alert("Lỗi xác nhận: " + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleSuccessOk = () => {
    if (bookingResult?.id) {
      navigate(`/booking/details/${bookingResult.id}`);
      return;
    }
    navigate("/");
  };

  /* ============== SERVICE HELPERS ================= */
  const toggleServiceSelection = (service) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service],
    );
  };

  const isServiceSelected = (serviceId) =>
    selectedServices.some((s) => s.id === serviceId);

  const getServiceIcon = (name) => {
    const n = (name || "").toLowerCase();
    if (n.includes("tắm") || n.includes("bath")) return "fa-shower";
    if (n.includes("cắt") || n.includes("tỉa") || n.includes("grooming"))
      return "fa-scissors";
    if (n.includes("khám") || n.includes("check")) return "fa-stethoscope";
    if (n.includes("tiêm") || n.includes("vaccine")) return "fa-syringe";
    if (n.includes("spa") || n.includes("massage")) return "fa-spa";
    if (n.includes("nha") || n.includes("răng")) return "fa-tooth";
    return "fa-paw";
  };

  /* =============== FORMAT HELPERS ================= */
  const formatTime = (dateTimeString) =>
    new Date(dateTimeString).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateTime = (dateTimeString) =>
    new Date(dateTimeString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const getBookingStatusText = (status) => {
    const map = {
      0: "Chờ xác nhận",
      1: "Chờ thanh toán",
      2: "Đã xác nhận",
      3: "Đang thực hiện",
      4: "Hoàn thành",
      5: "Đã hủy",
      6: "Vắng mặt",
    };
    return map[status] || "Không xác định";
  };

  const getPetTypeName = (petTypeId) => {
    const t = petTypes.find((pt) => pt.id === Number(petTypeId));
    return t ? t.name : "";
  };

  /* ============== COMPUTED VALUES ================= */
  const selectedPetInfo = pets.find((p) => p.id === Number(selectedPet));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.durationInMinutes,
    0,
  );

  const isOnlinePayment =
    paymentMethod === "MOMO_PREPAID" || paymentMethod === "VNPAY_PREPAID";

  const selectedVoucher = vouchers.find(
    (v) => v.code === selectedVoucherCode,
  );
  const voucherDiscountPreview =
    isOnlinePayment && paymentCategory === "online"
      ? Math.min(
          Number(selectedVoucher?.remainingAmount || 0),
          Number(bookingResult?.totalPrice || 0),
        )
      : 0;
  const payablePreview = Math.max(
    0,
    Number(bookingResult?.totalPrice || 0) - voucherDiscountPreview,
  );

  /* =================== RENDER ==================== */
  return (
    <div className="booking-page">
      <div className="container">
        {/* -------- Page Header -------- */}
        <div className="page-header">
          <h2>
             Đặt lịch chăm sóc thú cưng
          </h2>
          <p>Chọn dịch vụ và thời gian phù hợp cho bé cưng của bạn</p>
        </div>

        <div className="row g-4">
          {/* ======================== LEFT COLUMN ======================== */}
          <div className="col-lg-8">
            {/* ---------- Section 1: Personal Info ---------- */}
            <div className="bp-section">
              <div className="bp-section-title">
                <span className="bp-step">1</span>
                <i className="fas fa-user"></i>
                Thông tin cá nhân
              </div>

              {user ? (
                <>
                  <div className="bp-autofill-badge">
                    <i className="fas fa-check-circle"></i> Tự động điền từ tài khoản
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="bp-label">Họ tên</label>
                      <input
                        className="bp-input"
                        value={user.username || ""}
                        readOnly
                      />
                    </div>
                   
                  </div>
                </>
              ) : (
                <div className="bp-alert bp-alert-info">
                  <i className="fas fa-info-circle"></i>
                  Vui lòng{" "}
                  <a href="/login" style={{ fontWeight: 600 }}>
                    đăng nhập
                  </a>{" "}
                  để tiếp tục đặt lịch.
                </div>
              )}
            </div>

            {/* ---------- Section 2: Pet ---------- */}
            <div className="bp-section">
              <div className="bp-section-title">
                <span className="bp-step">2</span>
                <i className="fas fa-paw"></i>
                Thông tin thú cưng
              </div>

              {loadingPets ? (
                <div className="text-center py-3">
                  <div
                    className="spinner-border spinner-border-sm text-primary"
                    role="status"
                  >
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : petError ? (
                <div className="bp-alert bp-alert-danger">
                  <i className="fas fa-exclamation-circle"></i>
                  {petError}
                  <button className="btn-sm-round ms-auto" onClick={fetchUserPets}>
                    <i className="fas fa-redo"></i> Thử lại
                  </button>
                </div>
              ) : pets.length === 0 ? (
                <div className="bp-empty-state">
                  <i className="fas fa-dog"></i>
                  <p>
                    Bạn chưa có thú cưng nào.
                    <br />
                    Hãy thêm thú cưng để đặt lịch chăm sóc.
                  </p>
                  <button
                    type="button"
                    className="btn-sm-round btn-fill mt-2"
                    onClick={handleOpenAddPetModal}
                  >
                    <i className="fas fa-plus"></i> Thêm thú cưng
                  </button>
                </div>
              ) : (
                <>
                  <div className="d-flex gap-2 align-items-end">
                    <div style={{ flex: 1 }}>
                      <label className="bp-label">
                        Chọn thú cưng <span className="required">*</span>
                      </label>
                      <select
                        className="bp-select"
                        value={selectedPet}
                        onChange={(e) => setSelectedPet(e.target.value)}
                      >
                        <option value="">-- Chọn thú cưng --</option>
                        {pets.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {pet.name}
                            {getPetTypeName(pet.petTypeId)
                              ? ` (${getPetTypeName(pet.petTypeId)})`
                              : ""}{" "}
                            – {pet.age} tuổi
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="btn-sm-round"
                      style={{ marginBottom: "1px" }}
                      onClick={handleOpenAddPetModal}
                    >
                      <i className="fas fa-plus"></i> Thêm mới
                    </button>
                  </div>

                  {/* Selected pet info card */}
                  {selectedPetInfo && (
                    <div className="pet-info-card">
                      <div className="pet-avatar-circle">
                        <i className="fas fa-paw"></i>
                      </div>
                      <div className="pet-details">
                        <strong>{selectedPetInfo.name}</strong>
                        <span>
                          {getPetTypeName(selectedPetInfo.petTypeId) || "Thú cưng"}{" "}
                          &bull; {selectedPetInfo.age} tuổi
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ---------- Section 3: Services ---------- */}
            <div className="bp-section">
              <div className="bp-section-title">
                <span className="bp-step">3</span>
                
                Chọn dịch vụ
                {selectedServices.length > 0 && (
                  <span className="bp-badge bp-badge-primary ms-auto">
                    {selectedServices.length} đã chọn
                  </span>
                )}
              </div>

              {loading ? (
                <div className="service-cards-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="skeleton skeleton-card" />
                  ))}
                </div>
              ) : error ? (
                <div className="bp-alert bp-alert-danger">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                  <button className="btn-sm-round ms-auto" onClick={fetchServices}>
                    <i className="fas fa-redo"></i> Thử lại
                  </button>
                </div>
              ) : (
                <div className="service-cards-grid">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`service-card${
                        isServiceSelected(service.id) ? " selected" : ""
                      }`}
                      onClick={() => toggleServiceSelection(service)}
                    >
                      <span className="service-check">
                        <i className="fas fa-check-circle"></i>
                      </span>
                      <div className="service-icon-box">
                        <i
                          className={`fas ${getServiceIcon(service.name)}`}
                        ></i>
                      </div>
                      <div className="service-name">{service.name}</div>
                      <div className="service-price">
                        {service.price.toLocaleString("vi-VN")}đ
                      </div>
                      <div className="service-duration">
                        <i className="far fa-clock"></i>{" "}
                        {service.durationInMinutes} phút
                      </div>
                      {service.description && (
                        <div className="service-desc">{service.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ---------- Section 4: Date & Time ---------- */}
            <div className="bp-section">
              <div className="bp-section-title">
                <span className="bp-step">4</span>
                <i className="fas fa-calendar-alt"></i>
                Chọn ngày &amp; giờ
                {selectedDate && selectedServices.length > 0 && (
                  <button
                    className="btn-reload ms-auto"
                    onClick={fetchAvailableSlots}
                    title="Tải lại khung giờ"
                  >
                    <i className="fas fa-sync-alt"></i> Tải lại
                  </button>
                )}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="bp-label">
                    Ngày hẹn <span className="required">*</span>
                  </label>
                  <div className="bp-date-wrap">
                    <i className="fas fa-calendar-day"></i>
                    <input
                      type="date"
                      className="bp-input"
                      value={selectedDate}
                      min={getTodayDate()}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      disabled={selectedServices.length === 0}
                    />
                  </div>
                  {selectedServices.length === 0 && (
                    <small style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                      Vui lòng chọn dịch vụ trước
                    </small>
                  )}
                  {selectedDate && (
                    <small
                      style={{
                        color: "#2563eb",
                        fontSize: "0.8rem",
                        display: "block",
                        marginTop: "0.3rem",
                      }}
                    >
                      {formatDate(selectedDate)}
                    </small>
                  )}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && selectedServices.length > 0 && (
                <>
                  <label className="bp-label" style={{ marginBottom: "0.5rem" }}>
                    Khung giờ <span className="required">*</span>
                  </label>

                  {loadingSlots ? (
                    <div className="slot-grid">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="skeleton skeleton-slot" />
                      ))}
                    </div>
                  ) : slotError ? (
                    <div className="bp-alert bp-alert-danger">
                      <i className="fas fa-exclamation-circle"></i>
                      {slotError}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="bp-alert bp-alert-warning">
                      <i className="fas fa-info-circle"></i>
                      Không có khung giờ trống cho ngày này.
                    </div>
                  ) : (
                    <div className="slot-grid">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`slot-btn${
                            selectedSlot?.startAt === slot.startAt
                              ? " active"
                              : ""
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatTime(slot.startAt)}
                          <span className="slot-label">Còn trống</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ---------- Section 5: Notes ---------- */}
            <div className="bp-section">
              <div className="bp-section-title">
                <span className="bp-step">5</span>
                <i className="fas fa-sticky-note"></i>
                Ghi chú
              </div>
              <textarea
                className="bp-textarea"
                rows="3"
                placeholder="Ví dụ: Bé chó hơi dữ, cần rọ mõm khi tắm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
              {notes.toLowerCase().includes("dữ") && (
                <div
                  className="bp-alert bp-alert-warning mt-2"
                  style={{ fontSize: "0.82rem" }}
                >
                  <i className="fas fa-exclamation-triangle"></i>
                  Lưu ý: thú cưng có thể hung dữ – nhân viên sẽ chuẩn bị dụng cụ
                  bảo hộ.
                </div>
              )}
            </div>

            {/* ---------- Section 6: Payment ---------- */}
            <div className="bp-section">
              <div className="bp-section-title">
                <span className="bp-step">6</span>
                <i className="fas fa-credit-card"></i>
                Phương thức thanh toán
              </div>

              <div className="d-flex flex-column gap-3">
                {/* Option: Store */}
                <div
                  className={`payment-option${
                    paymentCategory === "store" ? " active" : ""
                  }`}
                  onClick={() => {
                    setPaymentCategory("store");
                    setPaymentMethod("PAY_LATER");
                  }}
                >
                  <div
                    className="payment-icon-circle"
                    style={{ background: "#fef3c7", color: "#d97706" }}
                  >
                    <i className="fas fa-store"></i>
                  </div>
                  <div>
                    <div className="payment-name">Thanh toán tại cửa hàng</div>
                    <div className="payment-desc">
                      Thanh toán sau khi hoàn thành dịch vụ
                    </div>
                  </div>
                  <div className="ms-auto">
                    <input
                      type="radio"
                      className="form-check-input"
                      checked={paymentCategory === "store"}
                      onChange={() => {}}
                    />
                  </div>
                </div>

                {/* Option: Online */}
                <div
                  className={`payment-option${
                    paymentCategory === "online" ? " active" : ""
                  }`}
                  onClick={() => {
                    setPaymentCategory("online");
                    setPaymentMethod("MOMO_PREPAID");
                  }}
                >
                  <div
                    className="payment-icon-circle"
                    style={{ background: "#dbeafe", color: "#2563eb" }}
                  >
                    <i className="fas fa-globe"></i>
                  </div>
                  <div>
                    <div className="payment-name">Thanh toán online</div>
                    <div className="payment-desc">
                      Thanh toán trước qua ví điện tử
                    </div>
                  </div>
                  <div className="ms-auto">
                    <input
                      type="radio"
                      className="form-check-input"
                      checked={paymentCategory === "online"}
                      onChange={() => {}}
                    />
                  </div>
                </div>

                {/* Online sub-options */}
                {paymentCategory === "online" && (
                  <>
                    <div className="online-methods">
                      {/* MoMo */}
                      <div
                        className={`online-method-card${
                          paymentMethod === "MOMO_PREPAID" ? " active" : ""
                        }`}
                        onClick={() => setPaymentMethod("MOMO_PREPAID")}
                      >
                        <div
                          className="method-icon"
                          style={{ background: "#d6336c" }}
                        >
                          M
                        </div>
                        <div className="method-name">MoMo</div>
                        <div className="method-desc">Ví MoMo</div>
                      </div>

                      {/* VNPay */}
                      <div
                        className={`online-method-card${
                          paymentMethod === "VNPAY_PREPAID" ? " active" : ""
                        }`}
                        onClick={() => setPaymentMethod("VNPAY_PREPAID")}
                      >
                        <div
                          className="method-icon"
                          style={{ background: "#1e40af" }}
                        >
                          V
                        </div>
                        <div className="method-name">VNPay</div>
                        <div className="method-desc">Ví VNPay</div>
                      </div>
                    </div>

                    <div className="payment-note">
                      <i className="fas fa-info-circle"></i>
                      Bạn sẽ được chuyển đến cổng thanh toán sau khi xác nhận đặt
                      lịch.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ---------- Form Error ---------- */}
            {formError && (
              <div className="bp-alert bp-alert-danger mb-3">
                <i className="fas fa-exclamation-circle"></i>
                {formError}
              </div>
            )}

            {/* ---------- Action Buttons ---------- */}
            <div className="bp-actions">
              <button
                type="button"
                className="btn-booking-secondary"
                onClick={() => navigate(-1)}
              >
                <i className="fas fa-arrow-left"></i> Quay lại
              </button>
              <button
                type="button"
                className="btn-booking-primary"
                onClick={handleSubmitBooking}
                disabled={
                  !selectedPet ||
                  selectedServices.length === 0 ||
                  !selectedSlot ||
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <i className="fas fa-calendar-plus"></i> Đặt lịch ngay
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ==================== RIGHT COLUMN: Summary ==================== */}
          <div className="col-lg-4">
            <div className="summary-card">
              <div className="summary-title">
                <i className="fas fa-receipt"></i> Tóm tắt lịch hẹn
              </div>

              {selectedServices.length === 0 &&
              !selectedPetInfo &&
              !selectedSlot ? (
                <div className="summary-empty">
                  <i className="fas fa-clipboard-list"></i>
                  <p>Chọn dịch vụ và thời gian để xem tóm tắt lịch hẹn</p>
                </div>
              ) : (
                <>
                  {/* Pet */}
                  {selectedPetInfo && (
                    <div className="summary-item">
                      <div className="summary-item-label">Thú cưng</div>
                      <div className="summary-item-value">
                        <i
                          className="fas fa-paw"
                          style={{ color: "#2563eb", marginRight: 6 }}
                        ></i>
                        {selectedPetInfo.name}
                        {getPetTypeName(selectedPetInfo.petTypeId) &&
                          ` (${getPetTypeName(selectedPetInfo.petTypeId)})`}
                      </div>
                    </div>
                  )}

                  {/* Services */}
                  {selectedServices.length > 0 && (
                    <div className="summary-item">
                      <div className="summary-item-label">Dịch vụ</div>
                      <ul className="summary-service-list">
                        {selectedServices.map((s) => (
                          <li key={s.id}>
                            <span>{s.name}</span>
                            <span>{s.price.toLocaleString("vi-VN")}đ</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Date & Time */}
                  {selectedDate && (
                    <div className="summary-item">
                      <div className="summary-item-label">Ngày</div>
                      <div className="summary-item-value">
                        <i
                          className="fas fa-calendar-day"
                          style={{ color: "#2563eb", marginRight: 6 }}
                        ></i>
                        {formatDate(selectedDate)}
                      </div>
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="summary-item">
                      <div className="summary-item-label">Khung giờ</div>
                      <div className="summary-item-value">
                        <i
                          className="fas fa-clock"
                          style={{ color: "#2563eb", marginRight: 6 }}
                        ></i>
                        {formatTime(selectedSlot.startAt)}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {totalDuration > 0 && (
                    <div className="summary-item">
                      <div className="summary-item-label">Thời lượng</div>
                      <div className="summary-item-value">
                        ~{totalDuration} phút
                      </div>
                    </div>
                  )}

                  {/* Payment */}
                  <div className="summary-item">
                    <div className="summary-item-label">Thanh toán</div>
                    <div className="summary-item-value">
                      {paymentCategory === "store"
                        ? "Tại cửa hàng"
                        : paymentMethod === "MOMO_PREPAID"
                          ? "MoMo"
                          : "VNPay"}
                    </div>
                  </div>

                  {/* Total */}
                  {totalPrice > 0 && (
                    <div className="summary-total">
                      <div className="total-label">Tạm tính</div>
                      <div className="total-amount">
                        {totalPrice.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  )}

                  {/* CTA duplicate */}
                  <button
                    type="button"
                    className="btn-booking-primary mt-3"
                    style={{ width: "100%" }}
                    onClick={handleSubmitBooking}
                    disabled={
                      !selectedPet ||
                      selectedServices.length === 0 ||
                      !selectedSlot ||
                      submitting
                    }
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm"
                          role="status"
                        ></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-calendar-plus"></i> Đặt lịch ngay
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ADD PET MODAL ===================== */}
      {showAddPetModal && (
        <div className="bp-modal-overlay" onClick={() => setShowAddPetModal(false)}>
          <div
            className="bp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bp-modal-header">
              <h5>
                <i className="fas fa-paw"></i> Thêm thú cưng mới
              </h5>
              <button
                className="bp-modal-close"
                onClick={() => setShowAddPetModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddPet}>
              <div className="bp-modal-body">
                {addPetError && (
                  <div className="bp-alert bp-alert-danger mb-3">
                    <i className="fas fa-exclamation-circle"></i> {addPetError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="bp-label">
                    Tên thú cưng <span className="required">*</span>
                  </label>
                  <input
                    className="bp-input"
                    placeholder="Ví dụ: Milu, Bông..."
                    value={newPet.name}
                    onChange={(e) =>
                      setNewPet({ ...newPet, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="bp-label">
                      Loại thú cưng <span className="required">*</span>
                    </label>
                    {loadingPetTypes ? (
                      <div className="text-center py-2">
                        <div
                          className="spinner-border spinner-border-sm text-primary"
                          role="status"
                        ></div>
                      </div>
                    ) : (
                      <select
                        className="bp-select"
                        value={newPet.petTypeId}
                        onChange={(e) =>
                          setNewPet({ ...newPet, petTypeId: e.target.value })
                        }
                        required
                      >
                        <option value="">-- Chọn loại --</option>
                        {petTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-6">
                    <label className="bp-label">
                      Tuổi <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="bp-input"
                      min="0"
                      max="50"
                      placeholder="VD: 2"
                      value={newPet.age}
                      onChange={(e) =>
                        setNewPet({ ...newPet, age: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="bp-label">Giống</label>
                    <input
                      className="bp-input"
                      placeholder="VD: Corgi, Mèo Ba Tư..."
                      value={newPet.breed}
                      onChange={(e) =>
                        setNewPet({ ...newPet, breed: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label className="bp-label">Cân nặng (kg)</label>
                    <input
                      type="number"
                      className="bp-input"
                      min="0"
                      step="0.1"
                      placeholder="VD: 5.5"
                      value={newPet.weight}
                      onChange={(e) =>
                        setNewPet({ ...newPet, weight: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="bp-modal-footer">
                <button
                  type="button"
                  className="btn-booking-secondary"
                  onClick={() => setShowAddPetModal(false)}
                  disabled={addingPet}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-sm-round btn-fill"
                  disabled={addingPet}
                  style={{ padding: "0.55rem 1.25rem" }}
                >
                  {addingPet ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                      ></span>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i> Thêm thú cưng
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CONFIRM MODAL ================= */}
      {showConfirmModal && bookingResult && (
        <div className="bp-modal-overlay">
          <div
            className="bp-modal bp-modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bp-modal-header">
              <h5>
                <i className="fas fa-clipboard-check"></i> Xác nhận lịch hẹn
              </h5>
              <button
                className="bp-modal-close"
                onClick={() => setShowConfirmModal(false)}
                disabled={confirming}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="bp-modal-body">
              <div className="bp-alert bp-alert-warning mb-3">
                <i className="fas fa-clock"></i>
                <div>
                  <strong>Lưu ý:</strong> Hệ thống sẽ chờ bạn xác nhận trong
                  vòng <strong>5 phút</strong>. Nếu quá thời gian, lịch hẹn sẽ bị
                  hủy.
                </div>
              </div>

              <table className="bp-info-table">
                <tbody>
                  <tr>
                    <td className="info-label">Mã booking</td>
                    <td className="info-value">
                      <span className="bp-badge bp-badge-primary">
                        {bookingResult.bookingCode}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Thú cưng</td>
                    <td className="info-value">{bookingResult.petName}</td>
                  </tr>
                  <tr>
                    <td className="info-label">Bắt đầu</td>
                    <td className="info-value">
                      {formatDateTime(bookingResult.scheduledAt)}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Kết thúc dự kiến</td>
                    <td className="info-value">
                      {formatDateTime(bookingResult.expectedEndTime)}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Dịch vụ</td>
                    <td className="info-value">
                      <ul
                        style={{ margin: 0, paddingLeft: "1.1rem" }}
                      >
                        {bookingResult.services.map((s, i) => (
                          <li key={i}>
                            {s.name} –{" "}
                            <strong style={{ color: "#2563eb" }}>
                              {s.price.toLocaleString("vi-VN")}đ
                            </strong>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Tổng tiền</td>
                    <td className="info-value">
                      <span
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: 800,
                          color: "#dc2626",
                        }}
                      >
                        {bookingResult.totalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    </td>
                  </tr>
                  {bookingResult.notes && (
                    <tr>
                      <td className="info-label">Ghi chú</td>
                      <td className="info-value">{bookingResult.notes}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="info-label">Thanh toán</td>
                    <td className="info-value">
                      {paymentCategory === "store"
                        ? "Tại cửa hàng"
                        : paymentMethod === "MOMO_PREPAID"
                          ? "MoMo (online)"
                          : "VNPay (online)"}
                    </td>
                  </tr>
                  <tr>
                    <td className="info-label">Trạng thái</td>
                    <td className="info-value">
                      <span className="bp-badge bp-badge-warning">
                        {getBookingStatusText(bookingResult.bookingStatus)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Voucher (only for online payment) */}
              {paymentCategory === "online" && (
                <div style={{ marginTop: "1rem" }}>
                  <label className="bp-label">
                    <i className="fas fa-ticket-alt" style={{ color: "#2563eb" }}></i>{" "}
                    Áp dụng voucher
                  </label>
                  {loadingVouchers ? (
                    <div className="text-muted" style={{ fontSize: "0.85rem" }}>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Đang tải voucher...
                    </div>
                  ) : (
                    <>
                      {voucherError && (
                        <div
                          className="text-danger"
                          style={{ fontSize: "0.82rem", marginBottom: "0.35rem" }}
                        >
                          {voucherError}
                        </div>
                      )}
                      <select
                        className="bp-voucher-select"
                        value={selectedVoucherCode}
                        onChange={(e) =>
                          setSelectedVoucherCode(e.target.value)
                        }
                      >
                        <option value="">Không dùng voucher</option>
                        {vouchers.map((v) => (
                          <option key={v.id} value={v.code}>
                            {v.code} – còn{" "}
                            {Number(v.remainingAmount || 0).toLocaleString(
                              "vi-VN",
                            )}
                            đ
                          </option>
                        ))}
                      </select>
                      {selectedVoucherCode && (
                        <div
                          style={{
                            marginTop: "0.5rem",
                            fontSize: "0.85rem",
                            color: "#475569",
                          }}
                        >
                          Giảm voucher:{" "}
                          <strong style={{ color: "#10b981" }}>
                            -{voucherDiscountPreview.toLocaleString("vi-VN")}đ
                          </strong>
                          <br />
                          Cần thanh toán:{" "}
                          <strong style={{ color: "#dc2626" }}>
                            {payablePreview.toLocaleString("vi-VN")}đ
                          </strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="bp-modal-footer">
              <button
                type="button"
                className="btn-booking-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={confirming}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-booking-primary"
                style={{ flex: "none", width: "auto" }}
                onClick={handleConfirmBooking}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                    Đang xác nhận...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Xác nhận &amp; thanh toán
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {showSuccessModal && bookingResult && (
        <div className="bp-modal-overlay">
          <div className="bp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bp-modal-body text-center" style={{ padding: "2.5rem 1.5rem" }}>
              <div className="bp-success-icon">
                <i className="fas fa-check"></i>
              </div>
              <h4 style={{ color: "#1e3a5f", fontWeight: 700 }}>
                Đặt lịch thành công!
              </h4>
              <p style={{ color: "#64748b", margin: "0.5rem 0 0.25rem" }}>
                Mã booking của bạn:
              </p>
              <h5 style={{ color: "#2563eb", fontWeight: 700 }}>
                {bookingResult.bookingCode}
              </h5>
              <p style={{ color: "#94a3b8", marginTop: "1rem" }}>
                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
              </p>
            </div>
            <div className="bp-modal-footer" style={{ justifyContent: "center" }}>
              <button
                type="button"
                className="btn-sm-round btn-fill"
                style={{ padding: "0.6rem 2rem" }}
                onClick={handleSuccessOk}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
