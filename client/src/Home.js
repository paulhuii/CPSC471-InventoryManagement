import { NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function Home() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <h1>Welcome to the Inventory Management System</h1>
                <p>
                    Streamline your inventory operations with our easy-to-use system.
                    Add, update, and manage products effortlessly.
                </p>
                {user ? (
                    <div className="auth-buttons">
                        <span className="user-info">Logged in as: {user.email}</span>
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
                    </div>
                ) : (
                    <NavLink to="/login" className="cta-button">
                        Login to Access Inventory
                    </NavLink>
                )}
            </section>
        </div>
    );
}

export default Home;