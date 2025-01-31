import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, Save, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from '@/lib/supabase';

interface PriceDetails {
  basePrice: number;
  additionalFees: number;
  discount: number;
  total: number;
  estimatedDays: number;
}

interface JobData extends PriceDetails {
  jobTitle: string;
  clientName: string;
  serviceType: 'subtitle' | 'transcription';
  language: 'thai' | 'english';
  duration: number;
  date: string;
  customDueDate?: string;
  additionalServices: {
    vlog: boolean;
    rush: boolean;
    superRush: boolean;
    ultraRush: boolean;
    unclearAudio: boolean;
    dualSubs: boolean;
    interview: boolean;
    meeting: boolean;
    research: boolean;
    verbatim: boolean;
    englishTranscription: boolean;
    translation: boolean;
    unclearAudio1: boolean;
    unclearAudio2: boolean;
    timestamp: boolean;
    difficultyLevel: boolean;
  };
}

interface ClientDiscount {
  clientName: string;
  difficultyPercentage: number;
  customDiscount: number;
  hasDifficultyLevel: boolean;
}

const PriceCalculator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobTitle, setJobTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [frequentClients, setFrequentClients] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [language, setLanguage] = useState<'thai' | 'english'>('thai');
  const [customDueDate, setCustomDueDate] = useState('');
  const [additionalServices, setAdditionalServices] = useState({
    vlog: false,
    rush: false,
    superRush: false,
    ultraRush: false,
    unclearAudio: false,
    dualSubs: false,
    interview: false,
    meeting: false,
    research: false,
    verbatim: false,
    englishTranscription: false,
    translation: false,
    unclearAudio1: false,
    unclearAudio2: false,
    timestamp: false,
    difficultyLevel: false,
  });

  const [priceDetails, setPriceDetails] = useState<PriceDetails>({
    basePrice: 0,
    additionalFees: 0,
    discount: 0,
    total: 0,
    estimatedDays: 0,
  });

  const [serviceType, setServiceType] = useState<'subtitle' | 'transcription'>('subtitle');

  const [customDiscount, setCustomDiscount] = useState<number>(0);

  const [urgencyOption, setUrgencyOption] = useState<'none' | 'rush' | 'superRush' | 'ultraRush'>('none');

  const [difficultyPercentage, setDifficultyPercentage] = useState<number>(0);

  const [clientDiscounts, setClientDiscounts] = useState<ClientDiscount[]>([]);

  useEffect(() => {
    // โหลดรายชื่อลูกค้าประจำเมื่อคอมโพเนนต์โหลด
    fetchFrequentClients();
  }, []);

  const fetchFrequentClients = async () => {
    try {
      const { data, error } = await supabase
        .from('frequent_clients')
        .select('name')
        .order('name');

      if (error) throw error;
      setFrequentClients(data?.map(client => client.name) || []);
    } catch (error) {
      console.error('Error fetching frequent clients:', error);
      toast({
        title: "Error",
        description: "Could not load frequent clients",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Update additionalServices when urgencyOption changes
    setAdditionalServices(prev => ({
      ...prev,
      rush: urgencyOption === 'rush',
      superRush: urgencyOption === 'superRush',
      ultraRush: urgencyOption === 'ultraRush'
    }));
  }, [urgencyOption]);

  useEffect(() => {
    // โหลดข้อมูลส่วนลดองลูกค้าเมื่อคอมโพเนนต์โหลด
    const savedDiscounts = JSON.parse(localStorage.getItem('clientDiscounts') || '[]');
    setClientDiscounts(savedDiscounts);
  }, []);

  // อัพเดทข้อมูลส่วนลดเมื่อมีการเปลี่ยนแปลง
  const updateClientDiscount = () => {
    if (!clientName) return;

    const updatedDiscounts = [...clientDiscounts];
    const existingIndex = updatedDiscounts.findIndex(d => d.clientName === clientName);

    if (existingIndex >= 0) {
      updatedDiscounts[existingIndex] = {
        clientName,
        difficultyPercentage,
        customDiscount
      };
    } else {
      updatedDiscounts.push({
        clientName,
        difficultyPercentage,
        customDiscount
      });
    }

    setClientDiscounts(updatedDiscounts);
    localStorage.setItem('clientDiscounts', JSON.stringify(updatedDiscounts));
  };

  // โหลดข้อมูลส่วนลดเมื่อเลือกลูกค้า
  const handleClientSelect = (value: string) => {
    setClientName(value);
    const clientDiscount = clientDiscounts.find(d => d.clientName === value);
    if (clientDiscount) {
      // ถ้าเคยบันทึกข้อมูลไว้ ให้โหลค่าล่าสุดที่บันทึก
      setDifficultyPercentage(clientDiscount.hasDifficultyLevel ? clientDiscount.difficultyPercentage : 0);
      setCustomDiscount(clientDiscount.customDiscount);
      setAdditionalServices(prev => ({
        ...prev,
        difficultyLevel: clientDiscount.hasDifficultyLevel
      }));
    } else {
      // ถ้าไม่เคยบันทึก ให้เริ่มจากค่าเริ่มต้น
      setDifficultyPercentage(0);
      setCustomDiscount(0);
      setAdditionalServices(prev => ({
        ...prev,
        difficultyLevel: false
      }));
    }
  };

  const addFrequentClient = async () => {
    if (!clientName || frequentClients.includes(clientName)) return;
    
    try {
      const { error } = await supabase
        .from('frequent_clients')
        .insert([{ name: clientName }]);

      if (error) throw error;

      // รีโหลดข้อมูลหลังเพิ่ม
      fetchFrequentClients();
      
      toast({
        title: "เพิ่มลูกค้าประจำ",
        description: `เพิ่ม ${clientName} เป็นลูกค้าประจำแล้ว`,
      });
    } catch (error) {
      console.error('Error adding frequent client:', error);
      toast({
        title: "Error",
        description: "Could not add frequent client",
        variant: "destructive",
      });
    }
  };

  const removeFrequentClient = async (clientToRemove: string) => {
    try {
      const { error } = await supabase
        .from('frequent_clients')
        .delete()
        .eq('name', clientToRemove);

      if (error) throw error;

      // รีโหลดข้อมูลหลังลบ
      fetchFrequentClients();
      
      if (clientName === clientToRemove) {
        setClientName('');
      }
      
      toast({
        title: "ลบลูกค้าประจำ",
        description: `ลบ ${clientToRemove} ออกจากรายการแล้ว`,
      });
    } catch (error) {
      console.error('Error removing frequent client:', error);
      toast({
        title: "Error",
        description: "Could not remove frequent client",
        variant: "destructive",
      });
    }
  };

  const calculateSubtitlePrice = () => {
    let basePrice = 0;
    let additionalFees = 0;
    let discount = 0;
    let estimatedDays = 0;

    if (language === 'thai') {
      basePrice = duration <= 4 ? 300 : 300 + (duration - 4) * 29;
      estimatedDays = Math.ceil(duration / (additionalServices.ultraRush ? 40 : additionalServices.superRush ? 30 : additionalServices.rush ? 20 : 10));
    } else {
      basePrice = duration <= 4 ? 400 : 400 + (duration - 4) * 54;
      estimatedDays = Math.ceil(duration / (additionalServices.ultraRush ? 25 : additionalServices.superRush ? 17 : additionalServices.rush ? 12 : 8));
    }

    if (additionalServices.vlog) additionalFees += basePrice * 0.15;
    if (additionalServices.unclearAudio) additionalFees += basePrice * 0.20;
    if (additionalServices.dualSubs) additionalFees += basePrice * 0.40;
    if (additionalServices.difficultyLevel) additionalFees += basePrice * (difficultyPercentage / 100);

    if (duration >= 60) {
      discount = basePrice * 0.10;
    } else if (duration >= 30) {
      discount = basePrice * 0.05;
    }

    if (additionalServices.dualSubs) {
      discount += basePrice * 0.15;
    }

    if (customDiscount > 0) {
      discount += basePrice * (customDiscount / 100);
    }

    let subtotal = basePrice + additionalFees - discount;

    if (additionalServices.ultraRush) {
      additionalFees += subtotal * 0.70;
    } else if (additionalServices.superRush) {
      additionalFees += subtotal * 0.50;
    } else if (additionalServices.rush) {
      additionalFees += subtotal * 0.30;
    }

    return {
      basePrice,
      additionalFees,
      discount,
      total: basePrice + additionalFees - discount,
      estimatedDays,
    };
  };

  const calculateTranscriptionPrice = () => {
    let basePrice = 0;
    let additionalFees = 0;
    let discount = 0;
    let estimatedDays = 0;

    if (additionalServices.translation) {
      basePrice = duration * 35;
    } else if (additionalServices.englishTranscription) {
      basePrice = duration * 13;
    } else if (additionalServices.verbatim) {
      basePrice = duration * 12;
    } else if (additionalServices.interview || additionalServices.meeting || additionalServices.research) {
      basePrice = duration * 11;
    } else {
      basePrice = duration * 9;
    }

    if (additionalServices.unclearAudio1) {
      additionalFees += duration * 2;
    }
    if (additionalServices.timestamp) {
      additionalFees += basePrice * 0.30;
    }
    if (additionalServices.difficultyLevel) {
      additionalFees += basePrice * (difficultyPercentage / 100);
    }

    const hoursOfWork = duration / 60;
    if ((additionalServices.interview || additionalServices.meeting || additionalServices.research) && hoursOfWork >= 20) {
      discount = basePrice * 0.15;
    } else if ((additionalServices.interview || additionalServices.meeting || additionalServices.research) && hoursOfWork >= 10) {
      discount = basePrice * 0.10;
    }

    if (customDiscount > 0) {
      discount += basePrice * (customDiscount / 100);
    }

    let subtotal = basePrice + additionalFees - discount;

    if (additionalServices.ultraRush) {
      additionalFees += subtotal * 0.70;
    } else if (additionalServices.superRush) {
      additionalFees += subtotal * 0.50;
    } else if (additionalServices.rush) {
      additionalFees += subtotal * 0.30;
    }

    const minutesPerDay = additionalServices.ultraRush ? 80 : additionalServices.superRush ? 60 : additionalServices.rush ? 20 : 12;
    estimatedDays = Math.ceil(duration / minutesPerDay);

    return {
      basePrice,
      additionalFees,
      discount,
      total: basePrice + additionalFees - discount,
      estimatedDays,
    };
  };

  useEffect(() => {
    const price = serviceType === 'subtitle' ? calculateSubtitlePrice() : calculateTranscriptionPrice();
    setPriceDetails(price);
  }, [duration, language, additionalServices, serviceType, customDiscount, difficultyPercentage]);

  const handleSave = async () => {
    if (!jobTitle || !clientName || !duration) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "ต้องระบุชื่องาน, ชื่อลูกค้า และระยะเวลา",
        variant: "destructive",
      });
      return;
    }

    try {
      const newJob = {
        job_title: jobTitle,
        client_name: clientName,
        service_type: serviceType,
        language,
        duration,
        date: new Date().toISOString(),
        custom_due_date: customDueDate,
        additional_services: additionalServices,
        base_price: priceDetails.basePrice,
        additional_fees: priceDetails.additionalFees,
        discount: priceDetails.discount,
        total: priceDetails.total,
        estimated_days: priceDetails.estimatedDays
      };

      console.log('Saving data:', newJob);

      const { data, error } = await supabase
        .from('projects')
        .insert([newJob]);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Saved data:', data);

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "บันทึกข้อมูลไปยัง Supabase เรียบร้อยแล้ว",
      });

      handleReset();
    } catch (error: any) {
      console.error('Error details:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    // รีเซ็ตข้อมูลทั้งหมดกลับไปเป็นค่าเริ่มต้น
    setJobTitle('');
    setClientName('');
    setDuration(0);
    setLanguage('thai');
    setServiceType('subtitle');
    setCustomDueDate('');
    setUrgencyOption('none');
    setDifficultyPercentage(0);
    setCustomDiscount(0);
    setAdditionalServices({
      vlog: false,
      rush: false,
      superRush: false,
      ultraRush: false,
      unclearAudio: false,
      dualSubs: false,
      interview: false,
      meeting: false,
      research: false,
      verbatim: false,
      englishTranscription: false,
      translation: false,
      unclearAudio1: false,
      unclearAudio2: false,
      timestamp: false,
      difficultyLevel: false,
    });

    toast({
      title: "Reset Complete",
      description: "All fields have been cleared",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-secondary">Service Price Calculator</h1>
          </div>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <Card className="p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter job title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <Select onValueChange={handleClientSelect} value={clientName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select or type new client name" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequentClients.map((client) => (
                        <div key={client} className="flex items-center px-2 py-1.5 relative">
                          <SelectItem value={client}>
                            {client}
                          </SelectItem>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 opacity-0 hover:opacity-100 p-1 h-6"
                            onClick={() => removeFrequentClient(client)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                          </Button>
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Or type new client name"
                  className="flex-1"
                />
                <Button 
                  onClick={addFrequentClient}
                  variant="outline"
                  size="icon"
                  title="Add to frequent clients"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs 
            value={serviceType} 
            onValueChange={(value) => setServiceType(value as 'subtitle' | 'transcription')} 
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subtitle">Subtitle Service</TabsTrigger>
              <TabsTrigger value="transcription">Transcription Service</TabsTrigger>
            </TabsList>
          </Tabs>

          {serviceType === 'subtitle' ? (
            <Tabs 
              value={language}
              onValueChange={(value) => setLanguage(value as 'thai' | 'english')}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="thai">Thai Subtitles</TabsTrigger>
                <TabsTrigger value="english">English Subtitles</TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="duration">Video Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={duration || ''}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <Label>Additional Services</Label>
                    {[
                      { id: 'vlog', label: 'Vlog (+15%)' },
                      { id: 'unclearAudio', label: 'Unclear Audio (+20%)' },
                      { id: 'dualSubs', label: 'Dual Subtitles (+40%)' },
                    ].map(({ id, label }) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={additionalServices[id as keyof typeof additionalServices]}
                          onCheckedChange={(checked) =>
                            setAdditionalServices((prev) => ({
                              ...prev,
                              [id]: checked,
                            }))
                          }
                        />
                        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {label}
                        </label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2 mt-2">
                      <Checkbox
                        id="difficultyLevel"
                        checked={additionalServices.difficultyLevel}
                        onCheckedChange={(checked) =>
                          setAdditionalServices((prev) => ({
                            ...prev,
                            difficultyLevel: checked === true,
                          }))
                        }
                      />
                      <label htmlFor="difficultyLevel" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Difficulty Level Surcharge
                      </label>
                      {additionalServices.difficultyLevel && (
                        <div className="flex items-center space-x-1">
                          <span>(+</span>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={difficultyPercentage || ''}
                            onChange={(e) => setDifficultyPercentage(Number(e.target.value))}
                            className="w-16 h-7 text-sm"
                            placeholder="0-100"
                          />
                          <span>%)</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <Label>Urgency Options</Label>
                      <RadioGroup
                        value={urgencyOption}
                        onValueChange={(value) => setUrgencyOption(value as 'none' | 'rush' | 'superRush' | 'ultraRush')}
                        className="mt-2 space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="none" id="none" />
                          <label htmlFor="none" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Normal Speed
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rush" id="rush" />
                          <label htmlFor="rush" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Rush Order (+30%)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="superRush" id="superRush" />
                          <label htmlFor="superRush" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Super Rush (+50%)
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ultraRush" id="ultraRush" />
                          <label htmlFor="ultraRush" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Ultra Rush (+70%)
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="bg-accent p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-semibold">฿{priceDetails.basePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Additional Fees:</span>
                      <span className="font-semibold text-primary">
                        +฿{priceDetails.additionalFees.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>Custom Discount (%):</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={customDiscount || ''}
                          onChange={(e) => setCustomDiscount(Number(e.target.value))}
                          className="w-20 h-8"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span>Discounts:</span>
                        <span className="font-semibold text-green-500">
                          -฿{priceDetails.discount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 pl-4">
                        {duration >= 60 && (
                          <div>• Duration Discount (60+ mins): 10%</div>
                        )}
                        {duration >= 30 && duration < 60 && (
                          <div>• Duration Discount (30-59 mins): 5%</div>
                        )}
                        {additionalServices.dualSubs && (
                          <div>• Dual Subtitles Discount: 15%</div>
                        )}
                        {serviceType === 'transcription' && additionalServices.interview && duration >= 1200 && (
                          <div>• Interview Duration Discount (20+ hrs): 15%</div>
                        )}
                        {serviceType === 'transcription' && additionalServices.interview && duration >= 600 && duration < 1200 && (
                          <div>• Interview Duration Discount (10-19 hrs): 10%</div>
                        )}
                        {customDiscount > 0 && (
                          <div>• Custom Discount: {customDiscount}%</div>
                        )}
                      </div>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">฿{priceDetails.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-4">
                      Estimated delivery: {priceDetails.estimatedDays} days
                      {priceDetails.estimatedDays > 0 && (
                        <div className="text-primary font-medium">
                          (Due: {new Date(new Date().setDate(new Date().getDate() + priceDetails.estimatedDays)).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
                        </div>
                      )}
                      <div className="mt-2">
                        <Label htmlFor="customDueDate">Custom Due Date (Optional)</Label>
                        <Input
                          id="customDueDate"
                          type="date"
                          value={customDueDate}
                          onChange={(e) => setCustomDueDate(e.target.value)}
                          min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4"
                      onClick={handleSave}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Job Data
                    </Button>
                  </div>
                </div>
              </div>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <Tabs 
                value={additionalServices.interview ? 'interview' : 
                       additionalServices.meeting ? 'interview' :
                       additionalServices.research ? 'interview' :
                       additionalServices.verbatim ? 'verbatim' :
                       additionalServices.englishTranscription ? 'englishTranscription' :
                       additionalServices.translation ? 'translation' : 'normal'}
                onValueChange={(value) => {
                  const newServices = {
                    ...additionalServices,
                    interview: false,
                    meeting: false,
                    research: false,
                    verbatim: false,
                    englishTranscription: false,
                    translation: false,
                  };
                  if (value === 'interview') {
                    newServices.interview = true;
                  } else {
                    newServices[value === 'verbatim' ? 'verbatim' : 
                             value === 'englishTranscription' ? 'englishTranscription' :
                             value === 'translation' ? 'translation' : ''] = true;
                  }
                  setAdditionalServices(newServices);
                }}
              >
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                  <TabsTrigger value="interview">Interview/Meeting/Research</TabsTrigger>
                  <TabsTrigger value="verbatim">Verbatim</TabsTrigger>
                  <TabsTrigger value="englishTranscription">English</TabsTrigger>
                  <TabsTrigger value="translation">Translation</TabsTrigger>
                </TabsList>
              </Tabs>

              {(additionalServices.interview || additionalServices.meeting || additionalServices.research) && (
                <div className="mb-4">
                  <Label>Type of Work</Label>
                  <RadioGroup
                    value={additionalServices.interview ? 'interview' : 
                           additionalServices.meeting ? 'meeting' : 'research'}
                    onValueChange={(value) => {
                      setAdditionalServices(prev => ({
                        ...prev,
                        interview: value === 'interview',
                        meeting: value === 'meeting',
                        research: value === 'research'
                      }));
                    }}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="interview" id="interview-type" />
                      <label htmlFor="interview-type" className="text-sm font-medium leading-none">
                        Interview
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="meeting" id="meeting-type" />
                      <label htmlFor="meeting-type" className="text-sm font-medium leading-none">
                        Meeting
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="research" id="research-type" />
                      <label htmlFor="research-type" className="text-sm font-medium leading-none">
                        Research
                      </label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              <div>
                <Label htmlFor="duration">Audio Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={duration || ''}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label>Additional Services</Label>
                  {[
                    { id: 'unclearAudio1', label: 'Unclear Audio (+฿2/min)' },
                    { id: 'timestamp', label: 'Add Timestamp (+30%)' },
                  ].map(({ id, label }) => (
                    <div key={id} className="flex items-center space-x-2">
                      <Checkbox
                        id={id}
                        checked={additionalServices[id as keyof typeof additionalServices]}
                        onCheckedChange={(checked) =>
                          setAdditionalServices((prev) => ({
                            ...prev,
                            [id]: checked,
                          }))
                        }
                      />
                      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                      </label>
                    </div>
                  ))}

                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="difficultyLevel-trans"
                      checked={additionalServices.difficultyLevel}
                      onCheckedChange={(checked) =>
                        setAdditionalServices((prev) => ({
                          ...prev,
                          difficultyLevel: checked === true,
                        }))
                      }
                    />
                    <label htmlFor="difficultyLevel-trans" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Difficulty Level Surcharge
                    </label>
                    {additionalServices.difficultyLevel && (
                      <div className="flex items-center space-x-1">
                        <span>(+</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={difficultyPercentage || ''}
                          onChange={(e) => setDifficultyPercentage(Number(e.target.value))}
                          className="w-16 h-7 text-sm"
                          placeholder="0-100"
                        />
                        <span>%)</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Label>Urgency Options</Label>
                    <RadioGroup
                      value={urgencyOption}
                      onValueChange={(value) => setUrgencyOption(value as 'none' | 'rush' | 'superRush' | 'ultraRush')}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="none" id="none-trans" />
                        <label htmlFor="none-trans" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Normal Speed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rush" id="rush-trans" />
                        <label htmlFor="rush-trans" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Rush Order (+30%)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="superRush" id="superRush-trans" />
                        <label htmlFor="superRush-trans" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Super Rush (+50%)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ultraRush" id="ultraRush-trans" />
                        <label htmlFor="ultraRush-trans" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Ultra Rush (+70%)
                        </label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="bg-accent p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span className="font-semibold">฿{priceDetails.basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Additional Fees:</span>
                    <span className="font-semibold text-primary">
                      +฿{priceDetails.additionalFees.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span>Custom Discount (%):</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={customDiscount || ''}
                        onChange={(e) => setCustomDiscount(Number(e.target.value))}
                        className="w-20 h-8"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span>Discounts:</span>
                      <span className="font-semibold text-green-500">
                        -฿{priceDetails.discount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 pl-4">
                      {duration >= 60 && (
                        <div>• Duration Discount (60+ mins): 10%</div>
                      )}
                      {duration >= 30 && duration < 60 && (
                        <div>• Duration Discount (30-59 mins): 5%</div>
                      )}
                      {additionalServices.dualSubs && (
                        <div>• Dual Subtitles Discount: 15%</div>
                      )}
                      {serviceType === 'transcription' && additionalServices.interview && duration >= 1200 && (
                        <div>• Interview Duration Discount (20+ hrs): 15%</div>
                      )}
                      {serviceType === 'transcription' && additionalServices.interview && duration >= 600 && duration < 1200 && (
                        <div>• Interview Duration Discount (10-19 hrs): 10%</div>
                      )}
                      {customDiscount > 0 && (
                        <div>• Custom Discount: {customDiscount}%</div>
                      )}
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">฿{priceDetails.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mt-4">
                    Estimated delivery: {priceDetails.estimatedDays} days
                    {priceDetails.estimatedDays > 0 && (
                      <div className="text-primary font-medium">
                        (Due: {new Date(new Date().setDate(new Date().getDate() + priceDetails.estimatedDays)).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
                      </div>
                    )}
                    <div className="mt-2">
                      <Label htmlFor="customDueDate">Custom Due Date (Optional)</Label>
                      <Input
                        id="customDueDate"
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    onClick={handleSave}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Job Data
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PriceCalculator;
