import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; 
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from "../AuthContext";
import { jwtDecode } from "jwt-decode"; 

function RegisterPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth(); 

    const from = location.state?.from?.pathname || "/";

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        phone: "",  
        confirmPassword: "",
    });

    // Thêm biến loading bị thiếu
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // --- HÀM XỬ LÝ KHI BACKEND TRẢ VỀ TOKEN (Copy chuẩn từ LoginPage) ---
    const handleLoginSuccess = async (response) => {
        if (response.ok) {
            try {
                const result = await response.json();
                const data = result?.data ?? result;

                if (data && data.token) {
                    try {
                        const decoded = jwtDecode(data.token);
                        let tokenRole = decoded?.role || decoded?.roles || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                        if (Array.isArray(tokenRole)) tokenRole = tokenRole[0];

                        login({
                            userId: data.userId || data.id || decoded?.userId || decoded?.id || null,
                            username: decoded?.preferred_username || data.userName || data.username,
                            email: decoded?.email || data.email,
                            phone: data.phone || decoded?.phone_number || decoded?.phone || "",
                            role: tokenRole,
                            token: data.token,
                        });

                        if (tokenRole === "Admin" || tokenRole === "ADMIN") {
                            navigate("/admin");
                        } else {
                            navigate(from, { replace: true });
                        }
                    } catch (decodeError) {
                        console.error("Lỗi giải mã token:", decodeError);
                        alert("Token không hợp lệ!");
                    }
                } else {
                    alert(result?.message || result?.error || "Đăng nhập thất bại: Không nhận được token");
                }
            } catch (error) {
                alert("Lỗi hệ thống");
            }
        } else {
            try {
                const errorResult = await response.json();
                alert("Thất bại: " + (errorResult.message || errorResult.error || `HTTP ${response.status}`));
            } catch {
                alert("Thất bại");
            }
        }
        setLoading(false);
    };

    // --- XỬ LÝ ĐĂNG KÝ TÀI KHOẢN THƯỜNG ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (form.password !== form.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    username: form.username,
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                    email: form.email,
                    phone: form.phone
                }),
            });

            if (res.ok) {
                alert("Đăng ký thành công! Vui lòng đăng nhập.");
                navigate("/login"); 
            } else {
                const errorText = await res.text();
                alert("Đăng ký thất bại: " + errorText);
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Không thể kết nối Server");
        } finally {
            setLoading(false);
        }
    };

    // --- XỬ LÝ GOOGLE (Sửa lại chuẩn payload body) ---
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", 
                // ĐÃ FIX: Gửi Object có chứa key "token"
                body: JSON.stringify({ token: credentialResponse.credential }), 
            });

            await handleLoginSuccess(res);
        } catch (error) {
            console.error("Lỗi Google Auth:", error);
            alert("Không thể kết nối tới Server");
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: 400 }}>
            <div className="card p-4 shadow border-0">
                <h2 className="text-center mb-4 text-primary fw-bold">Đăng Ký PetSpa</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            className="form-control"
                            name="username"
                            placeholder="Tên đăng nhập"
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            placeholder="Email"
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="tel"
                            className="form-control"
                            name="phone"
                            placeholder="Số điện thoại"
                            onChange={handleChange}
                            pattern="[0-9]{10}"
                            maxLength="10"
                            title="Số điện thoại phải gồm đúng 10 chữ số"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            placeholder="Mật khẩu"
                            autoComplete="new-password"
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <input
                            type="password"
                            className="form-control"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            autoComplete="new-password"
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <button className="btn btn-primary w-100 py-2 fw-bold" disabled={loading}>
                        {loading ? "Đang xử lý..." : "ĐĂNG KÝ"}
                    </button>
                </form>

                {/* Phần Google & Chuyển trang */}
                <div className="position-relative my-4">
                    <hr />
                    <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
                        hoặc đăng ký bằng
                    </span>
                </div>

                <div className="d-flex justify-content-center mb-3">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => console.log('Google Failed')}
                        useOneTap
                        theme="outline"
                        width="300"
                    />
                </div>

                <div className="text-center">
                    <span className="text-muted">Đã có tài khoản? </span>
                    <Link to="/login" className="text-decoration-none fw-bold">Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;