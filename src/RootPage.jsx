import React, { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import supabase from './lib/supabase';

const RootPage = () => {
  const [deviceId, setDeviceId] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
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

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  if (alreadySubmitted) {
    return (
      <div className="checkin-container">
        <h2 className="submitted-title">오늘은 이미 제출하셨습니다 😊</h2>
        {submittedData && (
          <div className="submitted-card">
            <p>아픈 곳: {submittedData.pain_value === 'yes' ? submittedData.pain_detail || '예' : '아니요'}</p>
            <p>건의사항: {submittedData.suggestion_value === 'yes' ? submittedData.suggestion_detail || '예' : '아니요'}</p>
            <p>궁금한 점: {submittedData.question_value === 'yes' ? submittedData.question_detail || '예' : '아니요'}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="checkin-container">
      <h1 className="page-title">{`${todayStr} 상향식 일일결산`}</h1>
      <form onSubmit={handleSubmit} className="checkin-form">
        {['pain', 'suggestion', 'question'].map((key) => (
          <div key={key} className="question-card">
            <p className="question-title">
              {key === 'pain' && '아픈 곳 있는지?'}
              {key === 'suggestion' && '건의사항 있는지?'}
              {key === 'question' && '궁금한 점 있는지?'}
            </p>
            <div className="radio-group">
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
                className="detail-textarea"
                placeholder="자세히 입력해주세요"
                value={answers[key].detail}
                onChange={(e) => handleTextChange(key, e.target.value)}
              />
            )}
          </div>
        ))}
        <button type="submit" className="submit-button">
          제출하기
        </button>
      </form>
    </div>
  );
};

export default RootPage;