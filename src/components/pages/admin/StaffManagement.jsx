import React, { useState, useEffect } from "react";

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortDir, setSortDir] = useState("Ascending");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    hireDate: "",
    department: "",
    position: "",
    specialization: "",
    profilePictureUrl: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmAction({ message, onConfirm });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction && confirmAction.onConfirm) {
      confirmAction.onConfirm();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  useEffect(() => {
    fetchStaff();
  }, [pageNumber, pageSize, search, sortBy, sortDir]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pageNumber: pageNumber,
        pageSize: pageSize,
        sortBy: sortBy,
        sortDir: sortDir,
      });
      if (search) params.append("search", search);

      const response = await fetch(
        `http://localhost:8080/api/staff/paginated?${params}`,
        { credentials: "include" },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setStaff(result.data.items || []);
          setTotalCount(result.data.totalCount || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      showToast("Không thể tải dữ liệu!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPageNumber(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchInput("");
    setPageNumber(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir(sortDir === "Ascending" ? "Descending" : "Ascending");
    } else {
      setSortBy(column);
      setSortDir("Ascending");
    }
    setPageNumber(1);
  };

  const handleAddNew = () => {
    setEditingStaff(null);
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      address: "",
      dateOfBirth: "",
      hireDate: "",
      department: "",
      position: "",
      specialization: "",
      profilePictureUrl: "",
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleView = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/staff/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setViewingStaff(result.data);
          setShowViewModal(true);
        }
      } else {
        showToast("Không tìm thấy dữ liệu!", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Có lỗi xảy ra!", "error");
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      fullName: staffMember.fullName,
      email: staffMember.email,
      phoneNumber: staffMember.phoneNumber || "",
      address: staffMember.address || "",
      dateOfBirth: staffMember.dateOfBirth || "",
      hireDate: staffMember.hireDate || "",
      department: staffMember.department || "",
      position: staffMember.position || "",
      specialization: staffMember.specialization || "",
      profilePictureUrl: staffMember.profilePictureUrl || "",
    });
    setImagePreview(
      staffMember.profilePictureUrl
        ? `http://localhost:8080${staffMember.profilePictureUrl}`
        : null,
    );
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)!", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước ảnh tối đa 5MB!", "error");
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("http://localhost:8080/api/upload", {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setFormData((prev) => ({ ...prev, profilePictureUrl: result.data }));
        setImagePreview(`http://localhost:8080${result.data}`);
        showToast("Tải ảnh lên thành công!", "success");
      } else {
        showToast(result.message || "Upload ảnh thất bại!", "error");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Không thể tải ảnh lên!", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, profilePictureUrl: "" }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show loading state
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

    try {
      let response;
      if (editingStaff) {
        response = await fetch(
          `http://localhost:8080/api/staff/${editingStaff.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(formData),
          },
        );
      } else {
        response = await fetch(`http://localhost:8080/api/staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData),
        });
      }

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const result = await response.json();
      console.log("Response data:", result);

      if (response.ok && result.success) {
        showToast(result.message, "success");
        setShowModal(false);
        fetchStaff();
      } else {
        showToast(result.message || "Có lỗi xảy ra!", "error");
      }
    } catch (error) {
      console.error("Error details:", error);
      showToast("Không thể kết nối tới server! " + error.message, "error");
    } finally {
      // Restore button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  };

  const handleToggleActive = (staffMember) => {
    const action = staffMember.isActive ? "vô hiệu hóa" : "kích hoạt";
    showConfirm(`Bạn có chắc muốn ${action} nhân viên này?`, async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/staff/toggle-active?id=${staffMember.id}`,
          { method: "PATCH", credentials: "include" },
        );
        const result = await response.json();
        if (response.ok && result.success) {
          showToast(result.message, "success");
          fetchStaff();
        } else {
          showToast(result.message || "Không thể thực hiện!", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showToast("Có lỗi xảy ra!", "error");
      }
    });
  };

  const handleDelete = (staffMember) => {
    showConfirm("Bạn có chắc muốn xóa nhân viên này?", async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/staff/${staffMember.id}`,
          { method: "DELETE", credentials: "include" },
        );
        const result = await response.json();
        if (response.ok && result.success) {
          showToast(result.message, "success");
          fetchStaff();
        } else {
          showToast(result.message || "Không thể xóa!", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showToast("Có lỗi xảy ra!", "error");
      }
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalCount);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageNumber(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (pageNumber <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (pageNumber >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = pageNumber - 1; i <= pageNumber + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="container-fluid px-4">
      {toast.show && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`alert alert-${toast.type === "success" ? "success" : "danger"} alert-dismissible fade show`}
          >
            <i
              className={`fas fa-${toast.type === "success" ? "check-circle" : "exclamation-circle"} me-2`}
            ></i>
            {toast.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setToast({ show: false, message: "", type: "" })}
            ></button>
          </div>
        </div>
      )}

      <h1 className="mt-4">Quản lý Nhân viên</h1>
      <ol className="breadcrumb mb-4">
        <li className="breadcrumb-item">
          <a href="/admin">Dashboard</a>
        </li>
        <li className="breadcrumb-item active">Nhân viên</li>
      </ol>
      <button className="btn btn-primary btn-sm mb-3" onClick={handleAddNew}>
        <i className="fas fa-plus me-2"></i>Thêm nhân viên
      </button>

      <div className="card mb-4">
        <div className="card-header">
          <i className="fas fa-users me-1"></i>Danh sách nhân viên
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3">
              <select
                className="form-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
              >
                <option value="5">5 dòng/trang</option>
                <option value="10">10 dòng/trang</option>
                <option value="25">25 dòng/trang</option>
                <option value="50">50 dòng/trang</option>
              </select>
            </div>
            <div className="col-md-9">
              <form onSubmit={handleSearch} className="d-flex">
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Tìm kiếm theo tên, email, SĐT..."
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
                    onClick={handleClearSearch}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </form>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Ảnh</th>
                    <th
                      onClick={() => handleSort("staffCode")}
                      style={{ cursor: "pointer" }}
                    >
                      Mã NV{" "}
                      {sortBy === "staffCode" && (
                        <i
                          className={`fas fa-sort-${sortDir === "Ascending" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort("fullName")}
                      style={{ cursor: "pointer" }}
                    >
                      Họ tên{" "}
                      {sortBy === "fullName" && (
                        <i
                          className={`fas fa-sort-${sortDir === "Ascending" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th>Email</th>
                    <th>SĐT</th>
                    <th>Phòng ban</th>
                    <th>Chức vụ</th>
                    <th>Trạng thái</th>
                    <th style={{ width: "180px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        {search ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
                      </td>
                    </tr>
                  ) : (
                    staff.map((s) => (
                      <tr key={s.id}>
                        <td className="text-center">
                          {s.profilePictureUrl ? (
                            <img
                              src={`http://localhost:8080${s.profilePictureUrl}`}
                              alt={s.fullName}
                              className="rounded-circle"
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white mx-auto"
                              style={{ width: "50px", height: "50px" }}
                            >
                              <i className="fas fa-user"></i>
                            </div>
                          )}
                        </td>
                        <td>
                          <strong>{s.staffCode}</strong>
                        </td>
                        <td>{s.fullName}</td>
                        <td>{s.email}</td>
                        <td>{s.phoneNumber || "-"}</td>
                        <td>{s.department || "-"}</td>
                        <td>{s.position || "-"}</td>
                        <td>
                          <span
                            className={`badge ${s.isActive ? "bg-success" : "bg-secondary"}`}
                          >
                            {s.isActive ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-1"
                            onClick={() => handleView(s.id)}
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-warning btn-sm me-1"
                            onClick={() => handleEdit(s)}
                            title="Chỉnh sửa"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`btn btn-sm me-1 ${s.isActive ? "btn-danger" : "btn-success"}`}
                            onClick={() => handleToggleActive(s)}
                            title={s.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                          >
                            <i
                              className={`fas fa-${s.isActive ? "ban" : "check"}`}
                            ></i>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(s)}
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <div className="mb-2 mb-md-0">
                  Hiển thị {startRecord} - {endRecord} của {totalCount} bản ghi
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li
                      className={`page-item ${pageNumber === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(1)}
                        disabled={pageNumber === 1}
                      >
                        <i className="fas fa-angle-double-left"></i>
                      </button>
                    </li>
                    <li
                      className={`page-item ${pageNumber === 1 ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNumber - 1)}
                        disabled={pageNumber === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    </li>
                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <li
                          key={`ellipsis-${index}`}
                          className="page-item disabled"
                        >
                          <span className="page-link">...</span>
                        </li>
                      ) : (
                        <li
                          key={page}
                          className={`page-item ${pageNumber === page ? "active" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ),
                    )}
                    <li
                      className={`page-item ${pageNumber === totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNumber + 1)}
                        disabled={pageNumber === totalPages}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </li>
                    <li
                      className={`page-item ${pageNumber === totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={pageNumber === totalPages}
                      >
                        <i className="fas fa-angle-double-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-question-circle text-warning me-2"></i>
                  Xác nhận
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCancelConfirm}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{confirmAction?.message}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelConfirm}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirm}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create/Edit */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingStaff ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Ảnh đại diện</label>
                        <div className="text-center">
                          {imagePreview ? (
                            <div className="position-relative d-inline-block">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="rounded-circle"
                                style={{
                                  width: "150px",
                                  height: "150px",
                                  objectFit: "cover",
                                }}
                              />
                              <button
                                type="button"
                                className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                                onClick={handleRemoveImage}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <div
                              className="border rounded-circle d-flex align-items-center justify-content-center bg-light mx-auto"
                              style={{ width: "150px", height: "150px" }}
                            >
                              <i className="fas fa-user fa-4x text-muted"></i>
                            </div>
                          )}
                          <div className="mt-2">
                            <input
                              type="file"
                              id="imageUpload"
                              className="d-none"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={uploading}
                            />
                            <label
                              htmlFor="imageUpload"
                              className={`btn btn-sm btn-outline-primary ${uploading ? "disabled" : ""}`}
                            >
                              {uploading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2"></span>
                                  Đang tải...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-upload me-2"></i>Chọn ảnh
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label">
                          Họ tên <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="Nhập họ tên"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="Nhập email"
                          disabled={editingStaff}
                        />
                        {editingStaff && (
                          <small className="text-muted">
                            Email không thể thay đổi
                          </small>
                        )}
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Số điện thoại</label>
                            <input
                              type="text"
                              className="form-control"
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              placeholder="0901234567"
                              maxLength="10"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Ngày sinh</label>
                            <input
                              type="date"
                              className="form-control"
                              name="dateOfBirth"
                              value={formData.dateOfBirth}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Địa chỉ</label>
                        <input
                          type="text"
                          className="form-control"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Nhập địa chỉ"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Phòng ban</label>
                        <select
                          className="form-select"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                        >
                          <option value="">-- Chọn phòng ban --</option>
                          <option value="GROOMING">Grooming</option>
                          <option value="VETERINARY">Thú y</option>
                          <option value="RECEPTION">Lễ tân</option>
                          <option value="MANAGEMENT">Quản lý</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Chức vụ</label>
                        <select
                          className="form-select"
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                        >
                          <option value="">-- Chọn chức vụ --</option>
                          <option value="STAFF">Nhân viên</option>
                          <option value="SUPERVISOR">Giám sát</option>
                          <option value="MANAGER">Quản lý</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Ngày vào làm</label>
                        <input
                          type="date"
                          className="form-control"
                          name="hireDate"
                          value={formData.hireDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Chuyên môn</label>
                    <textarea
                      className="form-control"
                      name="specialization"
                      rows="2"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="VD: Cắt tỉa lông chó, Khám bệnh mèo..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingStaff ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingStaff && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết nhân viên</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 text-center">
                    {viewingStaff.profilePictureUrl ? (
                      <img
                        src={`http://localhost:8080${viewingStaff.profilePictureUrl}`}
                        alt={viewingStaff.fullName}
                        className="rounded-circle mb-3"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white mx-auto mb-3"
                        style={{ width: "150px", height: "150px" }}
                      >
                        <i className="fas fa-user fa-4x"></i>
                      </div>
                    )}
                    <h5>{viewingStaff.fullName}</h5>
                    <p className="text-muted">{viewingStaff.staffCode}</p>
                    <span
                      className={`badge ${viewingStaff.isActive ? "bg-success" : "bg-secondary"}`}
                    >
                      {viewingStaff.isActive ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </div>
                  <div className="col-md-8">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <th width="150">Email:</th>
                          <td>{viewingStaff.email}</td>
                        </tr>
                        <tr>
                          <th>Số điện thoại:</th>
                          <td>{viewingStaff.phoneNumber || "-"}</td>
                        </tr>
                        <tr>
                          <th>Địa chỉ:</th>
                          <td>{viewingStaff.address || "-"}</td>
                        </tr>
                        <tr>
                          <th>Ngày sinh:</th>
                          <td>{viewingStaff.dateOfBirth || "-"}</td>
                        </tr>
                        <tr>
                          <th>Ngày vào làm:</th>
                          <td>{viewingStaff.hireDate || "-"}</td>
                        </tr>
                        <tr>
                          <th>Phòng ban:</th>
                          <td>{viewingStaff.department || "-"}</td>
                        </tr>
                        <tr>
                          <th>Chức vụ:</th>
                          <td>{viewingStaff.position || "-"}</td>
                        </tr>
                        <tr>
                          <th>Chuyên môn:</th>
                          <td>{viewingStaff.specialization || "-"}</td>
                        </tr>
                        <tr>
                          <th>Tài khoản:</th>
                          <td>{viewingStaff.username || "-"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
