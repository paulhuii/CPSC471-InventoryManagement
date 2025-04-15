// client/src/components/AdminUserList.js
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, updateUserRole } from '../api';
import { useAuth } from '../context/AuthContext'; // To prevent admin from demoting themselves
import './AdminUserList.css'; // Create this CSS file for styling

function AdminUserListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const { user: currentUser } = useAuth(); // Get the currently logged-in admin user

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(''); // Clear previous success messages
            const fetchedUsers = await getAllUsers();
            // Ensure the fetched data is an array before setting state
            setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
        } catch (err) {
            console.error("Fetch Users Error:", err);
            setError(`Failed to load users. ${err.response?.data?.error || err.message}`);
            setUsers([]); // Clear users on error
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies needed if getAllUsers doesn't change

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // Fetch users when component mounts

    const handleRoleChange = async (userId, newRole) => {
        // Optional: Confirmation dialog
        if (!window.confirm(`Are you sure you want to change this user's role to "${newRole}"?`)) {
            return; // User cancelled
        }

        // Prevent admin from changing their own role via this UI
        if (currentUser && currentUser.id === userId) {
             setError("You cannot change your own role from this page.");
             // Clear error after a few seconds
             setTimeout(() => setError(null), 4000);
             // Reset the dropdown visually (optional, depends on implementation)
             // This might require more complex state if you want the dropdown to visually revert
             return;
        }


        try {
            setLoading(true); // Show loading state during the update
            setError(null);
            setSuccessMessage('');

            const updatedUser = await updateUserRole(userId, newRole);

            // Update the user list state immediately for better UX
            setUsers(currentUsers =>
                currentUsers.map(user =>
                    user.userid === userId ? { ...user, role: updatedUser.role } : user
                )
            );

            setSuccessMessage(`Successfully updated role for ${updatedUser.username || updatedUser.email} to ${updatedUser.role}.`);
             // Clear success message after a few seconds
            setTimeout(() => setSuccessMessage(''), 4000);

        } catch (err) {
            console.error("Update Role Error:", err);
            setError(`Failed to update role. ${err.response?.data?.error || err.message}`);
             // Clear error after a few seconds
            setTimeout(() => setError(null), 4000);
        } finally {
             setLoading(false);
        }
    };

    // --- Render Logic ---
    if (loading && users.length === 0) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="admin-user-list-container">
            <h2>Admin - Manage User Roles</h2>

            {/* Display error messages */}
            {error && (
                <div className="error-message admin-error">
                    {error}
                    <button onClick={() => setError(null)} className="close-button simple">×</button>
                </div>
            )}

            {/* Display success messages */}
            {successMessage && (
                <div className="success-message admin-success">
                    {successMessage}
                    <button onClick={() => setSuccessMessage('')} className="close-button simple">×</button>
                </div>
            )}

            {/* Display loading state during updates */}
            {loading && users.length > 0 && <div className="loading-inline">Updating...</div>}

            <table className="user-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Current Role</th>
                        <th>Change Role To</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length === 0 && !loading ? (
                        <tr>
                            <td colSpan="4">No users found.</td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.userid}>
                                <td>{user.username || 'N/A'}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    {/* Prevent changing own role */}
                                    {currentUser && currentUser.id === user.userid ? (
                                        <span className="self-role-indicator">(Your Role)</span>
                                    ) : (
                                        <select
                                            value={user.role} // Controlled component reflects current role
                                            onChange={(e) => handleRoleChange(user.userid, e.target.value)}
                                            className="role-select"
                                            disabled={loading} // Disable during updates
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
    );
}

export default AdminUserListPage;