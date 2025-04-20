import React, { useState, useEffect, useCallback } from "react";
import { getAllUsers, updateUserRole, deleteUser, register } from "../api";
import { useAuth } from "../context/AuthContext";
import { FaTrashAlt } from "react-icons/fa";

function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { user: currentUser } = useAuth();
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [addUserError, setAddUserError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage("");

      const fetched = await getAllUsers();
      setUsers(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError(
        `Failed to load users. ${err.response?.data?.error || err.message}`
      );
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
    if (
      !window.confirm(
        `Are you sure you want to change this user's role to "${newRole}"?`
      )
    ) {
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
        prev.map((u) =>
          u.userid === userId ? { ...u, role: updatedUser.role } : u
        )
      );
      setSuccessMessage(
        `Successfully updated role for ${
          updatedUser.username || updatedUser.email
        } to ${updatedUser.role}.`
      );
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Update Role Error:", err);
      setError(
        `Failed to update role. ${err.response?.data?.error || err.message}`
      );
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Loading users...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gray-50 rounded-lg shadow mb-8">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
        Admin – Manage User Roles
      </h2>

      {/* Error message */}
      {error && (
        <div className="relative bg-red-50 border border-red-400 text-red-700 rounded p-4 mb-4 flex justify-between items-start">
          <span className="text-sm font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-1/2 -translate-y-1/2 right-3 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="relative bg-green-50 border border-green-400 text-green-800 rounded p-4 mb-4 flex justify-between items-start">
          <span className="text-sm font-medium">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="absolute top-1/2 -translate-y-1/2 right-3 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {loading && users.length > 0 && (
        <div className="text-center italic text-sm text-gray-500 mb-2">
          Updating...
        </div>
      )}

      {/* Add Member button */}
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => {
            setNewUser({ username: "", email: "", password: "" });
            setShowAddForm(true);
          }}
        >
          + Add Member
        </button>
      </div>

      {/* Users table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Username
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Change Role To
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.userid} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {user.username || "N/A"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {user.email}
                  </td>
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
                        onChange={(e) =>
                          handleRoleChange(user.userid, e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                    {currentUser && currentUser.id === user.userid ? null : (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete user"
                      >
                        <FaTrashAlt className="inline-block h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Add New Member
            </h3>

            {addUserError && (
              <div className="text-sm text-red-600 mb-2">{addUserError}</div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                name="username"
                placeholder="Username"
                autoComplete="new-username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="new-email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="w-full border px-3 py-2 rounded text-sm"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="new-password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="w-full border px-3 py-2 rounded text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setShowAddForm(false);
                  setNewUser({ username: "", email: "", password: "" });
                  setAddUserError("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={async () => {
                  setAddUserError("");
                  try {
                    await register(newUser);
                    await fetchUsers();
                    setShowAddForm(false);
                    setNewUser({ username: "", email: "", password: "" });
                    setSuccessMessage("New member added successfully.");
                    setTimeout(() => setSuccessMessage(""), 3000);
                  } catch (err) {
                    setAddUserError(
                      err.response?.data?.error || "Failed to add member."
                    );
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Confirm Deletion
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove{" "}
              <span className="font-semibold">
                {userToDelete.username || userToDelete.email}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setUserToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await deleteUser(userToDelete.userid);
                    setUsers((prev) =>
                      prev.filter((u) => u.userid !== userToDelete.userid)
                    );
                    setSuccessMessage("User removed successfully.");
                    setUserToDelete(null);
                    setTimeout(() => setSuccessMessage(""), 3000);
                  } catch (err) {
                    console.error("Delete User Error:", err);
                    setError("Failed to delete user.");
                    setTimeout(() => setError(null), 4000);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminUserListPage;
