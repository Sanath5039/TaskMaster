import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import { getTasksByProject } from '../api/taskService';
import DashboardLayout from '../components/DashboardLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ projects: 0, totalTasks: 0, completed: 0, inProgress: 0 });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const projects = await getProjects();
      
      let allTasks = [];
      // Fetch tasks for all projects to aggregate stats
      if (projects.length > 0) {
        const taskPromises = projects.map(p => getTasksByProject(p._id));
        const tasksArrays = await Promise.all(taskPromises);
        allTasks = tasksArrays.flat();
      }

      setStats({
        projects: projects.length,
        totalTasks: allTasks.length,
        completed: allTasks.filter(t => t.status === 'done').length,
        inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      });

      // Keep up to 3 most recent projects for quick access
      setRecentProjects(projects.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <DashboardLayout>
      {/* Profile Card */}
      <section className="profile-section">
        <div className="profile-card">
          <div className="profile-avatar-large">
            {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
          </div>
          <div className="profile-info">
            <h2>{user?.name}</h2>
            <p className="profile-email">📧 {user?.email}</p>
            <p className="profile-joined">🗓 Member since {joinedDate}</p>
          </div>
          <div className="profile-badge">Active</div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-blue-bg)' }}>📋</div>
          <div>
            <p className="stat-label">Total Tasks</p>
            <p className="stat-value">{loading ? '...' : stats.totalTasks}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-green-bg)' }}>✅</div>
          <div>
            <p className="stat-label">Completed</p>
            <p className="stat-value text-[var(--accent-green)]">{loading ? '...' : stats.completed}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-orange-bg)' }}>⏳</div>
          <div>
            <p className="stat-label">In Progress</p>
            <p className="stat-value text-[var(--accent-orange)]">{loading ? '...' : stats.inProgress}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-purple-bg)' }}>🗂</div>
          <div>
            <p className="stat-label">Projects</p>
            <p className="stat-value">{loading ? '...' : stats.projects}</p>
          </div>
        </div>
      </section>

      {/* Recent Activity / Projects */}
      <section className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Recent Projects</h3>
          <Link to="/projects" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">View All</Link>
        </div>
        
        {loading ? (
           <div className="text-[var(--text-muted)]">Loading...</div>
        ) : recentProjects.length === 0 ? (
          <div className="empty-state-card mt-0">
            <div className="empty-icon">🚀</div>
            <h3>Ready to start?</h3>
            <p>Create your first project to organize your tasks.</p>
            <Link to="/projects" className="btn-primary mt-4 inline-block">Go to Projects</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentProjects.map(project => (
              <Link key={project._id} to={`/projects/${project._id}`} className="stat-card flex-col items-start gap-3 hover:border-[var(--border-focus)] transition-colors group">
                 <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition">{project.title}</h4>
                 <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{project.description || 'No description'}</p>
                 <div className="text-xs text-[var(--text-muted)] mt-auto pt-3">
                   {new Date(project.createdAt).toLocaleDateString()}
                 </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default Dashboard;
