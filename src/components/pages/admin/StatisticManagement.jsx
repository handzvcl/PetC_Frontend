import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api/statistics';

export default function StatisticManagement() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/most-booked-services?limit=10`);
            if (!response.ok) {
                throw new Error('Không thể lấy dữ liệu thống kê');
            }
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (format) => {
        const url = `${API_BASE_URL}/most-booked-services/export?limit=50&format=${format}`;
        window.open(url, '_blank');
    };

    return (
        <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Thống Kê Dịch Vụ Nổi Bật</h2>
                <div>
                    <button 
                        className="btn btn-success me-2"
                        onClick={() => handleExport('csv')}
                    >
                        <i className="fa-solid fa-file-csv me-2"></i> Xuất CSV
                    </button>
                    <button 
                        className="btn btn-danger" 
                        onClick={() => handleExport('pdf')}
                    >
                        <i className="fa-solid fa-file-pdf me-2"></i> Xuất PDF
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Mã Dịch Vụ</th>
                                        <th>Tên Dịch Vụ</th>
                                        <th className="text-end">Số Lượng Đặt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.length > 0 ? (
                                        stats.map((stat, index) => (
                                            <tr key={stat.serviceId}>
                                                <td>{index + 1}</td>
                                                <td>#{stat.serviceId}</td>
                                                <td className="fw-medium">{stat.serviceName}</td>
                                                <td className="text-end fw-bold text-primary">
                                                    {stat.bookingCount}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4">
                                                Không có dữ liệu thống kê.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
