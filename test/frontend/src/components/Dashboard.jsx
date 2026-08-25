import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>ยินดีต้อนรับสู่ Dashboard</h2>
      {user ? <p>คุณเข้าสู่ระบบในชื่อ: <strong>{user}</strong></p> : <p>กรุณา Login ก่อน</p>}
      
      <button onClick={handleLogout} style={{ padding: '10px', marginTop: '20px', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
}

