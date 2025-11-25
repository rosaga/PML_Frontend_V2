import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import { authHeaders } from '../../app/api/utils/headers/headers';
import axios from 'axios';

interface FinancialVisualizationProps {
  selectedYear: string;
  selectedMonth: string;
}

const FinancialVisualization: React.FC<FinancialVisualizationProps> = ({
  selectedYear,
  selectedMonth
}) => {
  const costPerUserChartRef = useRef<HTMLDivElement>(null);
  const costPerUserChartInstance = useRef<Highcharts.Chart | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  // API function to get financial data from cost-efficiency endpoint
  const getFinancialData = async (
    orgId: string,
    group: string,
    startDate: string,
    endDate: string
  ) => {
    const apiUrl = 'https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2';
    const financialUrl = `${apiUrl}/organization/${orgId}/cost-efficiency?start_date=${startDate}&end_date=${endDate}&group=${group}`;

    try {
      const config = await authHeaders();
      const res = await axios.get(financialUrl, config);

      if (res.data && res.status === 200) {
        return res.data;
      }

      return res;
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      if (error.response) {
        return {
          errors: {
            _error: 'The financial data could not be retrieved.',
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

  // Generate date ranges and group parameter based on filters
  const getDateParams = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    if (!selectedYear) {
      return {
        group: 'yearly',
        startDate: `${currentYear - 1}-01-01`,
        endDate: `${currentYear}-12-31`
      };
    } else if (selectedYear && !selectedMonth) {
      return {
        group: 'monthly',
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`
      };
    } else {
      const year = selectedYear;
      const month = selectedMonth.padStart(2, '0');
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      
      return {
        group: 'daily',
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
      const { group, startDate, endDate } = getDateParams();
      const result = await getFinancialData(org_id, group, startDate, endDate);

      if (result.errors) {
        setError(result.errors._error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError('Failed to fetch financial data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process API data for charts - extract cost per user from graph data
  const processApiData = () => {
    if (!data || !data.graph || data.graph.length === 0) {
      return {
        costPerUser: [],
        periods: [],
        avgCostPerUser: 0
      };
    }

    // Get data from the graph array
    const graphData = data.graph;
    
    // Extract cost per user data across periods
    const costPerUserData = graphData.map((item: any) => item.avg_cost_per_user || 0);
    
    // Get period labels (years, months, or dates)
    const periods = graphData.map((item: any) => item.period || '');

    // Calculate overall average if we have report summary
    const avgCostPerUser = data.report?.avg_cost_per_user || 0;

    return {
      costPerUser: costPerUserData,
      periods: periods,
      avgCostPerUser: avgCostPerUser
    };
  };

  const createCostPerUserChart = () => {
    if (!costPerUserChartRef.current || typeof window === 'undefined') return;

    const chartData = processApiData();
    
    // Destroy existing chart
    if (costPerUserChartInstance.current) {
      costPerUserChartInstance.current.destroy();
      costPerUserChartInstance.current = null;
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
        text: 'Average Cost per User',
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
        categories: chartData.periods.length > 0 ? chartData.periods : ['No Data'],
        crosshair: true,
        labels: {
          style: {
            color: '#6B7280'
          },
          rotation: selectedMonth ? -45 : 0
        },
        title: {
          text: selectedYear && selectedMonth ? 'Date' : selectedYear ? 'Month' : 'Year',
          style: {
            color: '#374151',
            fontWeight: '600'
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Cost (KSh)',
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
            return 'KSh ' + Highcharts.numberFormat(this.value as number, 2);
          }
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
          const period = chartData.periods[this.x as number];
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
                Period: ${period}
              </div>
              <div style="color: #374151;">
                Average Cost per User: <strong>KSh ${Highcharts.numberFormat(value, 2)}</strong>
              </div>
            </div>
          `;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 4,
          colorByPoint: false
        }
      },
      series: [{
        name: 'Cost per User',
        type: 'column',
        data: chartData.costPerUser,
        color: '#3B82F6',
        dataLabels: {
          enabled: false
        }
      }],
      credits: {
        enabled: false
      },
      legend: {
        enabled: false
      }
    };

    costPerUserChartInstance.current = Highcharts.chart(costPerUserChartRef.current, options);
  };

  const getSubtitleText = () => {
    if (!selectedYear) return 'Overall Financial Overview';
    if (selectedYear && !selectedMonth) return `Financial Analysis for ${selectedYear}`;
    return `Financial Analysis for ${getMonthName(selectedMonth)} ${selectedYear}`;
  };

  const getMonthName = (month: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(month) - 1] || '';
  };

  const getSummaryStats = () => {
    // Use report summary if available
    if (data?.report) {
      return {
        avgCostPerUser: data.report.avg_cost_per_user || 0,
        totalCost: data.report.total_cost || 0,
        uniqueUsers: data.report.unique_users || 0,
        totalRewards: data.report.total_rewards || 0,
        avgCostPerReward: data.report.avg_cost_per_reward || 0
      };
    }

    return {
      avgCostPerUser: 0,
      totalCost: 0,
      uniqueUsers: 0,
      totalRewards: 0,
      avgCostPerReward: 0
    };
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMonth]);

  // Create charts when data changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const timer = setTimeout(() => {
        createCostPerUserChart();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (costPerUserChartInstance.current) {
          costPerUserChartInstance.current.destroy();
          costPerUserChartInstance.current = null;
        }
      };
    }
  }, [data, loading, selectedYear, selectedMonth]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9800]"></div>
          <span className="ml-3 text-gray-600">Loading financial data...</span>
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
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-[#3B82F6] font-medium">Avg Cost/User</div>
              <div className="text-2xl font-bold text-[#3B82F6]">
                KSh {getSummaryStats().avgCostPerUser.toFixed(2)}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-[#F58426] font-medium">Total Cost</div>
              <div className="text-2xl font-bold text-[#F58426]">
                KSh {getSummaryStats().totalCost.toFixed(2)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">Unique Users</div>
              <div className="text-2xl font-bold text-green-700">
                {getSummaryStats().uniqueUsers}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-600 font-medium">Total Rewards</div>
              <div className="text-2xl font-bold text-purple-700">
                {getSummaryStats().totalRewards}
              </div>
            </div>
          </div>

          {/* Cost per User Chart */}
          <div className="border-[1.5px] rounded-3xl p-6 mb-4">
            <div 
              ref={costPerUserChartRef} 
              style={{ height: '400px', width: '100%' }}
              suppressHydrationWarning={true}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialVisualization;