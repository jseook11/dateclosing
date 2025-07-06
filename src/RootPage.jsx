import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import supabase from './lib/supabase';

const RootPage = ({ deviceId: initialDeviceId = '', nickname: initialNickname = '' }) => {
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [nickname, setNickname] = useState(initialNickname);
  const [newNickname, setNewNickname] = useState(initialNickname);
  const [editingNickname, setEditingNickname] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [answers, setAnswers] = useState({
    pain: { value: 'no', detail: '' },
    suggestion: { value: 'no', detail: '' },
    question: { value: 'no', detail: '' },
  });

  useEffect(() => {
    const detectAndCheckSubmission = async () => {
      let id = initialDeviceId;
      if (!id) {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        id = result.visitorId;
      }
      setDeviceId(id);

      if (!initialNickname) {
        const { data: deviceData } = await supabase
          .from('devices')
          .select('nickname')
          .eq('device_id', id)
          .maybeSingle();
        if (deviceData) {
          setNickname(deviceData.nickname);
          setNewNickname(deviceData.nickname);
        }
      }

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
  }, [initialDeviceId, initialNickname]);

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

  const handleNicknameUpdate = async (e) => {
    e.preventDefault();
    const trimmed = newNickname.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('devices')
      .update({ nickname: trimmed })
      .eq('device_id', deviceId);

    if (error) {
      console.error('닉네임 업데이트 실패:', error.message);
      alert('닉네임 수정에 실패했습니다.');
    } else {
      setNickname(trimmed);
      setEditingNickname(false);
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
        <div className="mb-4">
          {editingNickname ? (
            <form onSubmit={handleNicknameUpdate} className="flex gap-2 items-center">
              <input
                className="border rounded p-1 flex-1"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
              />
              <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">
                저장
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingNickname(false);
                  setNewNickname(nickname);
                }}
                className="px-2 py-1"
              >
                취소
              </button>
            </form>
          ) : (
            <p>
              현재 닉네임: <span className="font-semibold">{nickname}</span>{' '}
              <button
                type="button"
                onClick={() => setEditingNickname(true)}
                className="text-blue-500 underline"
              >
                수정
              </button>
            </p>
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
      <div className="mb-4">
        {editingNickname ? (
          <form onSubmit={handleNicknameUpdate} className="flex gap-2 items-center">
            <input
              className="border rounded p-1 flex-1"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
            />
            <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingNickname(false);
                setNewNickname(nickname);
              }}
              className="px-2 py-1"
            >
              취소
            </button>
          </form>
        ) : (
          <p>
            현재 닉네임: <span className="font-semibold">{nickname}</span>{' '}
            <button
              type="button"
              onClick={() => setEditingNickname(true)}
              className="text-blue-500 underline"
            >
              수정
            </button>
          </p>
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