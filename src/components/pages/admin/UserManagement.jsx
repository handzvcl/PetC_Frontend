import React, { useState, useEffect } from 'react';

const UserManagement = () => {
    // --- BẢNG STATE ---
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho Modal phân quyền
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState(null); // Đổi thành lưu 1 ID duy nhất
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // --- HIỆN THÔNG BÁO ---
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    // --- EFFECTS: Load dữ liệu ban đầu ---
    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    // --- API CALLS ---
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:8080/api/user', { credentials: 'include' });
            const result = await response.json();
            if (response.ok && result.success) {
                setUsers(result.data || []);
            }
        } catch (error) {
            showToast('Lỗi khi tải danh sách người dùng!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/user/roles', { credentials: 'include' });
            const result = await response.json();
            if (response.ok && result.success) {
                setRoles(result.data || []);
            }
        } catch (error) {
            showToast('Lỗi khi tải danh sách quyền!', 'error');
        }
    };

    // Mở Modal và lấy quyền HIỆN TẠI của User đó
    const handleOpenRoleModal = async (user) => {
        setSelectedUser(user);
        setSelectedRoleId(null); // Reset
        setShowRoleModal(true);
        
        try {
            const response = await fetch(`http://localhost:8080/api/user/${user.id}`, { credentials: 'include' });
            const result = await response.json();
            // Vì backend trả về mảng currentRoleIds, ta lấy phần tử đầu tiên (nếu có)
            if (response.ok && result.success && result.data.currentRoleIds && result.data.currentRoleIds.length > 0) {
                setSelectedRoleId(result.data.currentRoleIds[0]);
            }
        } catch (error) {
            showToast('Không lấy được quyền hiện tại của user này', 'error');
        }
    };

    // Khi click chọn 1 quyền
    const handleSelectRole = (roleId) => {
        setSelectedRoleId(roleId);
    };

    // Gửi API cập nhật quyền mới
    const handleSaveRoles = async () => {
        if (!selectedUser) return;
        if (!selectedRoleId) {
            alert("Vui lòng chọn 1 quyền!");
            return;
        }
        
        try {
            setUpdating(true);
            const response = await fetch(`http://localhost:8080/api/user/${selectedUser.id}/roles`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ roleId: selectedRoleId }) // Gửi 1 ID lên Backend
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                showToast('Cập nhật phân quyền thành công!', 'success');
                setShowRoleModal(false);
                fetchUsers(); // Tải lại danh sách để thấy thay đổi
            } else {
                throw new Error(result.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="container-fluid px-4">
            {toast.show && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
                    <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                        {toast.message}
                        <button type="button" className="btn-close" onClick={() => setToast({ show: false, message: '', type: '' })}></button>
                    </div>
                </div>
            )}

            <h1 className="mt-4">Quản lý Người dùng</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                <li className="breadcrumb-item active">Người dùng</li>
            </ol>

            <div className="card shadow-sm mb-4">
                <div className="card-header bg-white fw-bold py-3">
                    <i className="fas fa-users me-2 text-primary"></i>Danh sách Tài khoản
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th width="5%" className="text-center">ID</th>
                                        <th width="20%">Tên đăng nhập</th>
                                        <th width="25%">Email</th>
                                        <th width="15%">Số điện thoại</th>
                                        <th width="20%">Quyền (Role)</th>
                                        <th width="15%" className="text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center text-muted py-4">Không có dữ liệu người dùng</td></tr>
                                    ) : (
                                        users.map(user => (
                                            <tr key={user.id}>
                                                <td className="text-center fw-bold text-secondary">{user.id}</td>
                                                <td className="fw-bold">{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>{user.phone || '-'}</td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {user.roles && user.roles.length > 0 ? (
                                                            user.roles.map(role => (
                                                                <span key={role.id} className={`badge ${role.name === 'ADMIN' ? 'bg-danger' : role.name === 'STAFF' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                                                    {role.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted small fst-italic">Chưa có quyền</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary fw-bold"
                                                        onClick={() => handleOpenRoleModal(user)}
                                                    >
                                                        <i className="fas fa-user-shield me-1"></i> Phân quyền
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* =======================================================
                MODAL CẬP NHẬT PHÂN QUYỀN (ROLES)
               ======================================================== */}
            {showRoleModal && selectedUser && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">
                                    <i className="fas fa-user-shield me-2"></i>Cập nhật Quyền
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoleModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="alert alert-info border-info border-start border-4 mb-4">
                                    Tài khoản đang chọn: <strong className="fs-5 ms-1">{selectedUser.username}</strong>
                                </div>
                                <div className="bg-light p-3 rounded border">
                                    {roles.length === 0 ? (
                                        <div className="text-muted fst-italic">Chưa tải được danh sách quyền từ hệ thống.</div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {roles.map(role => (
                                                <div className="form-check fs-5" key={role.id}>
                                                    {/* Đổi thành type="radio" */}
                                                    <input 
                                                        className="form-check-input" 
                                                        type="radio" 
                                                        name="roleRadioOptions"
                                                        id={`role-${role.id}`}
                                                        checked={selectedRoleId === role.id}
                                                        onChange={() => handleSelectRole(role.id)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <label className="form-check-label fw-bold ms-2" htmlFor={`role-${role.id}`} style={{ cursor: 'pointer' }}>
                                                        {role.name}
                                                        {role.description && <span className="d-block fs-6 fw-normal text-muted">{role.description}</span>}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowRoleModal(false)}>Hủy</button>
                                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={handleSaveRoles} disabled={updating || !selectedRoleId}>
                                    {updating ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="fas fa-save me-2"></i>}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;