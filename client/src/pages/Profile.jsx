import React, { useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    try {
      const res = await userService.updateProfile({ name });
      setUser(res.data);
      localStorage.setItem('fraudshield_user', JSON.stringify(res.data));
      setProfileMsg('Profile updated successfully.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');
    try {
      await userService.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setPasswordMsg('Password changed successfully.');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <AppLayout title="My Profile">
      <div className="card" style={{ maxWidth: 480, marginBottom: 16 }}>
        <div className="card-header">
          <h3>Profile Details</h3>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user?.email} disabled />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input value={user?.role} disabled style={{ textTransform: 'capitalize' }} />
          </div>
          {profileMsg && <p style={{ color: 'var(--risk-low)', fontSize: 13 }}>{profileMsg}</p>}
          {profileError && <p className="field-error">{profileError}</p>}
          <button className="btn btn-primary" type="submit">
            Save Changes
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-header">
          <h3>Change Password</h3>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              required
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            />
          </div>
          {passwordMsg && <p style={{ color: 'var(--risk-low)', fontSize: 13 }}>{passwordMsg}</p>}
          {passwordError && <p className="field-error">{passwordError}</p>}
          <button className="btn btn-primary" type="submit">
            Change Password
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
