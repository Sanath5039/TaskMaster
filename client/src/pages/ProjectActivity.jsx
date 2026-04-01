import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ActivityTimeline from '../components/ActivityTimeline';
import { getProjectById } from '../api/projectService';

function ProjectActivity() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await getProjectById(id);
        setProject(data);
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-[var(--text-primary)]">Loading project activity...</div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20 text-xl font-semibold text-[var(--text-primary)]">Project not found</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link to={`/projects/${id}`} className="text-[var(--text-secondary)] hover:text-[var(--accent)] mb-4 inline-flex items-center gap-2 transition-colors font-medium">
          <span>&larr;</span> Back to Project Board
        </Link>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">{project.title} Activity</h1>
        <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">A complete chronological history of all actions taken in this project.</p>
      </div>
      
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-sm p-6 max-w-4xl mx-auto md:mx-0">
        <ActivityTimeline projectId={id} />
      </div>
    </DashboardLayout>
  );
}

export default ProjectActivity;
