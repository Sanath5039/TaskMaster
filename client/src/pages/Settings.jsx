import { useState, useEffect } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

const NOTIFICATION_KEYS = [
  { key: 'email',          icon: '📧', label: 'Email',           desc: 'Receive notifications via email' },
  { key: 'inApp',          icon: '🔔', label: 'In App',          desc: 'Receive in-app notification alerts' },
  { key: 'taskAssignment', icon: '👤', label: 'Task Assignment',  desc: 'When a task is assigned to you' },
  { key: 'taskStatus',     icon: '📋', label: 'Task Status',      desc: 'When task status changes' },
  { key: 'comments',       icon: '💬', label: 'Comments',         desc: 'When someone comments on a task' },
];

const Settings = () => {
  const { updateTheme } = useAuth();
  const [preferences, setPreferences] = useState({
    notifications: { email: true, inApp: true, taskAssignment: true, taskStatus: true, comments: true },
    reminders: { enabled: true, defaultOffset: '10_min_before' },
    appearance: { theme: '' },
  });

  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/api/settings');
        setPreferences(prev => ({
          notifications: { ...prev.notifications, ...(data.notifications || {}) },
          reminders:     { ...prev.reminders,     ...(data.reminders || {}) },
          appearance:    { ...prev.appearance,    ...(data.appearance || {}) },
        }));
      } catch (error) {
        console.error('Failed to fetch settings', error);
        setFetchError('Could not load your settings. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const { data } = await api.put('/api/settings', preferences);
      setPreferences(prev => ({
        notifications: { ...prev.notifications, ...(data.notifications || {}) },
        reminders:     { ...prev.reminders,     ...(data.reminders || {}) },
        appearance:    { ...prev.appearance,    ...(data.appearance || {}) },
      }));
      setMessage({ text: '✅ Preferences saved successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (error) {
      setMessage({ text: 'Failed to save settings. Try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (field) =>
    setPreferences(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: !prev.notifications[field] } }));

  const toggleReminder = () =>
    setPreferences(prev => ({ ...prev, reminders: { ...prev.reminders, enabled: !prev.reminders.enabled } }));

  const changeReminderOffset = (e) =>
    setPreferences(prev => ({ ...prev, reminders: { ...prev.reminders, defaultOffset: e.target.value } }));

  const changeTheme = (newTheme) => {
    updateTheme(newTheme);
    setPreferences(prev => ({ ...prev, appearance: { ...prev.appearance, theme: newTheme } }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
          <div style={S.spinner} />
        </div>
      </DashboardLayout>
    );
  }

  if (fetchError) {
    return (
      <DashboardLayout>
        <div style={{ padding: '40px', maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <div style={S.card}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Something went wrong</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>{fetchError}</p>
            <button onClick={() => window.location.reload()} style={S.btnPrimary}>Retry</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 32px 60px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Settings</h1>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Manage your preferences and workspace behaviour</p>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btnPrimary, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {saving
              ? <><span style={S.btnSpinner} /> Saving…</>
              : '💾 Save Preferences'
            }
          </button>
        </div>

        {/* ── Global Message ── */}
        {message.text && (
          <div style={{ ...S.alert, ...(message.type === 'success' ? S.alertSuccess : S.alertError), marginBottom: '24px' }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── A. Notifications ── */}
          <section style={S.card}>
            <div style={S.sectionHeader('#7c5cff')}>
              <div style={{ ...S.sectionIcon, background: 'linear-gradient(135deg, #7c5cff, #9e85ff)', boxShadow: '0 6px 18px rgba(124,92,255,0.35)' }}>🔔</div>
              <div>
                <h2 style={S.sectionTitle}>Notifications</h2>
                <p style={S.sectionSub}>Control which events trigger a notification</p>
              </div>
            </div>

            <div style={{ padding: '8px 0' }}>
              {NOTIFICATION_KEYS.map((item, idx) => (
                <div key={item.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 24px',
                  borderBottom: idx < NOTIFICATION_KEYS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{item.desc}</p>
                    </div>
                  </div>
                  <Toggle checked={!!preferences.notifications[item.key]} onChange={() => toggleNotification(item.key)} />
                </div>
              ))}
            </div>
          </section>

          {/* ── B. Reminders ── */}
          <section style={S.card}>
            <div style={S.sectionHeader('#f59e0b')}>
              <div style={{ ...S.sectionIcon, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', boxShadow: '0 6px 18px rgba(245,158,11,0.35)' }}>⏰</div>
              <div>
                <h2 style={S.sectionTitle}>Reminders</h2>
                <p style={S.sectionSub}>Configure automated nudge behaviors for due dates</p>
              </div>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Enable toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Enable System Reminders</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Allow TaskMaster to send you reminder push notifications</p>
                </div>
                <Toggle checked={!!preferences.reminders.enabled} onChange={toggleReminder} />
              </div>

              {/* Offset selector */}
              <div style={{
                padding: '16px 18px', borderRadius: '14px', transition: 'all 0.3s',
                background: preferences.reminders.enabled ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: `1px solid ${preferences.reminders.enabled ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
                opacity: preferences.reminders.enabled ? 1 : 0.4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Default Reminder Offset</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Fallback time before due date if none is chosen</p>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <select
                      value={preferences.reminders.defaultOffset}
                      onChange={changeReminderOffset}
                      disabled={!preferences.reminders.enabled}
                      style={S.select}
                    >
                      <option value="due_time">At time of due date</option>
                      <option value="10_min_before">10 minutes before</option>
                      <option value="30_min_before">30 minutes before</option>
                      <option value="1_hour_before">1 hour before</option>
                      <option value="1_day_before">1 day before</option>
                    </select>
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}>▾</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── C. Appearance ── */}
          <section style={S.card}>
            <div style={S.sectionHeader('#38e078')}>
              <div style={{ ...S.sectionIcon, background: 'linear-gradient(135deg, #38e078, #63dba6)', boxShadow: '0 6px 18px rgba(56,224,120,0.3)' }}>✨</div>
              <div>
                <h2 style={S.sectionTitle}>Appearance</h2>
                <p style={S.sectionSub}>Customize your workspace visual identity</p>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interface Theme</p>
              <div style={{ display: 'inline-flex', gap: '6px', padding: '6px', borderRadius: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                {[
                  { id: 'system', icon: '💻', label: 'System' },
                  { id: 'light',  icon: '☀️',  label: 'Light'  },
                  { id: 'dark',   icon: '🌙',  label: 'Dark'   },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    style={{
                      padding: '10px 20px', borderRadius: '10px', border: 'none',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s',
                      fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px',
                      ...(preferences.appearance.theme === t.id
                        ? { background: 'linear-gradient(135deg, #7c5cff, #9e85ff)', color: '#fff', boxShadow: '0 4px 14px rgba(124,92,255,0.4)' }
                        : { background: 'transparent', color: '#64748b' }
                      ),
                    }}
                  >
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toggle-slide { from { transform: translateX(0); } to { transform: translateX(22px); } }
        select option { background: var(--bg-card); color: var(--text-primary); }
      `}</style>
    </DashboardLayout>
  );
};

/* ── Toggle Component ── */
const Toggle = ({ checked, onChange }) => (
  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
    <div style={{
      width: '42px', height: '24px', borderRadius: '999px', padding: '3px',
      background: checked ? 'var(--accent)' : 'var(--bg-hover)',
      border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
      transition: 'all 0.2s ease',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: '#fff',
        boxShadow: 'var(--shadow-sm)',
        transform: checked ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.2s ease',
      }} />
    </div>
  </label>
);

/* ── Style constants ── */
const S = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    animation: 'fadeInUp 0.3s ease',
  },
  sectionHeader: (accentVal) => ({
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '16px 20px',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    position: 'relative', overflow: 'hidden',
  }),
  sectionIcon: {
    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
    background: 'var(--bg-hover)', border: '1px solid var(--border)',
  },
  sectionTitle: { margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' },
  sectionSub:   { margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' },
  select: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '8px 32px 8px 12px', color: 'var(--text-primary)', fontSize: '13px',
    outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s', minWidth: '180px', boxShadow: 'var(--shadow-sm)'
  },
  btnPrimary: {
    background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: '8px', padding: '10px 20px',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'inherit', boxShadow: 'var(--shadow-sm)',
  },
  btnSpinner: {
    display: 'inline-block', width: '14px', height: '14px',
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
  alert: {
    padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1px solid transparent',
  },
  alertSuccess: { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'var(--success)' },
  alertError:   { background: 'var(--error-bg)', color: 'var(--error)', borderColor: 'var(--error)' },
  spinner: {
    width: '32px', height: '32px', border: '3px solid var(--border)',
    borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
};

export default Settings;
