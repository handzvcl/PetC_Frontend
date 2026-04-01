import React, { useState, useEffect } from 'react';

const PetTypeManagement = () => {
    const [petTypes, setPetTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [editingPetType, setEditingPetType] = useState(null);
    const [viewingPetType, setViewingPetType] = useState(null);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Pagination state
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [sortBy, setSortBy] = useState('Name');
    const [sortDir, setSortDir] = useState('Ascending');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
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
        fetchPetTypes();
    }, [pageNumber, pageSize, search, sortBy, sortDir]);

    const fetchPetTypes = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                PageNumber: pageNumber,
                PageSize: pageSize,
                SortBy: sortBy,
                SortDir: sortDir
            });

            if (search) {
                params.append('Search', search);
            }

            const response = await fetch(`http://localhost:8080/api/pet-type/paginated?${params}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();

                if (result.success && result.data) {
                    setPetTypes(result.data.items || []);
                    setTotalCount(result.data.totalCount || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching pet types:', error);
            showToast('Không thể tải dữ liệu!', 'error');
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
        setSearch('');
        setSearchInput('');
        setPageNumber(1);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'Ascending' ? 'Descending' : 'Ascending');
        } else {
            setSortBy(column);
            setSortDir('Ascending');
        }
        setPageNumber(1);
    };

    const handleAddNew = () => {
        setEditingPetType(null);
        setFormData({ name: '', description: '', image: '', isActive: true });
        setImageFile(null);
        setPreviewImage(null);
        setShowModal(true);
    };

    const handleView = async (id) => {
        try {
            const response = await fetch(`http://localhost:8080/api/pet-type/${id}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setViewingPetType(result.data);
                    setShowViewModal(true);
                }
            } else {
                showToast('Không tìm thấy dữ liệu!', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Có lỗi xảy ra!', 'error');
        }
    };

    const handleEdit = (petType) => {
        setEditingPetType(petType);
        setFormData({
            id: petType.id,
            name: petType.name,
            description: petType.description || '',
            image: petType.image || '',
            isActive: petType.isActive
        });
        setImageFile(null);
        setPreviewImage(petType.image ? `http://localhost:8080${petType.image}` : null);
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let finalFormData = { ...formData };

            // Logic upload ảnh nếu có chọn file
            if (imageFile) {
                const uploadData = new FormData();
                uploadData.append('file', imageFile);

                const uploadRes = await fetch('http://localhost:8080/api/upload', {
                    method: 'POST',
                    body: uploadData
                });

                const uploadResult = await uploadRes.json();
                if (uploadRes.ok && uploadResult.success) {
                    finalFormData.image = uploadResult.data;
                } else {
                    showToast(uploadResult.message || 'Lỗi tải ảnh lên!', 'error');
                    return;
                }
            }

            let response;
            if (editingPetType) {
                response = await fetch(`http://localhost:8080/api/pet-type`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(finalFormData)
                });
            } else {
                response = await fetch(`http://localhost:8080/api/pet-type`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(finalFormData)
                });
            }

            const result = await response.json();

            if (response.ok && result.success) {
                showToast(result.message, 'success');
                setShowModal(false);
                fetchPetTypes();
            } else {
                showToast(result.message || 'Có lỗi xảy ra!', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Không thể kết nối tới server!', 'error');
        }
    };

    // ===== TOGGLE ACTIVE/INACTIVE =====
    const handleToggleActive = (petType) => {
        const action = petType.isActive ? 'vô hiệu hóa' : 'kích hoạt';

        showConfirm(
            `Bạn có chắc muốn ${action} loại thú cưng này?`,
            async () => {
                try {
                    // Gọi API tương ứng
                    const endpoint = petType.isActive
                        ? `http://localhost:8080/api/pet-type/soft-delete?id=${petType.id}`
                        : `http://localhost:8080/api/pet-type/active?id=${petType.id}`;

                    const response = await fetch(endpoint, {
                        method: 'PATCH',
                        credentials: 'include'
                    });

                    const result = await response.json();

                    if (response.ok && result.success) {
                        showToast(result.message, 'success');
                        fetchPetTypes();
                    } else {
                        showToast(result.message || 'Không thể thực hiện!', 'error');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showToast('Có lỗi xảy ra!', 'error');
                }
            }
        );
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
                pages.push('...');
                pages.push(totalPages);
            } else if (pageNumber >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = pageNumber - 1; i <= pageNumber + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="container-fluid px-4">
            {/* Toast Notification */}
            {toast.show && (
                <div
                    className="position-fixed top-0 end-0 p-3"
                    style={{ zIndex: 9999 }}
                >
                    <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                        {toast.message}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setToast({ show: false, message: '', type: '' })}
                        ></button>
                    </div>
                </div>
            )}

            <h1 className="mt-4">Quản lý Loại thú cưng</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                <li className="breadcrumb-item active">Loại thú cưng</li>
            </ol>
            <button className="btn btn-primary btn-sm mb-3" onClick={handleAddNew}>
                <i className="fas fa-plus me-2"></i>
                Thêm mới
            </button>
            <div className="card mb-4">
                <div className="card-header">
                    <i className="fas fa-table me-1"></i>
                    Danh sách loại thú cưng
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
                                        <th style={{ width: '100px', textAlign: 'center' }}>Ảnh</th>
                                        <th
                                            onClick={() => handleSort('Name')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            Tên loại thú cưng
                                            {sortBy === 'Name' && (
                                                <i className={`fas fa-sort-${sortDir === 'Ascending' ? 'up' : 'down'} ms-1`}></i>
                                            )}
                                        </th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                        <th style={{ width: '150px' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {petTypes.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4">
                                                {search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
                                            </td>
                                        </tr>
                                    ) : (
                                        petTypes.map((petType) => (
                                            <tr key={petType.id} className="align-middle">
                                                <td className="text-center">
                                                    {petType.image ? (
                                                        <img 
                                                            src={`http://localhost:8080${petType.image}`} 
                                                            alt={petType.name} 
                                                            style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                                                            className="rounded"
                                                        />
                                                    ) : (
                                                        <div 
                                                            className="bg-light text-secondary d-flex align-items-center justify-content-center rounded mx-auto" 
                                                            style={{ width: '60px', height: '60px', fontSize: '12px' }}
                                                        >
                                                            Không có ảnh
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{petType.name}</td>
                                                <td>
                                                    {petType.isActive ? (
                                                        <span className="badge bg-success">Hoạt động</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">Vô hiệu hóa</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {new Date(petType.createAt).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-info btn-sm me-1"
                                                        onClick={() => handleView(petType.id)}
                                                        title="Xem chi tiết"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-warning btn-sm me-1"
                                                        onClick={() => handleEdit(petType)}
                                                        title="Chỉnh sửa"
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${petType.isActive ? 'btn-danger' : 'btn-success'}`}
                                                        onClick={() => handleToggleActive(petType)}
                                                        title={petType.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                    >
                                                        <i className={`fas fa-${petType.isActive ? 'ban' : 'check'}`}></i>
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
                                        <li className={`page-item ${pageNumber === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(1)}
                                                disabled={pageNumber === 1}
                                            >
                                                <i className="fas fa-angle-double-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${pageNumber === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNumber - 1)}
                                                disabled={pageNumber === 1}
                                            >
                                                <i className="fas fa-chevron-left"></i>
                                            </button>
                                        </li>
                                        {getPageNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            ) : (
                                                <li
                                                    key={page}
                                                    className={`page-item ${pageNumber === page ? 'active' : ''}`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            )
                                        ))}
                                        <li className={`page-item ${pageNumber === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNumber + 1)}
                                                disabled={pageNumber === totalPages}
                                            >
                                                <i className="fas fa-chevron-right"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${pageNumber === totalPages ? 'disabled' : ''}`}>
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
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingPetType ? 'Chỉnh sửa loại thú cưng' : 'Thêm loại thú cưng mới'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Tên loại thú cưng <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Nhập tên loại thú cưng"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Mô tả</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="3"
                                            placeholder="Nhập phần mô tả về loại thú cưng"
                                        ></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Hình ảnh</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        {previewImage && (
                                            <div className="mt-3 text-center">
                                                <img src={previewImage} alt="Hình ảnh xem trước" className="img-thumbnail" style={{ maxHeight: '150px', objectFit: 'contain' }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                name="isActive"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="isActive">
                                                Hoạt động
                                            </label>
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
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`fas fa-${editingPetType ? 'save' : 'plus'} me-2`}></i>
                                        {editingPetType ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal View Detail */}
            {showViewModal && viewingPetType && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Chi tiết loại thú cưng</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowViewModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {viewingPetType.image && (
                                    <div className="text-center mb-4">
                                        <img 
                                            src={`http://localhost:8080${viewingPetType.image}`} 
                                            alt={viewingPetType.name} 
                                            className="img-fluid rounded" 
                                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                                        />
                                    </div>
                                )}
                                <table className="table table-borderless">
                                    <tbody>
                                        <tr>
                                            <th style={{ width: '40%' }}>ID:</th>
                                            <td><code>{viewingPetType.id}</code></td>
                                        </tr>
                                        <tr>
                                            <th>Tên loại thú cưng:</th>
                                            <td><strong>{viewingPetType.name}</strong></td>
                                        </tr>
                                        <tr>
                                            <th>Mô tả:</th>
                                            <td style={{ whiteSpace: 'pre-line' }}>{viewingPetType.description || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th>Trạng thái:</th>
                                            <td>
                                                {viewingPetType.isActive ? (
                                                    <span className="badge bg-success">Hoạt động</span>
                                                ) : (
                                                    <span className="badge bg-secondary">Vô hiệu hóa</span>
                                                )}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>Ngày tạo:</th>
                                            <td>{new Date(viewingPetType.createAt).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    </tbody>
                                </table>
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
                                        handleEdit(viewingPetType);
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

export default PetTypeManagement;