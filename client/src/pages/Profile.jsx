import React, { useEffect, useState } from 'react';
import AppLayout from '../layouts/AppLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast, addToast = showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Real-time password validation indicators
  const hasMinLength = passwords.newPassword.length >= 8;
  const hasNumber = /\d/.test(passwords.newPassword);
  const passwordsMatch =
    passwords.newPassword.length > 0 &&
    passwords.confirmPassword.length > 0 &&
    passwords.newPassword === passwords.confirmPassword;
  const passwordsMismatch =
    passwords.confirmPassword.length > 0 &&
    passwords.newPassword !== passwords.confirmPassword;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      const err = 'Full name cannot be empty.';
      setProfileMsg('');
      setProfileError(err);
      showToast(err, 'error');
      return;
    }

    if (trimmedName.length < 2) {
      const err = 'Full name must be at least 2 characters.';
      setProfileMsg('');
      setProfileError(err);
      showToast(err, 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await userService.updateProfile({ name: trimmedName });
      setUser(res.data);
      localStorage.setItem('fraudshield_user', JSON.stringify(res.data));
      const successMsg = 'Profile updated successfully.';
      setProfileError('');
      setProfileMsg(successMsg);
      showToast(successMsg, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      setProfileMsg('');
      setProfileError(msg);
      showToast(msg, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (!passwords.currentPassword) {
      const err = 'Current password is required.';
      setPasswordMsg('');
      setPasswordError(err);
      showToast(err, 'error');
      return;
    }

    if (!hasMinLength) {
      const err = 'New password must be at least 8 characters long.';
      setPasswordMsg('');
      setPasswordError(err);
      showToast(err, 'error');
      return;
    }

    if (!hasNumber) {
      const err = 'New password must contain at least one number.';
      setPasswordMsg('');
      setPasswordError(err);
      showToast(err, 'error');
      return;
    }

    if (passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword) {
      const err = 'New passwords do not match.';
      setPasswordMsg('');
      setPasswordError(err);
      showToast(err, 'error');
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      const err = 'New password cannot be the same as your current password.';
      setPasswordMsg('');
      setPasswordError(err);
      showToast(err, 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      const successMsg = 'Password changed successfully.';
      setPasswordError('');
      setPasswordMsg(successMsg);
      showToast(successMsg, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password';
      setPasswordMsg('');
      setPasswordError(msg);
      showToast(msg, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const roleDisplay = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Analyst';

  return (
    <AppLayout title="My Profile">
      <div className="profile-grid">
        {/* Card 1: Profile Details */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Identity & Access</div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                <span>👤</span> Profile Details
              </h3>
            </div>
            <div className="card-header-actions">
              <span className={`badge ${user?.role === 'admin' ? 'badge-high' : user?.role === 'investigator' ? 'badge-medium' : 'badge-low'}`}>
                {roleDisplay}
              </span>
            </div>
          </div>

          {/* User Identity Banner */}
          <div className="profile-avatar-row">
            <div className="profile-avatar" aria-hidden="true">
              {userInitial}
            </div>
            <div className="profile-identity">
              <h4 className="profile-identity-name">{user?.name || 'Platform User'}</h4>
              <p className="profile-identity-email">{user?.email || 'user@fraudshield.dev'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--status-safe)', boxShadow: '0 0 6px var(--status-safe)' }} />
                <span style={{ fontSize: 11, color: 'var(--status-safe)', fontFamily: 'var(--font-mono)' }}>
                  Active Session · IAM Verified
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="profile-full-name">Full Name</label>
              <input
                id="profile-full-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="profile-email">Email Address</label>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  🔒 Managed by IAM
                </span>
              </div>
              <input
                id="profile-email"
                value={user?.email || ''}
                disabled
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-secondary)',
                  background: 'rgba(216, 232, 222, 0.04)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-role">Platform Role</label>
              <input
                id="profile-role"
                value={`${roleDisplay} — ${user?.role === 'admin' ? 'Full administrative privileges' : user?.role === 'investigator' ? 'Case management & escalation rights' : 'Read-only analyst access'}`}
                disabled
                style={{
                  color: 'var(--text-secondary)',
                  background: 'rgba(216, 232, 222, 0.04)',
                  cursor: 'not-allowed',
                  fontSize: 13,
                }}
              />
            </div>

            {/* Monospace Metadata Strip */}
            <div className="profile-meta-strip">
              <span>ID: <strong style={{ color: 'var(--accent-cyan)' }}>{user?._id || user?.id || 'USR-LOCAL'}</strong></span>
              <span>·</span>
              <span>Last Login: <strong style={{ color: 'var(--text-primary)' }}>{user?.lastLogin ? formatDate(user.lastLogin) : 'Current Session'}</strong></span>
              <span>·</span>
              <span>Status: <strong style={{ color: 'var(--status-safe)' }}>Active</strong></span>
            </div>

            {profileMsg && (
              <p style={{ color: 'var(--status-safe)', fontSize: 13, marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> {profileMsg}
              </p>
            )}
            {profileError && (
              <p className="field-error" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✕</span> {profileError}
              </p>
            )}

            <div style={{ marginTop: 18 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isUpdatingProfile}
                style={{ width: '100%' }}
              >
                {isUpdatingProfile ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Change Password */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Credentials</div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                <span>🔑</span> Change Password
              </h3>
            </div>
            <div className="card-header-actions">
              <span className="badge badge-low">Live policy</span>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <div className="password-input-wrap">
                <input
                  id="current-password"
                  type={showPassword.current ? 'text' : 'password'}
                  required
                  placeholder="Enter current password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  style={{ fontFamily: showPassword.current ? 'inherit' : 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                  aria-label={showPassword.current ? 'Hide current password' : 'Show current password'}
                  title={showPassword.current ? 'Hide password' : 'Show password'}
                >
                  {showPassword.current ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <div className="password-input-wrap">
                <input
                  id="new-password"
                  type={showPassword.new ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters with 1+ number"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  style={{ fontFamily: showPassword.new ? 'inherit' : 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                  aria-label={showPassword.new ? 'Hide new password' : 'Show new password'}
                  title={showPassword.new ? 'Hide password' : 'Show password'}
                >
                  {showPassword.new ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Real-time Requirement Checklist */}
            <div className="password-rules-card">
              <div className={`password-rule-item ${hasMinLength ? 'valid' : ''}`}>
                <span>{hasMinLength ? '✓' : '○'}</span>
                <span>Minimum 8 characters long</span>
              </div>
              <div className={`password-rule-item ${hasNumber ? 'valid' : ''}`}>
                <span>{hasNumber ? '✓' : '○'}</span>
                <span>At least one numeric digit (0-9)</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <div className="password-input-wrap">
                <input
                  id="confirm-password"
                  type={showPassword.confirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  style={{
                    fontFamily: showPassword.confirm ? 'inherit' : 'var(--font-mono)',
                    borderColor: passwordsMatch
                      ? 'var(--status-safe)'
                      : passwordsMismatch
                        ? 'var(--status-high)'
                        : 'var(--border-hairline)',
                  }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                  aria-label={showPassword.confirm ? 'Hide confirmed password' : 'Show confirmed password'}
                  title={showPassword.confirm ? 'Hide password' : 'Show password'}
                >
                  {showPassword.confirm ? '🙈' : '👁️'}
                </button>
              </div>

              {passwordsMatch && (
                <span style={{ fontSize: 12, color: 'var(--status-safe)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  ✓ Passwords match
                </span>
              )}
              {passwordsMismatch && (
                <span style={{ fontSize: 12, color: 'var(--status-high)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  ✕ Passwords do not match
                </span>
              )}
            </div>

            {passwordMsg && (
              <p style={{ color: 'var(--status-safe)', fontSize: 13, marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> {passwordMsg}
              </p>
            )}
            {passwordError && (
              <p className="field-error" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✕</span> {passwordError}
              </p>
            )}

            <div style={{ marginTop: 18 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isChangingPassword || (passwords.newPassword && !hasMinLength) || (passwords.newPassword && !hasNumber) || (passwords.confirmPassword && !passwordsMatch)}
                style={{ width: '100%' }}
              >
                {isChangingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
