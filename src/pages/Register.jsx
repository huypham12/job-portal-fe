import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthClient } from "../services/authClient"

const passwordSpecial = /[!@#$%^&*(),.?":{}|<>_\-]/

export default function Register() {
  const [tab, setTab] = useState("candidate") // candidate | recruiter
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    date_of_birth: "",
    company: "",
  })
  const [showPass, setShowPass] = useState(false)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const openDatePicker = (e) => {
    if (typeof e.target.showPicker === "function") {
      e.target.showPicker()
    }
  }

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!form.name || !form.email || !form.password || !form.confirm_password || !form.date_of_birth) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.")
      return
    }
    const hasSpecial = passwordSpecial.test(form.password)
    if (form.password.length < 10 || !hasSpecial) {
      setError("Mật khẩu phải dài tối thiểu 10 ký tự và chứa ký tự đặc biệt.")
      return
    }
    if (form.password !== form.confirm_password) {
      setError("Xác nhận mật khẩu không khớp.")
      return
    }
    setLoading(true)
    try {
      const role = tab === "recruiter" ? "recruiter" : "candidate"
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        role,
        date_of_birth: form.date_of_birth,
      }
      await AuthClient.register(payload)
      setSuccess("Đã đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản rồi quay lại đăng nhập.")
    } catch (err) {
      setError(err?.data?.message || err?.message || "Đăng ký thất bại.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const wantedRole = params.get("role")
    if (wantedRole === "recruiter") setTab("recruiter")
    if (wantedRole === "candidate" || wantedRole === "seeker") setTab("candidate")
  }, [params])

  return (
    <section className="section" style={{ maxWidth: 920, margin: "40px auto" }}>
      <div className="card auth-card auth-grid">
        <div className="auth-side">
          <div className="brand" style={{ marginBottom: 12 }}>
            <span className="brand-badge">JF</span>
            <span>JobFinder</span>
          </div>
          <h2 style={{ margin: "0 0 6px" }}>Tạo tài khoản</h2>
          <div className="muted">Gia nhập cộng đồng nhân tài và nhà tuyển dụng chất lượng.</div>
          <ul className="auth-points">
            <li>Ứng tuyển / Đăng tuyển dễ dàng</li>
            <li>Gợi ý phù hợp theo hồ sơ</li>
            <li>Quản lý đơn ứng tuyển thuận tiện</li>
          </ul>
        </div>

        <div className="auth-form">
          <div className="tabs">
            <button className={"tab" + (tab === "candidate" ? " active" : "")} onClick={() => setTab("candidate")}>
              Ứng viên (Candidate)
            </button>
            <button className={"tab" + (tab === "recruiter" ? " active" : "")} onClick={() => setTab("recruiter")}>
              Nhà tuyển dụng (Recruiter)
            </button>
          </div>

          <form onSubmit={onSubmit} className="form-grid">
            <label className="field">
              <span>Họ và tên</span>
              <input name="name" value={form.name} onChange={onChange} placeholder="Nguyen Van A" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
            </label>
            <label className="field">
              <span>Mật khẩu</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                <input
                  style={{ flex: 1 }}
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={onChange}
                  placeholder="**********"
                  required
                />
                <button type="button" className="btn" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {form.password && (form.password.length < 10 || !passwordSpecial.test(form.password)) && (
                <div className="field-error">Mật khẩu phải dài tối thiểu 10 ký tự và chứa ký tự đặc biệt.</div>
              )}
            </label>
            <label className="field">
              <span>Xác nhận mật khẩu</span>
              <input
                name="confirm_password"
                type={showPass ? "text" : "password"}
                value={form.confirm_password}
                onChange={onChange}
                placeholder="**********"
                required
              />
              {form.confirm_password && form.confirm_password !== form.password && (
                <div className="field-error">Mật khẩu không khớp.</div>
              )}
            </label>

            <label className="field">
              <span>Ngày sinh</span>
              <input
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={onChange}
                onClick={openDatePicker}
                onFocus={openDatePicker}
                required
              />
            </label>

            {success && <div className="success-banner">{success}</div>}
            {error && <div className="error-banner">{error}</div>}

            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn primary large">
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
