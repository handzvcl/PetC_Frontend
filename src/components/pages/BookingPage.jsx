import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const BookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("MOMO_PREPAID");
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherError, setVoucherError] = useState(null);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState("");

  // New pet form states
  const [newPet, setNewPet] = useState({
    name: "",
    petTypeId: "",
    age: "",
  });
  const [addingPet, setAddingPet] = useState(false);
  const [addPetError, setAddPetError] = useState(null);

  // Fetch services from API
  useEffect(() => {
    fetchServices();
    fetchUserPets();
  }, [user]);

  // Fetch available slots when date and services change
  useEffect(() => {
    if (selectedDate && selectedServices.length > 0) {
      fetchAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate, selectedServices]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/service");
      if (!response.ok) {
        throw new Error("Không thể tải danh sách dịch vụ");
      }
      const result = await response.json();
      if (result.success) {
        setServices(result.data);
        setError(null);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching services:", err);
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

      const response = await fetch(`/api/pet/user/${currentUserId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải danh sách thú cưng");
      }

      const result = await response.json();
      if (result.success) {
        setPets(result.data);
        setPetError(null);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setPetError(err.message);
      console.error("Error fetching pets:", err);
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchPetTypes = async () => {
    try {
      setLoadingPetTypes(true);
      const response = await fetch("/api/pet-type");

      if (!response.ok) {
        throw new Error("Không thể tải danh sách loại thú cưng");
      }

      const result = await response.json();
      if (result.success) {
        setPetTypes(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error("Error fetching pet types:", err);
      setAddPetError("Không thể tải danh sách loại thú cưng");
    } finally {
      setLoadingPetTypes(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      setSlotError(null);

      // Calculate total duration from selected services
      const totalDuration = selectedServices.reduce(
        (sum, service) => sum + service.durationInMinutes,
        0,
      );

      const response = await fetch(
        `/api/bookings/available-slots?selectedDay=${selectedDate}&durationInMinutes=${totalDuration}`,
      );

      if (!response.ok) {
        throw new Error("Không thể tải danh sách khung giờ");
      }

      const result = await response.json();
      if (result.success) {
        setAvailableSlots(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setSlotError(err.message);
      console.error("Error fetching slots:", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchMyVouchers = async (token) => {
    try {
      setLoadingVouchers(true);
      setVoucherError(null);

      const response = await fetch("/api/bookings/me/vouchers", {
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
      setVoucherError(err.message);
      setVouchers([]);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const handleOpenAddPetModal = () => {
    setShowAddPetModal(true);
    fetchPetTypes();
  };

  const handleAddPet = async (e) => {
    e.preventDefault();

    try {
      setAddingPet(true);
      setAddPetError(null);

      const currentUserId = Number(user?.userId ?? user?.id);
      if (!Number.isFinite(currentUserId)) {
        throw new Error("Không xác định được người dùng hiện tại");
      }

      const response = await fetch(`/api/pet/user/${currentUserId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newPet.name,
          petTypeId: newPet.petTypeId,
          age: parseInt(newPet.age),
        }),
      });

      if (!response.ok) {
        throw new Error("Không thể thêm thú cưng");
      }

      // Reset form
      setNewPet({ name: "", petTypeId: "", age: "" });

      // Reload pets list
      await fetchUserPets();

      // Close modal
      setShowAddPetModal(false);
    } catch (err) {
      setAddPetError(err.message);
      console.error("Error adding pet:", err);
    } finally {
      setAddingPet(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedPet || selectedServices.length === 0 || !selectedSlot) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setSubmitting(true);

      const currentUserId = Number(user?.userId ?? user?.id);
      if (!Number.isFinite(currentUserId)) {
        throw new Error("Vui lòng đăng nhập trước khi đặt lịch");
      }

      const response = await fetch(
        `/api/bookings/user/${currentUserId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scheduledAt: selectedSlot.startAt,
            notes: notes,
            petId: selectedPet,
            services: selectedServices.map((s) => s.id),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Không thể tạo lịch hẹn");
      }

      const result = await response.json();
      if (result.success) {
        const token = user?.token;
        if (token) {
          await fetchMyVouchers(token);
        }
        setSelectedVoucherCode("");
        setPaymentMethod("MOMO_PREPAID");
        setBookingResult(result.data);
        setShowConfirmModal(true);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      alert("Lỗi: " + err.message);
      console.error("Error creating booking:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setConfirming(true);

      const token = user?.token;
      if (!token) {
        throw new Error("Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.");
      }

      const response = await fetch(
        `/api/payments/booking/${bookingResult.id}/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentMethod,
            voucherCode:
              paymentMethod === "MOMO_PREPAID" || paymentMethod === "VNPAY_PREPAID"
                ? (selectedVoucherCode || null)
                : null,
          }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể khởi tạo thanh toán");
      }

      if (!result.success) {
        throw new Error(result.message || "Khởi tạo thanh toán thất bại");
      }

      const paymentData = result.data;

      if (
        (paymentMethod === "MOMO_PREPAID" || paymentMethod === "VNPAY_PREPAID") &&
        paymentData?.paymentUrl
      ) {
        window.location.href = paymentData.paymentUrl;
        return;
      }

      setShowConfirmModal(false);
      navigate(`/booking/details/${bookingResult.id}?fromPayment=0&method=PAY_LATER`);
    } catch (err) {
      alert("Lỗi xác nhận: " + err.message);
      console.error("Error confirming booking:", err);
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

  // Toggle service selection
  const toggleServiceSelection = (service) => {
    const isSelected = selectedServices.find((s) => s.id === service.id);

    if (isSelected) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // Check if service is selected
  const isServiceSelected = (serviceId) => {
    return selectedServices.find((s) => s.id === serviceId) !== undefined;
  };

  // Remove service from selected list
  const handleRemoveService = (serviceId) => {
    setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
  };

  // Format time for display
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date time for display
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

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get booking status text
  const getBookingStatusText = (status) => {
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

  const selectedVoucher = vouchers.find((voucher) => voucher.code === selectedVoucherCode);
  const voucherDiscountPreview =
    paymentMethod === "MOMO_PREPAID" || paymentMethod === "VNPAY_PREPAID"
      ? Math.min(Number(selectedVoucher?.remainingAmount || 0), Number(bookingResult?.totalPrice || 0))
      : 0;
  const payablePreview = Math.max(0, Number(bookingResult?.totalPrice || 0) - voucherDiscountPreview);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Đặt lịch chăm sóc thú cưng</h3>
            </div>
            <div className="card-body">
              {/* Pet Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Chọn thú cưng <span className="text-danger">*</span>
                </label>
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
                  <div className="alert alert-danger">
                    {petError}
                    <button
                      className="btn btn-sm btn-outline-danger ms-3"
                      onClick={fetchUserPets}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : pets.length === 0 ? (
                  <div className="alert alert-warning">
                    Bạn chưa có thú cưng nào. Vui lòng thêm thú cưng trước khi
                    đặt lịch.
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleOpenAddPetModal}
                      >
                        + Thêm thú cưng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex gap-2">
                    <select
                      className="form-select"
                      value={selectedPet}
                      onChange={(e) => setSelectedPet(e.target.value)}
                    >
                      <option value="">-- Chọn thú cưng --</option>
                      {pets.map((pet) => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} ({pet.age} tuổi)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleOpenAddPetModal}
                    >
                      + Thêm mới
                    </button>
                  </div>
                )}
              </div>

              <hr />

              {/* Service Selection Button */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Chọn dịch vụ <span className="text-danger">*</span>
                </label>
                <div>
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setShowServiceModal(true)}
                  >
                    + Chọn dịch vụ
                  </button>
                </div>
              </div>

              {/* Selected Services Tags */}
              {selectedServices.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-bold">Dịch vụ đã chọn:</label>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedServices.map((service) => (
                      <span
                        key={service.id}
                        className="badge bg-primary fs-6 d-flex align-items-center gap-2"
                      >
                        <span>{service.name}</span>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          aria-label="Remove"
                          onClick={() => handleRemoveService(service.id)}
                        ></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <hr />

              {/* Date Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold">
                  Chọn ngày <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  min={getTodayDate()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={selectedServices.length === 0}
                />
                {selectedServices.length === 0 && (
                  <small className="text-muted">
                    Vui lòng chọn dịch vụ trước
                  </small>
                )}
              </div>

              {/* Time Slot Selection */}
              {selectedDate && selectedServices.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Chọn khung giờ <span className="text-danger">*</span>
                  </label>

                  {loadingSlots ? (
                    <div className="text-center py-3">
                      <div
                        className="spinner-border spinner-border-sm text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Đang tải...</span>
                      </div>
                    </div>
                  ) : slotError ? (
                    <div className="alert alert-danger">{slotError}</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="alert alert-warning">
                      Không có khung giờ trống cho ngày này.
                    </div>
                  ) : (
                    <div className="row g-2">
                      {availableSlots.map((slot, index) => (
                        <div key={index} className="col-md-3 col-4">
                          <button
                            type="button"
                            className={`btn w-100 ${
                              selectedSlot?.startAt === slot.startAt
                                ? "btn-primary"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {formatTime(slot.startAt)}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <hr />

              {/* Notes */}
              <div className="mb-3">
                <label className="form-label fw-bold">Ghi chú</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Ví dụ: Bé chó hơi dữ, cần rọ mõm khi tắm..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <hr />

              {/* Submit Button */}
              <div className="d-grid">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
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
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đặt lịch hẹn"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Modal */}
      {showServiceModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chọn dịch vụ</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowServiceModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {loading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">
                    {error}
                    <button
                      className="btn btn-sm btn-outline-danger ms-3"
                      onClick={fetchServices}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Chọn</th>
                        <th>Tên dịch vụ</th>
                        <th>Mô tả</th>
                        <th>Giá</th>
                        <th>Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr
                          key={service.id}
                          onClick={() => toggleServiceSelection(service)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isServiceSelected(service.id)}
                              onChange={() => toggleServiceSelection(service)}
                            />
                          </td>
                          <td>{service.name}</td>
                          <td>{service.description}</td>
                          <td>{service.price.toLocaleString("vi-VN")}đ</td>
                          <td>{service.durationInMinutes} phút</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowServiceModal(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowServiceModal(false)}
                >
                  Xác nhận ({selectedServices.length} dịch vụ)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddPetModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Thêm thú cưng mới</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddPetModal(false)}
                ></button>
              </div>
              <form onSubmit={handleAddPet}>
                <div className="modal-body">
                  {addPetError && (
                    <div className="alert alert-danger">{addPetError}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Tên thú cưng <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={newPet.name}
                      onChange={(e) =>
                        setNewPet({ ...newPet, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Loại thú cưng <span className="text-danger">*</span>
                    </label>
                    {loadingPetTypes ? (
                      <div className="text-center py-2">
                        <div
                          className="spinner-border spinner-border-sm text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">Đang tải...</span>
                        </div>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={newPet.petTypeId}
                        onChange={(e) =>
                          setNewPet({ ...newPet, petTypeId: e.target.value })
                        }
                        required
                      >
                        <option value="">-- Chọn loại thú cưng --</option>
                        {petTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Tuổi <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="50"
                      value={newPet.age}
                      onChange={(e) =>
                        setNewPet({ ...newPet, age: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddPetModal(false)}
                    disabled={addingPet}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={addingPet}
                  >
                    {addingPet ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Đang thêm...
                      </>
                    ) : (
                      "Thêm thú cưng"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showConfirmModal && bookingResult && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">Xác nhận lịch hẹn</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={confirming}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>⏰ Lưu ý:</strong> Hãy xác nhận lịch hẹn của bạn. Hệ
                  thống sẽ chờ bạn xác nhận trong vòng 5 phút, nếu quá thời gian
                  lịch hẹn sẽ bị hủy.
                </div>

                <h5 className="mb-3">Thông tin lịch hẹn</h5>

                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th width="40%">Mã booking</th>
                      <td>
                        <strong className="text-primary">
                          {bookingResult.bookingCode}
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <th>Thú cưng</th>
                      <td>{bookingResult.petName}</td>
                    </tr>
                    <tr>
                      <th>Thời gian bắt đầu</th>
                      <td>{formatDateTime(bookingResult.scheduledAt)}</td>
                    </tr>
                    <tr>
                      <th>Thời gian kết thúc dự kiến</th>
                      <td>{formatDateTime(bookingResult.expectedEndTime)}</td>
                    </tr>
                    <tr>
                      <th>Dịch vụ</th>
                      <td>
                        <ul className="mb-0">
                          {bookingResult.services.map((service, index) => (
                            <li key={index}>
                              {service.name} -{" "}
                              {service.price.toLocaleString("vi-VN")}đ
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>Tổng tiền</th>
                      <td>
                        <strong className="text-danger fs-5">
                          {bookingResult.totalPrice.toLocaleString("vi-VN")}đ
                        </strong>
                      </td>
                    </tr>
                    {bookingResult.notes && (
                      <tr>
                        <th>Ghi chú</th>
                        <td>{bookingResult.notes}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Trạng thái</th>
                      <td>
                        <span className="badge bg-warning">
                          {getBookingStatusText(bookingResult.bookingStatus)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-3">
                  <label className="form-label fw-bold">
                    Phương thức thanh toán <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="pay-momo"
                        value="MOMO_PREPAID"
                        checked={paymentMethod === "MOMO_PREPAID"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="pay-momo">
                        MOMO (thanh toán trước)
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="pay-vnpay"
                        value="VNPAY_PREPAID"
                        checked={paymentMethod === "VNPAY_PREPAID"}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="pay-vnpay">
                        VNPay (thanh toán trước)
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="paymentMethod"
                        id="pay-later"
                        value="PAY_LATER"
                        checked={paymentMethod === "PAY_LATER"}
                        onChange={(e) => {
                          setPaymentMethod(e.target.value);
                          setSelectedVoucherCode("");
                        }}
                      />
                      <label className="form-check-label" htmlFor="pay-later">
                        Thanh toán sau khi hoàn thành dịch vụ
                      </label>
                    </div>
                  </div>
                </div>

                {(paymentMethod === "MOMO_PREPAID" || paymentMethod === "VNPAY_PREPAID") && (
                  <div className="mt-3">
                    <label className="form-label fw-bold">Áp dụng voucher</label>
                    {loadingVouchers ? (
                      <div className="text-muted">Đang tải voucher...</div>
                    ) : (
                      <>
                        {voucherError && <div className="text-danger small mb-2">{voucherError}</div>}
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
                        <div className="mt-2 small text-muted">
                          <div>
                            Giảm voucher: <strong>-{voucherDiscountPreview.toLocaleString("vi-VN")}đ</strong>
                          </div>
                          <div>
                            Cần thanh toán: <strong className="text-danger">{payablePreview.toLocaleString("vi-VN")}đ</strong>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={confirming}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-lg"
                  onClick={handleConfirmBooking}
                  disabled={confirming}
                >
                  {confirming ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Đang xác nhận...
                    </>
                  ) : (
                    "Xác nhận & tiếp tục thanh toán"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && bookingResult && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body text-center py-5">
                <div className="mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="80"
                    height="80"
                    fill="currentColor"
                    className="bi bi-check-circle text-success"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                    <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05" />
                  </svg>
                </div>
                <h4 className="mb-3">Đặt lịch thành công!</h4>
                <p className="text-muted mb-1">Mã booking của bạn:</p>
                <h5 className="text-primary mb-4">
                  {bookingResult.bookingCode}
                </h5>
                <p className="text-muted">
                  Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
                </p>
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={handleSuccessOk}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
