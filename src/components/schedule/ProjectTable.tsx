import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

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

interface ProjectTableProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onStatusChange: (projectId: number, status: string) => void;
  onNotesChange: (projectId: number, notes: string) => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({ 
  projects, 
  onStatusChange,
  onNotesChange
}) => {
  const [localNotes, setLocalNotes] = useState<{ [key: number]: string }>({});

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ultra-rush': return 'text-red-500';
      case 'super-rush': return 'text-orange-500';
      case 'rush': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in-progress': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const handleNotesChange = (projectId: number, value: string) => {
    setLocalNotes(prev => ({ ...prev, [projectId]: value }));
  };

  const handleNotesBlur = (projectId: number) => {
    const newNotes = localNotes[projectId];
    if (newNotes !== undefined) {
      onNotesChange(projectId, newNotes);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Due Date</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              {project.custom_due_date ? (
                <div className="text-primary">
                  {new Date(project.custom_due_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              ) : (
                new Date(new Date(project.date).setDate(
                  new Date(project.date).getDate() + project.estimated_days
                )).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              )}
            </TableCell>
            <TableCell>{project.job_title}</TableCell>
            <TableCell>{project.client_name}</TableCell>
            <TableCell>
              <span className={getPriorityColor(project.priority)}>
                {project.priority.replace('-', ' ').toUpperCase()}
              </span>
            </TableCell>
            <TableCell>
              <Select
                value={project.status}
                onValueChange={(value) => onStatusChange(project.id, value)}
              >
                <SelectTrigger className={`w-[130px] ${getStatusColor(project.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                value={localNotes[project.id] === undefined ? project.notes || '' : localNotes[project.id]}
                onChange={(e) => handleNotesChange(project.id, e.target.value)}
                onBlur={() => handleNotesBlur(project.id)}
                placeholder="Add notes..."
                className="max-w-[200px]"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};