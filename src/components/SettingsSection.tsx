import React from 'react';
import { Settings, User as UserIcon, Mail, GraduationCap, Users as UsersIcon, Lock as LockIcon } from 'lucide-react';
import type { User } from '../types';

interface SettingsSectionProps {
  currentUser: User | null;
  handleUpdatePassword: (e: React.FormEvent) => Promise<void>;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  passLoading: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  currentUser,
  handleUpdatePassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passLoading
}) => {
  return (
    <div className="settings-container animate-fade-in">
      <div className="section-head-v2">
        <div className="s-icon gray"><Settings size={24} /></div>
        <div>
          <h2>Account Settings</h2>
          <p>Manage your profile security and personal preferences</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Personal Info Card */}
        <div className="settings-card glass-card">
          <h3>Personal Information</h3>
          <div className="s-form-group">
            <label>Full Name</label>
            <div className="s-input-box disabled">
              <UserIcon size={18} />
              <input type="text" value={currentUser?.name} disabled />
            </div>
          </div>
          <div className="s-form-group">
            <label>Institutional Email</label>
            <div className="s-input-box disabled">
              <Mail size={18} />
              <input type="text" value={currentUser?.email} disabled />
            </div>
          </div>
          <div className="s-row-2">
            <div className="s-form-group">
              <label>Grade Level</label>
              <div className="s-input-box disabled">
                <GraduationCap size={18} />
                <input type="text" value={`Grade ${currentUser?.grade || '-'}`} disabled />
              </div>
            </div>
            <div className="s-form-group">
              <label>Class Section</label>
              <div className="s-input-box disabled">
                <UsersIcon size={18} />
                <input type="text" value={currentUser?.classId || 'Not Assigned'} disabled />
              </div>
            </div>
          </div>
          <p className="s-note">To update personal details, please contact the campus administration.</p>
        </div>

        {/* Security Card */}
        <div className="settings-card glass-card">
          <h3>Security & Access</h3>
          <form onSubmit={handleUpdatePassword}>
            <div className="s-form-group">
              <label>New Password</label>
              <div className="s-input-box">
                <LockIcon size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="s-form-group">
              <label>Confirm Password</label>
              <div className="s-input-box">
                <LockIcon size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="s-save-btn accent-gradient" disabled={passLoading}>
              {passLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
