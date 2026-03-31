import { useState } from 'react';

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    emoji: '🟢', color: '#38e078', bg: 'rgba(56,224,120,0.1)',  border: 'rgba(56,224,120,0.3)'  },
  { value: 'medium', label: 'Medium', emoji: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  { value: 'high',   label: 'High',   emoji: '🔴', color: '#ff5f72', bg: 'rgba(255,95,114,0.1)', border: 'rgba(255,95,114,0.3)' },
];

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'To Do',       emoji: '⬜' },
  { value: 'in-progress', label: 'In Progress', emoji: '🔄' },
  { value: 'done',        label: 'Done',        emoji: '✅' },
];

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/zip', 'application/x-zip-compressed',
];
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

function getFileIcon(type) {
  if (type.startsWith('image/'))                                              return '🖼️';
  if (type === 'application/pdf')                                             return '📄';
  if (type.includes('word'))                                                  return '📝';
  if (type.includes('excel') || type.includes('spreadsheet') || type === 'text/csv') return '📊';
  if (type.includes('powerpoint') || type.includes('presentation'))          return '📋';
  if (type === 'text/plain')                                                  return '📃';
  if (type.includes('zip'))                                                   return '🗜️';
  return '📎';
}

function formatBytes(bytes) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CreateTaskModal({ projectId, isAdmin, members, onClose, onSubmit }) {
  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [status, setStatus]             = useState('todo');
  const [priority, setPriority]         = useState('medium');
  const [dueDate, setDueDate]           = useState('');
  const [assignedTo, setAssignedTo]     = useState('');
  const [reminderOption, setReminderOption] = useState('none');
  const [attachedFile, setAttachedFile] = useState(null);
  const [dragOver, setDragOver]         = useState(false);

  const pickFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(`File type not supported: ${file.type}`);
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('File exceeds the 20 MB limit.');
      return;
    }
    setAttachedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const handleFileInput = (e) => {
    pickFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title, description, status, priority, projectId,
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
      reminderOption: reminderOption !== 'none' ? reminderOption : undefined,
      file: attachedFile || undefined,
    });
  };

  const selStyle = {
    width: '100%', background: 'var(--bg-hover)',
    border: '1.5px solid var(--border)', borderRadius: '12px',
    padding: '11px 36px 11px 14px', color: 'var(--text-primary)', fontSize: '14px',
    outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 0.2s', boxSizing: 'border-box',
  };

  return (
    <>
      <style>{`
        @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tm-overlay { animation: backdropIn 0.2s ease; }
        .tm-modal   { animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .tm-input {
          width: 100%; background: var(--bg-hover);
          border: 1.5px solid var(--border); border-radius: 12px;
          padding: 12px 16px; color: var(--text-primary); font-size: 14px;
          outline: none; transition: all 0.2s ease; font-family: inherit;
          box-sizing: border-box; resize: none;
        }
        .tm-input::placeholder { color: #475569; }
        .tm-input:focus { border-color: #7c5cff; box-shadow: 0 0 0 3px rgba(124,92,255,0.15); }
        .tm-select:focus { border-color: #7c5cff !important; box-shadow: 0 0 0 3px rgba(124,92,255,0.15); }
        .tm-select option { background: var(--bg-card); color: var(--text-primary); }
        .priority-chip {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 9px 8px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.08);
          background: transparent; cursor: pointer; transition: all 0.2s; font-size: 13px;
          font-weight: 600; font-family: inherit; color: #64748b;
        }
        .priority-chip:hover { background: rgba(255,255,255,0.05); }
        .tm-btn-cancel {
          padding: 10px 20px; border-radius: 10px; border: 1.5px solid var(--border);
          background: transparent; color: var(--text-muted); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
        }
        .tm-btn-cancel:hover { background: var(--bg-hover); color: var(--text-primary); }
        .tm-btn-submit {
          padding: 10px 24px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #7c5cff, #9e85ff);
          color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease; font-family: inherit;
          box-shadow: 0 4px 16px rgba(124,92,255,0.35);
        }
        .tm-btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,92,255,0.45); }
        .tm-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
        .tm-date-input::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }

        /* ── Drop Zone ── */
        .tm-dropzone {
          border: 1.5px dashed rgba(124,92,255,0.35);
          border-radius: 14px;
          background: rgba(124,92,255,0.04);
          padding: 22px 16px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all 0.22s; text-align: center;
        }
        .tm-dropzone:hover, .tm-dropzone.tm-drag-over {
          border-color: #7c5cff;
          background: rgba(124,92,255,0.1);
        }
        .tm-file-chip {
          display: flex; align-items: center; gap: 10px;
          background: rgba(124,92,255,0.09);
          border: 1.5px solid rgba(124,92,255,0.28);
          border-radius: 12px; padding: 11px 14px;
          animation: backdropIn 0.2s ease;
        }
        .tm-file-remove {
          margin-left: auto; background: rgba(255,255,255,0.06);
          border: none; border-radius: 6px; color: #64748b;
          cursor: pointer; padding: 3px 8px; font-size: 16px;
          transition: all 0.2s; line-height: 1;
        }
        .tm-file-remove:hover { background: rgba(255,95,114,0.15); color: #ff5f72; }
      `}</style>

      {/* Backdrop */}
      <div
        className="tm-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(7,11,26,0.78)',
          backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 50, padding: '16px', overflowY: 'auto',
        }}
      >
        {/* Modal */}
        <div
          className="tm-modal"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '560px', borderRadius: '24px', overflow: 'hidden',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,255,0.1)',
            margin: 'auto',
          }}
        >
          {/* ── Gradient Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(56,224,120,0.12) 0%, rgba(124,92,255,0.18) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '26px 28px 22px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,224,120,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -40, left: 60, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,255,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #38e078, #63dba6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', boxShadow: '0 8px 20px rgba(56,224,120,0.3)',
                }}>✅</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                    New Task
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Add an actionable item to this project
                  </p>
                </div>
              </div>
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

            {/* Task Title */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Task Title <span style={{ color: '#7c5cff' }}>*</span>
              </label>
              <input
                type="text"
                className="tm-input"
                placeholder="e.g. Design the Login Page"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
                style={{ fontSize: '15px', fontWeight: 500 }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                Description <span style={{ fontSize: '11px', fontWeight: 400, color: '#475569', textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
              </label>
              <textarea
                className="tm-input"
                placeholder="Add subtasks, notes, or additional context..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Priority */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Priority
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className="priority-chip"
                    onClick={() => setPriority(p.value)}
                    style={priority === p.value ? { background: p.bg, borderColor: p.border, color: p.color } : {}}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                Status
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    className="priority-chip"
                    onClick={() => setStatus(s.value)}
                    style={status === s.value ? { background: 'rgba(124,92,255,0.12)', borderColor: 'rgba(124,92,255,0.4)', color: '#9e85ff' } : {}}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assign To + Due Date */}
            <div style={{ display: 'grid', gridTemplateColumns: isAdmin && members?.length > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>
              {isAdmin && members && members.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    👤 Assign To
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select className="tm-select" style={selStyle} value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '11px' }}>▾</div>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  📅 Due Date
                </label>
                <input
                  type="date"
                  className="tm-input tm-date-input"
                  style={{ colorScheme: 'dark' }}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Reminder */}
            {dueDate && (
              <div style={{ animation: 'backdropIn 0.2s ease' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                  🔔 Reminder
                </label>
                <div style={{ position: 'relative' }}>
                  <select className="tm-select" style={selStyle} value={reminderOption} onChange={e => setReminderOption(e.target.value)}>
                    <option value="none">No Reminder</option>
                    <option value="at_due_time">At due time</option>
                    <option value="10_min_before">10 mins before</option>
                    <option value="30_min_before">30 mins before</option>
                    <option value="1_hour_before">1 hour before</option>
                    <option value="1_day_before">1 day before</option>
                  </select>
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b', fontSize: '11px' }}>▾</div>
                </div>
              </div>
            )}

            {/* ── Attachment ── */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                📎 Attachment{' '}
                <span style={{ fontSize: '11px', fontWeight: 400, color: '#475569', textTransform: 'none', letterSpacing: 0 }}>
                  (Optional · max 20 MB)
                </span>
              </label>

              {attachedFile ? (
                <div className="tm-file-chip">
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{getFileIcon(attachedFile.type)}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {attachedFile.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatBytes(attachedFile.size)}
                    </div>
                  </div>
                  <button type="button" className="tm-file-remove" onClick={() => setAttachedFile(null)} title="Remove file">
                    ×
                  </button>
                </div>
              ) : (
                <label
                  className={`tm-dropzone${dragOver ? ' tm-drag-over' : ''}`}
                  htmlFor="tm-file-input"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <div style={{ fontSize: '28px', lineHeight: 1 }}>📁</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#9e85ff' }}>
                    Drop a file here, or <span style={{ textDecoration: 'underline' }}>browse</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    PDF · Word · Excel · PowerPoint · Images · CSV · ZIP
                  </div>
                  <input
                    id="tm-file-input"
                    type="file"
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
                    onChange={handleFileInput}
                  />
                </label>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px' }}>
              <button type="button" onClick={onClose} className="tm-btn-cancel">Cancel</button>
              <button type="submit" className="tm-btn-submit" disabled={!title.trim()}>
                ✦ Create Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateTaskModal;
