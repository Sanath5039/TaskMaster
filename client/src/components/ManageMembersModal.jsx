import { useState } from 'react';
import { addProjectMember, removeProjectMember } from '../api/projectService';

const ManageMembersModal = ({ project, onClose, onUpdate }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setIsLoading(true);
      setError('');
      await addProjectMember(project._id, { email, role });
      onUpdate();
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      setRemovingId(userId);
      setError('');
      await removeProjectMember(project._id, userId);
      onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing member');
    } finally {
      setRemovingId(null);
    }
  };

  const getInitials = (name) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const AVATAR_COLORS = ['#7c5cff', '#38e078', '#63b3ff', '#f59e0b', '#ff5f72', '#f472b6'];
  const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  return (
    <>
      <style>{`
        @keyframes mmBackdrop { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mmSlide {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .mm-overlay { animation: mmBackdrop 0.2s ease; }
        .mm-modal   { animation: mmSlide 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .mm-input {
          flex: 1; background: var(--bg-hover);
          border: 1.5px solid var(--border); border-radius: 12px;
          padding: 11px 16px; color: var(--text-primary); font-size: 14px;
          outline: none; transition: all 0.2s; font-family: inherit;
          min-width: 0;
        }
        .mm-input::placeholder { color: #475569; }
        .mm-input:focus { border-color: #7c5cff; box-shadow: 0 0 0 3px rgba(124,92,255,0.15); }
        .mm-select:focus { border-color: #7c5cff; box-shadow: 0 0 0 3px rgba(124,92,255,0.15); }
        .mm-select option { background: var(--bg-card); color: var(--text-primary); }
        .mm-select {
          background: var(--bg-hover); border: 1.5px solid var(--border);
          border-radius: 12px; padding: 11px 14px; color: var(--text-primary); font-size: 14px;
          outline: none; cursor: pointer; transition: all 0.2s; font-family: inherit;
          appearance: none; width: 110px;
        }
        .mm-select:focus { border-color: #7c5cff; box-shadow: 0 0 0 3px rgba(124,92,255,0.15); }
        .mm-select option { background: #1a2238; }
        .mm-member-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-radius: 14px;
          background: var(--bg-card); border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .mm-member-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        .mm-remove-btn {
          opacity: 0; width: 30px; height: 30px; border-radius: 8px; border: none;
          background: rgba(255,95,114,0.1); color: #ff5f72; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; font-size: 14px;
        }
        .mm-member-row:hover .mm-remove-btn { opacity: 1; }
        .mm-remove-btn:hover { background: rgba(255,95,114,0.2); transform: scale(1.1); }
        .mm-add-btn {
          height: 44px; padding: 0 18px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #7c5cff, #9e85ff); color: #fff;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.2s; font-family: inherit; white-space: nowrap;
          box-shadow: 0 4px 14px rgba(124,92,255,0.35); display: flex; align-items: center; gap: 6px;
        }
        .mm-add-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,92,255,0.45); }
        .mm-add-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .mm-close-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: rgba(255,255,255,0.06); color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; transition: all 0.2s; line-height: 1;
        }
        .mm-close-btn:hover { background: rgba(255,255,255,0.12); color: #f8fafc; }
      `}</style>

      {/* Backdrop */}
      <div className="mm-overlay" onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(7,11,26,0.78)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 50, padding: '16px',
      }}>
        {/* Modal */}
        <div className="mm-modal" onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: '480px', borderRadius: '24px', overflow: 'hidden',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,92,255,0.2) 0%, rgba(99,179,255,0.1) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '24px 24px 20px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c5cff, #9e85ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', boxShadow: '0 6px 18px rgba(124,92,255,0.4)',
                }}>👥</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Manage Members</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {project.title} · {project.members?.length || 1} member{(project.members?.length || 1) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button className="mm-close-btn" onClick={onClose}>×</button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                background: 'rgba(255,95,114,0.1)', color: '#ff5f72',
                border: '1px solid rgba(255,95,114,0.25)', animation: 'mmBackdrop 0.2s ease',
              }}>⚠ {error}</div>
            )}

            {/* ── Add Member Form ── */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Invite Member
              </label>
              <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="email"
                  className="mm-input"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <select className="mm-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '10px' }}>▾</div>
                </div>
                <button type="submit" className="mm-add-btn" disabled={isLoading || !email.trim()}>
                  {isLoading ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'mmSlide 0.7s linear infinite' }} /> : '+ Add'}
                </button>
              </form>
            </div>

            {/* ── Member List ── */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Current Members
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto', paddingRight: '2px' }}>

                {/* Creator */}
                <div className="mm-member-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${avatarColor(project.createdBy?.name)}, ${avatarColor(project.createdBy?.name)}aa)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 700, color: '#fff',
                      boxShadow: `0 4px 12px ${avatarColor(project.createdBy?.name)}40`,
                    }}>
                      {getInitials(project.createdBy?.name)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.createdBy?.name}
                        <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>(Creator)</span>
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{project.createdBy?.email}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: 'rgba(124,92,255,0.12)', color: '#9e85ff', border: '1px solid rgba(124,92,255,0.25)', whiteSpace: 'nowrap' }}>
                    👑 Admin
                  </span>
                </div>

                {/* Members */}
                {project.members && project.members
                  .filter(member => member.user._id !== project.createdBy._id)
                  .map(member => (
                  <div key={member.user._id} className="mm-member-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                        background: `linear-gradient(135deg, ${avatarColor(member.user.name)}, ${avatarColor(member.user.name)}aa)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 700, color: '#fff',
                        boxShadow: `0 4px 12px ${avatarColor(member.user.name)}40`,
                        opacity: removingId === member.user._id ? 0.4 : 1,
                        transition: 'opacity 0.2s',
                      }}>
                        {getInitials(member.user.name)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{member.user.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{member.user.email}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap',
                        ...(member.role === 'Admin'
                          ? { background: 'rgba(124,92,255,0.12)', color: '#9e85ff', border: '1px solid rgba(124,92,255,0.25)' }
                          : { background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' })
                      }}>
                        {member.role === 'Admin' ? '👑 ' : ''}  {member.role}
                      </span>
                      <button
                        className="mm-remove-btn"
                        onClick={() => handleRemoveMember(member.user._id)}
                        disabled={removingId === member.user._id}
                        title="Remove member"
                      >
                        {removingId === member.user._id ? '…' : '🗑'}
                      </button>
                    </div>
                  </div>
                ))}

                {(!project.members || project.members.filter(m => m.user._id !== project.createdBy._id).length === 0) && (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#475569', fontSize: '13px' }}>
                    No other members yet. Invite someone above!
                  </div>
                )}
              </div>
            </div>

            {/* Done button */}
            <button onClick={onClose} style={{
              width: '100%', padding: '11px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)',
              color: '#94a3b8', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#f8fafc'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageMembersModal;
