import React, { useEffect, useMemo, useState } from "react";

const PetTypeManagement = () => {
  const [petTypes, setPetTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // create modal
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  // table state
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const fetchPetTypes = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:8080/api/pet-type", {
        credentials: "include",
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể tải dữ liệu");
      }

      setPetTypes(result.data || []);
    } catch (error) {
      console.error("Error fetching pet types:", error);
      showToast("Không thể tải dữ liệu!", "error");
      setPetTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetTypes();
  }, []);

  const handleCreatePetType = async (e) => {
    e.preventDefault();

    if (!newName.trim()) {
      showToast("Tên loại thú cưng là bắt buộc", "error");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("http://localhost:8080/api/pet-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim() }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Không thể thêm loại thú cưng");
      }

      showToast("Thêm loại thú cưng thành công", "success");
      setShowModal(false);
      setNewName("");
      await fetchPetTypes();
    } catch (error) {
      console.error("Create pet type error:", error);
      showToast(error.message || "Có lỗi xảy ra", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim().toLowerCase());
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

  const filteredSortedData = useMemo(() => {
    let data = [...petTypes];

    if (search) {
      data = data.filter((item) => (item.name || "").toLowerCase().includes(search));
    }

    data.sort((a, b) => {
      const aValue = (a[sortBy] || "").toString().toLowerCase();
      const bValue = (b[sortBy] || "").toString().toLowerCase();

      if (aValue < bValue) return sortDir === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [petTypes, search, sortBy, sortDir]);

  const totalCount = filteredSortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pagedData = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filteredSortedData.slice(start, start + pageSize);
  }, [filteredSortedData, pageNumber, pageSize]);

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
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }

    if (pageNumber <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
      return pages;
    }

    if (pageNumber >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return pages;
    }

    pages.push(1, "...", pageNumber - 1, pageNumber, pageNumber + 1, "...", totalPages);
    return pages;
  };

  return (
    <div className="container-fluid px-4">
      {/* Toast */}
      {toast.show && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
          <div
            className={`alert alert-${toast.type === "success" ? "success" : "danger"} alert-dismissible fade show`}
            role="alert"
          >
            {toast.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setToast({ show: false, message: "", type: "success" })}
            />
          </div>
        </div>
      )}

      <h1 className="mt-4">Quản lý Loại thú cưng</h1>
      <ol className="breadcrumb mb-4">
        <li className="breadcrumb-item">
          <a href="/admin">Dashboard</a>
        </li>
        <li className="breadcrumb-item active">Loại thú cưng</li>
      </ol>

      <button className="btn btn-primary btn-sm mb-3" onClick={() => setShowModal(true)}>
        <i className="fas fa-plus me-2"></i>
        Thêm mới
      </button>

      <div className="card mb-4">
        <div className="card-header">
          <i className="fas fa-table me-1"></i>
          Danh sách loại thú cưng
        </div>

        <div className="card-body">
          {/* toolbar */}
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
                  placeholder="Tìm kiếm theo tên..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary me-2">
                  <i className="fas fa-search"></i>
                </button>
                {search && (
                  <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>
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
                    <th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                      Tên loại thú cưng
                      {sortBy === "name" && (
                        <i className={`fas fa-sort-${sortDir === "asc" ? "up" : "down"} ms-1`}></i>
                      )}
                    </th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedData.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4">
                        {search ? "Không tìm thấy kết quả" : "Chưa có dữ liệu"}
                      </td>
                    </tr>
                  ) : (
                    pagedData.map((petType) => (
                      <tr key={petType.id}>
                        <td>{petType.name}</td>
                        <td>
                          <span className="badge bg-success">Hoạt động</span>
                        </td>
                        <td>-</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* pagination */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                <div className="mb-2 mb-md-0">
                  Hiển thị {startRecord} - {endRecord} của {totalCount} bản ghi
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${pageNumber === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => handlePageChange(1)} disabled={pageNumber === 1}>
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

                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <li key={`ellipsis-${idx}`} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      ) : (
                        <li key={page} className={`page-item ${pageNumber === page ? "active" : ""}`}>
                          <button className="page-link" onClick={() => handlePageChange(page)}>
                            {page}
                          </button>
                        </li>
                      )
                    )}

                    <li className={`page-item ${pageNumber === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(pageNumber + 1)}
                        disabled={pageNumber === totalPages}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </li>

                    <li className={`page-item ${pageNumber === totalPages ? "disabled" : ""}`}>
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

      {/* Create Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreatePetType}>
                <div className="modal-header">
                  <h5 className="modal-title">Thêm loại thú cưng</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
                </div>

                <div className="modal-body">
                  <label className="form-label">
                    Tên loại thú cưng <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ví dụ: Chó"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu"}
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

export default PetTypeManagement;