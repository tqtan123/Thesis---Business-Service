"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TrendChart from '@/components/results/TrendChart';
import SentimentChart from '@/components/results/SentimentChart';
import { analysisService } from '@/services/analysisService';
import { AnalysisResult } from '@/services/types';
import { exportToPDF } from '@/utils/pdfExport';
import styles from './ResultsPage.module.css';

// 创建一个内部组件来使用 useSearchParams
function ResultsContent() {
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const keyword = searchParams.get('keyword') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';
        const videoCount = Number(searchParams.get('videoCount')) || 50;
        const commentCount = Number(searchParams.get('commentCount')) || 100;
        
        const results = await analysisService.requestAnalysis({
          keyword,
          startDate,
          endDate,
          videoCount,
          commentCount
        });
        
        setResults(results);
      } catch (error) {
        console.error('Failed to fetch results:', error);
        // 处理错误状态
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [searchParams]);

  // 处理导出PDF
  const handlePrintReport = async () => {
    if (!results) return;
    
    try {
      setExportingPDF(true);
      await exportToPDF(results);
    } finally {
      setExportingPDF(false);
    }
  };

  // 返回使用模块化样式的 JSX
  if (loading) {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.container}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <span className="ml-3">Loading analysis results...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!results) {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.container}>
          <div className={styles.errorContainer}>
            <h2 className={styles.errorTitle}>Unable to load analysis results</h2>
            <p className={styles.errorMessage}>An error occurred while loading data. Please try again.</p>
            <Link href="/" className={styles.returnLink}>
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageContainer}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleContainer}>
            <h1>Analysis Results</h1>
            <p className={styles.subtitle}>Keyword: {results.keyword} | Date Range: {results.dateRange}</p>
          </div>
          <div className={styles.buttonGroup}>
            <button 
              className={styles.actionButton}
              onClick={handlePrintReport}
              disabled={exportingPDF}
            >
              {exportingPDF ? (
                <>
                  <span className={styles.spinner}></span>
                  Creating PDF...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.buttonIcon}>
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print Report
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className={styles.chartsGrid}>
          <div className={`${styles.card} chart-for-pdf`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Trend Analysis</h2>
              <p className={styles.cardSubtitle}>Interest trend changes over the specified time period</p>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.chartContainer}>
                <TrendChart data={results.trendData} />
              </div>
            </div>
          </div>
          
          <div className={`${styles.card} chart-for-pdf`}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sentiment Distribution</h2>
              <p className={styles.cardSubtitle}>Distribution of user sentiment toward the keyword</p>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.chartContainer}>
                <SentimentChart data={results.sentimentData} />
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Analysis Conclusions</h2>
            <p className={styles.cardSubtitle}>Comprehensive analysis and recommendations based on data</p>
          </div>
          <div className={styles.cardBody}>
            {results.structuredAnalysis ? (
              <div className="space-y-6">
                {/* 整体分析部分 */}
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>Overall Analysis</h3>
                  <div className={styles.analysisContainer}>
                    <p className={styles.analysisParagraph}>
                      {results.structuredAnalysis.overallAnalysis}
                    </p>
                  </div>
                </div>
                
                {/* 推荐行动部分 */}
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>Recommendation</h3>
                  <div className={styles.analysisContainer}>
                    <p className={styles.analysisParagraph}>
                      {results.structuredAnalysis.recommendation}
                    </p>
                  </div>
                </div>
                
                {/* 预估数量部分 */}
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>Estimated Units</h3>
                  <div className={styles.analysisContainer}>
                    <p className={styles.analysisParagraph}>
                      {results.structuredAnalysis.estimatedUnits}
                    </p>
                  </div>
                </div>
                
                {/* 重要考虑因素部分 */}
                {results.structuredAnalysis.considerations.length > 0 && (
                  <div className={styles.analysisSection}>
                    <h3 className={styles.sectionTitle}>Important Considerations</h3>
                    <div className={styles.analysisContainer}>
                      <ul className={styles.recommendationsList}>
                        {results.structuredAnalysis.considerations.map((item, i) => (
                          <li key={i} className={styles.recommendationItem}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* 免责声明部分 */}
                {results.structuredAnalysis.disclaimer && (
                  <div className={styles.analysisSection}>
                    <h3 className={styles.sectionTitle}>Disclaimer</h3>
                    <div className={styles.disclaimer}>
                      <p className={styles.disclaimerText}>
                        {results.structuredAnalysis.disclaimer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 现有的非结构化显示 */}
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>Overall Analysis</h3>
                  <p className={styles.analysisParagraph}>{results.analysis}</p>
                </div>
                <div className={styles.analysisSection}>
                  <h3 className={styles.sectionTitle}>Recommendations</h3>
                  <ul className={styles.recommendationsList}>
                    {results.recommendations.map((rec, index) => (
                      <li key={index} className={styles.recommendationItem}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
        
        <Link href="/" className={styles.backLink}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.backIcon}>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Return to Home
        </Link>
      </div>
    </main>
  );
}

// 主页面组件
export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageContainer + " flex items-center justify-center"}>
        <div className={styles.spinner}></div>
        <span className="ml-3">Loading...</span>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}