import React from 'react';
import { 
  Users, LogIn, LogOut, Activity, 
  Settings, Sun, RotateCw, Calendar, Clock, Trophy, Medal
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';


const data = [
  { time: '06:00', visitors: 10 },
  { time: '07:00', visitors: 45 },
  { time: '08:00', visitors: 90 },
  { time: '09:00', visitors: 130 },
  { time: '10:00', visitors: 170 },
  { time: '11:00', visitors: 210 },
  { time: '12:00', visitors: 240 },
  { time: '13:00', visitors: 255 },
  { time: '14:00', visitors: 245 },
  { time: '15:00', visitors: 260 },
  { time: '16:00', visitors: 280 },
  { time: '17:00', visitors: 245 },
];

export default function App() {
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
          <span className="text-xs flex items-center gap-1"><RotateCw size={14}/> UPDATED 14:30</span>
          <Sun size={20} className="hover:text-white cursor-pointer" />
          <Settings size={20} className="hover:text-white cursor-pointer" />
        </div>
      </header>

      {/* --- USER STORY BANNER --- */}
      <div className="bg-[#1A2333] border border-blue-900/50 rounded-lg p-3 mb-6 flex justify-between items-center text-sm shadow-lg shadow-blue-900/10">
        <div className="flex gap-3 items-center">
          <div className="bg-blue-600/20 text-blue-400 p-1.5 rounded">
            <Users size={16} />
          </div>
          <div>
            <span className="font-semibold text-blue-100">Scenario 1: Check Library Status Before Walking There</span>
            <p className="text-slate-400 text-xs">David - Engineering Student</p>
          </div>
        </div>
        <span className="text-slate-500 text-xs">Time: 14:30</span>
      </div>

      {/* --- MAIN OCCUPANCY CARD --- */}
      <div className="bg-[#111827] rounded-2xl p-6 mb-6 border border-slate-800 relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <Activity size={16} className="text-slate-400"/>
                <span className="text-slate-400 font-medium">Moderate</span>
             </div>
             <p className="text-slate-500 text-sm">Current Occupancy</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold text-white">82%</div>
            <div className="text-slate-400 text-sm">Capacity</div>
          </div>
        </div>

        <div className="flex items-end gap-2 mb-4">
          <span className="text-6xl font-bold text-white tracking-tighter">245</span>
          <span className="text-xl text-slate-500 mb-2">/ 300</span>
          <span className="text-sm text-slate-500 mb-2 ml-2">Active Visitors</span>
        </div>

        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full w-[82%] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard icon={<LogIn size={20} />} title="Total Entries" value="740" sub="Today" />
        <StatCard icon={<LogOut size={20} />} title="Total Exits" value="617" sub="Today" />
        <StatCard icon={<Activity size={20} />} title="Peak Hour" value="2:30 PM" sub="Today" isText />
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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
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
              <ReferenceLine y={280} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Max', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Footer Stats for Chart */}
        <div className="grid grid-cols-3 gap-4 mt-6 border-t border-slate-800 pt-4">
           <div>
             <p className="text-xs text-slate-500">Current Trend</p>
             <p className="text-green-400 font-bold flex items-center gap-1">↘ Falling</p>
           </div>
           <div>
             <p className="text-xs text-slate-500">Peak Today</p>
             <p className="text-xl font-bold text-white">282</p>
           </div>
           <div>
             <p className="text-xs text-slate-500">Avg Today</p>
             <p className="text-xl font-bold text-white">167</p>
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
            <LogItem type="exit" time="10:32 PM" val="-2" />
            <LogItem type="entry" time="10:29 PM" val="+2" />
            <LogItem type="exit" time="10:26 PM" val="-1" />
            <LogItem type="entry" time="10:21 PM" val="+3" />
            <LogItem type="entry" time="10:18 PM" val="+1" />
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