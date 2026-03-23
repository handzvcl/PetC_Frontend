import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const BookingManagement = () => {
    // --- BẢNG STATE CƠ BẢN ---
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()));
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showBookingListPopup, setShowBookingListPopup] = useState(false);
    const [popupBookings, setPopupBookings] = useState([]);
    const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    
    // --- STATE TÌM KIẾM & QUÉT MÃ ---
    const [searchEmail, setSearchEmail] = useState('');
    const [searchingUser, setSearchingUser] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [userSearchError, setUserSearchError] = useState(null);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [isScanningAPI, setIsScanningAPI] = useState(false);

    // --- STATE TẠO / SỬA LỊCH ---
    const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); 
    const [isDeleting, setIsDeleting] = useState(false); 
    const [updatingStatus, setUpdatingStatus] = useState(false); 
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [pets, setPets] = useState([]);
    const [petTypes, setPetTypes] = useState([]);
    const [selectedPet, setSelectedPet] = useState('');
    const [newBookingDate, setNewBookingDate] = useState(''); 
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [loadingPets, setLoadingPets] = useState(false);
    const [loadingPetTypes, setLoadingPetTypes] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [serviceError, setServiceError] = useState(null);
    const [petError, setPetError] = useState(null);
    const [slotError, setSlotError] = useState(null);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showAddPetModal, setShowAddPetModal] = useState(false);
    const [newBookingResult, setNewBookingResult] = useState(null);
    const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);
    const [showCreateSuccessModal, setShowCreateSuccessModal] = useState(false);
    const [newPet, setNewPet] = useState({ name: '', petTypeId: '', age: '' });
    const [addingPet, setAddingPet] = useState(false);
    const [addPetError, setAddPetError] = useState(null);

    // --- STATE THANH TOÁN TẠI QUẦY ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('PAY_LATER');

    // --- CÁC HÀM TIỆN ÍCH ---
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };
    const formatDateForAPI = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    const getWeekDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(selectedWeekStart);
            date.setDate(selectedWeekStart.getDate() + i);
            dates.push(date);
        }
        return dates;
    };
    const weekDates = getWeekDates();
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const hours = Array.from({ length: 10 }, (_, i) => i + 9);
    const formatTime = (dateTimeString) => new Date(dateTimeString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const formatDateTime = (dateTimeString) => new Date(dateTimeString).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    
    // --- EFFECTS ---
    useEffect(() => {
        fetchBookings();
    }, [selectedWeekStart]);

    useEffect(() => {
        if (newBookingDate && selectedServices.length > 0) {
            fetchAvailableSlots();
        } else {
            setAvailableSlots([]);
            setSelectedSlot(null);
        }
    }, [newBookingDate, selectedServices]);
    
    useEffect(() => {
        let html5QrcodeScanner = null;
        if (showScannerModal) {
            const config = { fps: 10, qrbox: { width: 250, height: 250 }, formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ] };
            html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);
            html5QrcodeScanner.render(
                (decodedText) => { html5QrcodeScanner.clear(); setShowScannerModal(false); fetchBookingByCode(decodedText); },
                (error) => { }
            );
        }
        return () => { if (html5QrcodeScanner) { html5QrcodeScanner.clear().catch(e => console.error(e)); } };
    }, [showScannerModal]);

    // --- API CALLS CHÍNH ---
    const fetchBookingByCode = async (code) => {
        try {
            setIsScanningAPI(true);
            const response = await fetch(`http://localhost:8080/api/bookings/code/${code}`, { credentials: 'include' });
            const result = await response.json();
            if (response.ok && result.success && result.data) {
                setSelectedBooking(result.data); setShowDetailModal(true); showToast('Quét mã thành công!', 'success');
            } else throw new Error(result.message || 'Không tìm thấy lịch hẹn trùng khớp!');
        } catch (err) { showToast(err.message, 'error'); } finally { setIsScanningAPI(false); }
    };

    const handleSearchUser = async (e) => {
        e.preventDefault();
        if (!searchEmail) return;
        try {
            setSearchingUser(true); setUserSearchError(null); setFoundUser(null);
            const response = await fetch(`http://localhost:8080/api/user/search?email=${searchEmail}`);
            const result = await response.json();
            if (response.ok && result.success) {
                setFoundUser(result.data); showToast(`Tìm khách hàng: ${result.data.username}`, 'success');
            } else throw new Error(result.message || 'Không tìm thấy khách hàng!');
        } catch (err) { setUserSearchError(err.message); } finally { setSearchingUser(false); }
    };

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const startDate = formatDateForAPI(selectedWeekStart);
            const response = await fetch(`http://localhost:8080/api/bookings/bookings-in-week?startDate=${startDate}`, { credentials: 'include' });
            if (response.ok) { const result = await response.json(); setBookings(result || []); }
        } catch (error) { showToast('Không thể tải dữ liệu lịch!', 'error'); } finally { setLoading(false); }
    };

    const handleBookingClick = async (bookingId) => {
        try {
            setShowBookingListPopup(false);
            const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, { credentials: 'include' });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) { setSelectedBooking(result.data); setShowDetailModal(true); }
            } else showToast('Không thể tải thông tin!', 'error');
        } catch (error) { showToast('Có lỗi xảy ra!', 'error'); }
    };

    const handleUpdateStatus = async (action) => {
        try {
            setUpdatingStatus(true);
            const response = await fetch(`http://localhost:8080/api/bookings/${selectedBooking.id}/${action}`, { method: 'POST', credentials: 'include' });
            const result = await response.json();
            if (response.ok && result.success) {
                showToast(`Cập nhật trạng thái thành công!`, 'success');
                setShowDetailModal(false); fetchBookings(); 
            } else throw new Error(result.message || 'Cập nhật thất bại');
        } catch (err) { showToast(err.message, 'error'); } finally { setUpdatingStatus(false); }
    };

    // --- HÀM THANH TOÁN CHỐT SỔ CHO ĐƠN CHƯA PAID ---
    const handlePaymentConfirm = async () => {
        try {
            setUpdatingStatus(true);
            const url = `http://localhost:8080/api/bookings/${selectedBooking.id}/complete?paymentMethod=${selectedPaymentMethod}`;
            const response = await fetch(url, { method: 'POST', credentials: 'include' });
            const result = await response.json();
            
            if (response.ok && result.success) {
                showToast('Đã chốt doanh thu và hoàn tất lịch hẹn!', 'success');
                setShowPaymentModal(false);
                setShowDetailModal(false);
                fetchBookings();
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            showToast('Lỗi thanh toán: ' + err.message, 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn HỦY/XÓA lịch hẹn này không?')) return;
        try {
            setIsDeleting(true);
            const response = await fetch(`http://localhost:8080/api/bookings/${selectedBooking.id}`, { method: 'DELETE' });
            const result = await response.json();
            if (response.ok && result.success) {
                showToast('Đã xóa thành công', 'success'); setShowDetailModal(false); fetchBookings(); 
            } else throw new Error(result.message);
        } catch (err) { showToast(err.message || 'Lỗi khi xóa', 'error'); } finally { setIsDeleting(false); }
    };

    // --- CÁC HÀM TẠO LỊCH ---
    const fetchServicesByPetType = async (petTypeId) => {
        try {
            setLoadingServices(true); setServiceError(null);
            const response = await fetch(`http://localhost:8080/api/service/pet-type/${petTypeId}`);
            if (!response.ok) throw new Error('Không thể tải danh sách dịch vụ phù hợp.');
            const data = await response.json();
            setServices(data.data || data); 
        } catch (err) { setServiceError(err.message); setServices([]); } finally { setLoadingServices(false); }
    };

    const handlePetChange = (e) => {
        const pId = e.target.value;
        setSelectedPet(pId);
        setSelectedServices([]); 
        setSelectedSlot(null);   
        
        if (pId) {
            const pet = pets.find(p => String(p.id) === String(pId));
            if (pet && pet.petTypeId) {
                fetchServicesByPetType(pet.petTypeId);
            }
        } else {
            setServices([]);
        }
    };

    const handleOpenEditBooking = async () => {
        setIsEditMode(true);
        setShowDetailModal(false);
        setFoundUser({ id: selectedBooking.userId, username: selectedBooking.userName, email: selectedBooking.userEmail || '' });
        
        try {
            const petsRes = await fetch(`http://localhost:8080/api/pet/user/${selectedBooking.userId}`);
            const petsData = await petsRes.json();
            const allPets = petsData.data || petsData;
            setPets(allPets);
            const currentPet = allPets.find(p => String(p.id) === String(selectedBooking.petId));
            setSelectedPet(selectedBooking.petId);
            let allServices = [];
            if (currentPet && currentPet.petTypeId) {
                const srvRes = await fetch(`http://localhost:8080/api/service/pet-type/${currentPet.petTypeId}`);
                const srvData = await srvRes.json();
                allServices = srvData.data || srvData;
                setServices(allServices);
            }
            
            setNotes(selectedBooking.notes || '');
            const dateStr = new Date(selectedBooking.scheduledAt).toISOString().split('T')[0];
            setNewBookingDate(dateStr);
            
            if (selectedBooking.services) {
                const matchedServices = allServices.filter(s => 
                    selectedBooking.services.some(oldSrv => oldSrv.id === s.id)
                );
                setSelectedServices(matchedServices);
            }
            
            setSelectedSlot({ startAt: selectedBooking.scheduledAt });
            setShowCreateBookingModal(true);
        } catch (err) {
            showToast('Lỗi khi tải dữ liệu cũ: ' + err.message, 'error');
        }
    };

    const handleOpenCreateBooking = () => {
        setIsEditMode(false);
        setShowCreateBookingModal(true);
        fetchUserPets(foundUser.id);
        setServices([]);
        setSelectedServices([]); setSelectedPet(''); setNewBookingDate(''); setSelectedSlot(null); setNotes('');
    };

    const fetchUserPets = async (userId) => {
        try {
            setLoadingPets(true); 
            const response = await fetch(`http://localhost:8080/api/pet/user/${userId}`);
            const result = await response.json();
            if (response.ok && result.success) setPets(result.data);
        } catch (err) { } finally { setLoadingPets(false); }
    };

    const fetchPetTypes = async () => {
        try {
            setLoadingPetTypes(true);
            const response = await fetch('http://localhost:8080/api/pet-type');
            const result = await response.json();
            if (response.ok && result.success) setPetTypes(result.data);
        } catch (err) { } finally { setLoadingPetTypes(false); }
    };

    const fetchAvailableSlots = async () => {
        try {
            setLoadingSlots(true); setSlotError(null);
            const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationInMinutes, 0);
            const response = await fetch(`http://localhost:8080/api/bookings/available-slots?selectedDay=${newBookingDate}&durationInMinutes=${totalDuration}`);
            const result = await response.json();
            if (response.ok && result.success) setAvailableSlots(result.data);
            else throw new Error(result.message);
        } catch (err) { setSlotError(err.message); setAvailableSlots([]); } finally { setLoadingSlots(false); }
    };

    const handleOpenAddPetModal = () => { setShowAddPetModal(true); fetchPetTypes(); };

    const handleAddPet = async (e) => {
        e.preventDefault();
        try {
            setAddingPet(true); setAddPetError(null);
            const response = await fetch(`http://localhost:8080/api/pet/user/${foundUser.id}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPet.name, petTypeId: newPet.petTypeId, age: parseInt(newPet.age) })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            setNewPet({ name: '', petTypeId: '', age: '' });
            await fetchUserPets(foundUser.id);
            setShowAddPetModal(false);
        } catch (err) { setAddPetError(err.message); } finally { setAddingPet(false); }
    };

    const handleSubmitBooking = async () => {
        if (!selectedPet || selectedServices.length === 0 || !selectedSlot) {
            alert('Vui lòng điền đầy đủ thông tin!'); return;
        }
        try {
            setSubmitting(true);
            const url = isEditMode 
                ? `http://localhost:8080/api/bookings/${selectedBooking.id}` 
                : `http://localhost:8080/api/bookings/user/${foundUser.id}`;
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduledAt: selectedSlot.startAt, notes: notes, petId: selectedPet, services: selectedServices.map(s => s.id) })
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            
            setNewBookingResult(result.data);
            setShowCreateConfirmModal(true);
        } catch (err) { alert('Lỗi: ' + err.message); } finally { setSubmitting(false); }
    };

    const handleConfirmBooking = async () => {
        try {
            setConfirming(true);
            const response = await fetch(`http://localhost:8080/api/bookings/${newBookingResult.id}/confirm`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message);
            
            setShowCreateConfirmModal(false);
            setShowCreateBookingModal(false); 
            setShowCreateSuccessModal(true);
            fetchBookings(); 
        } catch (err) { alert('Lỗi xác nhận: ' + err.message); } finally { setConfirming(false); }
    };

    // --- CÁC HÀM TÍNH TOÁN UI ---
    const handlePreviousWeek = () => { const newDate = new Date(selectedWeekStart); newDate.setDate(newDate.getDate() - 7); setSelectedWeekStart(newDate); setSelectedDate(formatDateForInput(newDate)); };
    const handleNextWeek = () => { const newDate = new Date(selectedWeekStart); newDate.setDate(newDate.getDate() + 7); setSelectedWeekStart(newDate); setSelectedDate(formatDateForInput(newDate)); };
    const handleToday = () => { const today = new Date(); setSelectedWeekStart(getMonday(today)); setSelectedDate(formatDateForInput(today)); };
    const handleDateChange = (e) => { const val = e.target.value; setSelectedDate(val); const [y, m, d] = val.split('-'); setSelectedWeekStart(getMonday(new Date(y, m - 1, d))); };

    const getBookingsForDate = (date) => { const dateStr = formatDateForAPI(date); return bookings.filter(b => formatDateForAPI(new Date(b.scheduledAt)) === dateStr); };
    
    const createTimeSegments = (dayBookings) => {
        if (dayBookings.length === 0) return [];
        const timePoints = new Set();
        dayBookings.forEach(booking => { timePoints.add(new Date(booking.scheduledAt).getTime()); timePoints.add(new Date(booking.expectedEndTime).getTime()); });
        const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
        const segments = [];
        for (let i = 0; i < sortedTimePoints.length - 1; i++) {
            const segmentStart = sortedTimePoints[i]; const segmentEnd = sortedTimePoints[i + 1];
            const overlappingBookings = dayBookings.filter(booking => {
                const bookingStart = new Date(booking.scheduledAt).getTime(); const bookingEnd = new Date(booking.expectedEndTime).getTime();
                return bookingStart < segmentEnd && bookingEnd > segmentStart;
            });
            if (overlappingBookings.length > 0) {
                segments.push({ start: new Date(segmentStart), end: new Date(segmentEnd), bookings: overlappingBookings, density: overlappingBookings.length });
            }
        }
        return segments;
    };
    
    const calculateSegmentPosition = (start, end) => {
        const startHour = start.getHours(); const startMinute = start.getMinutes(); const endHour = end.getHours(); const endMinute = end.getMinutes();
        const startPosition = (startHour - 9) + startMinute / 60; const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60;
        return { top: startPosition * 60, height: Math.max(duration * 60, 1) };
    };
    
    const getDensityColor = (density) => {
        const colors = ['rgba(13, 110, 253, 0.25)', 'rgba(25, 135, 84, 0.4)', 'rgba(255, 193, 7, 0.5)', 'rgba(253, 126, 20, 0.6)', 'rgba(220, 53, 69, 0.8)'];
        return colors[Math.min(density - 1, colors.length - 1)];
    };
    
    const getDensityIcon = (density) => {
        if (density === 1) return <div className="d-flex align-items-center justify-content-center"><i className="fas fa-user" style={{ fontSize: '1rem' }}></i></div>;
        if (density === 2) return <div className="d-flex align-items-center justify-content-center gap-1"><i className="fas fa-user" style={{ fontSize: '0.9rem' }}></i><i className="fas fa-user" style={{ fontSize: '0.9rem' }}></i></div>;
        return <div className="d-flex align-items-center justify-content-center gap-1"><i className="fas fa-users" style={{ fontSize: '1rem' }}></i><span className="badge bg-dark rounded-circle text-white shadow-sm" style={{ fontSize: '0.65rem', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{density}</span></div>;
    };
    
    const handleSegmentClick = (e, segment) => {
        if (segment.bookings.length === 1) handleBookingClick(segment.bookings[0].id);
        else {
            const rect = e.currentTarget.getBoundingClientRect();
            setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top }); setPopupBookings(segment.bookings); setShowBookingListPopup(true);
        }
    };

    const getBookingStatusText = (status) => {
        const statusMap = {
            0: 'Chờ xử lý',
            1: 'Chờ thanh toán',
            2: 'Đã xác nhận',
            3: 'Đang thực hiện',
            4: 'Hoàn thành',
            5: 'Đã hủy',
            6: 'Khách không đến'
        };
        return statusMap[status] || 'Không xác định';
    };

    const getBookingStatusColor = (status) => {
        const colorMap = {
            0: 'bg-warning text-dark',
            1: 'bg-info text-white',
            2: 'bg-primary text-white',
            3: 'bg-info text-white',
            4: 'bg-success text-white',
            5: 'bg-secondary text-white',
            6: 'bg-danger text-white'
        };
        return colorMap[status] || 'bg-dark';
    };

    const handleMouseMove = (e, segment) => { setHoveredSegment(segment); setMousePosition({ x: e.clientX, y: e.clientY }); };
    const handleMouseLeave = () => setHoveredSegment(null);

    const toggleServiceSelection = (service) => {
        const isSelected = selectedServices.find(s => s.id === service.id);
        if (isSelected) setSelectedServices(selectedServices.filter(s => s.id !== service.id));
        else setSelectedServices([...selectedServices, service]);
    };
    const isServiceSelected = (serviceId) => selectedServices.some(s => s.id === serviceId);
    const handleRemoveService = (serviceId) => setSelectedServices(selectedServices.filter(s => s.id !== serviceId));

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

            <h1 className="mt-4">Quản lý Đặt lịch</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item"><a href="/admin">Dashboard</a></li>
                <li className="breadcrumb-item active">Đặt lịch</li>
            </ol>
            
            <div className="row mb-4">
                {/* TÌM KIẾM KHÁCH HÀNG */}
                <div className="col-md-6 mb-3 mb-md-0">
                    <div className="card shadow-sm border-primary h-100" style={{ borderTopWidth: '4px' }}>
                        <div className="card-header bg-white fw-bold">
                            <i className="fas fa-search text-primary me-2"></i>Tra cứu Khách hàng (Tạo lịch mới)
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSearchUser} className="d-flex gap-2">
                                <input type="email" className="form-control" placeholder="Nhập email khách hàng..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} required />
                                <button type="submit" className="btn btn-primary px-4" disabled={searchingUser}>
                                    {searchingUser ? <span className="spinner-border spinner-border-sm"></span> : 'Tìm'}
                                </button>
                            </form>
                            {userSearchError && <div className="text-danger mt-2 small"><i className="fas fa-exclamation-circle me-1"></i>{userSearchError}</div>}
                            {foundUser && (
                                <div className="alert alert-success mt-3 mb-0 d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong><i className="fas fa-user-check me-2"></i>{foundUser.username}</strong>
                                        <span className="ms-3 text-muted"><i className="fas fa-envelope me-1"></i>{foundUser.email}</span>
                                    </div>
                                    <button className="btn btn-sm btn-success fw-bold" onClick={handleOpenCreateBooking}>
                                        <i className="fas fa-calendar-plus me-1"></i> Tạo lịch
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUÉT QR CODE */}
                <div className="col-md-6">
                    <div className="card shadow-sm border-success h-100" style={{ borderTopWidth: '4px' }}>
                        <div className="card-header bg-white fw-bold">
                            <i className="fas fa-qrcode text-success me-2"></i>Tra cứu Hóa Đơn (Quét QR)
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center py-4">
                            {isScanningAPI ? (
                                <div className="text-center">
                                    <div className="spinner-border text-success mb-2" role="status"></div>
                                    <p className="text-muted mb-0">Đang truy xuất dữ liệu từ mã QR...</p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-muted text-center mb-3">Ấn vào nút bên dưới để mở Camera và quét mã QR trên điện thoại/giấy của khách.</p>
                                    <button 
                                        type="button" 
                                        className="btn btn-success btn-lg px-5 shadow-sm"
                                        onClick={() => setShowScannerModal(true)}
                                    >
                                        <i className="fas fa-camera me-2"></i> Mở Camera Quét QR
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* THANH ĐIỀU HƯỚNG LỊCH */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-primary" onClick={handlePreviousWeek}><i className="fas fa-chevron-left"></i></button>
                                <button className="btn btn-primary" onClick={handleToday}><i className="fas fa-calendar-day me-2"></i>Hôm nay</button>
                                <button className="btn btn-outline-primary" onClick={handleNextWeek}><i className="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center justify-content-end gap-3">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="mb-0 fw-bold"><i className="fas fa-calendar-alt me-2"></i>Chọn ngày:</label>
                                    <input type="date" className="form-control" value={selectedDate} onChange={handleDateChange} style={{ maxWidth: '200px' }} />
                                </div>
                                <div className="text-end">
                                    <h5 className="mb-0">{weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LEGEND MẬT ĐỘ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-4 flex-wrap">
                        <span className="fw-bold me-2">Mật độ lịch hẹn:</span>
                        {[1, 2, 3, 4, 5].map(num => (
                            <div key={num} className="d-flex align-items-center gap-2">
                                <div style={{ width: '55px', height: '32px', backgroundColor: getDensityColor(num), border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: num >= 4 ? 'white' : '#333' }}>
                                    {getDensityIcon(num)}
                                </div>
                                <span>{num === 5 ? '5+ lịch' : `${num} lịch`}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BẢNG LỊCH TIMETABLE */}
            <div className="card mb-4">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
                    ) : (
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '80vh' }}>
                            <div style={{ minWidth: '1100px', display: 'flex', backgroundColor: '#f8f9fa' }}>
                                {/* Cột giờ */}
                                <div style={{ width: '80px', flexShrink: 0, backgroundColor: 'white', borderRight: '1px solid #dee2e6' }}>
                                    <div style={{ height: '60px', borderBottom: '2px solid #dee2e6', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 110 }}></div>
                                    {hours.map(hour => (
                                        <div key={hour} style={{ height: '60px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5px', fontSize: '0.75rem', color: '#6c757d' }}>
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Cột các ngày */}
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {/* Header Ngày */}
                                    {weekDates.map((date, index) => {
                                        const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());
                                        return (
                                            <div key={`header-${index}`} style={{ height: '60px', borderBottom: '2px solid #dee2e6', borderRight: index < 6 ? '1px solid #dee2e6' : 'none', backgroundColor: isToday ? '#0d6efd' : 'white', color: isToday ? 'white' : '#212529', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{date.getDate()}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}</div>
                                            </div>
                                        );
                                    })}

                                    {/* Nội dung Grid */}
                                    {weekDates.map((date, dayIndex) => {
                                        const dayBookings = getBookingsForDate(date);
                                        const segments = createTimeSegments(dayBookings);
                                        const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());

                                        return (
                                            <div key={`day-${dayIndex}`} style={{ position: 'relative', borderRight: dayIndex < 6 ? '1px solid #dee2e6' : 'none', backgroundColor: isToday ? 'rgba(13, 110, 253, 0.05)' : 'white' }}>
                                                {hours.map(hour => <div key={hour} style={{ height: '60px', borderBottom: '1px solid #f0f0f0' }}></div>)}
                                                {segments.map((segment, segmentIndex) => {
                                                    const { top, height } = calculateSegmentPosition(segment.start, segment.end);
                                                    return (
                                                        <div key={segmentIndex}
                                                            style={{ position: 'absolute', top: `${top}px`, left: '0', right: '0', height: `${height}px`, backgroundColor: getDensityColor(segment.density), border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', margin: '1px', cursor: 'pointer', zIndex: 50, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: segment.density >= 4 ? 'white' : '#333' }}
                                                            onClick={(e) => handleSegmentClick(e, segment)} onMouseMove={(e) => handleMouseMove(e, segment)} onMouseLeave={handleMouseLeave}
                                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.zIndex = '100'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'; }}
                                                            onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = '50'; e.currentTarget.style.boxShadow = 'none'; }}
                                                        >
                                                            {height > 20 && getDensityIcon(segment.density)}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredSegment && (
                <div className="position-fixed bg-dark text-white p-2 rounded shadow" style={{ left: `${mousePosition.x + 15}px`, top: `${mousePosition.y + 15}px`, zIndex: 9999, fontSize: '0.85rem', pointerEvents: 'none', maxWidth: '300px' }}>
                    <div className="fw-bold mb-1">{hoveredSegment.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {hoveredSegment.end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="small mb-1"><i className="fas fa-users me-1"></i>Số lượng: {hoveredSegment.density} lịch hẹn</div>
                    <div className="mt-1 small" style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '5px' }}>
                        {hoveredSegment.bookings.map((booking, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-1 mb-1"><i className="fas fa-calendar-check" style={{ fontSize: '0.7rem' }}></i><span>{booking.bookingCode}</span><span className="text-muted">-</span><span>{booking.userName}</span></div>
                        ))}
                    </div>
                </div>
            )}

            {/* Booking List Popup */}
            {showBookingListPopup && (
                <>
                    <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1040 }} onClick={() => setShowBookingListPopup(false)}></div>
                    <div className="position-fixed bg-white rounded shadow-lg border" style={{ left: `${popupPosition.x}px`, top: `${popupPosition.y}px`, transform: 'translate(-50%, -10px)', zIndex: 1050, minWidth: '300px', maxWidth: '400px', maxHeight: '500px', overflowY: 'auto' }}>
                        <div className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3"><h6 className="mb-0 fw-bold"><i className="fas fa-list me-2"></i>Danh sách lịch hẹn ({popupBookings.length})</h6><button className="btn-close btn-sm" onClick={() => setShowBookingListPopup(false)}></button></div>
                            <div className="list-group">
                                {popupBookings.map((booking) => (
                                    <button key={booking.id} className="list-group-item list-group-item-action" onClick={() => handleBookingClick(booking.id)}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="fw-bold"><i className="fas fa-calendar-check me-2 text-primary"></i>{booking.bookingCode}</div>
                                                <div className="small text-muted"><i className="fas fa-user me-1"></i>{booking.userName}</div>
                                                <div className="small text-muted"><i className="fas fa-clock me-1"></i>{new Date(booking.scheduledAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.expectedEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                            <span className={`badge ${getBookingStatusColor(booking.bookingStatus)} ms-2`}>{getBookingStatusText(booking.bookingStatus)}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL CHI TIẾT BOOKING */}
            {showDetailModal && selectedBooking && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title"><i className="fas fa-calendar-check me-2"></i>Chi tiết đặt lịch - {selectedBooking.bookingCode}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr><th style={{ width: '40%' }}>Mã đặt lịch:</th><td><strong className="text-primary">{selectedBooking.bookingCode}</strong></td></tr>
                                                <tr><th>Khách hàng:</th><td><i className="fas fa-user me-2"></i>{selectedBooking.userName}</td></tr>
                                                <tr><th>Thú cưng:</th><td><i className="fas fa-paw me-2"></i>{selectedBooking.petName}</td></tr>
                                                <tr><th>Trạng thái:</th><td><span className={`badge ${getBookingStatusColor(selectedBooking.bookingStatus)}`}>{getBookingStatusText(selectedBooking.bookingStatus)}</span></td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr><th style={{ width: '40%' }}>Thời gian:</th><td><i className="fas fa-clock me-2"></i>{new Date(selectedBooking.scheduledAt).toLocaleString('vi-VN')}</td></tr>
                                                <tr><th>Kết thúc dự kiến:</th><td>{new Date(selectedBooking.expectedEndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td></tr>
                                                <tr><th>Tổng tiền:</th><td><strong className="text-success fs-5">{formatCurrency(selectedBooking.totalPrice)}</strong></td></tr>
                                                
                                                {/* TRƯỜNG MỚI: HIỂN THỊ TÌNH TRẠNG THANH TOÁN */}
                                                <tr>
                                                    <th>Thanh toán:</th>
                                                    <td>
                                                        {selectedBooking.paid ? (
                                                            <span className="badge bg-success"><i className="fas fa-check-circle me-1"></i> Đã thanh toán ({selectedBooking.paymentMethod})</span>
                                                        ) : (
                                                            <span className="badge bg-warning text-dark"><i className="fas fa-clock me-1"></i> Chưa thu tiền</span>
                                                        )}
                                                    </td>
                                                </tr>

                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h6 className="fw-bold"><i className="fas fa-concierge-bell me-2"></i>Dịch vụ đã chọn:</h6>
                                    <table className="table table-sm table-bordered">
                                        <thead className="table-light"><tr><th>Tên dịch vụ</th><th className="text-end">Giá</th></tr></thead>
                                        <tbody>{selectedBooking.services?.map((service, index) => <tr key={index}><td>{service.name}</td><td className="text-end">{formatCurrency(service.price)}</td></tr>)}</tbody>
                                    </table>
                                </div>
                                {selectedBooking.notes && (
                                    <div className="mt-3"><h6 className="fw-bold"><i className="fas fa-sticky-note me-2"></i>Ghi chú:</h6><div className="alert alert-info mb-0"><i className="fas fa-info-circle me-2"></i>{selectedBooking.notes}</div></div>
                                )}
                            </div>
                            
                            {/* --- NÚT THAO TÁC CỦA ADMIN --- */}
                            <div className="modal-footer d-flex justify-content-between bg-light">
                                <div>
                                    {(selectedBooking.bookingStatus <= 2) && (
                                        <>
                                            <button type="button" className="btn btn-outline-danger me-2 fw-bold" onClick={handleDeleteBooking} disabled={isDeleting || updatingStatus}>
                                                {isDeleting ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-trash-alt me-2"></i>}
                                                Hủy lịch
                                            </button>
                                            <button type="button" className="btn btn-outline-primary fw-bold" onClick={handleOpenEditBooking} disabled={updatingStatus}>
                                                <i className="fas fa-edit me-2"></i>Chỉnh sửa
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div>
                                    {/* Duyệt thủ công */}
                                    {(selectedBooking.bookingStatus === 0 || selectedBooking.bookingStatus === 1) && (
                                        <button type="button" className="btn btn-success fw-bold me-2" onClick={() => handleUpdateStatus('confirm')} disabled={updatingStatus}>
                                            Xác nhận (Gửi QR)
                                        </button>
                                    )}

                                    {/* Bắt đầu làm */}
                                    {selectedBooking.bookingStatus === 2 && (
                                        <button type="button" className="btn btn-info fw-bold me-2 text-white" onClick={() => handleUpdateStatus('start')} disabled={updatingStatus}>
                                            {updatingStatus ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-play me-2"></i>} Bắt đầu làm
                                        </button>
                                    )}
                                    
                                    {/* Khách đã thanh toán -> Nút bấm Hoàn thành luôn (Không bật Popup hỏi tiền) */}
                                    {selectedBooking.bookingStatus === 3 && selectedBooking.paid && (
                                        <button type="button" className="btn btn-success fw-bold me-2" onClick={() => handleUpdateStatus('complete')} disabled={updatingStatus}>
                                            {updatingStatus ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-check-double me-2"></i>} Hoàn thành
                                        </button>
                                    )}

                                    {/* Khách chưa thanh toán -> Nút Hoàn Thành & Thu Tiền (Bật Popup hỏi tiền) */}
                                    {selectedBooking.bookingStatus === 3 && !selectedBooking.paid && (
                                        <button type="button" className="btn btn-success fw-bold me-2" onClick={() => setShowPaymentModal(true)} disabled={updatingStatus}>
                                            {updatingStatus ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="fas fa-hand-holding-usd me-2"></i>} Hoàn thành & Thu tiền
                                        </button>
                                    )}

                                    {/* Khách boom hàng */}
                                    {selectedBooking.bookingStatus === 2 && (
                                        <button type="button" className="btn btn-danger fw-bold me-2" onClick={() => handleUpdateStatus('noshow')} disabled={updatingStatus}>
                                            Báo vắng
                                        </button>
                                    )}

                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =======================================================
                MODAL GHI NHẬN THANH TOÁN TẠI QUẦY (HIỆN KHI BẤM HOÀN THÀNH & THU TIỀN)
               ======================================================== */}
            {showPaymentModal && selectedBooking && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content shadow-lg">
                            <div className="modal-header bg-success text-white">
                                <h6 className="modal-title fw-bold">Xác nhận Thu tiền</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
                            </div>
                            <div className="modal-body text-center">
                                <h4 className="text-danger fw-bold mb-3">{formatCurrency(selectedBooking.totalPrice)}</h4>
                                
                                <p className="small text-muted mb-3">
                                    Vui lòng chọn hình thức khách vừa thanh toán tại quầy để chốt sổ:
                                </p>

                                <select className="form-select mb-3 border-success" value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
                                    <option value="PAY_LATER">💵 Đã thu Tiền mặt</option>
                                    <option value="MOMO_PREPAID">📱 Khách quét mã Momo</option>
                                    <option value="VNPAY_PREPAID">🏦 Khách quét VNPay / Ngân hàng</option>
                                </select>
                            </div>
                            <div className="modal-footer p-2">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPaymentModal(false)}>Hủy</button>
                                <button type="button" className="btn btn-success btn-sm fw-bold" onClick={handlePaymentConfirm} disabled={updatingStatus}>
                                    {updatingStatus ? <span className="spinner-border spinner-border-sm"></span> : <i className="fas fa-check me-1"></i>} Hoàn thành & Chốt sổ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SCANNER */}
            {showScannerModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 overflow-hidden">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title"><i className="fas fa-qrcode me-2"></i>Quét mã QR Hóa đơn</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowScannerModal(false)}></button>
                            </div>
                            <div className="modal-body p-0 bg-dark text-center position-relative">
                                <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
                                <div className="position-absolute bottom-0 w-100 p-3 bg-dark bg-opacity-75">
                                    <p className="text-white mb-0 small">Đưa mã QR trên điện thoại/giấy của khách vào giữa khung hình.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CREATE/EDIT BOOKING */}
            {showCreateBookingModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1040, overflowY: 'auto' }}>
                    <div className="modal-dialog modal-xl modal-dialog-scrollable">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="fas fa-calendar-plus me-2"></i>
                                    {isEditMode ? `Cập nhật Lịch hẹn cho ${foundUser?.username}` : `Tạo Lịch hẹn cho ${foundUser?.username}`}
                                </h4>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateBookingModal(false)}></button>
                            </div>
                            <div className="modal-body bg-light p-4">
                                {isEditMode && (
                                    <div className="alert alert-info border-info border-start border-4 mb-4">
                                        <i className="fas fa-info-circle me-2"></i>
                                        <strong>Chế độ Sửa:</strong> Vui lòng chọn lại đầy đủ Dịch vụ và Khung giờ mới để hệ thống tính toán lại!
                                    </div>
                                )}
                                <div className="row">
                                    <div className="col-lg-8 mx-auto">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-body p-4">
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold text-secondary">1. Chọn thú cưng <span className="text-danger">*</span></label>
                                                    {loadingPets ? (
                                                        <div className="spinner-border spinner-border-sm text-primary ms-3"></div>
                                                    ) : pets.length === 0 ? (
                                                        <div className="alert alert-warning py-2 border-warning border-start border-4">
                                                            Khách hàng này chưa có thú cưng nào.
                                                            <button type="button" className="btn btn-sm btn-dark ms-3" onClick={handleOpenAddPetModal}>+ Thêm thú cưng</button>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex gap-2">
                                                            <select className="form-select" value={selectedPet} onChange={handlePetChange}>
                                                                <option value="">-- Chọn thú cưng của khách --</option>
                                                                {pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name} ({pet.age} tuổi)</option>)}
                                                            </select>
                                                            <button type="button" className="btn btn-outline-dark text-nowrap" onClick={handleOpenAddPetModal}>+ Thêm mới</button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mb-4">
                                                    <label className="form-label fw-bold text-secondary">2. Dịch vụ Spa <span className="text-danger">*</span></label>
                                                    
                                                    {!selectedPet ? (
                                                        <div className="text-muted small fst-italic">Vui lòng chọn Thú cưng trước để xem các dịch vụ phù hợp.</div>
                                                    ) : (
                                                        <div>
                                                            <button type="button" className="btn btn-outline-primary" onClick={() => setShowServiceModal(true)}>
                                                                <i className="fas fa-plus me-1"></i> Chọn dịch vụ
                                                            </button>
                                                        </div>
                                                    )}

                                                    {selectedServices.length > 0 && (
                                                        <div className="d-flex flex-wrap gap-2 mt-3 p-3 bg-light rounded border">
                                                            {selectedServices.map(service => (
                                                                <span key={service.id} className="badge bg-primary fs-6 d-flex align-items-center gap-2 p-2">
                                                                    <span>{service.name}</span>
                                                                    <button type="button" className="btn-close btn-close-white" onClick={() => handleRemoveService(service.id)}></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mb-4">
                                                    <label className="form-label fw-bold text-secondary">3. Chọn ngày <span className="text-danger">*</span></label>
                                                    <input type="date" className="form-control form-control-lg" value={newBookingDate} min={getTodayDate()} onChange={(e) => setNewBookingDate(e.target.value)} disabled={selectedServices.length === 0} />
                                                    {selectedServices.length === 0 && <small className="text-danger mt-1">Vui lòng chọn dịch vụ trước</small>}
                                                </div>

                                                {newBookingDate && selectedServices.length > 0 && (
                                                    <div className="mb-4 p-3 border rounded bg-white">
                                                        <label className="form-label fw-bold text-secondary">4. Khung giờ trống <span className="text-danger">*</span></label>
                                                        {loadingSlots ? (
                                                            <div className="text-center py-2"><span className="spinner-border spinner-border-sm text-primary"></span></div>
                                                        ) : slotError ? (
                                                            <div className="alert alert-danger py-2">{slotError}</div>
                                                        ) : availableSlots.length === 0 ? (
                                                            <div className="alert alert-secondary py-2">Không còn khung giờ trống.</div>
                                                        ) : (
                                                            <div className="row g-2">
                                                                {availableSlots.map((slot, index) => (
                                                                    <div key={index} className="col-md-3 col-4">
                                                                        <button type="button" className={`btn w-100 fw-bold ${selectedSlot?.startAt === slot.startAt ? 'btn-primary shadow-sm' : 'btn-outline-primary bg-white'}`} onClick={() => setSelectedSlot(slot)}>
                                                                            {formatTime(slot.startAt)}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mb-4">
                                                    <label className="form-label fw-bold text-secondary">5. Ghi chú</label>
                                                    <textarea className="form-control" rows="3" placeholder="Ghi chú thêm..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                                                </div>

                                                <div className="d-grid mt-4">
                                                    <button type="button" className={`btn ${isEditMode ? 'btn-warning' : 'btn-primary'} btn-lg fw-bold text-dark`} onClick={handleSubmitBooking} disabled={!selectedPet || selectedServices.length === 0 || !selectedSlot || submitting}>
                                                        {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : (isEditMode ? 'CẬP NHẬT LỊCH HẸN' : 'TẠO LỊCH HẸN')}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SERVICE SELECTION */}
            {showServiceModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold">Chọn dịch vụ</h5>
                                <button type="button" className="btn-close" onClick={() => setShowServiceModal(false)}></button>
                            </div>
                            <div className="modal-body p-0">
                                {loadingServices ? (
                                    <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
                                ) : serviceError ? (
                                    <div className="alert alert-danger m-3">{serviceError}</div>
                                ) : services.length === 0 ? (
                                    <div className="alert alert-warning m-3">Không có dịch vụ nào phù hợp với thú cưng này.</div>
                                ) : (
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light"><tr><th className="ps-4">Chọn</th><th>Tên dịch vụ</th><th>Giá</th><th>Thời lượng</th></tr></thead>
                                        <tbody>
                                            {services.map(service => (
                                                <tr key={service.id} onClick={() => toggleServiceSelection(service)} style={{ cursor: 'pointer' }}>
                                                    <td className="ps-4"><input type="checkbox" className="form-check-input" checked={isServiceSelected(service.id)} readOnly /></td>
                                                    <td className="fw-bold">{service.name}</td>
                                                    <td className="text-danger fw-bold">{service.price.toLocaleString('vi-VN')}đ</td>
                                                    <td>{service.durationInMinutes} phút</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-primary px-4" onClick={() => setShowServiceModal(false)}>Xong ({selectedServices.length})</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD PET MODAL */}
            {showAddPetModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">Thêm Thú cưng</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddPetModal(false)}></button>
                            </div>
                            <form onSubmit={handleAddPet}>
                                <div className="modal-body">
                                    {addPetError && <div className="alert alert-danger py-2">{addPetError}</div>}
                                    <div className="mb-3"><label className="form-label fw-bold">Tên Pet *</label><input type="text" className="form-control" value={newPet.name} onChange={(e) => setNewPet({ ...newPet, name: e.target.value })} required /></div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Chủng loại *</label>
                                        <select className="form-select" value={newPet.petTypeId} onChange={(e) => setNewPet({ ...newPet, petTypeId: e.target.value })} required>
                                            <option value="">-- Chọn loại --</option>
                                            {petTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3"><label className="form-label fw-bold">Tuổi *</label><input type="number" className="form-control" min="0" max="30" value={newPet.age} onChange={(e) => setNewPet({ ...newPet, age: e.target.value })} required /></div>
                                </div>
                                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddPetModal(false)}>Hủy</button><button type="submit" className="btn btn-primary" disabled={addingPet}>{addingPet ? 'Đang lưu...' : 'Lưu thú cưng'}</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM BOOKING MODAL */}
            {showCreateConfirmModal && newBookingResult && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-warning">
                                <h5 className="modal-title fw-bold text-dark"><i className="fas fa-exclamation-triangle me-2"></i>{isEditMode ? 'Xác nhận Cập nhật Lịch (Admin)' : 'Xác nhận Lịch hẹn (Admin)'}</h5>
                            </div>
                            <div className="modal-body">
                                <table className="table table-bordered">
                                    <tbody>
                                        <tr><th width="40%" className="bg-light">Khách hàng</th><td><strong>{foundUser?.username}</strong> ({foundUser?.email})</td></tr>
                                        <tr><th className="bg-light">Mã booking</th><td><strong className="text-primary">{newBookingResult.bookingCode}</strong></td></tr>
                                        <tr><th className="bg-light">Thời gian</th><td>{formatDateTime(newBookingResult.scheduledAt)} - {formatTime(newBookingResult.expectedEndTime)}</td></tr>
                                        <tr><th className="bg-light align-middle">Tổng thanh toán</th><td className="bg-light"><strong className="text-danger fs-4">{newBookingResult.totalPrice.toLocaleString('vi-VN')}đ</strong></td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setShowCreateConfirmModal(false)}>Sửa lại</button>
                                <button type="button" className="btn btn-success px-4 fw-bold" onClick={handleConfirmBooking} disabled={confirming}>
                                    {confirming ? 'Đang xử lý...' : 'Chốt Lịch'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showCreateSuccessModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content text-center py-4 border-0 shadow-lg">
                            <div className="modal-body">
                                <i className="fas fa-check-circle text-success" style={{ fontSize: '5rem' }}></i>
                                <h3 className="mt-4 mb-2 fw-bold text-success">{isEditMode ? 'Đã cập nhật thành công!' : 'Đã tạo lịch hẹn!'}</h3>
                                <p className="text-muted">Dữ liệu đã được lưu vào hệ thống.</p>
                                <button type="button" className="btn btn-primary mt-3 px-5" onClick={() => setShowCreateSuccessModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManagement;