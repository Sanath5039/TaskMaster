import { useState } from 'react';

function CreateProjectModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description });
  };

  return (
    <>
      <style>{`
        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .pm-overlay { animation: backdropIn 0.2s ease; }
        .pm-modal  { animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .pm-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px;
          padding: 12px 16px; color: #f8fafc; font-size: 14px;
          outline: none; transition: all 0.2s ease; font-family: inherit;
          box-sizing: border-box; resize: none;
        }
        .pm-input::placeholder { color: #475569; }
        .pm-input:focus { border-color: #7c5cff; box-shadow: 0 0 0 3px rgba(124,92,255,0.15); }
        .pm-btn-cancel {
          padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.08);
          background: transparent; color: #94a3b8; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .pm-btn-cancel:hover { background: rgba(255,255,255,0.05); color: #f8fafc; }
        .pm-btn-submit {
          padding: 10px 24px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #7c5cff, #9e85ff);
          color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; font-family: inherit;
          box-shadow: 0 4px 16px rgba(124,92,255,0.35);
        }
        .pm-btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,92,255,0.45); }
        .pm-btn-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
      `}</style>

      {/* Backdrop */}
      <div
        className="pm-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(7,11,26,0.75)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 50, padding: '16px',
        }}
      >
        {/* Modal */}
        <div
          className="pm-modal"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden',
            background: 'linear-gradient(180deg, #1e2740 0%, #161f35 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,255,0.1)',
          }}
        >
          {/* ── Gradient Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,92,255,0.25) 0%, rgba(99,179,255,0.12) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '28px 28px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Background glow orb */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.4) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Icon */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #7c5cff, #9e85ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', boxShadow: '0 8px 20px rgba(124,92,255,0.4)',
                }}>📁</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                    New Project
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
                    Create a new workspace for your team
                  </p>
                </div>
              </div>
              {/* Close */}
              <button onClick={onClose} style={{
                width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                transition: 'all 0.2s', lineHeight: 1,
              }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#f8fafc'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; }}
              >×</button>
            </div>
          </div>

          {/* ── Body ── */}
          <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Project Title */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Project Title <span style={{ color: '#7c5cff' }}>*</span>
              </label>
              <input
                type="text"
                className="pm-input"
                placeholder="e.g. Q1 Marketing Campaign"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Description <span style={{ fontSize: '11px', fontWeight: 400, color: '#475569', textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
              </label>
              <textarea
                className="pm-input"
                placeholder="Briefly describe the project goals and deliverables..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px' }}>
              <button type="button" onClick={onClose} className="pm-btn-cancel">Cancel</button>
              <button type="submit" className="pm-btn-submit" disabled={!title.trim()}>
                ✦ Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateProjectModal;
