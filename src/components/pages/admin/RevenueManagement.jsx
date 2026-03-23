import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext';

const API = 'http://localhost:8080';

function formatVnd(amount) {
    if (amount == null) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
}

function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleString('vi-VN');
}

function paymentMethodLabel(method) {
    const map = {
        MOMO_PREPAID: 'MoMo',
        VNPAY_PREPAID: 'VNPay',
        PAY_LATER: 'Tiền mặt',
    };
    return map[method] || method;
}

function paymentMethodBadge(method) {
    const map = {
        MOMO_PREPAID: 'bg-danger',
        VNPAY_PREPAID: 'bg-primary',
        PAY_LATER: 'bg-success',
    };
    return map[method] || 'bg-secondary';
}

// Lấy ngày đầu tháng hiện tại và hôm nay
function defaultDateRange() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const toISO = d => d.toISOString().slice(0, 10);
    return { from: toISO(firstDay), to: toISO(now) };
}

const RevenueManagement = () => {
    const { token } = useAuth();
    const [dateRange, setDateRange] = useState(defaultDateRange());
    const [groupBy, setGroupBy] = useState('day'); // 'day' | 'month'

    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { from, to } = dateRange;
            const [summaryRes, chartRes, txRes] = await Promise.all([
                fetch(`${API}/api/admin/revenue/summary?from=${from}&to=${to}`, { headers }),
                fetch(`${API}/api/admin/revenue/by-${groupBy}?from=${from}&to=${to}`, { headers }),
                fetch(`${API}/api/admin/revenue/transactions?from=${from}&to=${to}`, { headers }),
            ]);

            const [summaryJson, chartJson, txJson] = await Promise.all([
                summaryRes.json(), chartRes.json(), txRes.json(),
            ]);

            if (summaryJson.success) setSummary(summaryJson.data);
            if (chartJson.success) setChartData(chartJson.data);
            if (txJson.success) setTransactions(txJson.data);
        } catch (e) {
            setError('Không thể tải dữ liệu. Kiểm tra kết nối server.');
        } finally {
            setLoading(false);
        }
    }, [dateRange, groupBy, token]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Chart bar: tìm max để tính %
    const maxRevenue = chartData.length ? Math.max(...chartData.map(d => d.revenue), 1) : 1;

    return (
        <div>
            <h2 className="mb-4">Quản lý Doanh thu</h2>

            {/* Bộ lọc */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Từ ngày</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateRange.from}
                                onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Đến ngày</label>
                            <input
                                type="date"
                                className="form-control"
                                value={dateRange.to}
                                onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label fw-semibold">Nhóm theo</label>
                            <select
                                className="form-select"
                                value={groupBy}
                                onChange={e => setGroupBy(e.target.value)}
                            >
                                <option value="day">Ngày</option>
                                <option value="month">Tháng</option>
                            </select>
                        </div>
                        <div className="col-md-3">
                            <button
                                className="btn btn-primary w-100"
                                onClick={fetchAll}
                                disabled={loading}
                            >
                                {loading
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Đang tải...</>
                                    : <><i className="fas fa-search me-2"></i>Xem báo cáo</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Thẻ tổng quan */}
            {summary && (
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-1">Doanh thu kỳ này</h6>
                                        <h3 className="mb-0 text-success fw-bold">{formatVnd(summary.totalRevenue)}</h3>
                                    </div>
                                    <div className="bg-success bg-opacity-10 p-3 rounded">
                                        <i className="fas fa-dollar-sign text-success fs-3"></i>
                                    </div>
                                </div>
                                <small className={summary.growthPercent >= 0 ? 'text-success' : 'text-danger'}>
                                    <i className={`fas fa-arrow-${summary.growthPercent >= 0 ? 'up' : 'down'} me-1`}></i>
                                    {Math.abs(summary.growthPercent)}% so với kỳ trước
                                </small>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h6 className="text-muted mb-0">Theo phương thức</h6>
                                    <div className="bg-primary bg-opacity-10 p-2 rounded">
                                        <i className="fas fa-credit-card text-primary"></i>
                                    </div>
                                </div>
                                {summary.byPaymentMethod && Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                                    <div key={method} className="d-flex justify-content-between align-items-center mb-1">
                                        <span className={`badge ${paymentMethodBadge(method)} me-2`}>{paymentMethodLabel(method)}</span>
                                        <span className="fw-semibold">{formatVnd(amount)}</span>
                                    </div>
                                ))}
                                {(!summary.byPaymentMethod || Object.keys(summary.byPaymentMethod).length === 0) && (
                                    <p className="text-muted mb-0">Chưa có dữ liệu</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-muted mb-1">Kỳ trước</h6>
                                        <h4 className="mb-0 text-secondary">{formatVnd(summary.prevPeriodRevenue)}</h4>
                                    </div>
                                    <div className="bg-secondary bg-opacity-10 p-3 rounded">
                                        <i className="fas fa-history text-secondary fs-3"></i>
                                    </div>
                                </div>
                                <small className="text-muted">Cùng độ dài thời gian, trước kỳ hiện tại</small>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Biểu đồ cột (CSS thuần) */}
            {chartData.length > 0 && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white fw-semibold">
                        Biểu đồ doanh thu theo {groupBy === 'day' ? 'ngày' : 'tháng'}
                    </div>
                    <div className="card-body">
                        <div
                            style={{ overflowX: 'auto' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', minHeight: '200px', padding: '0 8px 0 8px' }}>
                                {chartData.map((d, i) => {
                                    const heightPct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
                                    const label = groupBy === 'day' ? d.date?.slice(5) : d.month;
                                    return (
                                        <div
                                            key={i}
                                            style={{ flex: '0 0 auto', minWidth: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                            title={`${label}: ${formatVnd(d.revenue)}`}
                                        >
                                            <div
                                                style={{
                                                    width: '28px',
                                                    height: `${Math.max(heightPct * 1.8, 4)}px`,
                                                    background: 'linear-gradient(180deg,#0d6efd,#6ea8fe)',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height .3s',
                                                }}
                                            ></div>
                                            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap' }}>
                                                {label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bảng giao dịch */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Danh sách giao dịch hoàn thành</span>
                    <span className="badge bg-secondary">{transactions.length} giao dịch</span>
                </div>
                <div className="card-body p-0">
                    {transactions.length === 0 ? (
                        <div className="text-center text-muted py-4">Không có giao dịch nào trong kỳ này.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Mã booking</th>
                                        <th>Phương thức</th>
                                        <th className="text-end">Tổng tiền</th>
                                        <th className="text-end">Giảm voucher</th>
                                        <th className="text-end">Thực thu</th>
                                        <th>Thời gian</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx, idx) => (
                                        <tr key={tx.id}>
                                            <td className="text-muted">{idx + 1}</td>
                                            <td><strong>{tx.bookingCode || `#${tx.bookingId}`}</strong></td>
                                            <td>
                                                <span className={`badge ${paymentMethodBadge(tx.paymentMethod)}`}>
                                                    {paymentMethodLabel(tx.paymentMethod)}
                                                </span>
                                            </td>
                                            <td className="text-end">{formatVnd(tx.amount)}</td>
                                            <td className="text-end text-danger">
                                                {tx.voucherDiscount > 0 ? `-${formatVnd(tx.voucherDiscount)}` : '-'}
                                            </td>
                                            <td className="text-end fw-bold text-success">{formatVnd(tx.netRevenue)}</td>
                                            <td className="text-muted">{formatDate(tx.completedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan={5} className="text-end fw-bold">Tổng thực thu:</td>
                                        <td className="text-end fw-bold text-success">
                                            {formatVnd(transactions.reduce((s, tx) => s + (tx.netRevenue || 0), 0))}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RevenueManagement;
