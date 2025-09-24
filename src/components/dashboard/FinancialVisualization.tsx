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
  const costPerRewardChartRef = useRef<HTMLDivElement>(null);
  const costPerUserChartInstance = useRef<Highcharts.Chart | null>(null);
  const costPerRewardChartInstance = useRef<Highcharts.Chart | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  let org_id = null;
  if (typeof window !== "undefined") {
    org_id = localStorage.getItem("selectedAccountId");
  }

  // Data products available
  const dataProducts = ['10MB', '20MB', '100MB', '200MB', '500MB', '1GB', '5GB', '10GB'];

  // API function to get financial data (placeholder for now)
  const getFinancialData = async (orgId: string, granularity: string, startDate: string, endDate: string) => {
    const apiUrl = 'https://peakdata-jja4kcvvdq-ez.a.run.app/api/v2';
    const financialUrl = `${apiUrl}/organization/${orgId}/financial?granularity=${granularity}&start_date=${startDate}&end_date=${endDate}`;

    try {
      const config = await authHeaders();
      // For now, we'll simulate API call and return placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      // TODO: Replace with actual API call when backend is ready
      // const res = await axios.get(financialUrl, config);
      
      // Generate mock financial data
      const mockData = generateMockFinancialData();
      
      const mockResponse = {
        financial: mockData,
        status: 200
      };

      console.log("Financial API Response (Mock):", mockResponse.financial);
      return mockResponse;

    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      return {
        errors: {
          _error: 'The financial data could not be retrieved.',
        },
      };
    }
  };

  // Generate mock financial data
  const generateMockFinancialData = () => {
    const costPerUser: { [key: string]: number } = {};
    const costPerReward: { [key: string]: number } = {};

    // Generate random costs for each data product (in KSh)
    dataProducts.forEach(product => {
      // Average cost per user for each product (in KSh)
      costPerUser[product] = Math.random() * 500 + 100; // Between KSh 100-600
      
      // Average cost per reward for each product
      costPerReward[product] = Math.random() * 200 + 50; // Between KSh 50-250
    });

    return {
      cost_per_user: costPerUser,
      cost_per_reward: costPerReward
    };
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
      const result = await getFinancialData(org_id, granularity, startDate, endDate);

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

  // Process API data for charts
  const processApiData = () => {
    if (!data || !data.financial) {
      return {
        costPerUser: dataProducts.map(() => 0),
        costPerReward: dataProducts.map(() => 0)
      };
    }

    const costPerUser = dataProducts.map(product => 
      data.financial.cost_per_user[product] || 0
    );
    const costPerReward = dataProducts.map(product => 
      data.financial.cost_per_reward[product] || 0
    );

    return {
      costPerUser,
      costPerReward
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
        categories: dataProducts,
        crosshair: true,
        labels: {
          style: {
            color: '#6B7280'
          }
        },
        title: {
          text: 'Data Products',
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
          const product = dataProducts[this.x as number];
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
                ${product} Data Product
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
        color: '#3B82F6', // Blue for Cost per User
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

  const createCostPerRewardChart = () => {
    if (!costPerRewardChartRef.current || typeof window === 'undefined') return;

    const chartData = processApiData();
    
    // Destroy existing chart
    if (costPerRewardChartInstance.current) {
      costPerRewardChartInstance.current.destroy();
      costPerRewardChartInstance.current = null;
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
        text: 'Average Cost per Reward',
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
        categories: dataProducts,
        crosshair: true,
        labels: {
          style: {
            color: '#6B7280'
          }
        },
        title: {
          text: 'Data Products',
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
          const product = dataProducts[this.x as number];
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
                ${product} Data Product
              </div>
              <div style="color: #374151;">
                Average Cost per Reward: <strong>KSh ${Highcharts.numberFormat(value, 2)}</strong>
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
        name: 'Cost per Reward',
        type: 'column',
        data: chartData.costPerReward,
        color: '#F58426', // Orange for Cost per Reward
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

    costPerRewardChartInstance.current = Highcharts.chart(costPerRewardChartRef.current, options);
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

  // Calculate summary statistics
  const getSummaryStats = () => {
    const chartData = processApiData();
    const totalCostPerUser = chartData.costPerUser.reduce((sum, val) => sum + val, 0);
    const avgCostPerUser = totalCostPerUser / dataProducts.length;
    const totalCostPerReward = chartData.costPerReward.reduce((sum, val) => sum + val, 0);
    const avgCostPerReward = totalCostPerReward / dataProducts.length;
    
    const highestCostUserProduct = dataProducts[chartData.costPerUser.indexOf(Math.max(...chartData.costPerUser))];
    const lowestCostUserProduct = dataProducts[chartData.costPerUser.indexOf(Math.min(...chartData.costPerUser))];

    return {
      avgCostPerUser,
      avgCostPerReward,
      highestCostUserProduct,
      lowestCostUserProduct,
      totalCostPerUser,
      totalCostPerReward
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
        createCostPerRewardChart();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (costPerUserChartInstance.current) {
          costPerUserChartInstance.current.destroy();
          costPerUserChartInstance.current = null;
        }
        if (costPerRewardChartInstance.current) {
          costPerRewardChartInstance.current.destroy();
          costPerRewardChartInstance.current = null;
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
              <div className="text-sm text-[#F58426] font-medium">Avg Cost/Reward</div>
              <div className="text-2xl font-bold text-[#F58426]">
                KSh {getSummaryStats().avgCostPerReward.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Lowest Cost Product</div>
              <div className="text-2xl font-bold text-gray-700">
                {getSummaryStats().lowestCostUserProduct}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 font-medium">Highest Cost Product</div>
              <div className="text-2xl font-bold text-gray-700">
                {getSummaryStats().highestCostUserProduct}
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

          {/* Cost per Reward Chart */}
          <div className="border-[1.5px] rounded-3xl p-6 mb-4">
            <div 
              ref={costPerRewardChartRef} 
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