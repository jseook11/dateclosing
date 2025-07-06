import DeviceRegistration from './DeviceRegistration';
import AdminPage from './AdminPage';
import './App.css'

function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  return isAdminRoute ? <AdminPage /> : <DeviceRegistration />;
}

export default App;
