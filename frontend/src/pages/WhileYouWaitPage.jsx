import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const QuizCard = ({ question, options, answer }) => {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (opt) => {
    if (revealed) return;
    setSelected(opt);
    setRevealed(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-4 hover:shadow-md transition-shadow">
      <h3 className="font-bold text-gray-800 mb-4 text-lg">{question}</h3>
      <div className="space-y-2">
        {options.map((opt, i) => {
          let btnClass = "w-full text-left p-3 rounded-lg border transition-colors ";
          if (!revealed) {
            btnClass += "border-gray-200 hover:bg-blue-50 hover:border-blue-300";
          } else {
            if (opt === answer) {
              btnClass += "bg-green-100 border-green-500 text-green-800 font-medium";
            } else if (opt === selected) {
              btnClass += "bg-red-50 border-red-300 text-red-600";
            } else {
              btnClass += "border-gray-200 opacity-50";
            }
          }

          return (
            <button 
              key={i} 
              onClick={() => handleSelect(opt)}
              className={btnClass}
              disabled={revealed}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100">
          {selected === answer ? 'Correct! ' : 'Not quite. '} 
          The answer is: <span className="font-bold">{answer}</span>
        </div>
      )}
    </div>
  );
};

const WhileYouWaitPage = () => {
  const { t } = useTranslation();

  const quizData = [
    {
      q: t('q1'),
      opts: [t('q1_o1'), t('q1_o2'), t('q1_o3'), t('q1_o4')],
      a: t('q1_ans')
    },
    {
      q: t('q2'),
      opts: [t('q2_o1'), t('q2_o2'), t('q2_o3'), t('q2_o4')],
      a: t('q2_ans')
    },
    {
      q: t('q3'),
      opts: [t('q3_o1'), t('q3_o2'), t('q3_o3'), t('q3_o4')],
      a: t('q3_ans')
    },
    {
      q: t('q4'),
      opts: [t('q4_o1'), t('q4_o2'), t('q4_o3'), t('q4_o4')],
      a: t('q4_ans')
    },
    {
      q: t('q5'),
      opts: [t('q5_o1'), t('q5_o2'), t('q5_o3'), t('q5_o4')],
      a: t('q5_ans')
    }
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Educational Notice Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-medium">
              {t('educational_notice')}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('health_tips')}</h1>
        <p className="text-gray-600">Test your health knowledge while you wait for your assessment to be reviewed.</p>
      </div>

      <div className="space-y-6">
        {quizData.map((quiz, index) => (
          <QuizCard 
            key={index} 
            question={quiz.q} 
            options={quiz.opts} 
            answer={quiz.a} 
          />
        ))}
      </div>
    </div>
  );
};

export default WhileYouWaitPage;
