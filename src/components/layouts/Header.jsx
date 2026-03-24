import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./Layout.css";

function Header() {
    const { isAuth, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-md navbar-dark bg-dark fixed-top pet-main-navbar">
            <div className="container navbar-container">
                <NavLink className="navbar-brand" to="/">
                    Pawfect<span className="brand-dot">.</span>
                </NavLink>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#mainNavbar"
                    aria-controls="mainNavbar"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="mainNavbar">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <NavLink to="/" className="nav-link">
                                Trang chủ
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/articles" className="nav-link">
                                Cẩm nang
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/booking" className="nav-link">
                                Đặt ngay
                            </NavLink>
                        </li>
                        {isAuth && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/bookings" className="nav-link">
                                        Danh sách lịch hẹn
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/booking/details/latest" className="nav-link">
                                        Chi tiết lịch hẹn
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/vouchers" className="nav-link">
                                        Voucher
                                    </NavLink>
                                </li>
                            </>
                        )}
                    </ul>

                    <a className="pet-phone-link" href="tel:+16588472587">
                        <i className="fas fa-phone"></i>
                        +095.555.5432
                    </a>

                    <ul className="navbar-nav ms-auto">
                        {!isAuth ? (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/login" className="nav-link">
                                        Đăng nhập
                                    </NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/register" className="nav-link">
                                        Đăng ký
                                    </NavLink>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item dropdown pet-auth-dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <img
                                        src="https://ui-avatars.com/api/?name=User"
                                        className="rounded-circle pet-avatar"
                                        width="20"
                                        height="20"
                                        alt="User avatar"
                                    />
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <NavLink to="/bookings" className="dropdown-item">
                                            Danh sách lịch hẹn
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/booking/details/latest" className="dropdown-item">
                                            Chi tiết lịch hẹn
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/vouchers" className="dropdown-item">
                                            Voucher của tôi
                                        </NavLink>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                     <li>
                                        <NavLink to="/profile" className="dropdown-item">
                                            Tài khoản
                                        </NavLink>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            onClick={handleLogout}
                                        >
                                            Đăng xuất
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Header;
