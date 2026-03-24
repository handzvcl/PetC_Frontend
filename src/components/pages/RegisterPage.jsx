import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = "Email không đúng định dạng";
    }

    if (form.phone && !form.phone.match(/^[0-9]{10}$/)) {
      newErrors.phone = "Số điện thoại phải đủ 10 chữ số";
    }

    if (form.password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = () => {
    const password = form.password;
    if (!password) return { strength: 0, text: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const texts = ["Yếu", "Trung bình", "Tốt", "Mạnh"];
    return { strength, text: texts[strength - 1] || "" };
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
        alert("Thất bại: " + (errorResult.message || "Lỗi không xác định"));
      } catch {
        alert("Thất bại");
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

    if (!validateForm()) {
      return;
    }

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
          phone: form.phone,
        }),
      });

      if (res.ok) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        const errorText = await res.text();
        alert("Đăng ký thất bại: " + errorText);
      }
    } catch {
      alert("Không thể kết nối Server");
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div
      className="min-vh-100 d-flex m-0 p-0"
      style={{ backgroundColor: "#d3fffc" }}
    >
      {/* Left Side: Hero Image */}
      <div className="d-none d-lg-flex col-lg-6 position-relative overflow-hidden">
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0, 103, 92, 0.2)" }}
        ></div>
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background:
              "linear-gradient(to top, rgba(0, 53, 52, 0.6), transparent)",
          }}
        ></div>
        <img
          className="position-absolute top-0 start-0 w-100 h-100 object-fit-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg2NDNfjfEdabyWR3E9uoTkrCmupO4iuUFZGLWSj7EU7SRYwv6hVcp3kVPSZhJl7jaezY8mYf7JxQZulaT0koTQZMHKgKwFwDNs9dHuM2sMJ0nGj-saqLzvG_fGOpgygf0N6c3N-mmX3mtg-ZYLIXsz_DO88kbzXdwi5ZS5jn__BqMbrI38MIOzVtWDLq8f_7JoU8dJMH07IxJwXwnuO1csqEVHFnXKvhoDgJDZBo2xV3RGDTUN9LIMN4BZg5_-xVJbtwezV5UHKE"
          alt="Happy dog after spa"
        />
        <div
          className="position-absolute bottom-0 start-0 p-5 text-white"
          style={{ zIndex: 30, maxWidth: "28rem" }}
        >
          <div className="d-flex align-items-center gap-3 mb-4">
            <span style={{ fontSize: "2.5rem" }}>🐾</span>
            <span className="fs-2 fw-black">PetSpa</span>
          </div>
          <h1 className="display-5 fw-bold mb-3">
            Nơi yêu thương được lan tỏa qua từng dịch vụ.
          </h1>
          <p className="fs-5 opacity-75">
            Cùng chúng tôi tạo nên những giây phút thư giãn nhất cho người bạn
            bốn chân của bạn.
          </p>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div
        className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-4 p-md-5"
        style={{ overflowY: "auto" }}
      >
        <div
          className="w-100 bg-white p-4 p-md-5 rounded-4 shadow"
          style={{ maxWidth: "480px", backdropFilter: "blur(20px)" }}
        >
          {/* Header */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-4">
              <span style={{ fontSize: "1.875rem", color: "#00675c" }}>🌿</span>
              <span
                className="fs-4 fw-black"
                style={{ color: "#00675c", letterSpacing: "-0.05em" }}
              >
                PetSpa
              </span>
            </div>
            <h2 className="fs-2 fw-bold mb-3" style={{ color: "#003534" }}>
              Bắt đầu hành trình cùng PetSpa
            </h2>
            <p className="text-muted">
              Đăng ký để trải nghiệm dịch vụ chăm sóc tốt nhất cho thú cưng của
              bạn
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mb-4">
            {/* Username */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold small"
                style={{ color: "#296462" }}
              >
                Tên người dùng
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute start-0 top-50 translate-middle-y ms-3"
                  style={{ color: "#296462" }}
                >
                  👤
                </span>
                <input
                  type="text"
                  name="username"
                  className="form-control ps-5 py-3 rounded-4 border-0"
                  style={{ backgroundColor: "#96ece8" }}
                  placeholder="Nguyễn Văn A"
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold small"
                style={{ color: "#296462" }}
              >
                Email
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute start-0 top-50 translate-middle-y ms-3"
                  style={{ color: "#296462" }}
                >
                  ✉️
                </span>
                <input
                  type="email"
                  name="email"
                  className={`form-control ps-5 py-3 rounded-4 border-0 ${errors.email ? "is-invalid" : ""}`}
                  style={{ backgroundColor: "#96ece8" }}
                  placeholder="example@petspa.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              {errors.email && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <span>⚠️</span> {errors.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold small"
                style={{ color: "#296462" }}
              >
                Số điện thoại
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute start-0 top-50 translate-middle-y ms-3"
                  style={{ color: "#296462" }}
                >
                  📞
                </span>
                <input
                  type="tel"
                  name="phone"
                  className={`form-control ps-5 py-3 rounded-4 border-0 ${errors.phone ? "is-invalid" : ""}`}
                  style={{ backgroundColor: "#96ece8" }}
                  placeholder="090 1234 567"
                  value={form.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  disabled={loading}
                  required
                />
              </div>
              {errors.phone && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <span>⚠️</span> {errors.phone}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold small"
                style={{ color: "#296462" }}
              >
                Mật khẩu
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute start-0 top-50 translate-middle-y ms-3"
                  style={{ color: "#296462" }}
                >
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control ps-5 pe-5 py-3 rounded-4 border-0"
                  style={{ backgroundColor: "#96ece8" }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
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
              {/* Password Strength */}
              {form.password && (
                <div className="mt-2 px-1">
                  <div className="d-flex gap-1" style={{ height: "6px" }}>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="flex-fill rounded"
                        style={{
                          backgroundColor:
                            level <= passwordStrength.strength
                              ? "#00675c"
                              : "#96ece8",
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <span
                      className="small fw-bold text-uppercase"
                      style={{ color: "#00675c", fontSize: "0.625rem" }}
                    >
                      {passwordStrength.text}
                    </span>
                    <span
                      className="small"
                      style={{ color: "#296462", fontSize: "0.625rem" }}
                    >
                      Sử dụng ít nhất 8 ký tự
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold small"
                style={{ color: "#296462" }}
              >
                Xác nhận mật khẩu
              </label>
              <div className="position-relative">
                <span
                  className="position-absolute start-0 top-50 translate-middle-y ms-3"
                  style={{ color: "#296462" }}
                >
                  🔐
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={`form-control ps-5 pe-5 py-3 rounded-4 border-0 ${errors.confirmPassword ? "is-invalid" : ""}`}
                  style={{ backgroundColor: "#96ece8" }}
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-decoration-none p-0 pe-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ color: "#46807e" }}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                  <span>⚠️</span> {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="btn w-100 py-3 rounded-pill fw-bold text-white shadow"
                style={{
                  background: "linear-gradient(to right, #00675c, #005a50)",
                }}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Tạo tài khoản"}
              </button>
            </div>

            {/* Terms */}
            <div className="d-flex align-items-start gap-2 mt-3 px-1">
              <input
                type="checkbox"
                className="form-check-input mt-1 rounded"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                style={{ borderColor: "#7db7b5" }}
              />
              <label
                className="form-check-label small"
                htmlFor="terms"
                style={{ color: "#296462", lineHeight: "1.5" }}
              >
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link
                  to="/terms"
                  className="text-decoration-none fw-semibold"
                  style={{ color: "#00675c" }}
                >
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link
                  to="/privacy"
                  className="text-decoration-none fw-semibold"
                  style={{ color: "#00675c" }}
                >
                  Chính sách bảo mật
                </Link>{" "}
                của chúng tôi.
              </label>
            </div>
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
              Hoặc đăng ký bằng
            </span>
          </div>

          {/* Social Login */}
          <div className="mb-4 d-flex justify-content-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log("Google Failed")}
              text="signup_with"
              locale="vi"
              width="380"
              size="large"
            />
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-muted small fw-medium mb-0">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="fw-bold text-decoration-none d-inline-flex align-items-center gap-1"
                style={{ color: "#00675c" }}
              >
                Đăng nhập
                <span>→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Background Decorative Elements */}
      <div
        className="position-fixed top-0 end-0 rounded-circle"
        style={{
          width: "40%",
          height: "40%",
          background: "rgba(0, 103, 92, 0.05)",
          filter: "blur(120px)",
          zIndex: -1,
          transform: "translate(10%, -10%)",
        }}
      ></div>
      <div
        className="position-fixed bottom-0 start-0 rounded-circle"
        style={{
          width: "30%",
          height: "30%",
          background: "rgba(255, 199, 142, 0.1)",
          filter: "blur(100px)",
          zIndex: -1,
          transform: "translate(-10%, 10%)",
        }}
      ></div>
    </div>
  );
}

export default RegisterPage;
