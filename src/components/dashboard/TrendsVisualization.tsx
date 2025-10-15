import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import { authHeaders } from '../../app/api/utils/headers/headers';
import axios from 'axios';

interface TrendsVisualizationProps {
  selectedYear: string;
  selectedMonth: string;
}

const TrendsVisualization: React.FC<TrendsVisualizationProps> = ({
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

  // API function to get stats data
  const getStatsData = async (orgId: string, granularity: string, startDate: string, endDate: string) => {
    const apiUrl = 'https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2';
    const statsUrl = `${apiUrl}/organization/${orgId}/stats?granularity=${granularity}&start_date=${startDate}&end_date=${endDate}`;

    try {
      const config = await authHeaders();
      const res = await axios.get(statsUrl, config);

      if (res.data && res.status === 200) {
        return res.data;
      }

      return res;
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response) {
        return {
          errors: {
            _error: 'The stats data could not be retrieved.',
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
      // All Years - show yearly data (last 2 years)
      return {
        granularity: 'monthly',
        startDate: `${currentYear - 1}-01-01`,
        endDate: `${currentYear}-12-31`
      };
    } else if (selectedYear && !selectedMonth) {
      // Specific year - show monthly data
      return {
        granularity: 'monthly',
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`
      };
    } else {
      // Specific month - show daily data
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
      const result = await getStatsData(org_id, granularity, startDate, endDate);

      if (result.errors) {
        setError(result.errors._error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError('Failed to fetch data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process API data for chart - using actual API response structure
  const processApiData = () => {
    if (!data || !data.stats || data.stats.length === 0) {
      return generateFallbackData();
    }

    const apiData = data.stats;
    let categories: string[] = [];
    let recipients: number[] = [];
    let dataConsumed: number[] = [];

    if (!selectedYear) {
      // All Years view - group by year
      const yearGroups: { [key: string]: { recipients: number; dataConsumed: number } } = {};
      apiData.forEach((item: any) => {
        const date = new Date(item.period);
        const year = date.getFullYear().toString();
        if (!yearGroups[year]) {
          yearGroups[year] = { recipients: 0, dataConsumed: 0 };
        }
        yearGroups[year].recipients += item.customer_reach || 0;
        yearGroups[year].dataConsumed += item.total_bundle || 0;
      });

      categories = Object.keys(yearGroups).sort();
      recipients = categories.map(year => yearGroups[year].recipients);
      dataConsumed = categories.map(year => yearGroups[year].dataConsumed);
    } else if (selectedYear && !selectedMonth) {
      // Specific year view - show months based on actual data
      const monthGroups: { [key: number]: { name: string; recipients: number; dataConsumed: number } } = {};
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Initialize all months to 0
      monthNames.forEach((monthName, index) => {
        monthGroups[index] = { name: monthName, recipients: 0, dataConsumed: 0 };
      });

      // Fill in actual data
      apiData.forEach((item: any) => {
        const date = new Date(item.period);
        const monthIndex = date.getMonth();
        monthGroups[monthIndex].recipients += item.customer_reach || 0;
        monthGroups[monthIndex].dataConsumed += item.total_bundle || 0;
      });

      categories = monthNames;
      recipients = categories.map((_, index) => monthGroups[index].recipients);
      dataConsumed = categories.map((_, index) => monthGroups[index].dataConsumed);
    } else {
      // Daily view for specific month - show actual dates
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Initialize all days to 0
      const dayGroups: { [key: number]: { recipients: number; dataConsumed: number } } = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dayGroups[day] = { recipients: 0, dataConsumed: 0 };
      }

      // Fill in actual data
      apiData.forEach((item: any) => {
        const date = new Date(item.period);
        const dayOfMonth = date.getDate();
        if (dayGroups[dayOfMonth]) {
          dayGroups[dayOfMonth].recipients += item.customer_reach || 0;
          dayGroups[dayOfMonth].dataConsumed += item.total_bundle || 0;
        }
      });

      // Create readable date categories
      categories = [];
      recipients = [];
      dataConsumed = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${getMonthName(selectedMonth)} ${day}`;
        categories.push(dateStr);
        recipients.push(dayGroups[day].recipients);
        dataConsumed.push(dayGroups[day].dataConsumed);
      }
    }

    return {
      categories,
      recipients,
      dataConsumed
    };
  };

  // Fallback data when API fails or no data
  const generateFallbackData = () => {
    if (!selectedYear) {
      const years = ['2024', '2025'];
      return {
        categories: years,
        recipients: [0, 0],
        dataConsumed: [0, 0]
      };
    } else if (selectedYear && !selectedMonth) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return {
        categories: months,
        recipients: new Array(12).fill(0),
        dataConsumed: new Array(12).fill(0)
      };
    } else {
      const days = Array.from({length: 30}, (_, i) => `${getMonthName(selectedMonth)} ${i + 1}`);
      return {
        categories: days,
        recipients: new Array(30).fill(0),
        dataConsumed: new Array(30).fill(0)
      };
    }
  };

  const createChart = () => {
    if (!chartRef.current || typeof window === 'undefined') return;

    const chartData = processApiData();
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const options: Highcharts.Options = {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'inherit'
        }
      },
      title: {
        text: 'Customer Reach vs Total Bundle',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#374151'
        }
      },
      subtitle: {
        text: getSubtitleText(),
        style: {
          fontSize: '14px',
          color: '#6B7280'
        }
      },
      xAxis: {
        categories: chartData.categories,
        crosshair: true,
        labels: {
          style: {
            color: '#6B7280'
          },
          rotation: selectedMonth ? -45 : 0 // Rotate labels for daily view
        }
      },
      yAxis: [{
        min: 0,
        title: {
          text: 'Customer Reach',
          style: {
            color: '#F58426',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            color: '#F58426'
          },
          formatter: function() {
            return Highcharts.numberFormat(this.value as number, 0);
          }
        }
      }, {
        title: {
          text: 'Total Bundle (MB)',
          style: {
            color: '#3B82F6',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            color: '#3B82F6'
          },
          formatter: function() {
            return Highcharts.numberFormat(this.value as number, 0);
          }
        },
        opposite: true
      }],
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E7EB',
        borderRadius: 8,
        shadow: true,
        useHTML: true,
        formatter: function() {
          const points = this.points || [];
          let tooltip = `<div style="padding: 8px;">`;
          tooltip += `<div style="font-weight: 600; margin-bottom: 8px; color: #374151;">`;
          
          const categoryName = chartData.categories[this.x as number];
          
          if (!selectedYear) {
            tooltip += `Year: ${categoryName}`;
          } else if (selectedYear && !selectedMonth) {
            tooltip += `${categoryName} ${selectedYear}`;
          } else {
            tooltip += `${categoryName}, ${selectedYear}`;
          }
          
          tooltip += `</div>`;
          
          if (points.length === 0 || points.every(p => (p.y as number) === 0)) {
            tooltip += `<div style="color: #6B7280; font-style: italic;">No data available for this period</div>`;
          } else {
            points.forEach(point => {
              const color = point.series.color;
              const value = point.y as number;
              
              if (value === 0) {
                const seriesName = point.series.name;
                tooltip += `<div style="margin: 4px 0; display: flex; align-items: center;">`;
                tooltip += `<span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; margin-right: 8px; opacity: 0.3;"></span>`;
                tooltip += `<span style="color: #6B7280; font-style: italic;">${seriesName}: No data</span>`;
                tooltip += `</div>`;
              } else {
                const formattedValue = point.series.name.includes('Bundle') 
                  ? `${Highcharts.numberFormat(value, 0)} MB`
                  : Highcharts.numberFormat(value, 0);
                
                tooltip += `<div style="margin: 4px 0; display: flex; align-items: center;">`;
                tooltip += `<span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; margin-right: 8px;"></span>`;
                tooltip += `<span style="color: #374151;">${point.series.name}: <strong>${formattedValue}</strong></span>`;
                tooltip += `</div>`;
              }
            });
          }
          
          tooltip += `</div>`;
          return tooltip;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 4
        },
        line: {
          marker: {
            radius: 5,
            lineWidth: 2,
            lineColor: '#3B82F6'
          },
          connectNulls: false
        },
        series: {
          states: {
            inactive: {
              opacity: 1
            }
          }
        }
      },
      series: [{
        name: 'Customer Reach',
        type: 'column',
        yAxis: 0,
        data: chartData.recipients.map((value, index) => ({
          y: value,
          color: value === 0 ? 'rgba(245, 132, 38, 0.3)' : '#F58426' 
        })),
        dataLabels: {
          enabled: false
        }
      }, {
        name: 'Total Bundle',
        type: 'line',
        yAxis: 1,
        data: chartData.dataConsumed.map((value, index) => ({
          y: value === 0 ? null : value, 
        })),
        color: '#3B82F6',
        marker: {
          fillColor: '#3B82F6',
          lineWidth: 2,
          lineColor: '#ffffff',
          states: {
            hover: {
              fillColor: '#2563EB'
            }
          }
        },
        dataLabels: {
          enabled: false
        }
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
            legend: {
              layout: 'horizontal',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }]
      }
    };

    chartInstance.current = Highcharts.chart(chartRef.current, options);
  };

  const getSubtitleText = () => {
    if (!selectedYear) return 'Yearly Overview';
    if (selectedYear && !selectedMonth) return `Monthly Breakdown for ${selectedYear}`;
    return `Daily Breakdown for ${getMonthName(selectedMonth)} ${selectedYear}`;
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
          <span className="ml-3 text-gray-600">Loading chart data...</span>
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
    </div>
  );
};

export default TrendsVisualization;