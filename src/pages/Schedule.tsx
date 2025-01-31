import React, { useEffect, useState, useCallback } from 'react';
import { ProjectTable } from '@/components/schedule/ProjectTable';
import { ProjectStats } from '@/components/schedule/ProjectStats';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import debounce from 'lodash/debounce';

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

const Schedule = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedProjects = projectsData?.map(project => ({
        ...project,
        priority: project.additional_services.ultraRush ? 'ultra-rush' :
                 project.additional_services.superRush ? 'super-rush' : 
                 project.additional_services.rush ? 'rush' : 'normal',
        status: project.status || 'pending',
        notes: project.notes || ''
      })) || [];

      setProjects(formattedProjects);

      // เช็คโปรเจคที่ใกล้ถึงกำหนด
      const today = new Date();
      formattedProjects.forEach((project: Project) => {
        const dueDate = new Date(project.custom_due_date || 
          new Date(project.date).getTime() + (project.estimated_days * 24 * 60 * 60 * 1000));
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 2 && project.status !== 'completed') {
          toast({
            title: "Project Due Soon!",
            description: `${project.job_title} is due in ${daysUntilDue} days`,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Could not load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: number, status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId);

      if (error) throw error;

      // รีโหลดข้อมูลหลังอัพเดท
      fetchProjects();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast({
        title: "Error",
        description: "Could not update project status",
        variant: "destructive",
      });
    }
  };

  // สร้าง debounced function สำหรับ updateProjectNotes
  const debouncedUpdateNotes = useCallback(
    debounce(async (projectId: number, notes: string) => {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ notes })
          .eq('id', projectId);

        if (error) throw error;

        // อัพเดทข้อมูลในหน้าจอโดยไม่ต้องรีโหลดทั้งหมด
        setProjects(prevProjects => 
          prevProjects.map(project => 
            project.id === projectId 
              ? { ...project, notes } 
              : project
          )
        );
      } catch (error) {
        console.error('Error updating project notes:', error);
        toast({
          title: "Error",
          description: "Could not update project notes",
          variant: "destructive",
        });
      }
    }, 500), // รอ 500ms หลังจากพิมพ์เสร็จ
    [toast] // dependencies
  );

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-6">
            <ProjectStats projects={projects} />
            <Card className="p-6">
              <ProjectTable 
                projects={projects} 
                setProjects={setProjects}
                onStatusChange={updateProjectStatus}
                onNotesChange={debouncedUpdateNotes}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;