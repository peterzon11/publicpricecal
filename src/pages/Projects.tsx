import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabase';

interface JobData {
  id: number;
  job_title: string;
  client_name: string;
  service_type: 'subtitle' | 'transcription';
  language: 'thai' | 'english';
  duration: number;
  date: string;
  total: number;
  additional_services: {
    vlog: boolean;
    rush: boolean;
    superRush: boolean;
    unclearAudio: boolean;
    dualSubs: boolean;
  };
}

const ITEMS_PER_PAGE = 10;

const Projects = () => {
  const navigate = useNavigate();
  const [jobsData, setJobsData] = useState<JobData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>('กำลังเชื่อมต่อ...');

  useEffect(() => {
    // ทดสอบการเชื่อมต่อ
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('count')
          .single();

        if (error) {
          setConnectionStatus('❌ ไม่สามารถเชื่อมต่อกับ Supabase: ' + error.message);
          console.error('Supabase connection error:', error);
        } else {
          setConnectionStatus('✅ เชื่อมต่อกับ Supabase สำเร็จ');
          console.log('Supabase connected successfully');
        }
      } catch (error) {
        setConnectionStatus('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
        console.error('Connection test error:', error);
      }
    }

    testConnection();

    // เพิ่ม realtime subscription
    const subscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects' 
        }, 
        (payload) => {
          console.log('มีการเปลี่ยนแปลงข้อมูล:', payload);
          // รีโหลดข้อมูลเมื่อมีการเปลี่ยนแปลง
          fetchProjects();
      })
      .subscribe();

    // cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setJobsData(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh projects after deletion
      fetchProjects();
      setDeleteProjectId(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // กรองข้อมูลตามการค้นหา
  const filteredJobs = jobsData.filter(job => 
    job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // คำนวณข้อมูลสำหรับการแบ่งหน้า
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentJobs = filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-sm text-center">
            {connectionStatus}
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/analysis')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Analysis
            </Button>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[300px]"
              />
            </div>
          </div>

          <Card className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {new Date(job.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>{job.job_title}</TableCell>
                    <TableCell>{job.client_name}</TableCell>
                    <TableCell>
                      {job.service_type === 'subtitle' ? 'Subtitle' : 'Transcription'}
                      {job.service_type === 'subtitle' && ` (${job.language})`}
                    </TableCell>
                    <TableCell className="text-right">{job.duration} min</TableCell>
                    <TableCell className="text-right font-medium">฿{job.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteProjectId(job.id)}
                        className="hover:bg-destructive/20 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProjectId} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects; 