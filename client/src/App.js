// src/App.js
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Inventory from './Inventory';
import Home from './Home';
import Login from './components/Login';
import Register from './components/Register';
import './styles.css';

// Add ProtectedRoute component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    return children;
};

const Navigation = () => {
    const { user, logout } = useAuth();

    return (
        <nav>
            <NavLink to="/" className="nav-link" end>
                Home
            </NavLink>
            {user ? (
                <>
                    <NavLink to="/inventory" className="nav-link">
                        Inventory
                    </NavLink>
                    <button onClick={logout} className="nav-link logout-btn">
                        Logout
                    </button>
                </>
            ) : (
                <>
                    <NavLink to="/login" className="nav-link">
                        Login
                    </NavLink>
                    <NavLink to="/register" className="nav-link">
                        Register
                    </NavLink>
                </>
            )}
        </nav>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="App">
                    <Navigation />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/inventory"
                            element={
                                <ProtectedRoute>
                                    <Inventory />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;