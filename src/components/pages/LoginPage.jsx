import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { GoogleLogin } from "@react-oauth/google";

// Import thư viện jwt-decode
import { jwtDecode } from "jwt-decode"; 

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- HÀM XỬ LÝ CHUNG ---
  const handleLoginSuccess = async (response) => {
    if (response.ok) {
      try {
        const result = await response.json();
        const data = result?.data ?? result;

        if (data && data.token) {
          try {
            const decoded = jwtDecode(data.token);
            console.log("Dữ liệu Token sau khi giải mã:", decoded);

            let tokenRole = decoded?.role || decoded?.roles || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

            if (Array.isArray(tokenRole)) {
              tokenRole = tokenRole[0];
            }

            login({
              userId: decoded?.sub || data.userId || data.id, 
              username: decoded?.preferred_username || data.userName || data.username,
              email: decoded?.email || data.email,
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
          alert(result?.message || "Đăng nhập thất bại: Không nhận được token");
        }
      } catch (error) {
        console.error("Parse response error:", error);
        alert("Lỗi hệ thống");
      }
    } else {
      try {
        const errorResult = await response.json();
        alert("Đăng nhập thất bại: " + (errorResult.message || "Lỗi không xác định"));
      } catch {
        alert("Đăng nhập thất bại");
      }
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/Authenticate/login-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      await handleLoginSuccess(res);
    } catch (error) {
      console.error("Lỗi Google Login:", error);
      alert("Không thể kết nối tới Server");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        username: form.username,
        password: form.password,
      };

      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      await handleLoginSuccess(res);
    } catch (error) {
      console.error("Lỗi kết nối Server:", error);
      alert("Không thể kết nối tới Server");
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <div className="card shadow border-0 p-4 bg-white">
        <h2 className="mb-4 text-center text-primary fw-bold">PetSpa Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="form-label fw-bold">Tên đăng nhập</label>
            <input
              className="form-control"
              name="username"
              placeholder="Nhập username"
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="username"
              value={form.username}
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-bold">Mật khẩu</label>
            <input
              type="password"
              className="form-control"
              name="password"
              placeholder="Nhập mật khẩu"
              onChange={handleChange}
              disabled={loading}
              required
              autoComplete="current-password"
              value={form.password}
            />
          </div>

          <button className="btn btn-primary w-100 mb-3 py-2 fw-bold" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang xử lý...
              </>
            ) : (
              "ĐĂNG NHẬP"
            )}
          </button>
        </form>

        <div className="position-relative my-4">
          <hr />
          <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">
            hoặc đăng nhập bằng
          </span>
        </div>

        <div className="d-flex justify-content-center mb-3">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => console.log("Google Login Failed")}
            useOneTap
            theme="outline"
            width="300"
          />
        </div>

        <div className="text-center">
          <span className="text-muted">Chưa có tài khoản? </span>
          <Link to="/register" className="text-decoration-none fw-bold">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;