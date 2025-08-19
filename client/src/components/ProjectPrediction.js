import { useState, useEffect } from 'react';
import { getProjectCompletion, getProgressAnalysis } from '../api/predictions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ProjectPrediction.css';

const ProjectPrediction = ({ teamId }) => {
  const [prediction, setPrediction] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('prediction');

  useEffect(() => {
    if (teamId) {
      loadPredictionData();
    }
  }, [teamId]);

  const loadPredictionData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [predictionData, analysisData] = await Promise.all([
        getProjectCompletion(teamId),
        getProgressAnalysis(teamId)
      ]);
      
      setPrediction(predictionData.data);
      setAnalysis(analysisData.data);
    } catch (err) {
      console.error('Prediction loading error:', err);
      setError(err.response?.data?.message || '예측 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="prediction-card">
        <div className="prediction-loading">
          <div className="loading-spinner"></div>
          <p>AI가 프로젝트를 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-card">
        <div className="prediction-error">
          <p>⚠️ {error}</p>
          <button onClick={loadPredictionData} className="btn-retry">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!prediction && !analysis) {
    return null;
  }

  return (
    <div className="prediction-card">
      <div className="prediction-header">
        <h3>🤖 AI 프로젝트 예측 분석</h3>
        <div className="prediction-tabs">
          <button 
            className={`tab-btn ${activeTab === 'prediction' ? 'active' : ''}`}
            onClick={() => setActiveTab('prediction')}
          >
            완료일 예측
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            진행률 분석
          </button>
        </div>
      </div>

      {activeTab === 'prediction' && prediction && (
        <div className="prediction-content">
          {prediction.predictedCompletionDate ? (
            <>
              <div className="prediction-summary">
                <div className="completion-date">
                  <h4>📅 예상 완료일</h4>
                  <p className="date-value">
                    {new Date(prediction.predictedCompletionDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                  <p className="remaining-time">
                    (약 {prediction.remainingWeeks}주 후)
                  </p>
                </div>
                
                <div className="confidence-meter">
                  <h4>🎯 신뢰도</h4>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ 
                        width: `${prediction.confidence}%`,
                        backgroundColor: prediction.confidence >= 70 ? 'var(--success-color)' : 
                                       prediction.confidence >= 40 ? 'var(--warning-color)' : 
                                       'var(--danger-color)'
                      }}
                    />
                    <span className="confidence-text">{prediction.confidence}%</span>
                  </div>
                </div>
              </div>

              <div className="prediction-stats">
                <div className="stat-item">
                  <span className="stat-label">현재 진행률</span>
                  <span className="stat-value">{prediction.currentProgress}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">주간 평균 진행률</span>
                  <span className="stat-value">{prediction.averageWeeklyProgress}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">최근 트렌드</span>
                  <span className={`stat-value ${parseFloat(prediction.recentTrend) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(prediction.recentTrend) >= 0 ? '+' : ''}{prediction.recentTrend}%
                  </span>
                </div>
              </div>

              <div className="prediction-message">
                <p>{prediction.message}</p>
              </div>

              <div className="recommendations">
                <h4>💡 AI 추천사항</h4>
                <ul>
                  {prediction.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="no-prediction">
              <p>📊 {prediction.message}</p>
              {prediction.recommendations && (
                <div className="recommendations">
                  <h4>💡 시작하기 위한 추천사항</h4>
                  <ul>
                    {prediction.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analysis' && analysis && (
        <div className="analysis-content">
          {analysis.chartData && analysis.chartData.length > 0 ? (
            <>
              <div className="chart-container">
                <h4>📈 진행률 추이</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analysis.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="week" 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      formatter={(value) => [`${value}%`, '진행률']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="var(--primary-color)" 
                      strokeWidth={3}
                      dot={{ fill: 'var(--primary-color)', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, fill: 'var(--primary-color)' }}
                      name="진행률"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="analysis-insights">
                <h4>📊 분석 인사이트</h4>
                <div className="insights-grid">
                  <div className="insight-item">
                    <span className="insight-label">총 보고서</span>
                    <span className="insight-value">{analysis.totalReports}개</span>
                  </div>
                  <div className="insight-item">
                    <span className="insight-label">평균 진행률</span>
                    <span className="insight-value">{analysis.averageProgress}%</span>
                  </div>
                </div>
                
                <ul className="insights-list">
                  {analysis.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="no-analysis">
              <p>📊 {analysis.message || '분석할 데이터가 충분하지 않습니다.'}</p>
              <p>더 정확한 분석을 위해 주간 보고서를 지속적으로 작성해주세요.</p>
            </div>
          )}
        </div>
      )}

      <div className="prediction-footer">
        <small>
          ⚠️ AI 예측은 참고용이며, 실제 결과와 다를 수 있습니다. 
          지속적인 보고서 업데이트로 예측 정확도를 향상시킬 수 있습니다.
        </small>
      </div>
    </div>
  );
};

export default ProjectPrediction;