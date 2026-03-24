import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { GoogleLogin } from "@react-oauth/google";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginSuccess = async (response) => {
    if (response.ok) {
      try {
        const result = await response.json();
        const data = result?.data ?? result;

        if (data && data.token) {
          try {
            const decoded = jwtDecode(data.token);
            let tokenRole =
              decoded?.role ||
              decoded?.roles ||
              decoded?.[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
              ];
            if (Array.isArray(tokenRole)) tokenRole = tokenRole[0];

            login({
              userId:
                data.userId ||
                data.id ||
                decoded?.userId ||
                decoded?.id ||
                null,
              username:
                decoded?.preferred_username || data.userName || data.username,
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
      } catch {
        alert("Lỗi hệ thống");
      }
    } else {
      try {
        const errorResult = await response.json();
        alert(
          "Đăng nhập thất bại: " +
            (errorResult.message || "Lỗi không xác định"),
        );
      } catch {
        alert("Đăng nhập thất bại");
      }
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      await handleLoginSuccess(res);
    } catch {
      alert("Không thể kết nối tới Server");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });
      await handleLoginSuccess(res);
    } catch {
      alert("Không thể kết nối tới Server");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex m-0 p-0"
      style={{ backgroundColor: "#d3fffc" }}
    >
      {/* Left Side: Hero Image */}
      <div
        className="d-none d-md-flex col-md-6 position-relative overflow-hidden align-items-center justify-content-center"
        style={{ backgroundColor: "#005a50" }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSH5PxjuZkRAsFStN3ScjEW6DJskDfPo1vbUKNt-_pLTw0NiQhveNHfmqvqDGQDC7K1Ljv3xC99f6wJp3mquWb3WOugj22KKawaOTLie9huzt85ncZS39C1Dv8BSx1MAbxz94fBa9cYyyDmqELEkYFNEwLG7mo9vWAD1Jfabuj9HCUfEu2k2KdvtWdAeU-x5YzcWeozEpV0LcjNfuxwUgPtP25xFkCcZZAcQ4oVgk8jhgr1qxttsoFDvATYzNxCmWHH6BPfkwtNR0"
            alt="Happy dog at spa"
            className="w-100 h-100 object-fit-cover"
          />
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background:
                "linear-gradient(to top right, rgba(0, 90, 80, 0.9), rgba(0, 90, 80, 0.4), transparent)",
            }}
          ></div>
        </div>
        <div
          className="position-relative z-1 px-5 text-white"
          style={{ maxWidth: "36rem" }}
        >
          <h1 className="display-4 fw-bold mb-4" style={{ lineHeight: "1.2" }}>
            Trải nghiệm nghỉ dưỡng cho thú cưng của bạn.
          </h1>
          <p className="fs-5 opacity-75">
            Nơi tình yêu thương gặp gỡ sự chuyên nghiệp trong từng liệu trình
            chăm sóc.
          </p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="col-12 col-md-6 d-flex align-items-center justify-content-center p-4 p-md-5">
        <div
          className="w-100 bg-white p-4 p-md-5 rounded-4 shadow"
          style={{ maxWidth: "420px" }}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#bafdf9",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                fill="#00675c"
                viewBox="0 0 24 24"
              >
                <path d="M4.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm13.5 0c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z" />
              </svg>
            </div>
            <h3 className="fs-3 fw-bold mb-2" style={{ color: "#003534" }}>
              Chào mừng quay lại
            </h3>
            <p className="text-muted small">Đăng nhập để tiếp tục</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                className="form-label text-uppercase fw-bold small"
                style={{
                  color: "#296462",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                Tên đăng nhập
              </label>
              <input
                type="text"
                name="username"
                className="form-control py-3 rounded-4 border-0"
                style={{ backgroundColor: "#96ece8" }}
                placeholder="Tên tài khoản"
                value={form.username}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label text-uppercase fw-bold small"
                style={{
                  color: "#296462",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                Mật khẩu
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control py-3 pe-5 rounded-4 border-0"
                  style={{ backgroundColor: "#96ece8" }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none p-0 pe-3"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ color: "#46807e" }}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3 small">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input rounded"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ borderColor: "#7db7b5" }}
                />
                <label
                  className="form-check-label"
                  htmlFor="rememberMe"
                  style={{ color: "#296462" }}
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-decoration-none fw-medium"
                style={{ color: "#296462" }}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              className="btn w-100 py-3 rounded-pill fw-bold text-white shadow"
              style={{
                background: "linear-gradient(to right, #00675c, #005a50)",
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang xử lý...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="position-relative my-4">
            <hr style={{ borderColor: "#7db7b5" }} />
            <span
              className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-uppercase fw-bold small"
              style={{
                color: "#46807e",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
              }}
            >
              Hoặc đăng nhập bằng
            </span>
          </div>

          {/* Social Login */}
          <div className="mb-4 d-flex justify-content-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log("Google Login Failed")}
              text="signin_with"
              locale="vi"
              width="380"
              size="large"
            />
          </div>

          {/* Footer */}
          <div className="text-center small" style={{ color: "#296462" }}>
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="fw-bold text-decoration-none"
              style={{ color: "#00675c" }}
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
