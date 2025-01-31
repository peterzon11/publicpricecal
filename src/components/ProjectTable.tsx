import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Project {
  jobTitle: string;
  clientName: string;
  date: string;
  total: number;
  estimatedDays: number;
  customDueDate?: string;
  serviceType: 'subtitle' | 'transcription';
}

const columns = [
  {
    header: "Time",
    cell: (project: Project) => {
      const date = new Date(project.date);
      return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    }
  },
  {
    header: "Date",
    cell: (project: Project) => {
      const date = new Date(project.date);
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  },
  {
    header: "Due Date",
    cell: (project: Project) => {
      if (project.customDueDate) {
        return (
          <div>
            <div className="text-primary">{new Date(project.customDueDate).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="text-xs text-gray-500">(Custom)</div>
          </div>
        );
      }
      const dueDate = new Date(project.date);
      dueDate.setDate(dueDate.getDate() + project.estimatedDays);
      return dueDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  },
  {
    header: "Job Title",
    cell: (project: Project) => project.jobTitle
  },
  {
    header: "Client",
    cell: (project: Project) => project.clientName
  },
  {
    header: "Price",
    cell: (project: Project) => `฿${project.total.toFixed(2)}`
  }
];

interface ProjectTableProps {
  projects: Project[];
  title?: string;
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, title }) => {
  const sortedProjects = [...projects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((project, index) => (
              <TableRow key={index}>
                {columns.map((column, columnIndex) => (
                  <TableCell key={columnIndex}>{column.cell(project)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProjectTable; 