import React, { useState, useEffect } from 'react';
import { 
  LogIn, LogOut, Activity, 
  Settings, RotateCw, Calendar, Clock, Trophy, Medal
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

const API_URL = 'http://localhost:3000';
const MAX_CAPACITY = 300;

export default function App() {
  // State for API data
  const [occupancyData, setOccupancyData] = useState({
    current_inside: 0,
    total_in: 0,
    total_out: 0,
    peak_hour: '--',
    peak_count: 0,
    avg_today: 0
  });
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('--:--');

  // Fetch data from API
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch today's summary
        const todayResponse = await fetch(`${API_URL}/api/occupancy/today`);
        const todayResult = await todayResponse.json();
        if (todayResult.success) {
          setOccupancyData(todayResult.data);
        }

        // Fetch trend data
        const trendResponse = await fetch(`${API_URL}/api/occupancy/today-trend`);
        const trendResult = await trendResponse.json();
        if (trendResult.success) {
          // Transform data for chart - convert UTC to local time
          const chartData = trendResult.data.map(item => {
            const utcHour = parseInt(item.time.split(':')[0]);
            const localHour = (utcHour + 2) % 24; // UTC+2 for Israel
            return {
              time: `${localHour.toString().padStart(2, '0')}:00`,
              visitors: item.count
            };
          });
          setTrendData(chartData);
        }

        // Fetch recent activity
        const activityResponse = await fetch(`${API_URL}/api/occupancy/recent`);
        const activityResult = await activityResponse.json();
        if (activityResult.success) {
          setActivityLog(activityResult.data);
        }

        // Update timestamp
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }));

      } catch (error) {
        console.error('Failed to fetch occupancy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate derived values
  const capacityPercent = Math.round((occupancyData.current_inside / MAX_CAPACITY) * 100);
  
  const getStatus = () => {
    if (capacityPercent < 50) return 'Low';
    if (capacityPercent < 80) return 'Moderate';
    return 'High';
  };

  const getTrend = () => {
    if (trendData.length < 2) return 'Stable';
    const last = trendData[trendData.length - 1]?.visitors || 0;
    const prev = trendData[trendData.length - 2]?.visitors || 0;
    if (last > prev) return 'Rising';
    if (last < prev) return 'Falling';
    return 'Stable';
  };

  // Use trend data for chart, or fallback to empty array
  const chartData = trendData.length > 0 ? trendData : [];

  return (
    <div className="min-h-screen bg-[#0B101A] text-white p-4 md:p-8 font-sans">
      
      {/* --- HEADER --- */}
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black font-bold px-2 py-1 text-xl tracking-tighter">SCE</div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">LibFlowAI</h1>
            <p className="text-xs text-slate-400">v2.0.1 • Real-time monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span className="text-xs flex items-center gap-1"><RotateCw size={14}/> UPDATED {lastUpdated}</span>
          <Settings size={20} className="hover:text-white cursor-pointer" />
        </div>
      </header>

      {/* --- MAIN OCCUPANCY CARD --- */}
      <div className="bg-[#111827] rounded-2xl p-6 mb-6 border border-slate-800 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-slate-400"/>
                <span className="text-slate-400 font-medium">{getStatus()}</span>
             </div>
             <p className="text-slate-500 text-sm">Current Occupancy</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-white">{capacityPercent}%</div>
            <div className="text-slate-400 text-sm">Capacity</div>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-4">
          <span className="text-6xl font-bold text-white tracking-tighter">{occupancyData.current_inside}</span>
          <span className="text-xl text-slate-500 mb-2">/ {MAX_CAPACITY}</span>
          <span className="text-sm text-slate-500 mb-2 ml-2">Active Visitors</span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            style={{width: `${capacityPercent}%`}}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard icon={<LogIn size={20} />} title="Total Entries" value={occupancyData.total_in} sub="Today" />
        <StatCard icon={<LogOut size={20} />} title="Total Exits" value={occupancyData.total_out} sub="Today" />
        <StatCard icon={<Activity size={20} />} title="Peak Hour" value={occupancyData.peak_hour || '--'} sub="Today" isText />
      </div>

      {/* --- CHART SECTION --- */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Today's Live Trend</h3>
            <p className="text-slate-400 text-sm">Last 12 Hours Occupancy Pattern</p>
          </div>
          <div className="bg-slate-800 p-2 rounded text-slate-400">
             <Activity size={18} />
          </div>
        </div>

        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <ReferenceLine y={MAX_CAPACITY} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={occupancyData.avg_today} stroke="#f59e0b" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              {loading ? 'Loading chart data...' : 'No data available for today'}
            </div>
          )}
        </div>
        
        {/* Footer Stats for Chart */}
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-800 pt-4">
           <div>
             <p className="text-xs text-slate-500">Current Trend</p>
             <p className={`font-bold flex items-center gap-1 ${getTrend() === 'Rising' ? 'text-red-400' : getTrend() === 'Falling' ? 'text-green-400' : 'text-slate-400'}`}>
               {getTrend() === 'Rising' ? '↗' : getTrend() === 'Falling' ? '↘' : '→'} {getTrend()}
             </p>
           </div>
           <div>
             <p className="text-xs text-slate-500">Peak Today</p>
             <p className="text-xl font-bold text-white">{occupancyData.peak_count}</p>
           </div>
           <div>
             <p className="text-xs text-slate-500">Avg Today</p>
             <p className="text-xl font-bold text-white">{occupancyData.avg_today}</p>
           </div>
        </div>
      </div>

      {/* --- NEW SECTION: TOP 3 BUSIEST TIMES EVER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
             <div>
                <h3 className="text-lg font-bold text-white">Top 3 Busiest Times Ever</h3>
                <p className="text-slate-400 text-sm">Historical Peak Occupancy Records</p>
             </div>
             <div className="bg-orange-600/20 p-2 rounded text-orange-500">
                <Trophy size={20} />
             </div>
          </div>

          <div className="space-y-4">
             {/* Rank 1 */}
             <RankItem 
               rank="1" date="2024-12-15 at 14:30" 
               val="299" pct="99.7%" color="text-yellow-400" iconColor="bg-yellow-400/20 text-yellow-400"
               barColor="bg-red-600"
             />
             {/* Rank 2 */}
             <RankItem 
               rank="2" date="2024-12-10 at 15:45" 
               val="298" pct="99.3%" color="text-slate-300" iconColor="bg-slate-400/20 text-slate-300"
               barColor="bg-red-500"
             />
             {/* Rank 3 */}
             <RankItem 
               rank="3" date="2024-12-08 at 13:20" 
               val="297" pct="99.0%" color="text-orange-400" iconColor="bg-orange-600/20 text-orange-400"
               barColor="bg-red-500"
             />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
             <div className="bg-slate-800/30 p-4 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Highest Ever</p>
                <p className="text-xl font-bold text-red-400">299 / 300</p>
             </div>
             <div className="bg-slate-800/30 p-4 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Avg of Top 3</p>
                <p className="text-xl font-bold text-white">298</p>
             </div>
          </div>
        </div>
        
        {/* Placeholder for future content or just spacing */}
         <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center text-center opacity-50">
            <Activity size={48} className="text-slate-600 mb-4"/>
            <h3 className="text-lg font-bold text-slate-500">More Analytics Coming Soon</h3>
            <p className="text-sm text-slate-600">Weekly breakdown and detailed logs</p>
         </div>
      </div>

      {/* --- BOTTOM SECTION: WEEKLY & LOGS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Peak Hours Table */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Weekly Peak Hours</h3>
              <p className="text-slate-400 text-sm">Busiest & Freest Hours - Current Week</p>
            </div>
            <div className="bg-slate-800 p-2 rounded-lg text-slate-400"><Clock size={18}/></div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex justify-between items-center mb-6 text-sm">
            <span>28 / 12 / 2024</span>
            <Calendar size={16} className="text-slate-400"/>
          </div>

          <div className="grid grid-cols-4 text-xs text-slate-500 pb-3 border-b border-slate-800 mb-3">
            <span>Date</span>
            <span>Day</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Busiest Hour</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Freest Hour</span>
          </div>

          <div className="space-y-4 text-sm">
            <Row date="2024-12-22" day="Sunday" busy="3:00 PM" free="7:00 AM" />
            <Row date="2024-12-23" day="Monday" busy="2:00 PM" free="6:00 AM" />
            <Row date="2024-12-24" day="Tuesday" busy="1:00 PM" free="7:00 AM" />
            <div className="grid grid-cols-4 py-2 text-slate-600 italic">
               <span>2024-12-25</span><span>Wednesday</span><span>CLOSED</span><span>CLOSED</span>
            </div>
            <Row date="2024-12-26" day="Thursday" busy="3:00 PM" free="8:00 AM" />
            <div className="bg-blue-900/20 -mx-2 px-2 py-2 rounded border-l-2 border-blue-500 grid grid-cols-4 items-center">
               <span className="text-white font-medium">2024-12-28</span>
               <span className="text-white">Saturday</span>
               <span className="text-red-400 font-bold">2:00 PM</span>
               <span className="text-green-400 font-bold">8:00 AM</span>
            </div>
          </div>
        </div>

      {/* Activity Log */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-slate-400"/> Activity Log
            </h3>
            <p className="text-slate-400 text-sm">Real-Time Updates</p>
          </div>
          
          <div className="space-y-3">
            {activityLog.length > 0 ? (
              activityLog.map((activity, index) => (
                <LogItem 
                  key={index}
                  type={activity.type} 
                  time={activity.time} 
                  val={activity.count_change} 
                />
              ))
            ) : (
              <div className="text-slate-500 text-center py-4">No recent activity</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ icon, title, value, sub, isText }) {
  return (
    <div className="bg-[#111827] border border-slate-800 p-6 rounded-xl flex flex-col justify-start items-start gap-4 h-auto shadow-sm">
      <div className="bg-slate-800/50 w-fit p-2 rounded-lg text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h2 className={`text-3xl font-bold text-white mt-1 ${isText ? 'tracking-normal' : 'tracking-tight'}`}>
          {value}
        </h2>
        <p className="text-slate-500 text-xs mt-1">{sub}</p>
      </div>
    </div>
  );
}

function Row({ date, day, busy, free }) {
  return (
    <div className="grid grid-cols-4 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition rounded px-1">
      <span className="text-slate-300">{date}</span>
      <span className="text-slate-300">{day}</span>
      <span className="text-red-400 font-medium">{busy}</span>
      <span className="text-green-400 font-medium">{free}</span>
    </div>
  );
}

function LogItem({ type, time, val }) {
  const isEntry = type === 'entry';
  return (
    <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isEntry ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-600/10 text-slate-400'}`}>
          {isEntry ? <LogIn size={14}/> : <LogOut size={14}/>}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-200">{isEntry ? 'Entry' : 'Exit'}</p>
          <p className="text-xs text-slate-500">{time}</p>
        </div>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded ${isEntry ? 'bg-slate-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
        {val}
      </span>
    </div>
  );
}

function RankItem({ rank, date, val, pct, color, iconColor, barColor }) {
  return (
    <div className="bg-slate-800/20 border border-slate-700/50 p-4 rounded-lg">
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${iconColor}`}>
               <Medal size={16} />
            </div>
            <div>
               <p className={`text-sm font-bold ${color}`}>Rank #{rank}</p>
               <p className="text-slate-500 text-xs">{date}</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-xl font-bold text-white leading-none">{val}</p>
            <p className="text-xs text-slate-500">{pct} Full</p>
         </div>
      </div>
      {/* Mini Progress */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
         <div className={`h-full ${barColor}`} style={{width: pct}}></div>
      </div>
    </div>
  );
}