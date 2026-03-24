import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    rewardPoints: 0,
  });

  const token =
    user?.token || JSON.parse(localStorage.getItem("user") || "null")?.token;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        alert("Vui lòng đăng nhập lại");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:8080/api/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        if (!res.ok || !result?.data) {
          throw new Error(result?.message || "Không tải được hồ sơ");
        }
        const data = result.data;
        setForm({
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          rewardPoints: data.rewardPoints || 0,
        });
      } catch (error) {
        alert(error.message || "Lỗi tải hồ sơ");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      alert("Vui lòng đăng nhập lại");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://localhost:8080/api/user/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.email,
          phone: form.phone,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result?.data) {
        throw new Error(result?.message || "Cập nhật thất bại");
      }

      updateUser({
        email: result.data.email,
        phone: result.data.phone,
      });
      setForm((prev) => ({
        ...prev,
        email: result.data.email || "",
        phone: result.data.phone || "",
      }));
      alert(result.message || "Cập nhật hồ sơ thành công");
    } catch (error) {
      alert(error.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 pt-4">
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5 pt-4" style={{ maxWidth: 640 }}>
      <div className="card shadow border-0">
        <div className="card-body p-4">
          <h3 className="mb-4">Hồ sơ cá nhân</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold">Tên đăng nhập</label>
              <input
                className="form-control"
                value={form.username}
                disabled
                readOnly
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold">Điểm tích lũy</label>
              <input
                className="form-control"
                value={form.rewardPoints}
                disabled
                readOnly
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Cập nhật hồ sơ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
