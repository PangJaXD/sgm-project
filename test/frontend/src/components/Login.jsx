import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรชเมื่อกด Submit
    setErrorMessage("");

    try {
      // ยิง Request ไปยัง Spring Boot API
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          username: username,
          password: password,
        },
      );

      if (response.data.status === "success") {
        alert(response.data.message);
        // เก็บชื่อผู้ใช้ไว้ใน LocalStorage เพื่อใช้ในหน้าอื่น (ถ้ามี JWT ก็เก็บ Token ตรงนี้)
        localStorage.setItem("user", response.data.username);
        // เปลี่ยนหน้าไปยัง /dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setErrorMessage("Username หรือ Password ไม่ถูกต้อง");
      } else {
        setErrorMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      }
    }
  };

  return (
    <div
      style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}
    >
      <h2>ระบบเข้าสู่ระบบ</h2>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <div>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" style={{ padding: "10px", cursor: "pointer" }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
