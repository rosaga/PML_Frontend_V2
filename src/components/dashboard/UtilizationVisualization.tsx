import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import { authHeaders } from '../../app/api/utils/headers/headers';
import axios from 'axios';

interface UtilizationVisualizationProps {
  selectedYear: string;
  selectedMonth: string;
}

const UtilizationVisualization: React.FC<UtilizationVisualizationProps> = ({
  selectedYear,
  selectedMonth
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<Highcharts.Chart | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  // API function to get utilization data
  const getUtilizationData = async (orgId: string, granularity: string, startDate: string, endDate: string) => {
    const apiUrl = 'https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2';
    const utilizationUrl = `${apiUrl}/organization/${orgId}/utilization-report?group=${granularity}&start_date=${startDate}&end_date=${endDate}`;

    try {
      const config = await authHeaders();
      const res = await axios.get(utilizationUrl, config);

      if (res.data && res.status === 200) {
        console.log("Utilization API Response:", res.data);
        return res.data;
      }

      return res;
    } catch (error: any) {
      console.error('Error fetching utilization data:', error);
      if (error.response) {
        return {
          errors: {
            _error: 'The utilization data could not be retrieved.',
          },
        };
      }
      return {
        errors: {
          _error: 'Network error. Please try again.',
        },
      };
    }
  };

  // Generate date ranges and granularity based on filters
  const getDateParams = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    if (!selectedYear) {
      return {
        granularity: 'monthly',
        startDate: `${currentYear - 1}-01-01`,
        endDate: `${currentYear}-12-31`
      };
    } else if (selectedYear && !selectedMonth) {
      return {
        granularity: 'monthly',
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`
      };
    } else {
      const year = selectedYear;
      const month = selectedMonth.padStart(2, '0');
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      
      return {
        granularity: 'daily',
        startDate: `${year}-${month}-01`,
        endDate: `${year}-${month}-${lastDay.toString().padStart(2, '0')}`
      };
    }
  };

  // Fetch data from API
  const fetchData = async () => {
    if (!org_id) {
      setError('Organization ID not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { granularity, startDate, endDate } = getDateParams();
      const result = await getUtilizationData(org_id, granularity, startDate, endDate);

      if (result.errors) {
        setError(result.errors._error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError('Failed to fetch utilization data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process API data for pie chart
  const processApiData = () => {
    if (!data) {
      return {
        dispatched: 0,
        balance: 0
      };
    }

    return {
      dispatched: data.report.total_dispatched || data.dispatched || 0,
      balance: data.report.total_balance || data.balance || 0
    };
  };

  const createChart = () => {
    if (!chartRef.current || typeof window === 'undefined') return;

    const chartData = processApiData();
    const total = chartData.dispatched + chartData.balance;
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // Show message if no data
    const hasData = total > 0;

    const options: Highcharts.Options = {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'inherit'
        },
        height: 400
      },
      title: {
        text: 'Data Utilization Overview',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151'
        }
      },
      subtitle: {
        text: hasData ? getSubtitleText() : 'No data available for selected period',
        style: {
          fontSize: '14px',
          color: hasData ? '#6B7280' : '#EF4444'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderRadius: 8,
        shadow: true,
        useHTML: true,
        formatter: function() {
          const value = this.y as number;
          const name = this.key as string;
          const percentage = this.percentage?.toFixed(1) || '0.0';
          
          if (value === 0) {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
                  ${name}
                </div>
                <div style="color: #6B7280; font-style: italic;">
                  No data available
                </div>
              </div>
            `;
          }
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
                ${name}
              </div>
              <div style="color: #374151;">
                <strong>${Highcharts.numberFormat(value, 0)} MB</strong> (${percentage}%)
              </div>
            </div>
          `;
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: hasData,
            format: '<b>{point.name}</b><br>{point.percentage:.1f}%',
            style: {
              fontSize: '14px',
              fontWeight: '500'
            },
            distance: 30
          },
          showInLegend: true,
          size: '80%',
          innerSize: '40%',
          borderWidth: 2,
          borderColor: '#ffffff',
          states: {
            inactive: {
              opacity: 1
            }
          }
        }
      },
      series: [{
        name: 'Utilization',
        type: 'pie',
        data: hasData ? [
          {
            name: 'Data Dispatched',
            y: chartData.dispatched,
            color: '#F58426',
            sliced: false
          },
          {
            name: 'Data Balance',
            y: chartData.balance,
            color: '#3B82F6',
            sliced: false
          }
        ] : [
          {
            name: 'No Data',
            y: 1,
            color: '#E5E7EB',
            sliced: false
          }
        ]
      }],
      credits: {
        enabled: false
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        borderWidth: 0,
        itemStyle: {
          color: '#374151',
          fontSize: '14px'
        },
        itemHoverStyle: {
          color: '#111827'
        }
      },
      responsive: {
        rules: [{
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            plotOptions: {
              pie: {
                dataLabels: {
                  enabled: false
                }
              }
            }
          }
        }]
      }
    };

    chartInstance.current = Highcharts.chart(chartRef.current, options);
  };

  const getSubtitleText = () => {
    if (!selectedYear) return 'Overall Utilization';
    if (selectedYear && !selectedMonth) return `Utilization for ${selectedYear}`;
    return `Utilization for ${getMonthName(selectedMonth)} ${selectedYear}`;
  };

  const getMonthName = (month: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(month) - 1] || '';
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Create chart when data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const timer = setTimeout(() => {
        createChart();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }
      };
    }
  }, [data, loading, selectedYear, selectedMonth]);

  return (
    <div className="border-[1.5px] rounded-3xl p-6 mb-4">
      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9800]"></div>
          <span className="ml-3 text-gray-600">Loading utilization data...</span>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️ Error loading data</div>
            <div className="text-sm text-gray-600">{error}</div>
            <button 
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-[#FF9800] text-white rounded hover:bg-[#F57C00] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div 
          ref={chartRef} 
          style={{ height: '400px', width: '100%' }}
          suppressHydrationWarning={true}
        />
      )}

      {/* Summary Cards */}
      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-[#F58426] font-medium">Data Dispatched</div>
            <div className="text-2xl font-bold text-[#F58426]">
              {Highcharts.numberFormat(processApiData().dispatched, 0)} MB
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Data Balance</div>
            <div className="text-2xl font-bold text-blue-700">
              {Highcharts.numberFormat(processApiData().balance, 0)} MB
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Total Data</div>
            <div className="text-2xl font-bold text-gray-700">
              {Highcharts.numberFormat(processApiData().dispatched + processApiData().balance, 0)} MB
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilizationVisualization;