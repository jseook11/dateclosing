import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import supabase from './lib/supabase';

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);

  const fetchRecords = async (selected) => {
    const { data, error } = await supabase
      .from('daily_checkin')
      .select('id, pain_value, pain_detail, suggestion_value, suggestion_detail, question_value, question_detail, devices ( nickname )')
      .eq('date', selected)
      .order('created_at', { ascending: false });
    if (!error) {
      setRecords(data || []);
    } else {
      console.error('failed to fetch records:', error.message);
      setRecords([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const fp = await FingerprintJS.load();
      const { visitorId } = await fp.get();
      const { data: device } = await supabase
        .from('devices')
        .select('isadmin')
        .eq('device_id', visitorId)
        .maybeSingle();
      if (device?.isadmin) {
        setAuthorized(true);
        await fetchRecords(new Date().toISOString().slice(0, 10));
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setDate(newDate);
    await fetchRecords(newDate);
  };

  if (loading) return <p>로딩 중...</p>;
  if (!authorized) return <p>접근 권한이 없습니다.</p>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h1 className="text-xl font-bold mb-2">관리자 뷰</h1>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="w-full border rounded p-2"
        />
      </div>
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="bg-white p-4 rounded-lg shadow-md">조회된 데이터가 없습니다.</div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-lg shadow-md space-y-2">
              <p><strong>이름:</strong> {r.devices?.nickname || ''}</p>
              <p><strong>환자여부:</strong> {r.pain_value === 'yes' ? (r.pain_detail || '예') : '아니오'}</p>
              <p><strong>건의사항:</strong> {r.suggestion_value === 'yes' ? (r.suggestion_detail || '예') : '없음'}</p>
              <p><strong>문의사항:</strong> {r.question_value === 'yes' ? (r.question_detail || '예') : '없음'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPage;

