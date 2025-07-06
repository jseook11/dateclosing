import React, { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import supabase from './lib/supabase';
import RootPage from './RootPage';

const DeviceRegistration = () => {
  const [deviceId, setDeviceId] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [nickname, setNickname] = useState('');
  const [storedNickname, setStoredNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const checkDevice = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const id = result.visitorId;
      setDeviceId(id);

      const { data, error } = await supabase
        .from('devices')
        .select('nickname')
        .eq('device_id', id)
        .maybeSingle();

      if (data) {
        setStoredNickname(data.nickname);
        setIsRegistered(true);
      } else if (error) {
        console.error('Device lookup error:', error.message);
      }
      setChecking(false);
    };

    checkDevice();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!nickname.trim()) return;
    const { error } = await supabase.from('devices').insert({
      device_id: deviceId,
      nickname: nickname.trim(),
    });

    if (error) {
      console.error('Registration failed:', error.message);
      setErrorMsg('등록에 실패했습니다.');
    } else {
      setStoredNickname(nickname.trim());
      setIsRegistered(true);
    }
  };

  if (checking) {
    return <p>로딩 중...</p>;
  }

  if (isRegistered) {
    return <RootPage storedNickname={storedNickname} />;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">닉네임 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border rounded p-2"
          placeholder="닉네임을 입력하세요"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          등록
        </button>
        {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
      </form>
    </div>
  );
};

export default DeviceRegistration;
