import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, createProject, deleteProject } from '../api/projectService';
import CreateProjectModal from '../components/CreateProjectModal';
import DashboardLayout from '../components/DashboardLayout';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      await createProject(projectData);
      loadProjects();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-[var(--text-primary)]">Loading projects...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Projects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <section className="empty-state-card">
          <div className="empty-icon">📂</div>
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing tasks.</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="stat-card flex-col items-start !gap-4 hover:border-[var(--border-focus)] hover:shadow-md transition-all h-full group"
            >
              <div className="flex justify-between items-start w-full">
                <h2 className="text-xl font-bold text-[var(--text-primary)] truncate pr-2">{project.title}</h2>
                <button
                  onClick={(e) => handleDelete(project._id, e)}
                  className="text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-3 min-h-[4.5rem] w-full">
                {project.description || 'No description provided.'}
              </p>
              <div className="text-[11px] font-semibold tracking-wide uppercase text-[var(--text-muted)] mt-auto pt-4 border-t border-[var(--border)] w-full flex items-center justify-between">
                <span>{new Date(project.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                  Open <span className="text-lg leading-none transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <CreateProjectModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </DashboardLayout>
  );
}

export default Projects;

