import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const Profile = () => {
  const { user, setUser } = useAuth();

  const [profileData, setProfileData] = useState({ name: '', email: '', avatar: '', role: 'user', createdAt: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [passMessage, setPassMessage] = useState({ text: '', type: '' });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/api/users/profile');
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          avatar: data.avatar || '',
          role: data.role || 'user',
          createdAt: data.createdAt || '',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setFetchError('Failed to load profile. Please try refreshing.');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const { data } = await api.put('/api/users/profile', {
        name: profileData.name,
        email: profileData.email,
        avatar: profileData.avatar,
      });
      setProfileData(prev => ({ ...prev, ...data }));
      if (setUser) setUser(prevAuth => ({ ...prevAuth, ...data }));
      setMessage({ text: '✅ Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error updating profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPassSaving(true);
    setPassMessage({ text: '', type: '' });
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassSaving(false);
      return setPassMessage({ text: 'New passwords do not match', type: 'error' });
    }
    try {
      await api.put('/api/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPassMessage({ text: '🔐 Password changed successfully!', type: 'success' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setPassMessage({ text: '', type: '' }), 5000);
    } catch (err) {
      setPassMessage({ text: err.response?.data?.message || 'Error changing password', type: 'error' });
    } finally {
      setPassSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordForm(false);
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPassMessage({ text: '', type: '' });
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') return { label: '👑 Administrator', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    return { label: '🚀 Team Member', color: '#7c5cff', bg: 'rgba(124,92,255,0.12)', border: 'rgba(124,92,255,0.3)' };
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
          <div style={styles.spinner}></div>
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout>
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ ...styles.card, textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '20px', marginBottom: '8px' }}>Something went wrong</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{fetchError}</p>
            <button onClick={() => window.location.reload()} style={styles.btnPrimary}>Retry</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const roleBadge = getRoleBadge(profileData.role);

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 32px 60px' }}>

        {/* ── Hero Banner ── */}
        <div style={styles.heroBanner}>
          {/* Animated background orbs */}
          <div style={{ ...styles.orb, width: 300, height: 300, top: -80, left: -80, background: 'radial-gradient(circle, rgba(124,92,255,0.35) 0%, transparent 70%)' }} />
          <div style={{ ...styles.orb, width: 200, height: 200, bottom: -60, right: 60, background: 'radial-gradient(circle, rgba(99,179,255,0.25) 0%, transparent 70%)' }} />

          <div style={styles.heroContent}>
            {/* Avatar */}
            <div style={styles.avatarRing}>
              <div style={styles.avatarLarge}>
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>{getInitials(profileData.name)}</span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div style={styles.heroText}>
              <h1 style={styles.heroName}>{profileData.name || 'Your Name'}</h1>
              <p style={styles.heroEmail}>{profileData.email}</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
                <span style={{ ...styles.badge, color: roleBadge.color, background: roleBadge.bg, border: `1px solid ${roleBadge.border}` }}>
                  {roleBadge.label}
                </span>
                <span style={{ ...styles.badge, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  📅 Joined {formatDate(profileData.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={styles.grid}>

          {/* ── Left: Personal Info ── */}
          <div style={{ gridColumn: 'span 3' }}>
            <div style={styles.card}>
              {/* Card header */}
              <div style={styles.cardHeader}>
                <div style={styles.cardIconWrap}>
                  <span style={{ fontSize: '18px' }}>👤</span>
                </div>
                <div>
                  <h2 style={styles.cardTitle}>Personal Information</h2>
                  <p style={styles.cardSub}>Update your name, email and avatar</p>
                </div>
              </div>

              {message.text && (
                <div style={{ ...styles.alert, ...(message.type === 'success' ? styles.alertSuccess : styles.alertError) }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleProfileUpdate}>
                {/* Avatar URL row */}
                <div style={styles.avatarRow}>
                  <div style={styles.avatarSmall}>
                    {profileData.avatar
                      ? <img src={profileData.avatar} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <span style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{getInitials(profileData.name)}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Avatar URL</label>
                    <input
                      type="url"
                      value={profileData.avatar}
                      onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                      style={styles.input}
                      placeholder="https://example.com/photo.jpg"
                      onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'none' })}
                    />
                    <p style={styles.hint}>Leave empty to use your initials as avatar</p>
                  </div>
                </div>

                {/* Name & Email */}
                <div style={styles.formGrid}>
                  <div>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      style={styles.input}
                      placeholder="John Doe"
                      onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'none' })}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Email Address</label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      style={styles.input}
                      placeholder="john@example.com"
                      onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                      onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'none' })}
                    />
                  </div>
                </div>

                {/* Read-only info chips */}
                <div style={{ ...styles.formGrid, marginTop: '8px' }}>
                  <div>
                    <label style={styles.label}>Account Role</label>
                    <div style={styles.readonlyField}>
                      {profileData.role === 'admin' ? '👑 Administrator' : '🚀 Team Member'}
                    </div>
                  </div>
                  <div>
                    <label style={styles.label}>Member Since</label>
                    <div style={styles.readonlyField}>📅 {formatDate(profileData.createdAt)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button type="submit" disabled={saving} style={{ ...styles.btnPrimary, minWidth: '160px' }}>
                    {saving
                      ? <span style={styles.btnSpinner}></span>
                      : <>💾 Save Changes</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Right: Security ── */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ ...styles.card, height: '100%' }}>

              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div style={{ ...styles.cardIconWrap, background: 'rgba(255,95,114,0.12)', border: '1px solid rgba(255,95,114,0.2)' }}>
                  <span style={{ fontSize: '18px' }}>🔐</span>
                </div>
                <div>
                  <h2 style={styles.cardTitle}>Security</h2>
                  <p style={styles.cardSub}>Manage your account security</p>
                </div>
              </div>

              {/* Success/Error message (always visible even when form is closed) */}
              {passMessage.text && (
                <div style={{ ...styles.alert, ...(passMessage.type === 'success' ? styles.alertSuccess : styles.alertError) }}>
                  {passMessage.text}
                </div>
              )}

              {/* ── Collapsed State ── */}
              {!showPasswordForm && (
                <div style={styles.securityIdleBox}>
                  <div style={styles.securityLockIcon}>🔒</div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Password Protected</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Your password is encrypted and secure. Update it anytime to keep your account safe.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    style={styles.btnChangePassword}
                  >
                    🔑 Change Password
                  </button>
                </div>
              )}

              {/* ── Expanded Password Form ── */}
              {showPasswordForm && (
                <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeInUp 0.25s ease' }}>
                  {/* Current Password */}
                  <div>
                    <label style={styles.label}>Current Password</label>
                    <div style={styles.pwWrap}>
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        autoFocus
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                        style={{ ...styles.input, paddingRight: '48px' }}
                        placeholder="Enter current password"
                        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                        onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'none' })}
                      />
                      <button type="button" style={styles.eyeBtn} onClick={() => setShowCurrentPw(v => !v)}>
                        {showCurrentPw ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label style={styles.label}>New Password</label>
                    <div style={styles.pwWrap}>
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        required
                        minLength="6"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                        style={{ ...styles.input, paddingRight: '48px' }}
                        placeholder="Min. 6 characters"
                        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                        onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'none' })}
                      />
                      <button type="button" style={styles.eyeBtn} onClick={() => setShowNewPw(v => !v)}>
                        {showNewPw ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {passwords.newPassword && (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: '4px',
                            width: passwords.newPassword.length < 6 ? '25%' : passwords.newPassword.length < 10 ? '60%' : '100%',
                            background: passwords.newPassword.length < 6 ? '#ff5f72' : passwords.newPassword.length < 10 ? '#f59e0b' : '#38e078',
                            transition: 'all 0.3s ease',
                          }} />
                        </div>
                        <p style={{ ...styles.hint, marginTop: '4px', color: passwords.newPassword.length < 6 ? '#ff5f72' : passwords.newPassword.length < 10 ? '#f59e0b' : '#38e078' }}>
                          {passwords.newPassword.length < 6 ? 'Weak' : passwords.newPassword.length < 10 ? 'Medium' : '✓ Strong'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={styles.label}>Confirm New Password</label>
                    <div style={styles.pwWrap}>
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        required
                        minLength="6"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                        style={{ ...styles.input, paddingRight: '48px', borderColor: passwords.confirmPassword && passwords.confirmPassword !== passwords.newPassword ? '#ff5f72' : 'rgba(255,255,255,0.08)' }}
                        placeholder="Repeat new password"
                        onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
                        onBlur={e => Object.assign(e.target.style, { borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'none' })}
                      />
                      <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirmPw(v => !v)}>
                        {showConfirmPw ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {passwords.confirmPassword && passwords.confirmPassword !== passwords.newPassword && (
                      <p style={{ ...styles.hint, color: '#ff5f72', marginTop: '4px' }}>⚠ Passwords don't match</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button type="button" onClick={handleCancelPassword} style={{ ...styles.btnGhost, flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={passSaving} style={{ ...styles.btnSecondary, flex: 2 }}>
                      {passSaving ? <span style={styles.btnSpinner}></span> : '🔒 Update Password'}
                    </button>
                  </div>
                </form>
              )}

              {/* Security tips — always visible */}
              <div style={{ ...styles.tipBox, marginTop: showPasswordForm ? '24px' : '20px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Security Tips</p>
                {['Use at least 8 characters', 'Mix letters, numbers & symbols', 'Never reuse passwords'].map(tip => (
                  <div key={tip} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ color: '#38e078', fontSize: '12px' }}>✓</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,92,255,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(124,92,255,0); }
        }
      `}</style>
    </DashboardLayout>
  );
};

const styles = {
  // Hero Section
  heroBanner: {
    position: 'relative',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '40px 48px',
    marginBottom: '28px',
    overflow: 'hidden',
    animation: 'fadeInUp 0.5s ease',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    filter: 'blur(40px)',
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
  },
  avatarRing: {
    padding: '4px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c5cff, #63b3ff)',
    boxShadow: '0 0 0 4px rgba(124,92,255,0.2), 0 0 40px rgba(124,92,255,0.3)',
    animation: 'pulse-glow 3s ease-in-out infinite',
    flexShrink: 0,
  },
  avatarLarge: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c5cff 0%, #9e85ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '3px solid #0f1729',
  },
  heroText: {
    flex: 1,
  },
  heroName: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  heroEmail: {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 14px',
    borderRadius: '100px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.01em',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '24px',
    animation: 'fadeInUp 0.5s ease 0.1s both',
  },

  // Card
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
    paddingBottom: '20px',
    borderBottom: '1px solid var(--border)',
  },
  cardIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(124,92,255,0.12)',
    border: '1px solid rgba(124,92,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  cardSub: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '2px',
  },

  // Form
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '16px 20px',
    marginBottom: '20px',
  },
  avatarSmall: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c5cff, #9e85ff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid rgba(124,92,255,0.4)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '11px 14px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: '#7c5cff',
    boxShadow: '0 0 0 3px rgba(124,92,255,0.15)',
  },
  readonlyField: {
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '11px 14px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    fontWeight: 500,
  },
  hint: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },

  // Password
  pwWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    color: '#64748b',
    lineHeight: 1,
  },

  // Buttons
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #7c5cff 0%, #9e85ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(124,92,255,0.35)',
    fontFamily: 'inherit',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'rgba(124,92,255,0.1)',
    color: '#9e85ff',
    border: '1px solid rgba(124,92,255,0.3)',
    borderRadius: '10px',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  },
  btnSpinner: {
    display: 'inline-block',
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.25)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  // Alerts
  alert: {
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '20px',
    border: '1px solid transparent',
    animation: 'fadeInUp 0.3s ease',
  },
  alertSuccess: {
    background: 'rgba(56,224,120,0.1)',
    color: '#38e078',
    borderColor: 'rgba(56,224,120,0.25)',
  },
  alertError: {
    background: 'rgba(255,95,114,0.1)',
    color: '#ff5f72',
    borderColor: 'rgba(255,95,114,0.25)',
  },

  // Security tips
  tipBox: {
    marginTop: '24px',
    padding: '16px',
    background: 'var(--bg-hover)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  },

  // Spinner
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(124,92,255,0.2)',
    borderTopColor: '#7c5cff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};

export default Profile;
