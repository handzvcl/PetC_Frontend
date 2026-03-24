import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const API_BASE = "http://localhost:8080/api";

const emptyForm = {
  name: "",
  age: "",
  petTypeId: "",
  imageUrl: "",
};

const MyPetsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUserId = useMemo(() => Number(user?.userId ?? user?.id), [user]);

  const [pets, setPets] = useState([]);
  const [petTypes, setPetTypes] = useState([]);

  const [loadingPets, setLoadingPets] = useState(false);
  const [loadingPetTypes, setLoadingPetTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingPetId, setEditingPetId] = useState(null);

  // Pagination / Search / Sort
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const clearNotice = () => {
    setError("");
    setSuccess("");
  };

  const fetchPets = async () => {
    if (!Number.isFinite(currentUserId)) {
      setError("Vui lòng đăng nhập để xem thú cưng.");
      setPets([]);
      return;
    }

    try {
      setLoadingPets(true);
      clearNotice();

      const response = await fetch(`${API_BASE}/pet/user/${currentUserId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể tải danh sách thú cưng.");
      }

      setPets(result.data || []);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi tải dữ liệu.");
      setPets([]);
    } finally {
      setLoadingPets(false);
    }
  };

  const fetchPetTypes = async () => {
    try {
      setLoadingPetTypes(true);
      const response = await fetch(`${API_BASE}/pet-type`, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể tải loại thú cưng.");
      }

      setPetTypes(result.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải loại thú cưng.");
    } finally {
      setLoadingPetTypes(false);
    }
  };

  useEffect(() => {
    fetchPets();
    fetchPetTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const openCreateModal = () => {
    clearNotice();
    setCreateForm(emptyForm);
    setShowCreateModal(true);
  };

  const openEditModal = (pet) => {
    clearNotice();
    setEditingPetId(pet.id);
    setEditForm({
      name: pet.name ?? "",
      age: String(pet.age ?? ""),
      petTypeId: String(pet.petTypeId ?? ""),
      imageUrl: pet.imageUrl ?? "",
    });
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm(emptyForm);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPetId(null);
    setEditForm(emptyForm);
  };

  const validateForm = (form) => {
    if (!form.name.trim()) return "Tên thú cưng là bắt buộc.";
    if (form.age === "" || Number(form.age) < 0) return "Tuổi không hợp lệ.";
    if (!form.petTypeId) return "Vui lòng chọn loại thú cưng.";
    return "";
  };

  const handleCreatePet = async (e) => {
    e.preventDefault();
    clearNotice();

    const msg = validateForm(createForm);
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/pet/user/${currentUserId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          age: Number(createForm.age),
          petTypeId: Number(createForm.petTypeId),
          imageUrl: createForm.imageUrl?.trim() || null,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Thêm thú cưng thất bại.");
      }

      setSuccess("Thêm thú cưng thành công.");
      closeCreateModal();
      await fetchPets();
    } catch (err) {
      setError(err.message || "Thêm thú cưng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePet = async (e) => {
    e.preventDefault();
    clearNotice();

    const msg = validateForm(editForm);
    if (msg) {
      setError(msg);
      return;
    }

    if (!editingPetId) {
      setError("Không tìm thấy thú cưng cần sửa.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE}/pet/user/${currentUserId}/${editingPetId}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editForm.name.trim(),
            age: Number(editForm.age),
            petTypeId: Number(editForm.petTypeId),
            imageUrl: editForm.imageUrl?.trim() || null,
          }),
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Cập nhật thú cưng thất bại.");
      }

      setSuccess("Cập nhật thú cưng thành công.");
      closeEditModal();
      await fetchPets();
    } catch (err) {
      setError(err.message || "Cập nhật thú cưng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePet = async (petId) => {
    clearNotice();

    const ok = window.confirm("Bạn có chắc muốn xóa thú cưng này?");
    if (!ok) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_BASE}/pet/user/${currentUserId}/${petId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Xóa thú cưng thất bại.");
      }

      setSuccess("Xóa thú cưng thành công.");
      await fetchPets();
    } catch (err) {
      setError(err.message || "Xóa thú cưng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormFields = (form, setForm) => (
    <>
      <div className="mb-3">
        <label className="form-label fw-bold">
          Tên thú cưng <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">
          Tuổi <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          min="0"
          className="form-control"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">
          Loại thú cưng <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          value={form.petTypeId}
          onChange={(e) => setForm({ ...form, petTypeId: e.target.value })}
          required
        >
          <option value="">-- Chọn loại thú cưng --</option>
          {petTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label fw-bold">Ảnh (URL)</label>
        <input
          type="text"
          className="form-control"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
    </>
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPageNumber(1);
  };

  const handleClearSearch = () => {
    setSearch("");
    setSearchInput("");
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

  const filteredAndSortedPets = useMemo(() => {
    const keyword = search.toLowerCase();

    const filtered = pets.filter((pet) => {
      const type = petTypes.find((t) => t.id === pet.petTypeId);
      const typeName = type?.name || "";
      return (
        (pet.name || "").toLowerCase().includes(keyword) ||
        String(pet.age ?? "").includes(keyword) ||
        typeName.toLowerCase().includes(keyword)
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return sortDir === "asc"
          ? (a.name || "").localeCompare(b.name || "", "vi")
          : (b.name || "").localeCompare(a.name || "", "vi");
      }

      if (sortBy === "age") {
        return sortDir === "asc"
          ? Number(a.age || 0) - Number(b.age || 0)
          : Number(b.age || 0) - Number(a.age || 0);
      }

      if (sortBy === "petType") {
        const aType = petTypes.find((t) => t.id === a.petTypeId)?.name || "";
        const bType = petTypes.find((t) => t.id === b.petTypeId)?.name || "";
        return sortDir === "asc"
          ? aType.localeCompare(bType, "vi")
          : bType.localeCompare(aType, "vi");
      }

      return 0;
    });

    return sorted;
  }, [pets, petTypes, search, sortBy, sortDir]);

  const totalCount = filteredAndSortedPets.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pagedPets = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredAndSortedPets.slice(start, start + pageSize);
  }, [filteredAndSortedPets, pageNumber, pageSize]);

  const startRecord = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endRecord = Math.min(pageNumber * pageSize, totalCount);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPageNumber(newPage);
  };

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (pageNumber > newTotalPages) setPageNumber(newTotalPages);
  }, [totalCount, pageSize, pageNumber]);

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    if (pageNumber <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
      return pages;
    }

    if (pageNumber >= totalPages - 2) {
      pages.push(
        1,
        "...",
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      );
      return pages;
    }

    pages.push(
      1,
      "...",
      pageNumber - 1,
      pageNumber,
      pageNumber + 1,
      "...",
      totalPages,
    );
    return pages;
  };

  return (
    <div className="container-fluid px-4">
      <h1 className="mt-4">Quản lý thú cưng</h1>
      <ol className="breadcrumb mb-4">
        <li className="breadcrumb-item">
          <a href="/admin">Dashboard</a>
        </li>
        <li className="breadcrumb-item active">Thú cưng</li>
      </ol>

      <button className="btn btn-primary btn-sm mb-3" onClick={openCreateModal}>
        <i className="fas fa-plus me-2"></i>Thêm mới
      </button>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card mb-4">
        <div className="card-header">
          <i className="fas fa-paw me-1"></i>Danh sách thú cưng
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
                <option value={5}>5 dòng/trang</option>
                <option value={10}>10 dòng/trang</option>
                <option value={25}>25 dòng/trang</option>
                <option value={50}>50 dòng/trang</option>
              </select>
            </div>

            <div className="col-md-9">
              <form onSubmit={handleSearch} className="d-flex">
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Tìm kiếm theo tên, tuổi, loại thú cưng..."
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

          {loadingPets ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <table className="table table-bordered table-hover align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>Ảnh</th>

                    <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                      Tên thú cưng{" "}
                      {sortBy === "name" && (
                        <i
                          className={`fas fa-sort-${sortDir === "asc" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>

                    <th onClick={() => handleSort("age")} style={{ cursor: "pointer" }}>
                      Tuổi{" "}
                      {sortBy === "age" && (
                        <i
                          className={`fas fa-sort-${sortDir === "asc" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>

                    <th onClick={() => handleSort("petType")} style={{ cursor: "pointer" }}>
                      Loại thú cưng{" "}
                      {sortBy === "petType" && (
                        <i
                          className={`fas fa-sort-${sortDir === "asc" ? "up" : "down"} ms-1`}
                        ></i>
                      )}
                    </th>

                    <th style={{ width: "240px" }}>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {pagedPets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        {search ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
                      </td>
                    </tr>
                  ) : (
                    pagedPets.map((pet) => {
                      const type = petTypes.find((t) => t.id === pet.petTypeId);
                      return (
                        <tr key={pet.id}>
                          <td className="text-center">
                            {pet.imageUrl ? (
                              <img
                                src={pet.imageUrl}
                                alt={pet.name || "pet"}
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                  border: "1px solid #ddd",
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white mx-auto"
                                style={{ width: "50px", height: "50px" }}
                              >
                                <i className="fas fa-paw"></i>
                              </div>
                            )}
                          </td>

                          <td>{pet.name}</td>
                          <td>{pet.age}</td>
                          <td>{type?.name || `#${pet.petTypeId ?? "-"}`}</td>

                          <td>
                            <button
                              className="btn btn-info btn-sm me-1"
                              onClick={() => navigate(`/bookings?petId=${pet.id}`)}
                              disabled={submitting}
                              title="Lịch sử chăm sóc"
                            >
                              <i className="fas fa-history"></i>
                            </button>

                            <button
                              className="btn btn-warning btn-sm me-1"
                              onClick={() => openEditModal(pet)}
                              disabled={submitting}
                              title="Chỉnh sửa"
                            >
                              <i className="fas fa-edit"></i>
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeletePet(pet.id)}
                              disabled={submitting}
                              title="Xóa"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
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
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${pageNumber === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(1)}
                        disabled={pageNumber === 1}
                      >
                        <i className="fas fa-angle-double-left"></i>
                      </button>
                    </li>

                    <li className={`page-item ${pageNumber === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNumber - 1)}
                        disabled={pageNumber === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                    </li>

                    {getPageNumbers().map((p, idx) =>
                      p === "..." ? (
                        <li key={`ellipsis-${idx}`} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      ) : (
                        <li
                          key={p}
                          className={`page-item ${pageNumber === p ? "active" : ""}`}
                        >
                          <button className="page-link" onClick={() => handlePageChange(p)}>
                            {p}
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

      {/* Create modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreatePet}>
                <div className="modal-header">
                  <h5 className="modal-title">Thêm thú cưng</h5>
                  <button type="button" className="btn-close" onClick={closeCreateModal} />
                </div>
                <div className="modal-body">
                  {loadingPetTypes ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" />
                    </div>
                  ) : (
                    renderFormFields(createForm, setCreateForm)
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCreateModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleUpdatePet}>
                <div className="modal-header">
                  <h5 className="modal-title">Sửa thú cưng</h5>
                  <button type="button" className="btn-close" onClick={closeEditModal} />
                </div>
                <div className="modal-body">
                  {loadingPetTypes ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" />
                    </div>
                  ) : (
                    renderFormFields(editForm, setEditForm)
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={submitting}>
                    {submitting ? "Đang cập nhật..." : "Cập nhật"}
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

export default MyPetsPage;