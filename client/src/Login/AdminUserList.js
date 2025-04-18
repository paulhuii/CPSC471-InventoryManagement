import React, { useState, useEffect, useCallback } from "react";
import { getAllUsers, updateUserRole } from "../api";
import { useAuth } from "../context/AuthContext";

function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const fetched = await getAllUsers();
      setUsers(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError(`Failed to load users. ${err.response?.data?.error || err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* -------------------- Role Change ------------------- */
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to \"${newRole}\"?`)) {
      return;
    }

    if (currentUser && currentUser.id === userId) {
      setError("You cannot change your own role from this page.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const updatedUser = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.userid === userId ? { ...u, role: updatedUser.role } : u))
      );
      setSuccessMessage(`Successfully updated role for ${updatedUser.username || updatedUser.email} to ${updatedUser.role}.`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Update Role Error:", err);
      setError(`Failed to update role. ${err.response?.data?.error || err.message}`);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };


  if (loading && users.length === 0) {
    return <div className="flex justify-center items-center h-40 text-gray-600">Loading users...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 rounded-lg shadow mb-8">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin – Manage User Roles</h2>

      {/* Error message */}
      {error && (
        <div className="relative bg-red-50 border border-red-400 text-red-700 rounded p-4 mb-4 flex justify-between items-start">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-1/2 -translate-y-1/2 right-3 text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="relative bg-green-50 border border-green-400 text-green-800 rounded p-4 mb-4 flex justify-between items-start">
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="absolute top-1/2 -translate-y-1/2 right-3 text-lg leading-none">
            ×
          </button>
        </div>
      )}

      {/* Inline loading when list already present */}
      {loading && users.length > 0 && (
        <div className="text-center italic text-sm text-gray-500 mb-2">Updating...</div>
      )}

      {/* Users table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Username</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Current Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Change Role To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 && !loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userid} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{user.username || "N/A"}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{user.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                        user.role === "admin" ? "bg-red-600" : "bg-blue-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {currentUser && currentUser.id === user.userid ? (
                      <span className="italic text-gray-500">(Your Role)</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.userid, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={loading}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUserListPage;
