import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import supabase from './lib/supabase';

const RootPage = () => {
  const [deviceId, setDeviceId] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [answers, setAnswers] = useState({
    pain: { value: 'no', detail: '' },
    suggestion: { value: 'no', detail: '' },
    question: { value: 'no', detail: '' },
  });

  useEffect(() => {
    const detectAndCheckSubmission = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const id = result.visitorId;
      setDeviceId(id);

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const { data, error } = await supabase
        .from('daily_checkin')
        .select('id')
        .eq('device_id', id)
        .eq('date', today);

      if (data && data.length > 0) {
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
      setAlreadySubmitted(true);
    }
  };

  if (alreadySubmitted) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold text-green-700">오늘은 이미 제출하셨습니다 😊</h2>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-xl mx-auto">
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