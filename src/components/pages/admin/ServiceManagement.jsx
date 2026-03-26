import React, { useState, useEffect } from "react";

const ServiceManagement = () => {
  const BACKEND_URL = "http://localhost:8080";
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("Ascending");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationInMinutes: "",
    imageUrl: "",
  });

  const resolveImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BACKEND_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Show confirm modal
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
    fetchServices();
  }, [pageNumber, pageSize, search, sortBy, sortDir]);

  const fetchServices = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        pageNumber: pageNumber,
        pageSize: pageSize,
        sortBy: sortBy,
        sortDir: sortDir,
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(
        `${BACKEND_URL}/api/services/paginated?${params}`,
        {
          credentials: "include",
        },
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          setServices(result.data.items || []);
          setTotalCount(result.data.totalCount || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
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
    setEditingService(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      durationInMinutes: "",
      imageUrl: "",
      isActive: true,
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleView = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/services/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setViewingService(result.data);
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

  const handleEdit = (service) => {
    setEditingService(service);

    setFormData({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: service.price,
      durationInMinutes: service.durationInMinutes,
      imageUrl: service.imageUrl || "",
      isActive: service.isActive !== undefined ? service.isActive : true,
    });

    setImagePreview(service.imageUrl ? resolveImageUrl(service.imageUrl) : null);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image upload
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

      const response = await fetch(`${BACKEND_URL}/api/upload`, {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: result.data,
        }));

        setImagePreview(resolveImageUrl(result.data));
        showToast("Tải ảnh lên thành công!", "success");
      } else {
        const errorMessage = result.errors
          ? result.errors.join(", ")
          : result.message || "Upload ảnh thất bại!";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Không thể tải ảnh lên!", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: "",
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (parseFloat(formData.price) <= 0) {
      showToast("Giá dịch vụ phải lớn hơn 0!", "error");
      return;
    }

    if (parseInt(formData.durationInMinutes) <= 0) {
      showToast("Thời gian phải lớn hơn 0!", "error");
      return;
    }

    try {
      let response;

      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        durationInMinutes: parseInt(formData.durationInMinutes),
      };

      if (editingService) {
        response = await fetch(`${BACKEND_URL}/api/services`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        });
      } else {
        response = await fetch(`${BACKEND_URL}/api/services`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(submitData),
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message, "success");
        setShowModal(false);
        fetchServices();
      } else {
        showToast(result.message || "Có lỗi xảy ra!", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Không thể kết nối tới server!", "error");
    }
  };

  const handleToggleActive = (service) => {
    const action = service.isActive ? "vô hiệu hóa" : "kích hoạt";
    const message = `Bạn có chắc muốn ${action} dịch vụ này?`;

    showConfirm(message, async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/services/toggle-active?id=${service.id}`,
          {
            method: "PATCH",
            credentials: "include",
          },
        );

        const result = await response.json();

        if (response.ok && result.success) {
          showToast(result.message, "success");
          fetchServices();
        } else {
          showToast(result.message || "Không thể thực hiện!", "error");
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
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (pageNumber <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (pageNumber >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = pageNumber - 1; i <= pageNumber + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Format currency VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format duration
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}p`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}p`;
    }
  };

  return (
    <div className="container-fluid px-4">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 9999 }}
        >
          <div
            className={`alert alert-${toast.type === "success" ? "success" : "danger"} alert-dismissible fade show`}
            role="alert"
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

      <h1 className="mt-4">Quản lý Dịch vụ</h1>
      <ol className="breadcrumb mb-4">
        <li className="breadcrumb-item">
          <a href="/admin">Dashboard</a>
        </li>
        <li className="breadcrumb-item active">Dịch vụ</li>
      </ol>
      <button className="btn btn-primary btn-sm mb-3" onClick={handleAddNew}>
        <i className="fas fa-plus me-2"></i>
        Thêm dịch vụ
      </button>
      <div className="card mb-4">
        <div className="card-header">
          <i className="fas fa-table me-1"></i>
          Danh sách dịch vụ
        </div>
        <div className="card-body">
          {/* Toolbar */}
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
                  placeholder="Tìm kiếm..."
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

          {/* Table */}
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
                      onClick={() => handleSort("name")}
                      style={{ cursor: "pointer" }}
                    >
                      Tên dịch vụ
                      {sortBy === "name" && (
                        <i
                          className={`fas fa-sort-${sortDir === "Ascending" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th>Mô tả</th>
                    <th
                      onClick={() => handleSort("price")}
                      style={{ cursor: "pointer" }}
                    >
                      Giá
                      {sortBy === "price" && (
                        <i
                          className={`fas fa-sort-${sortDir === "Ascending" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th style={{ width: "150px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        {search ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
                      </td>
                    </tr>
                  ) : (
                    services.map((service) => (
                      <tr key={service.id}>
                        <td className="text-center">
                          {service.imageUrl ? (
                            <img
                              src={resolveImageUrl(service.imageUrl)}
                              alt={service.name}
                              className="rounded"
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              className="rounded bg-secondary d-flex align-items-center justify-content-center text-white mx-auto"
                              style={{ width: "60px", height: "60px" }}
                            >
                              <i className="fas fa-image"></i>
                            </div>
                          )}
                        </td>
                        <td>
                          <strong>{service.name}</strong>
                        </td>
                        <td>
                          {service.description
                            ? service.description.length > 50
                              ? service.description.substring(0, 50) + "..."
                              : service.description
                            : "-"}
                        </td>
                        <td className="text-end">
                          <strong className="text-success">
                            {formatCurrency(service.price)}
                          </strong>
                        </td>
                        <td>{formatDuration(service.durationInMinutes)}</td>
                        <td>
                          <span
                            className={`badge ${service.isActive ? "bg-success" : "bg-secondary"}`}
                          >
                            {service.isActive ? "Hoạt động" : "Không hoạt động"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-info btn-sm me-1"
                            onClick={() => handleView(service.id)}
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button
                            className="btn btn-warning btn-sm me-1"
                            onClick={() => handleEdit(service)}
                            title="Chỉnh sửa"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className={`btn btn-sm ${service.isActive ? "btn-danger" : "btn-success"}`}
                            onClick={() => handleToggleActive(service)}
                            title={
                              service.isActive ? "Vô hiệu hóa" : "Kích hoạt"
                            }
                          >
                            <i
                              className={`fas fa-${service.isActive ? "ban" : "check"}`}
                            ></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
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
                  {editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
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
                      {/* Image Upload */}
                      <div className="mb-3">
                        <label className="form-label">Ảnh dịch vụ</label>
                        <div className="text-center">
                          {imagePreview ? (
                            <div className="position-relative d-inline-block">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="rounded"
                                style={{
                                  width: "100%",
                                  height: "200px",
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
                              className="border rounded d-flex align-items-center justify-content-center bg-light"
                              style={{ width: "100%", height: "200px" }}
                            >
                              <i className="fas fa-image fa-4x text-muted"></i>
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
                                  <i className="fas fa-upload me-2"></i>
                                  Chọn ảnh
                                </>
                              )}
                            </label>
                            <div className="form-text">
                              JPEG, PNG, WEBP. Tối đa 5MB.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label">
                          Tên dịch vụ <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Nhập tên dịch vụ"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Mô tả</label>
                        <textarea
                          className="form-control"
                          name="description"
                          rows="3"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Nhập mô tả dịch vụ"
                        ></textarea>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Giá (VNĐ) <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              name="price"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              min="0"
                              step="1000"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Thời gian (phút){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              name="durationInMinutes"
                              value={formData.durationInMinutes}
                              onChange={handleChange}
                              required
                              min="1"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploading}
                  >
                    <i
                      className={`fas fa-${editingService ? "save" : "plus"} me-2`}
                    ></i>
                    {editingService ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal View Detail */}
      {showViewModal && viewingService && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết dịch vụ</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {viewingService.imageUrl && (
                    <div className="col-md-4 mb-3">
                      <img
                        src={resolveImageUrl(viewingService.imageUrl)}
                        alt={viewingService.name}
                        className="rounded w-100"
                        style={{ height: "250px", objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <div
                    className={
                      viewingService.imageUrl ? "col-md-8" : "col-md-12"
                    }
                  >
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <th style={{ width: "40%" }}>ID:</th>
                          <td>
                            <code>{viewingService.id}</code>
                          </td>
                        </tr>
                        <tr>
                          <th>Tên dịch vụ:</th>
                          <td>
                            <strong className="fs-5">
                              {viewingService.name}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Mô tả:</th>
                          <td>{viewingService.description || "-"}</td>
                        </tr>
                        <tr>
                          <th>Giá:</th>
                          <td>
                            <strong className="text-success fs-5">
                              {formatCurrency(viewingService.price)}
                            </strong>
                          </td>
                        </tr>
                        <tr>
                          <th>Thời gian:</th>
                          <td>
                            <span className="badge bg-info">
                              {formatDuration(viewingService.durationInMinutes)}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Ngày tạo:</th>
                          <td>
                            {viewingService.createAt
                              ? new Date(
                                  viewingService.createAt,
                                ).toLocaleString("vi-VN")
                              : "Chưa có thông tin"}
                          </td>
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
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingService);
                  }}
                >
                  <i className="fas fa-edit me-2"></i>
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
