import React, { useState, useEffect } from 'react';

const BookingManagement = () => {
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
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3000);
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

    useEffect(() => {
        fetchBookings();
    }, [selectedWeekStart]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const startDate = formatDateForAPI(selectedWeekStart);

            const response = await fetch(
                `http://localhost:8080/api/bookings/bookings-in-week?startDate=${startDate}`,
                {
                    credentials: 'include'
                }
            );

            if (response.ok) {
                const result = await response.json();
                setBookings(result || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            showToast('Không thể tải dữ liệu!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousWeek = () => {
        const newDate = new Date(selectedWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setSelectedWeekStart(newDate);
        setSelectedDate(formatDateForInput(newDate));
    };

    const handleNextWeek = () => {
        const newDate = new Date(selectedWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setSelectedWeekStart(newDate);
        setSelectedDate(formatDateForInput(newDate));
    };

    const handleToday = () => {
        const today = new Date();
        setSelectedWeekStart(getMonday(today));
        setSelectedDate(formatDateForInput(today));
    };

    const handleDateChange = (e) => {
        const selectedDateValue = e.target.value;
        setSelectedDate(selectedDateValue);
        const [year, month, day] = selectedDateValue.split('-');
        const newDate = new Date(year, month - 1, day);
        setSelectedWeekStart(getMonday(newDate));
    };

    const handleBookingClick = async (bookingId) => {
        try {
            setShowBookingListPopup(false);

            const response = await fetch(
                `http://localhost:8080/api/bookings/${bookingId}`,
                {
                    credentials: 'include'
                }
            );

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setSelectedBooking(result.data);
                    setShowDetailModal(true);
                }
            } else {
                showToast('Không thể tải thông tin đặt lịch!', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Có lỗi xảy ra!', 'error');
        }
    };

    const getBookingsForDate = (date) => {
        const dateStr = formatDateForAPI(date);
        return bookings.filter(booking => {
            const bookingDate = formatDateForAPI(new Date(booking.scheduledAt));
            return bookingDate === dateStr;
        });
    };

    const createTimeSegments = (dayBookings) => {
        if (dayBookings.length === 0) return [];

        const timePoints = new Set();
        dayBookings.forEach(booking => {
            const start = new Date(booking.scheduledAt);
            const end = new Date(booking.expectedEndTime);
            timePoints.add(start.getTime());
            timePoints.add(end.getTime());
        });

        const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
        const segments = [];

        for (let i = 0; i < sortedTimePoints.length - 1; i++) {
            const segmentStart = sortedTimePoints[i];
            const segmentEnd = sortedTimePoints[i + 1];

            const overlappingBookings = dayBookings.filter(booking => {
                const bookingStart = new Date(booking.scheduledAt).getTime();
                const bookingEnd = new Date(booking.expectedEndTime).getTime();
                return bookingStart < segmentEnd && bookingEnd > segmentStart;
            });

            if (overlappingBookings.length > 0) {
                segments.push({
                    start: new Date(segmentStart),
                    end: new Date(segmentEnd),
                    bookings: overlappingBookings,
                    density: overlappingBookings.length
                });
            }
        }

        return segments;
    };

    const calculateSegmentPosition = (start, end) => {
        const startHour = start.getHours();
        const startMinute = start.getMinutes();
        const endHour = end.getHours();
        const endMinute = end.getMinutes();

        const startPosition = (startHour - 9) + startMinute / 60;
        const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60;

        return { top: startPosition * 60, height: Math.max(duration * 60, 1) };
    };

    // ĐÃ SỬA: Cập nhật dải màu lên 5 mức độ
    const getDensityColor = (density) => {
        const colors = [
            'rgba(13, 110, 253, 0.25)', // 1: Xanh dương nhạt
            'rgba(25, 135, 84, 0.4)',   // 2: Xanh lá
            'rgba(255, 193, 7, 0.5)',   // 3: Vàng
            'rgba(253, 126, 20, 0.6)',  // 4: Cam
            'rgba(220, 53, 69, 0.8)'    // 5+: Đỏ
        ];

        const index = Math.min(density - 1, colors.length - 1);
        return colors[index];
    };

    // ĐÃ SỬA: Icon động theo số lượng density
    const getDensityIcon = (density) => {
        if (density === 1) {
            return (
                <div className="d-flex align-items-center justify-content-center">
                    <i className="fas fa-user" style={{ fontSize: '1rem' }}></i>
                </div>
            );
        } else if (density === 2) {
            return (
                <div className="d-flex align-items-center justify-content-center gap-1">
                    <i className="fas fa-user" style={{ fontSize: '0.9rem' }}></i>
                    <i className="fas fa-user" style={{ fontSize: '0.9rem' }}></i>
                </div>
            );
        } else {
            // Từ 3 trở lên sẽ hiện icon nhóm + con số (3, 4, 5, 6...)
            return (
                <div className="d-flex align-items-center justify-content-center gap-1">
                    <i className="fas fa-users" style={{ fontSize: '1rem' }}></i>
                    <span className="badge bg-dark rounded-circle text-white shadow-sm" style={{
                        fontSize: '0.65rem',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {density}
                    </span>
                </div>
            );
        }
    };

    const handleSegmentClick = (e, segment) => {
        if (segment.bookings.length === 1) {
            handleBookingClick(segment.bookings[0].id);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setPopupPosition({
                x: rect.left + rect.width / 2,
                y: rect.top
            });
            setPopupBookings(segment.bookings);
            setShowBookingListPopup(true);
        }
    };

    const getBookingStatusText = (status) => {
        const statusMap = {
            0: 'Chờ xác nhận',
            1: 'Đã xác nhận',
            2: 'Đang thực hiện',
            3: 'Hoàn thành',
            4: 'Đã hủy'
        };
        return statusMap[status] || 'Không xác định';
    };

    const getBookingStatusColor = (status) => {
        const colorMap = {
            0: 'bg-warning',
            1: 'bg-info',
            2: 'bg-primary',
            3: 'bg-success',
            4: 'bg-secondary'
        };
        return colorMap[status] || 'bg-secondary';
    };

    const handleMouseMove = (e, segment) => {
        setHoveredSegment(segment);
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredSegment(null);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const hours = Array.from({ length: 10 }, (_, i) => i + 9);

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

            {/* Week Navigation with DatePicker */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-primary" onClick={handlePreviousWeek}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <button className="btn btn-primary" onClick={handleToday}>
                                    <i className="fas fa-calendar-day me-2"></i>Hôm nay
                                </button>
                                <button className="btn btn-outline-primary" onClick={handleNextWeek}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center justify-content-end gap-3">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="mb-0 fw-bold">
                                        <i className="fas fa-calendar-alt me-2"></i>
                                        Chọn ngày:
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        style={{ maxWidth: '200px' }}
                                    />
                                </div>
                                <div className="text-end">
                                    <h5 className="mb-0">
                                        {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ĐÃ SỬA: Legend cập nhật lên 5 mức độ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="d-flex align-items-center gap-4 flex-wrap">
                        <span className="fw-bold me-2">Mật độ lịch hẹn:</span>
                        
                        {[1, 2, 3, 4, 5].map(num => (
                            <div key={num} className="d-flex align-items-center gap-2">
                                <div style={{
                                    width: '55px',
                                    height: '32px',
                                    backgroundColor: getDensityColor(num),
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: num >= 4 ? 'white' : '#333'
                                }}>
                                    {num === 1 && <i className="fas fa-user" style={{ fontSize: '0.9rem' }}></i>}
                                    {num === 2 && (
                                        <div className="d-flex gap-1">
                                            <i className="fas fa-user" style={{ fontSize: '0.8rem' }}></i>
                                            <i className="fas fa-user" style={{ fontSize: '0.8rem' }}></i>
                                        </div>
                                    )}
                                    {num >= 3 && (
                                        <div className="d-flex align-items-center gap-1">
                                            <i className="fas fa-users" style={{ fontSize: '0.9rem' }}></i>
                                            <span className="badge bg-dark rounded-circle text-white" style={{ fontSize: '0.6rem', padding: '0.25em 0.4em' }}>
                                                {num === 5 ? '5+' : num}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <span>{num === 5 ? '5+ lịch' : `${num} lịch`}</span>
                            </div>
                        ))}
                        
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="card mb-4">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '80vh' }}>
                            <div style={{ minWidth: '1100px', display: 'flex', backgroundColor: '#f8f9fa' }}>
                                <div style={{ width: '80px', flexShrink: 0, backgroundColor: 'white', borderRight: '1px solid #dee2e6' }}>
                                    <div style={{
                                        height: '60px',
                                        borderBottom: '2px solid #dee2e6',
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: 'white',
                                        zIndex: 110
                                    }}></div>

                                    {hours.map(hour => (
                                        <div
                                            key={hour}
                                            style={{
                                                height: '60px',
                                                borderBottom: '1px solid #f0f0f0',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'center',
                                                paddingTop: '5px',
                                                fontSize: '0.75rem',
                                                color: '#6c757d'
                                            }}
                                        >
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                    ))}
                                </div>

                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {weekDates.map((date, index) => {
                                        const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());
                                        return (
                                            <div
                                                key={`header-${index}`}
                                                style={{
                                                    height: '60px',
                                                    borderBottom: '2px solid #dee2e6',
                                                    borderRight: index < 6 ? '1px solid #dee2e6' : 'none',
                                                    backgroundColor: isToday ? '#0d6efd' : 'white',
                                                    color: isToday ? 'white' : '#212529',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 100
                                                }}
                                            >
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                                    {date.getDate()}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {weekDates.map((date, dayIndex) => {
                                        const dayBookings = getBookingsForDate(date);
                                        const segments = createTimeSegments(dayBookings);
                                        const isToday = formatDateForAPI(date) === formatDateForAPI(new Date());

                                        return (
                                            <div
                                                key={`day-${dayIndex}`}
                                                style={{
                                                    position: 'relative',
                                                    borderRight: dayIndex < 6 ? '1px solid #dee2e6' : 'none',
                                                    backgroundColor: isToday ? 'rgba(13, 110, 253, 0.05)' : 'white'
                                                }}
                                            >
                                                {hours.map(hour => (
                                                    <div key={hour} style={{ height: '60px', borderBottom: '1px solid #f0f0f0' }}></div>
                                                ))}

                                                {segments.map((segment, segmentIndex) => {
                                                    const { top, height } = calculateSegmentPosition(segment.start, segment.end);

                                                    return (
                                                        <div
                                                            key={segmentIndex}
                                                            style={{
                                                                position: 'absolute',
                                                                top: `${top}px`,
                                                                left: '0',
                                                                right: '0',
                                                                height: `${height}px`,
                                                                backgroundColor: getDensityColor(segment.density),
                                                                border: '1px solid rgba(0,0,0,0.1)',
                                                                borderRadius: '4px',
                                                                margin: '1px',
                                                                cursor: 'pointer',
                                                                zIndex: 50,
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                // ĐÃ SỬA: Màu chữ trắng khi mật độ >= 4 (Cam và Đỏ)
                                                                color: segment.density >= 4 ? 'white' : '#333'
                                                            }}
                                                            onClick={(e) => handleSegmentClick(e, segment)}
                                                            onMouseMove={(e) => handleMouseMove(e, segment)}
                                                            onMouseLeave={handleMouseLeave}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.03)';
                                                                e.currentTarget.style.zIndex = '100';
                                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                                e.currentTarget.style.zIndex = '50';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                            }}
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
                <div
                    className="position-fixed bg-dark text-white p-2 rounded shadow"
                    style={{
                        left: `${mousePosition.x + 15}px`,
                        top: `${mousePosition.y + 15}px`,
                        zIndex: 9999,
                        fontSize: '0.85rem',
                        pointerEvents: 'none',
                        maxWidth: '300px'
                    }}
                >
                    <div className="fw-bold mb-1">
                        {hoveredSegment.start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {hoveredSegment.end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="small mb-1">
                        <i className="fas fa-users me-1"></i>
                        Số lượng: {hoveredSegment.density} lịch hẹn
                    </div>
                    <div className="mt-1 small" style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '5px' }}>
                        {hoveredSegment.bookings.map((booking, idx) => (
                            <div key={idx} className="d-flex align-items-center gap-1 mb-1">
                                <i className="fas fa-calendar-check" style={{ fontSize: '0.7rem' }}></i>
                                <span>{booking.bookingCode}</span>
                                <span className="text-muted">-</span>
                                <span>{booking.userName}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Booking List Popup */}
            {showBookingListPopup && (
                <>
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100"
                        style={{ zIndex: 1040 }}
                        onClick={() => setShowBookingListPopup(false)}
                    ></div>
                    <div
                        className="position-fixed bg-white rounded shadow-lg border"
                        style={{
                            left: `${popupPosition.x}px`,
                            top: `${popupPosition.y}px`,
                            transform: 'translate(-50%, -10px)',
                            zIndex: 1050,
                            minWidth: '300px',
                            maxWidth: '400px',
                            maxHeight: '500px',
                            overflowY: 'auto'
                        }}
                    >
                        <div className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0 fw-bold">
                                    <i className="fas fa-list me-2"></i>
                                    Danh sách lịch hẹn ({popupBookings.length})
                                </h6>
                                <button
                                    className="btn-close btn-sm"
                                    onClick={() => setShowBookingListPopup(false)}
                                ></button>
                            </div>
                            <div className="list-group">
                                {popupBookings.map((booking) => (
                                    <button
                                        key={booking.id}
                                        className="list-group-item list-group-item-action"
                                        onClick={() => handleBookingClick(booking.id)}
                                    >
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="fw-bold">
                                                    <i className="fas fa-calendar-check me-2 text-primary"></i>
                                                    {booking.bookingCode}
                                                </div>
                                                <div className="small text-muted">
                                                    <i className="fas fa-user me-1"></i>
                                                    {booking.userName}
                                                </div>
                                                <div className="small text-muted">
                                                    <i className="fas fa-clock me-1"></i>
                                                    {new Date(booking.scheduledAt).toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })} - {new Date(booking.expectedEndTime).toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                            <span className={`badge ${getBookingStatusColor(booking.bookingStatus)} ms-2`}>
                                                {getBookingStatusText(booking.bookingStatus)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedBooking && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="fas fa-calendar-check me-2"></i>
                                    Chi tiết đặt lịch - {selectedBooking.bookingCode}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <th style={{ width: '40%' }}>Mã đặt lịch:</th>
                                                    <td><strong className="text-primary">{selectedBooking.bookingCode}</strong></td>
                                                </tr>
                                                <tr>
                                                    <th>Khách hàng:</th>
                                                    <td><i className="fas fa-user me-2"></i>{selectedBooking.userName}</td>
                                                </tr>
                                                <tr>
                                                    <th>Thú cưng:</th>
                                                    <td><i className="fas fa-paw me-2"></i>{selectedBooking.petName}</td>
                                                </tr>
                                                <tr>
                                                    <th>Trạng thái:</th>
                                                    <td>
                                                        <span className={`badge ${getBookingStatusColor(selectedBooking.bookingStatus)}`}>
                                                            {getBookingStatusText(selectedBooking.bookingStatus)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <table className="table table-borderless">
                                            <tbody>
                                                <tr>
                                                    <th style={{ width: '40%' }}>Thời gian:</th>
                                                    <td>
                                                        <i className="fas fa-clock me-2"></i>
                                                        {new Date(selectedBooking.scheduledAt).toLocaleString('vi-VN')}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>Kết thúc dự kiến:</th>
                                                    <td>
                                                        {new Date(selectedBooking.expectedEndTime).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>Tổng tiền:</th>
                                                    <td>
                                                        <strong className="text-success fs-5">
                                                            {formatCurrency(selectedBooking.totalPrice)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>Ngày tạo:</th>
                                                    <td>{new Date(selectedBooking.createAt).toLocaleDateString('vi-VN')}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <h6 className="fw-bold">
                                        <i className="fas fa-concierge-bell me-2"></i>
                                        Dịch vụ đã chọn:
                                    </h6>
                                    <table className="table table-sm table-bordered">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Tên dịch vụ</th>
                                                <th className="text-end">Giá</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedBooking.services?.map((service, index) => (
                                                <tr key={index}>
                                                    <td>{service.name}</td>
                                                    <td className="text-end">{formatCurrency(service.price)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {selectedBooking.notes && (
                                    <div className="mt-3">
                                        <h6 className="fw-bold">
                                            <i className="fas fa-sticky-note me-2"></i>
                                            Ghi chú:
                                        </h6>
                                        <div className="alert alert-info mb-0">
                                            <i className="fas fa-info-circle me-2"></i>
                                            {selectedBooking.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
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

export default BookingManagement;