import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Briefcase,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  ComposedChart,
} from 'recharts';
import Navigation from '@/components/Navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  estimated_days: number;
  custom_due_date?: string;
  additional_services: {
    vlog: boolean;
    rush: boolean;
    superRush: boolean;
    unclearAudio: boolean;
    dualSubs: boolean;
    interview: boolean;
    verbatim: boolean;
    englishTranscription: boolean;
    translation: boolean;
    meeting: boolean;
    research: boolean;
  };
}

interface ClientBasicDetails {
  name: string;
  totalJobs: number;
  totalRevenue: number;
  averageRevenue: number;
  lastJobDate: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// เพิ่มชุดสีสำหรับ Job Speed
const SPEED_COLORS = {
  'Normal': '#0088FE',
  'Rush': '#00C49F',
  'Super Rush': '#FFBB28',
  'Ultra Rush': '#FF8042',
};

const Analysis = () => {
  const navigate = useNavigate();
  const [jobsData, setJobsData] = useState<JobData[]>([]);
  const [frequentClients, setFrequentClients] = useState<string[]>([]);
  const [showTopClients, setShowTopClients] = useState(false);
  const [topClientsData, setTopClientsData] = useState<ClientBasicDetails[]>([]);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // ดึงข้อมูลงานทั้งหมด
      const { data: jobs, error: jobsError } = await supabase
        .from('projects')
        .select('*')
        .order('date', { ascending: false });

      if (jobsError) throw jobsError;
      setJobsData(jobs || []);

      // ดึงข้อมูลลูกค้าประจำ
      const { data: clients, error: clientsError } = await supabase
        .from('frequent_clients')
        .select('name');

      if (clientsError) throw clientsError;
      setFrequentClients(clients?.map(c => c.name) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
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

      // รีโหลดข้อมูลหลังลบ
      fetchData();
      setDeleteProjectId(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const monthlyRevenue = jobsData.reduce((acc, job) => {
    const month = new Date(job.date).toLocaleString('default', { month: 'long' });
    acc[month] = (acc[month] || 0) + job.total;
    return acc;
  }, {} as Record<string, number>);

  const monthlyRevenueData = Object.entries(monthlyRevenue).map(([month, total]) => ({
    month,
    total,
  }));

  const clientRevenue = jobsData.reduce((acc, job) => {
    if (frequentClients.includes(job.client_name)) {
      acc[job.client_name] = (acc[job.client_name] || 0) + job.total;
    } else {
      acc['Other Clients'] = (acc['Other Clients'] || 0) + job.total;
    }
    return acc;
  }, {} as Record<string, number>);

  const clientRevenueData = Object.entries(clientRevenue)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => {
      if (a.name === 'Other Clients') return 1;
      if (b.name === 'Other Clients') return -1;
      return b.value - a.value;
    });

  const serviceTypeData = jobsData.reduce((acc, job) => {
    acc[job.service_type] = (acc[job.service_type] || 0) + job.total;
    return acc;
  }, {} as Record<string, number>);

  const serviceTypeChartData = Object.entries(serviceTypeData).map(([name, value]) => ({
    name: name === 'subtitle' ? 'Subtitle Service' : 'Transcription Service',
    value,
  }));

  const summaryData = {
    totalRevenue: jobsData.reduce((sum, job) => sum + job.total, 0),
    totalJobs: jobsData.length,
    frequentClientsCount: frequentClients.length,
    averageRevenue: jobsData.length > 0 
      ? jobsData.reduce((sum, job) => sum + job.total, 0) / jobsData.length 
      : 0,
  };

  // คำนวณข้อมูลงานถอดเทป
  const transcriptionJobs = jobsData.filter(job => job.service_type === 'transcription');
  const transcriptionTypeData = transcriptionJobs.reduce((acc, job) => {
    if (job.additional_services.translation) {
      acc['Translation'] = (acc['Translation'] || 0) + 1;
    } else if (job.additional_services.englishTranscription) {
      acc['English'] = (acc['English'] || 0) + 1;
    } else if (job.additional_services.verbatim) {
      acc['Verbatim'] = (acc['Verbatim'] || 0) + 1;
    } else if (job.additional_services.interview) {
      acc['Interview'] = (acc['Interview'] || 0) + 1;
    } else if (job.additional_services.meeting) {
      acc['Meeting'] = (acc['Meeting'] || 0) + 1;
    } else if (job.additional_services.research) {
      acc['Research'] = (acc['Research'] || 0) + 1;
    } else {
      acc['Normal'] = (acc['Normal'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const transcriptionTypeChartData = Object.entries(transcriptionTypeData).map(([name, value]) => ({
    name,
    value,
  }));

  // คำนวณข้อมูลงานซับไตเติ้ล
  const subtitleJobs = jobsData.filter(job => job.service_type === 'subtitle');
  const subtitleLanguageData = subtitleJobs.reduce((acc, job) => {
    acc[job.language === 'thai' ? 'Thai' : 'English'] = (acc[job.language === 'thai' ? 'Thai' : 'English'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const subtitleLanguageChartData = Object.entries(subtitleLanguageData).map(([name, value]) => ({
    name,
    value,
  }));

  // คำนวณข้อมูลเวลา
  const monthlyJobCount = jobsData.reduce((acc, job) => {
    const month = new Date(job.date).toLocaleString('default', { month: 'long' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monthlyJobData = Object.entries(monthlyJobCount).map(([month, count]) => ({
    month,
    count,
  }));

  const averageWorkDays = jobsData.length > 0
    ? jobsData.reduce((sum, job) => sum + job.estimated_days, 0) / jobsData.length
    : 0;

  const jobSpeedData = jobsData.reduce((acc, job) => {
    if (job.additional_services.superRush) {
      acc[job.service_type === 'subtitle' ? 'subtitleSuperRush' : 'transcriptionSuperRush'] = 
        (acc[job.service_type === 'subtitle' ? 'subtitleSuperRush' : 'transcriptionSuperRush'] || 0) + job.total;
    } else if (job.additional_services.rush) {
      acc[job.service_type === 'subtitle' ? 'subtitleRush' : 'transcriptionRush'] = 
        (acc[job.service_type === 'subtitle' ? 'subtitleRush' : 'transcriptionRush'] || 0) + job.total;
    } else {
      acc[job.service_type === 'subtitle' ? 'subtitleNormal' : 'transcriptionNormal'] = 
        (acc[job.service_type === 'subtitle' ? 'subtitleNormal' : 'transcriptionNormal'] || 0) + job.total;
    }
    return acc;
  }, {} as Record<string, number>);

  const jobSpeedChartData = [
    {
      name: 'Normal',
      Subtitle: jobSpeedData.subtitleNormal || 0,
      Transcription: jobSpeedData.transcriptionNormal || 0,
    },
    {
      name: 'Rush',
      Subtitle: jobSpeedData.subtitleRush || 0,
      Transcription: jobSpeedData.transcriptionRush || 0,
    },
    {
      name: 'Super Rush',
      Subtitle: jobSpeedData.subtitleSuperRush || 0,
      Transcription: jobSpeedData.transcriptionSuperRush || 0,
    },
    {
      name: 'Ultra Rush',
      Subtitle: jobSpeedData.subtitleUltraRush || 0,
      Transcription: jobSpeedData.transcriptionUltraRush || 0,
    },
  ];

  // รวมข้อมูล Monthly Revenue และ Job Count
  const combinedMonthlyData = Object.entries(monthlyRevenue).map(([month, total]) => ({
    month,
    total,
    count: monthlyJobCount[month] || 0,
  }));

  const calculateTopClientsData = () => {
    const clientDetails = frequentClients.map(clientName => {
      const clientJobs = jobsData.filter(job => job.client_name === clientName);
      const totalRevenue = clientJobs.reduce((sum, job) => sum + job.total, 0);
      const lastJob = clientJobs.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      return {
        name: clientName,
        totalJobs: clientJobs.length,
        totalRevenue,
        averageRevenue: totalRevenue / clientJobs.length,
        lastJobDate: new Date(lastJob?.date || '').toLocaleDateString(),
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

    setTopClientsData(clientDetails);
  };

  // Calculate pagination
  const indexOfLastJob = currentPage * itemsPerPage;
  const indexOfFirstJob = indexOfLastJob - itemsPerPage;
  // เรียงข้อมูลตามวันี่ล่าสุดก่อน
  const sortedJobs = [...jobsData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentJobs = sortedJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(jobsData.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-accent">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Total Revenue</h3>
              </div>
              <p className="text-2xl font-bold mt-2">฿{summaryData.totalRevenue.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Total Jobs</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{summaryData.totalJobs}</p>
            </Card>
            <Card className="p-4" onClick={() => {
              calculateTopClientsData();
              setShowTopClients(true);
            }}>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Frequent Clients</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{summaryData.frequentClientsCount}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Average Revenue</h3>
              </div>
              <p className="text-2xl font-bold mt-2">฿{summaryData.averageRevenue.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium">Average Work Days</h3>
              </div>
              <p className="text-2xl font-bold mt-2">{averageWorkDays.toFixed(1)} Days</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Monthly Overview</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={combinedMonthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "Revenue") return `฿${value.toLocaleString()}`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="count" name="Number of Jobs" fill="#82ca9d" />
                  <Line yAxisId="left" type="monotone" dataKey="total" name="Revenue" stroke="#8884d8" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <PieChart className="w-5 h-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Revenue by Frequent Clients</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={clientRevenueData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {clientRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Revenue by Service Type</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="value" name="Revenue (฿)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-semibold">Revenue by Type and Speed</h2>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jobSpeedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Subtitle" name="Subtitle" fill="#8884d8" />
                    <Bar dataKey="Transcription" name="Transcription" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Service Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <PieChart className="w-5 h-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Transcription Types</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={transcriptionTypeChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {transcriptionTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <PieChart className="w-5 h-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Subtitle Languages</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={subtitleLanguageChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {subtitleLanguageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Recent Projects Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Recent Projects</h2>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px]">Time</TableHead>
                  <TableHead className="w-[150px]">Date</TableHead>
                  <TableHead className="w-[200px]">Due Date</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right w-[150px]">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJobs.map((job) => (
                  <TableRow key={job.date} className="hover:bg-muted/50">
                    <TableCell>
                      {new Date(job.date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Date(job.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {job.custom_due_date ? (
                        <div>
                          <div className="text-primary">
                            {new Date(job.custom_due_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">(Custom)</div>
                        </div>
                      ) : (
                        <div>
                          {new Date(new Date(job.date).setDate(new Date(job.date).getDate() + job.estimated_days))
                            .toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{job.job_title}</TableCell>
                    <TableCell>{job.client_name}</TableCell>
                    <TableCell className="text-right font-medium">฿{job.total.toLocaleString()}</TableCell>
                    <TableCell className="text-right p-2">
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
      </div>

      <Dialog open={showTopClients} onOpenChange={setShowTopClients}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Top 10 Frequent Clients</DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-right">Total Jobs</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Average Revenue/Job</TableHead>
                <TableHead>Last Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topClientsData.map((client) => (
                <TableRow key={client.name}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-right">{client.totalJobs}</TableCell>
                  <TableCell className="text-right">฿{client.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right">฿{client.averageRevenue.toLocaleString()}</TableCell>
                  <TableCell>{client.lastJobDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Analysis;