import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import { authHeaders } from '../../app/api/utils/headers/headers';
import axios from 'axios';

interface EfficiencyVisualizationProps {
  selectedYear: string;
  selectedMonth: string;
}

const EfficiencyVisualization: React.FC<EfficiencyVisualizationProps> = ({
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

  // API function to get efficiency data (placeholder for now)
  const getEfficiencyData = async (orgId: string, granularity: string, startDate: string, endDate: string) => {
    const apiUrl = 'https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2';
    const efficiencyUrl = `${apiUrl}/organization/${orgId}/efficiency?granularity=${granularity}&start_date=${startDate}&end_date=${endDate}`;

    try {
      const config = await authHeaders();
      // For now, we'll simulate API call and return placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      // TODO: Replace with actual API call when backend is ready
      // const res = await axios.get(efficiencyUrl, config);
      
      // Generate mock data based on the selected filters
      const mockData = generateMockEfficiencyData(granularity, startDate, endDate);
      
      const mockResponse = {
        efficiency: mockData,
        status: 200
      };

      console.log("Efficiency API Response (Mock):", mockResponse.efficiency);
      return mockResponse;

    } catch (error: any) {
      console.error('Error fetching efficiency data:', error);
      return {
        errors: {
          _error: 'The efficiency data could not be retrieved.',
        },
      };
    }
  };

  // Generate mock efficiency data
  const generateMockEfficiencyData = (granularity: string, startDate: string, endDate: string) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (granularity === 'monthly') {
      if (!selectedYear) {
        // Yearly view - show 2 years
        for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
          data.push({
            period: `${year}-01-01`,
            successful_dispatches: Math.floor(Math.random() * 5000) + 3000,
            failed_dispatches: Math.floor(Math.random() * 800) + 200
          });
        }
      } else {
        // Monthly view for specific year
        for (let month = 0; month < 12; month++) {
          const date = new Date(parseInt(selectedYear), month, 1);
          data.push({
            period: date.toISOString().split('T')[0],
            successful_dispatches: Math.floor(Math.random() * 800) + 400,
            failed_dispatches: Math.floor(Math.random() * 100) + 20
          });
        }
      }
    } else {
      // Daily view for specific month
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth) - 1;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        data.push({
          period: date.toISOString().split('T')[0],
          successful_dispatches: Math.floor(Math.random() * 50) + 20,
          failed_dispatches: Math.floor(Math.random() * 10) + 1
        });
      }
    }
    
    return data;
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
      const result = await getEfficiencyData(org_id, granularity, startDate, endDate);

      if (result.errors) {
        setError(result.errors._error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError('Failed to fetch efficiency data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process API data for chart
  const processApiData = () => {
    if (!data || !data.efficiency || data.efficiency.length === 0) {
      return generateFallbackData();
    }

    const apiData = data.efficiency;
    let categories: string[] = [];
    let successful: number[] = [];
    let failed: number[] = [];

    if (!selectedYear) {
      // All Years view - group by year
      const yearGroups: { [key: string]: { successful: number; failed: number } } = {};
      apiData.forEach((item: any) => {
        const date = new Date(item.period);
        const year = date.getFullYear().toString();
        if (!yearGroups[year]) {
          yearGroups[year] = { successful: 0, failed: 0 };
        }
        yearGroups[year].successful += item.successful_dispatches || 0;
        yearGroups[year].failed += item.failed_dispatches || 0;
      });

      categories = Object.keys(yearGroups).sort();
      successful = categories.map(year => yearGroups[year].successful);
      failed = categories.map(year => yearGroups[year].failed);
    } else if (selectedYear && !selectedMonth) {
      // Specific year view - show months
      const monthGroups: { [key: number]: { name: string; successful: number; failed: number } } = {};
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      // Initialize all months to 0
      monthNames.forEach((monthName, index) => {
        monthGroups[index] = { name: monthName, successful: 0, failed: 0 };
      });

      // Fill in actual data
      apiData.forEach((item: any) => {
        const date = new Date(item.period);
        const monthIndex = date.getMonth();
        monthGroups[monthIndex].successful += item.successful_dispatches || 0;
        monthGroups[monthIndex].failed += item.failed_dispatches || 0;
      });

      categories = monthNames;
      successful = categories.map((_, index) => monthGroups[index].successful);
      failed = categories.map((_, index) => monthGroups[index].failed);
    } else {
      // Daily view for specific month
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Initialize all days to 0
      const dayGroups: { [key: number]: { successful: number; failed: number } } = {};
      for (let day = 1; day <= daysInMonth; day++) {
        dayGroups[day] = { successful: 0, failed: 0 };
      }

      // Fill in actual data
      apiData.forEach((item: any) => {
        const date = new Date(item.period);
        const dayOfMonth = date.getDate();
        if (dayGroups[dayOfMonth]) {
          dayGroups[dayOfMonth].successful += item.successful_dispatches || 0;
          dayGroups[dayOfMonth].failed += item.failed_dispatches || 0;
        }
      });

      // Create readable date categories
      categories = [];
      successful = [];
      failed = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${getMonthName(selectedMonth)} ${day}`;
        categories.push(dateStr);
        successful.push(dayGroups[day].successful);
        failed.push(dayGroups[day].failed);
      }
    }

    return {
      categories,
      successful,
      failed
    };
  };

  // Fallback data when API fails or no data
  const generateFallbackData = () => {
    if (!selectedYear) {
      const years = ['2024', '2025'];
      return {
        categories: years,
        successful: [0, 0],
        failed: [0, 0]
      };
    } else if (selectedYear && !selectedMonth) {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return {
        categories: months,
        successful: new Array(12).fill(0),
        failed: new Array(12).fill(0)
      };
    } else {
      const days = Array.from({length: 30}, (_, i) => `${getMonthName(selectedMonth)} ${i + 1}`);
      return {
        categories: days,
        successful: new Array(30).fill(0),
        failed: new Array(30).fill(0)
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
        text: 'Dispatch Efficiency Analysis',
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
          rotation: selectedMonth ? -45 : 0
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Number of Dispatches',
          style: {
            color: '#374151',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            color: '#6B7280'
          },
          formatter: function() {
            return Highcharts.numberFormat(this.value as number, 0);
          }
        }
      },
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
            tooltip += `<div style="color: #6B7280; font-style: italic;">No dispatch data available for this period</div>`;
          } else {
            const successful = points.find(p => p.series.name === 'Successful Dispatches')?.y || 0;
            const failed = points.find(p => p.series.name === 'Failed Dispatches')?.y || 0;
            const total = successful + failed;
            const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0';
            
            points.forEach(point => {
              const color = point.series.color;
              const value = point.y as number;
              
              tooltip += `<div style="margin: 4px 0; display: flex; align-items: center;">`;
              tooltip += `<span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; border-radius: 2px; margin-right: 8px;"></span>`;
              tooltip += `<span style="color: #374151;">${point.series.name}: <strong>${Highcharts.numberFormat(value, 0)}</strong></span>`;
              tooltip += `</div>`;
            });
            
            tooltip += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">`;
            tooltip += `<span style="color: #374151; font-weight: 600;">Success Rate: ${successRate}%</span>`;
            tooltip += `</div>`;
          }
          
          tooltip += `</div>`;
          return tooltip;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 4,
          groupPadding: 0.1
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
        name: 'Successful Dispatches',
        type: 'column',
        data: chartData.successful,
        color: '#F58426', // Orange for success
        dataLabels: {
          enabled: false
        }
      }, {
        name: 'Failed Dispatches',
        type: 'column',
        data: chartData.failed,
        color: '#EF4444', // Red for failure
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
    if (!selectedYear) return 'Yearly Efficiency Overview';
    if (selectedYear && !selectedMonth) return `Monthly Efficiency for ${selectedYear}`;
    return `Daily Efficiency for ${getMonthName(selectedMonth)} ${selectedYear}`;
  };

  const getMonthName = (month: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(month) - 1] || '';
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const chartData = processApiData();
    const totalSuccessful = chartData.successful.reduce((sum, val) => sum + val, 0);
    const totalFailed = chartData.failed.reduce((sum, val) => sum + val, 0);
    const totalDispatches = totalSuccessful + totalFailed;
    const successRate = totalDispatches > 0 ? ((totalSuccessful / totalDispatches) * 100) : 0;

    return {
      totalSuccessful,
      totalFailed,
      totalDispatches,
      successRate
    };
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
          <span className="ml-3 text-gray-600">Loading efficiency data...</span>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-sm text-[#F58426] font-medium">Successful</div>
            <div className="text-2xl font-bold text-[#F58426]">
              {Highcharts.numberFormat(getSummaryStats().totalSuccessful, 0)}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Failed</div>
            <div className="text-2xl font-bold text-red-700">
              {Highcharts.numberFormat(getSummaryStats().totalFailed, 0)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Total Dispatches</div>
            <div className="text-2xl font-bold text-gray-700">
              {Highcharts.numberFormat(getSummaryStats().totalDispatches, 0)}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Success Rate</div>
            <div className="text-2xl font-bold text-blue-700">
              {getSummaryStats().successRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EfficiencyVisualization;