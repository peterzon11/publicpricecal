import React, { useState, useEffect } from 'react';
// ... existing imports ...

const PriceCalculator = () => {
  // ... existing state ...

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

  // ... rest of the component code ...
}; 