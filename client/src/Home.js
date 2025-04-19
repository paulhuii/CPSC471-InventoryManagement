import { NavLink } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function Home() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="bg-[#f9f5f0] min-h-screen flex items-center justify-center px-4">
      <section className="max-w-xl bg-white shadow rounded-lg p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold text-[#3c4b2c]">
          Welcome to the Inventory Management System
        </h1>
        <p className="text-gray-700">
          Streamline your inventory operations with our easy-to-use system. Add,
          update, and manage products effortlessly.
        </p>

        {user ? (
          <div className="space-y-2">
            <span className="block text-sm text-gray-600">
              Logged in as: <span className="font-medium">{user.email}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 text-sm rounded-md font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-md font-medium transition"
          >
            Login to Access Inventory
          </NavLink>
        )}
      </section>
    </div>
  );
}

export default Home;
