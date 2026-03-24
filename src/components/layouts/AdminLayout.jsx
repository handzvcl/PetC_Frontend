import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../../assets/admin/css/styles.css';

const AdminLayout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = (event) => {
        event.preventDefault();
        document.body.classList.toggle('sb-sidenav-toggled');
        const isToggled = document.body.classList.contains('sb-sidenav-toggled');
        localStorage.setItem('sb|sidebar-toggle', isToggled);
        setSidebarOpen(!isToggled);
    };

    useEffect(() => {
        document.body.classList.add('sb-nav-fixed');
        return () => {
            document.body.classList.remove('sb-nav-fixed');
        };
    }, []);

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate('/login');
    };

    return (
        <div>
            <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
                <a className="navbar-brand ps-3" href="/admin">PetSpa</a>

                <button
                    className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
                    id="sidebarToggle"
                    onClick={toggleSidebar}
                >
                    <i className="fas fa-bars"></i>
                </button>

                <form className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0">
                    <div className="input-group">
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Search for..."
                            aria-label="Search for..."
                            aria-describedby="btnNavbarSearch"
                        />
                        <button className="btn btn-primary" id="btnNavbarSearch" type="button">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </form>

                <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
                    <li className="nav-item dropdown">
                        <a
                            className="nav-link dropdown-toggle"
                            id="navbarDropdown"
                            href="#"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <i className="fas fa-user fa-fw"></i>
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                            <li><a className="dropdown-item" href="#!">Settings</a></li>
                            <li><a className="dropdown-item" href="#!">Activity Log</a></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <a className="dropdown-item" href="#!" onClick={handleLogout}>
                                    Logout
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>

            <div id="layoutSidenav">
                <div id="layoutSidenav_nav">
                    <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
                        <div className="sb-sidenav-menu">
                            <div className="nav">
                                <div className="sb-sidenav-menu-heading">Addons</div>

                                <NavLink
                                    to="/admin"
                                    end
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-tachometer-alt"></i></div>
                                    Dashboard
                                </NavLink>

                                <div className="sb-sidenav-menu-heading">Quản lý</div>

                                <NavLink
                                    to="/admin/bookings"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-calendar-check"></i></div>
                                    Quản lý Booking
                                </NavLink>
                                <NavLink
                                    to="/admin/users"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-users-cog"></i></div>
                                    Quản lý quyền tài khoản
                                </NavLink>
                                <NavLink
                                    to="/admin/articles"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-newspaper"></i></div>
                                    Quản lý Cẩm nang
                                </NavLink>
                                <NavLink
                                    to="/admin/services"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-cut"></i></div>
                                    Quản lý Dịch vụ
                                </NavLink>

                                <NavLink
                                    to="/admin/staff"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-users"></i></div>
                                    Quản lý Nhân Viên
                                </NavLink>

                                <NavLink
                                    to="/admin/pet-types"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-paw"></i></div>
                                    Quản lý Loại thú cưng
                                </NavLink>

                                <NavLink
                                    to="/admin/my-pets"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-dog"></i></div>
                                    Quản lý thú cưng
                                </NavLink>

                                <NavLink
                                    to="/admin/pet-care-history"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-notes-medical"></i></div>
                                    Quản lý lịch sử chăm sóc
                                </NavLink>

                                <div className="sb-sidenav-menu-heading">Báo cáo</div>

                                <NavLink
                                    to="/admin/reports"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-chart-line"></i></div>
                                    Thống Kê Dịch Vụ
                                </NavLink>

                                <NavLink
                                    to="/admin/revenue"
                                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <div className="sb-nav-link-icon"><i className="fas fa-money-bill-wave"></i></div>
                                    Doanh thu
                                </NavLink>
                            </div>
                        </div>

                        <div className="sb-sidenav-footer">
                            <div className="small">Logged in as:</div>
                            Admin
                        </div>
                    </nav>
                </div>

                <div id="layoutSidenav_content">
                    <main>
                        <div className="container-fluid px-4">
                            <Outlet />
                        </div>
                    </main>

                    <footer className="py-4 bg-light mt-auto">
                        <div className="container-fluid px-4">
                            <div className="d-flex align-items-center justify-content-between small">
                                <div className="text-muted">Copyright &copy; PetSpa 2026</div>
                                <div>
                                    <a href="#!">Privacy Policy</a>
                                    &middot;
                                    <a href="#!">Terms &amp; Conditions</a>
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;