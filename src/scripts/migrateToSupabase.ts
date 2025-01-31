import { supabase } from '../lib/supabase';

interface LocalJobData {
  jobTitle: string;
  clientName: string;
  serviceType: 'subtitle' | 'transcription';
  language: 'thai' | 'english';
  duration: number;
  date: string;
  total: number;
  additionalServices: {
    vlog: boolean;
    rush: boolean;
    superRush: boolean;
    unclearAudio: boolean;
    dualSubs: boolean;
  };
}

async function migrateData() {
  try {
    // ดึงข้อมูลจาก localStorage
    const localData: LocalJobData[] = JSON.parse(localStorage.getItem('jobsData') || '[]');

    // แปลงข้อมูลให้ตรงกับโครงสร้างใหม่
    const supabaseData = localData.map(job => ({
      job_title: job.jobTitle,
      client_name: job.clientName,
      service_type: job.serviceType,
      language: job.language,
      duration: job.duration,
      date: job.date,
      total: job.total,
      additional_services: job.additionalServices
    }));

    // เพิ่มข้อมูลใน Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert(supabaseData)
      .select();

    if (error) throw error;

    console.log('Migration completed successfully!');
    console.log('Migrated records:', data?.length);

    // ลบข้อมูลเก่าใน localStorage
    localStorage.removeItem('jobsData');

  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// รันฟังก์ชัน
migrateData(); 