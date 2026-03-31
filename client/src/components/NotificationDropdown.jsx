import { useState, useEffect, useRef } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notificationService';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Loader2, 
  UserPlus, 
  Eye, 
  Bell, 
  Check,
  Circle
} from 'lucide-react';

const getTypeConfig = (message) => {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('assigned')) {
    return {
      type: 'assigned',
      icon: <UserPlus className="w-[18px] h-[18px] text-violet-400" />,
      bg: 'bg-violet-500/10 border-violet-500/20',
      dot: 'bg-violet-400'
    };
  }
  if (lowerMsg.includes('done')) {
    return {
      type: 'done',
      icon: <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      dot: 'bg-emerald-400'
    };
  }
  if (lowerMsg.includes('in-progress') || lowerMsg.includes('in progress')) {
    return {
      type: 'in-progress',
      icon: <Loader2 className="w-[18px] h-[18px] text-sky-400" />,
      bg: 'bg-sky-500/10 border-sky-500/20',
      dot: 'bg-sky-400'
    };
  }
  if (lowerMsg.includes('review')) {
    return {
      type: 'review',
      icon: <Eye className="w-[18px] h-[18px] text-amber-400" />,
      bg: 'bg-amber-500/10 border-amber-500/20',
      dot: 'bg-amber-400'
    };
  }
  if (lowerMsg.includes('overdue')) {
    return {
      type: 'overdue',
      icon: <Bell className="w-[18px] h-[18px] text-red-400" />,
      bg: 'bg-red-500/10 border-red-500/20',
      dot: 'bg-red-400'
    };
  }
  if (lowerMsg.includes('reminder') || lowerMsg.includes('due soon')) {
    return {
      type: 'reminder',
      icon: <Bell className="w-[18px] h-[18px] text-orange-400" />,
      bg: 'bg-orange-500/10 border-orange-500/20',
      dot: 'bg-orange-400'
    };
  }
  return {
    type: 'general',
    icon: <Bell className="w-[18px] h-[18px] text-slate-400" />,
    bg: 'bg-slate-500/10 border-slate-500/20',
    dot: 'bg-slate-400'
  };
};

const formatMessage = (msg) => {
  const parts = msg.split(/(".*?")/g);
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <span key={index} className="font-semibold text-[var(--text-primary)]">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const formatTime = (dateString) => {
  const d = new Date(dateString);
  const now = new Date();
  
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  
  if (isToday) {
    return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  
  if (isYesterday) {
    return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (unreadCount === 0) return;
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 outline-none
          ${isOpen ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-inner' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'}
        `}
      >
        <Bell className="w-5 h-5" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-[var(--bg)] animate-pulse" />
        )}
      </button>

      {/* Dropdown Menu */}
      <div 
        className={`absolute right-0 mt-3 w-[400px] bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200 ease-out origin-top-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-hover)]">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-[var(--text-primary)] text-base tracking-wide">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[var(--bg-hover)]"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
        
        {/* Notification List (Scrollable) */}
        <div className="max-h-[380px] overflow-y-auto overscroll-contain no-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-[var(--text-muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">You're all caught up!</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">No new notifications right now.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif, idx) => {
                const config = getTypeConfig(notif.message);
                
                return (
                  <Link 
                    key={notif._id}
                    to={notif.link || '#'}
                    onClick={() => { if (!notif.isRead) handleMarkAsRead(notif._id); setIsOpen(false); }}
                    className={`group relative flex items-start gap-3.5 p-4 transition-all duration-200 border-b border-[var(--border)] last:border-none
                      ${notif.isRead ? 'bg-transparent hover:bg-[var(--bg-hover)]' : 'bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]'}
                    `}
                  >
                    {/* Unread Indicator Bar */}
                    {!notif.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    )}

                    {/* Icon Container */}
                    <div className={`shrink-0 flex items-center justify-center w-9 h-9 mt-0.5 rounded-full border ${config.bg} shadow-sm group-hover:scale-105 transition-transform`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-sm leading-snug line-clamp-2 ${notif.isRead ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                        {formatMessage(notif.message)}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-medium flex items-center gap-1.5">
                        {formatTime(notif.createdAt)}
                        {!notif.isRead && (
                          <span className="w-1 h-1 rounded-full bg-blue-500 inline-block"></span>
                        )}
                      </p>
                    </div>

                    {/* Hover Mark as Read Button */}
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-all"
                        title="Mark as read"
                      >
                        <Circle className="w-4 h-4" />
                      </button>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[var(--border)] bg-[var(--bg-hover)]">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Close Dropdown
          </button>
        </div>
      </div>
      
      {/* Hide scrollbar styling */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
