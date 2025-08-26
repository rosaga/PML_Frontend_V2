import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';

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

  // Generate dummy data based on filters
  const generateDummyData = () => {
    if (!selectedYear) {
      // All Years - show yearly data
      const years = ['2024', '2025'];
      const recipients = [15420, 18650];
      const dataConsumed = [245680, 298450];
      
      // Simulate some periods with no data
      const processedRecipients = recipients.map(val => Math.random() > 0.1 ? val : 0);
      const processedDataConsumed = processedRecipients.map((val, index) => 
        val === 0 ? 0 : dataConsumed[index]
      );

      return {
        categories: years,
        recipients: processedRecipients,
        dataConsumed: processedDataConsumed
      };
    } else if (selectedYear && !selectedMonth) {
      // Specific year - show monthly data
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      // Generate realistic data with some seasonality and empty periods
      const recipients = months.map((_, index) => {
        // Simulate some months with no data (10% chance)
        if (Math.random() < 0.1) return 0;
        
        const baseValue = 1200 + Math.random() * 400;
        const seasonality = Math.sin((index / 12) * 2 * Math.PI) * 200;
        return Math.round(baseValue + seasonality + (index * 50));
      });
      
      const dataConsumed = recipients.map(r => 
        r === 0 ? 0 : Math.round(r * (15 + Math.random() * 5))
      );

      return {
        categories: months,
        recipients,
        dataConsumed
      };
    } else {
      // Specific month - show daily data (first 30 days)
      const days = Array.from({length: 30}, (_, i) => `Day ${i + 1}`);
      const recipients = days.map(() => {
        // Simulate some days with no data (15% chance)
        if (Math.random() < 0.15) return 0;
        return Math.round(40 + Math.random() * 60);
      });
      const dataConsumed = recipients.map(r => 
        r === 0 ? 0 : Math.round(r * (15 + Math.random() * 5))
      );
      
      return {
        categories: days,
        recipients,
        dataConsumed
      };
    }
  };

  const createChart = () => {
    if (!chartRef.current || typeof window === 'undefined') return;

    const data = generateDummyData();
    
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
        text: 'Recipients Reached vs Data Consumed',
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
        categories: data.categories,
        crosshair: true,
        labels: {
          style: {
            color: '#6B7280'
          }
        }
      },
      yAxis: [{
        min: 0,
        title: {
          text: 'Recipients Reached',
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
          text: 'Data Consumed (MB)',
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
          
          const categoryName = data.categories[this.x as number];
          
          if (!selectedYear) {
            tooltip += `Year: ${categoryName}`;
          } else if (selectedYear && !selectedMonth) {
            tooltip += `${categoryName} ${selectedYear}`;
          } else {
            tooltip += `${categoryName}, ${getMonthName(selectedMonth)} ${selectedYear}`;
          }
          
          tooltip += `</div>`;
          
          //  cases where there's no data
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
                const formattedValue = point.series.name.includes('Data') 
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
          connectNulls: false // Don't connect points when there's no data
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
        name: 'Recipients Reached',
        type: 'column',
        yAxis: 0,
        data: data.recipients.map((value, index) => ({
          y: value,
          color: value === 0 ? 'rgba(245, 132, 38, 0.3)' : '#F58426' 
        })),
        dataLabels: {
          enabled: false
        }
      }, {
        name: 'Data Consumed',
        type: 'line',
        yAxis: 1,
        data: data.dataConsumed.map((value, index) => ({
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
  }, [selectedYear, selectedMonth]);

  return (
    <div className="border-[1.5px] rounded-3xl p-6 mb-4">
      <div 
        ref={chartRef} 
        style={{ height: '400px', width: '100%' }}
        suppressHydrationWarning={true}
      />
    </div>
  );
};

export default TrendsVisualization;