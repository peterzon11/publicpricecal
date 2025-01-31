import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock, CheckCircle, AlertCircle, BarChart } from 'lucide-react';

interface Project {
  id: number;
  job_title: string;
  client_name: string;
  date: string;
  custom_due_date?: string;
  estimated_days: number;
  service_type: 'subtitle' | 'transcription';
  priority: 'normal' | 'rush' | 'super-rush' | 'ultra-rush';
  status: 'pending' | 'in-progress' | 'completed';
  notes?: string;
  additional_services: {
    superRush: boolean;
    rush: boolean;
    ultraRush: boolean;
  };
}

interface ProjectStatsProps {
  projects: Project[];
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ projects }) => {
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'in-progress').length;
  const pendingProjects = projects.filter(p => p.status === 'pending').length;

  const getOverdueProjects = () => {
    const today = new Date();
    return projects.filter(project => {
      const dueDate = new Date(project.custom_due_date || 
        new Date(project.date).getTime() + (project.estimated_days * 24 * 60 * 60 * 1000));
      return dueDate < today && project.status !== 'completed';
    }).length;
  };

  const overdueProjects = getOverdueProjects();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Projects</p>
            <h3 className="text-2xl font-bold">{totalProjects}</h3>
          </div>
          <BarChart className="w-8 h-8 text-primary" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-500">{inProgressProjects}</h3>
          </div>
          <Clock className="w-8 h-8 text-blue-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Completed</p>
            <h3 className="text-2xl font-bold text-green-500">{completedProjects}</h3>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Overdue</p>
            <h3 className="text-2xl font-bold text-red-500">{overdueProjects}</h3>
          </div>
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
      </Card>
    </div>
  );
};