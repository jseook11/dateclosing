import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import supabase from './lib/supabase';

const RootPage = ({ storedNickname = '' }) => {
  const [deviceId, setDeviceId] = useState('');
  const [nickname, setNickname] = useState(storedNickname);
  const [editingName, setEditingName] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [answers, setAnswers] = useState({
    pain: { value: 'no', detail: '' },
    suggestion: { value: 'no', detail: '' },
    question: { value: 'no', detail: '' },
  });

  useEffect(() => {
    setNickname(storedNickname);
  }, [storedNickname]);

  useEffect(() => {
    const detectAndCheckSubmission = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const id = result.visitorId;
      setDeviceId(id);

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data, error } = await supabase
        .from('daily_checkin')
        .select('pain_value, pain_detail, suggestion_value, suggestion_detail, question_value, question_detail')
        .eq('device_id', id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('❌ 데이터 조회 실패:', error.message);
      }

      if (data) {
        setSubmittedData(data);
        setAlreadySubmitted(true);
      }
    };

    detectAndCheckSubmission();
  }, []);

  const handleRadioChange = (key, value) => {
    setAnswers(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
        detail: value === 'no' ? '' : prev[key].detail
      }
    }));
  };

  const handleTextChange = (key, text) => {
    setAnswers(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        detail: text
      }
    }));
  };

  const handleNameSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('devices')
      .update({ nickname: trimmed })
      .eq('device_id', deviceId);
    if (!error) {
      setEditingName(false);
    } else {
      alert('닉네임 업데이트 실패');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('daily_checkin').insert({
      device_id: deviceId,
      pain_value: answers.pain.value,
      pain_detail: answers.pain.detail,
      suggestion_value: answers.suggestion.value,
      suggestion_detail: answers.suggestion.detail,
      question_value: answers.question.value,
      question_detail: answers.question.detail,
    });

    if (error) {
      console.error('❌ 제출 실패:', error.message);
      alert('제출에 실패했어요.');
    } else {
      alert('제출 완료! 감사합니다.');
      setSubmittedData({
        pain_value: answers.pain.value,
        pain_detail: answers.pain.detail,
        suggestion_value: answers.suggestion.value,
        suggestion_detail: answers.suggestion.detail,
        question_value: answers.question.value,
        question_detail: answers.question.detail,
      });
      setAlreadySubmitted(true);
    }
  };

  if (alreadySubmitted) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">내 정보</h2>
          {!editingName ? (
            <div>
              <p className="mb-2">닉네임: {nickname}</p>
              <button type="button" onClick={() => setEditingName(true)} className="px-2 py-1 bg-gray-200 rounded">수정</button>
            </div>
          ) : (
            <div>
              <input className="w-full border rounded p-2 mb-2" value={nickname} onChange={(e) => setNickname(e.target.value)} />
              <button type="button" onClick={handleNameSave} className="mr-2 px-2 py-1 bg-blue-500 text-white rounded">저장</button>
              <button type="button" onClick={() => { setNickname(storedNickname); setEditingName(false); }} className="px-2 py-1 bg-gray-200 rounded">취소</button>
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold text-green-700">오늘은 이미 제출하셨습니다 😊</h2>
        {submittedData && (
          <div className="mt-4 space-y-2 bg-gray-100 p-4 rounded">
            <p>아픈 곳: {submittedData.pain_value === 'yes' ? submittedData.pain_detail || '예' : '아니요'}</p>
            <p>건의사항: {submittedData.suggestion_value === 'yes' ? submittedData.suggestion_detail || '예' : '아니요'}</p>
            <p>궁금한 점: {submittedData.question_value === 'yes' ? submittedData.question_detail || '예' : '아니요'}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="card mb-4">
        <h2 className="text-lg font-semibold mb-2">내 정보</h2>
        {!editingName ? (
          <div>
            <p className="mb-2">닉네임: {nickname}</p>
            <button type="button" onClick={() => setEditingName(true)} className="px-2 py-1 bg-gray-200 rounded">수정</button>
          </div>
        ) : (
          <div>
            <input className="w-full border rounded p-2 mb-2" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <button type="button" onClick={handleNameSave} className="mr-2 px-2 py-1 bg-blue-500 text-white rounded">저장</button>
            <button type="button" onClick={() => { setNickname(storedNickname); setEditingName(false); }} className="px-2 py-1 bg-gray-200 rounded">취소</button>
          </div>
        )}
      </div>
      <h1 className="text-2xl font-bold mb-4">오늘의 체크인</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {['pain', 'suggestion', 'question'].map((key) => (
          <div key={key}>
            <p className="font-semibold mb-1">
              {key === 'pain' && '아픈 곳 있는지?'}
              {key === 'suggestion' && '건의사항 있는지?'}
              {key === 'question' && '궁금한 점 있는지?'}
            </p>
            <div className="flex gap-4 mb-2">
              <label>
                <input
                  type="radio"
                  name={`${key}`}
                  value="no"
                  checked={answers[key].value === 'no'}
                  onChange={() => handleRadioChange(key, 'no')}
                />{' '}
                아니요
              </label>
              <label>
                <input
                  type="radio"
                  name={`${key}`}
                  value="yes"
                  checked={answers[key].value === 'yes'}
                  onChange={() => handleRadioChange(key, 'yes')}
                />{' '}
                예
              </label>
            </div>
            {answers[key].value === 'yes' && (
              <textarea
                className="w-full border rounded p-2"
                placeholder="자세히 입력해주세요"
                value={answers[key].detail}
                onChange={(e) => handleTextChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          제출하기
        </button>
      </form>
    </div>
  );
};

export default RootPage;
