import React, { useEffect, useMemo, useState } from "react";

const statusMap = {
  0: { text: "Chờ xác nhận", badge: "bg-warning text-dark" },
  1: { text: "Chờ thanh toán", badge: "bg-info text-dark" },
  2: { text: "Đã xác nhận", badge: "bg-primary" },
  3: { text: "Đang thực hiện", badge: "bg-secondary" },
  4: { text: "Hoàn thành", badge: "bg-success" },
  5: { text: "Đã hủy", badge: "bg-danger" },
  6: { text: "Vắng mặt", badge: "bg-dark" },
};

const getStatusMeta = (status) =>
  statusMap[status] || { text: "Không xác định", badge: "bg-light text-dark" };

const toDateInput = (date) => {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const startOfWeekMonday = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toLocalDateTimeInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const getPaymentMeta = (isPaid) =>
  isPaid
    ? { text: "Đã thanh toán", badge: "bg-success" }
    : { text: "Chưa thanh toán", badge: "bg-warning text-dark" };

const isBookingPaid = (booking) => Boolean(booking?.isPaid ?? booking?.paid);

const PetCareHistoryManagement = () => {
  const [weekStart, setWeekStart] = useState(toDateInput(startOfWeekMonday()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("scheduledAt");
  const [sortDir, setSortDir] = useState("desc");

  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editForm, setEditForm] = useState({
    scheduledAt: "",
    notes: "",
    petId: null,
    services: [],
  });

  const clearNotice = () => {
    setError("");
    setSuccess("");
  };

  const fetchBookingDetail = async (bookingId) => {
    const res = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
      credentials: "include",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || "Không tải được chi tiết booking.");
    }
    return json.data;
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      clearNotice();

      const summaryRes = await fetch(
        `http://localhost:8080/api/bookings/bookings-in-week?startDate=${weekStart}`,
        { credentials: "include" },
      );
      if (!summaryRes.ok) throw new Error("Không thể tải danh sách lịch hẹn tuần.");
      const summaryList = await summaryRes.json();

      const detailResults = await Promise.all(
        (summaryList || []).map(async (item) => {
          try {
            const detail = await fetchBookingDetail(item.id);
            return {
              ...item,
              petName: detail?.petName || "-",
              petId: detail?.petId ?? null,
              totalPrice: detail?.totalPrice ?? 0,
              notes: detail?.notes || "",
              services: detail?.services || [],
            };
          } catch {
            return {
              ...item,
              petName: "-",
              petId: null,
              totalPrice: 0,
              notes: "",
              services: [],
            };
          }
        }),
      );

      const history = detailResults.filter((x) => [0, 1, 2, 3, 4, 5, 6].includes(x.bookingStatus));
      setRows(history);
    } catch (e) {
      setError(e.message || "Có lỗi xảy ra.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim().toLowerCase());
    setPageNumber(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
    setPageNumber(1);
  };

  const filteredSorted = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (!search) return true;
      const statusText = getStatusMeta(r.bookingStatus).text.toLowerCase();
      const servicesText = (r.services || []).map((s) => s.name).join(", ").toLowerCase();
      return (
        (r.bookingCode || "").toLowerCase().includes(search) ||
        (r.userName || "").toLowerCase().includes(search) ||
        (r.petName || "").toLowerCase().includes(search) ||
        statusText.includes(search) ||
        servicesText.includes(search)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "scheduledAt") {
        const av = new Date(a.scheduledAt || 0).getTime();
        const bv = new Date(b.scheduledAt || 0).getTime();
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (sortBy === "totalPrice") {
        return sortDir === "asc"
          ? Number(a.totalPrice || 0) - Number(b.totalPrice || 0)
          : Number(b.totalPrice || 0) - Number(a.totalPrice || 0);
      }
      const av = String(a[sortBy] || "").toLowerCase();
      const bv = String(b[sortBy] || "").toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv, "vi") : bv.localeCompare(av, "vi");
    });
  }, [rows, search, sortBy, sortDir]);

  const totalCount = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paged = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, pageNumber, pageSize]);

  const startRecord = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalCount);

  const openViewModal = async (row) => {
    try {
      const detail = await fetchBookingDetail(row.id);
      setSelectedBooking({
        ...row,
        ...detail,
      });
      setShowViewModal(true);
    } catch (e) {
      setError(e.message || "Không mở được chi tiết.");
    }
  };

  const openEditModal = async (row) => {
    try {
      const detail = await fetchBookingDetail(row.id);
      setSelectedBooking({
        ...row,
        ...detail,
      });
      setEditForm({
        scheduledAt: toLocalDateTimeInput(detail?.scheduledAt || row?.scheduledAt),
        notes: detail?.notes || "",
        petId: detail?.petId ?? row?.petId ?? null,
        services: (detail?.services || []).map((s) => s.id).filter(Boolean),
      });
      setShowEditModal(true);
    } catch (e) {
      setError(e.message || "Không mở được form chỉnh sửa.");
    }
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    if (!selectedBooking?.id) return;

    try {
      clearNotice();
      const payload = {
        scheduledAt: editForm.scheduledAt,
        notes: editForm.notes,
        petId: Number(editForm.petId),
        services: editForm.services,
      };

      const res = await fetch(`http://localhost:8080/api/bookings/${selectedBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Cập nhật booking thất bại.");
      }

      setSuccess("Cập nhật booking thành công.");
      setShowEditModal(false);
      await fetchHistory();
    } catch (e) {
      setError(e.message || "Cập nhật booking thất bại.");
    }
  };

  const runStatusAction = async (row, action) => {
    const confirmText = {
      start: "Bắt đầu xử lý lịch hẹn này?",
      complete: "Đánh dấu hoàn thành lịch hẹn này?",
      noshow: "Đánh dấu khách vắng mặt (No-show)?",
      cancel: "Hủy lịch hẹn này?",
      cashPaid: "Xác nhận khách đã thanh toán tiền mặt?",
    }[action];

    if (!window.confirm(confirmText)) return;

    try {
      clearNotice();
      const url =
        action === "complete"
          ? `http://localhost:8080/api/bookings/${row.id}/complete?paymentMethod=PAY_LATER`
          : action === "cashPaid"
            ? `http://localhost:8080/api/bookings/${row.id}/cash-paid`
          : `http://localhost:8080/api/bookings/${row.id}/${action}`;

      const res = await fetch(url, { method: "POST", credentials: "include" });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Không thể cập nhật trạng thái.");
      }

      setSuccess(json?.message || "Cập nhật trạng thái thành công.");
      await fetchHistory();
    } catch (e) {
      setError(e.message || "Không thể cập nhật trạng thái.");
    }
  };

  const canEdit = (status) => [0, 1, 2, 4].includes(status);
  const canStart = (status) => status === 2;
  const canComplete = (status) => status === 3;
  const canNoShow = (status) => status === 2;
  const canCancel = (status) => [0, 1, 2].includes(status);
  const canMarkCashPaid = (status, isPaid) => !isPaid && ![5, 6].includes(status);

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Quản lý lịch sử chăm sóc thú cưng</h1>
      <ol className="breadcrumb mb-4">
        <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
        <li className="breadcrumb-item active">Lịch sử chăm sóc</li>
      </ol>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card mb-4">
        <div className="card-header">
          <i className="fas fa-notes-medical me-1"></i>Danh sách lịch sử chăm sóc
        </div>

        <div className="card-body">
          <div className="row mb-3 g-2">
            <div className="col-md-2">
              <select
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
              >
                <option value={5}>5 dòng/trang</option>
                <option value={10}>10 dòng/trang</option>
                <option value={25}>25 dòng/trang</option>
                <option value={50}>50 dòng/trang</option>
              </select>
            </div>

            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                title="Ngày bắt đầu tuần"
              />
            </div>

            <div className="col-md-7">
              <form onSubmit={handleSearch} className="d-flex">
                <input
                  className="form-control me-2"
                  placeholder="Tìm theo mã booking, khách hàng, thú cưng, dịch vụ..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary me-2">
                  <i className="fas fa-search"></i>
                </button>
                {search && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSearch("");
                      setSearchInput("");
                      setPageNumber(1);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </form>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status"></div>
            </div>
          ) : (
            <>
              <table className="table table-bordered table-hover align-middle">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("bookingCode")} style={{ cursor: "pointer" }}>
                      Mã booking
                    </th>
                    <th onClick={() => handleSort("userName")} style={{ cursor: "pointer" }}>
                      Khách hàng
                    </th>
                    <th onClick={() => handleSort("petName")} style={{ cursor: "pointer" }}>
                      Thú cưng
                    </th>
                    <th onClick={() => handleSort("scheduledAt")} style={{ cursor: "pointer" }}>
                      Thời gian hẹn
                    </th>
                    <th>Dịch vụ</th>
                    <th onClick={() => handleSort("totalPrice")} style={{ cursor: "pointer" }}>
                      Tổng tiền
                    </th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                    <th style={{ width: 320 }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    paged.map((r) => {
                      const status = getStatusMeta(r.bookingStatus);
                      const paid = isBookingPaid(r);
                      const payment = getPaymentMeta(paid);
                      return (
                        <tr key={r.id}>
                          <td>{r.bookingCode}</td>
                          <td>{r.userName || "-"}</td>
                          <td>{r.petName || "-"}</td>
                          <td>{formatDateTime(r.scheduledAt)}</td>
                          <td>
                            {(r.services || []).length > 0
                              ? r.services.map((s) => s.name).join(", ")
                              : "-"}
                          </td>
                          <td>{formatCurrency(r.totalPrice)}</td>
                          <td>
                            <span className={`badge ${status.badge}`}>{status.text}</span>
                          </td>
                          <td>
                            <span className={`badge ${payment.badge}`}>{payment.text}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-info btn-sm me-1 mb-1"
                              onClick={() => openViewModal(r)}
                              title="Xem chi tiết"
                            >
                              <i className="fas fa-eye"></i>
                            </button>

                            {canEdit(r.bookingStatus) && (
                              <button
                                className="btn btn-warning btn-sm me-1 mb-1"
                                onClick={() => openEditModal(r)}
                                title="Chỉnh sửa lịch"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            )}

                            {canStart(r.bookingStatus) && (
                              <button
                                className="btn btn-secondary btn-sm me-1 mb-1"
                                onClick={() => runStatusAction(r, "start")}
                                title="Bắt đầu"
                              >
                                <i className="fas fa-play"></i>
                              </button>
                            )}

                            {canMarkCashPaid(r.bookingStatus, paid) && (
                              <button
                                className="btn btn-success btn-sm me-1 mb-1"
                                onClick={() => runStatusAction(r, "cashPaid")}
                                title="Xác nhận đã thanh toán tiền mặt"
                              >
                                <i className="fas fa-money-bill-wave"></i>
                              </button>
                            )}

                            {canComplete(r.bookingStatus) && (
                              <button
                                className="btn btn-success btn-sm me-1 mb-1"
                                onClick={() => runStatusAction(r, "complete")}
                                title="Hoàn thành"
                              >
                                <i className="fas fa-check"></i>
                              </button>
                            )}

                            {canNoShow(r.bookingStatus) && (
                              <button
                                className="btn btn-dark btn-sm me-1 mb-1"
                                onClick={() => runStatusAction(r, "noshow")}
                                title="No-show"
                              >
                                <i className="fas fa-user-slash"></i>
                              </button>
                            )}

                            {canCancel(r.bookingStatus) && (
                              <button
                                className="btn btn-danger btn-sm mb-1"
                                onClick={() => runStatusAction(r, "cancel")}
                                title="Hủy"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <div className="mb-2 mb-md-0">
                  Hiển thị {startRecord} - {endRecord} của {totalCount} bản ghi
                </div>
                <div>
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    disabled={pageNumber === 1}
                    onClick={() => setPageNumber((p) => p - 1)}
                  >
                    Trước
                  </button>
                  <span className="me-2">Trang {pageNumber}/{totalPages}</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={pageNumber === totalPages}
                    onClick={() => setPageNumber((p) => p + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showViewModal && selectedBooking && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết lịch chăm sóc</h5>
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)} />
              </div>
              <div className="modal-body">
                <p><strong>Mã booking:</strong> {selectedBooking.bookingCode}</p>
                <p><strong>Khách hàng:</strong> {selectedBooking.userName || "-"}</p>
                <p><strong>Thú cưng:</strong> {selectedBooking.petName || "-"}</p>
                <p><strong>Thời gian hẹn:</strong> {formatDateTime(selectedBooking.scheduledAt)}</p>
                <p><strong>Dịch vụ:</strong> {(selectedBooking.services || []).map((s) => s.name).join(", ") || "-"}</p>
                <p><strong>Tổng tiền:</strong> {formatCurrency(selectedBooking.totalPrice)}</p>
                <p><strong>Ghi chú:</strong> {selectedBooking.notes || "-"}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedBooking && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleUpdateBooking}>
                <div className="modal-header">
                  <h5 className="modal-title">Chỉnh sửa lịch hẹn</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Thời gian hẹn</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={editForm.scheduledAt}
                      onChange={(e) => setEditForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ghi chú</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editForm.notes}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>

                  <small className="text-muted">
                    Dịch vụ/thú cưng giữ nguyên theo booking hiện tại.
                  </small>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetCareHistoryManagement;