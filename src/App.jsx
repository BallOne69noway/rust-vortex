import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function App() {
  const [playerData, setPlayerData] = useState(null)
  const [gameStats, setGameStats] = useState(null)
  const [playTime, setPlayTime] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('') // Поле для ввода ID
  const [error, setError] = useState(null)

  const fetchSteamData = async () => {
    if (!searchQuery) return
    setLoading(true)
    setError(null)

    try {
      // Запрос к нашему новому API-роуту на Vercel
      const response = await fetch(`/api/stats?steamid=${searchQuery}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPlayerData(data.player)
      setGameStats(data.stats)
      setPlayTime(data.playtime)
    } catch (e) {
      console.error("Sync Error:", e)
      setError("FAILED TO HARVEST DATA. CHECK ID.")
    } finally {
      setLoading(false)
    }
  }

  const getStat = (name) => {
    if (!gameStats) return 0
    const stat = gameStats.find(s => s.name === name)
    return stat ? stat.value : 0
  }

  const chartData = useMemo(() => {
    if (!gameStats) return []
    const kills = getStat('kill_player')
    const deaths = getStat('deaths')
    const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills
    
    return [
      { name: 'KILLS', value: kills, color: '#b91c1c' },
      { name: 'DEATHS', value: deaths, color: '#3f3f46' },
      { name: 'K/D', value: parseFloat(kd), color: '#ffffff' }
    ]
  }, [gameStats])

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-5xl border border-white/10 bg-black/40 backdrop-blur-3xl p-6 md:p-12 relative shadow-2xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase break-all">
              {playerData ? playerData.personaname : "Rust Vortex"}
            </h1>
            <p className="text-zinc-600 text-[10px] tracking-[0.5em] uppercase">
              {playerData ? `Session // ${playerData.steamid}` : "System // Standby"}
            </p>
          </div>
          {playerData && (
            <img src={playerData.avatarfull} className="w-32 h-32 border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" alt="Avatar" />
          )}
        </div>

        {/* Search Input Section */}
        <div className="mb-12 space-y-4">
          <div className="relative group">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ENTER STEAMID64..."
              className="w-full bg-transparent border-b-2 border-white/10 py-4 text-2xl outline-none focus:border-red-600 transition-all duration-500 uppercase font-black tracking-widest placeholder:text-zinc-800"
            />
            <div className="absolute bottom-0 left-0 h-[2px] w-0 group-focus-within:w-full bg-red-600 transition-all duration-700"></div>
          </div>
          
          <button 
            onClick={fetchSteamData} 
            disabled={loading || !searchQuery} 
            className="w-full border border-white/20 py-6 text-xl font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all disabled:opacity-30"
          >
            {loading ? "DATA HARVESTING..." : "INITIALIZE SYNC"}
          </button>
          
          {error && <p className="text-red-600 text-[10px] uppercase tracking-widest animate-pulse">{error}</p>}
        </div>

        {gameStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-1000">
            
            {/* Stats Column */}
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-white/5 p-6 bg-white/[0.01]">
                  <span className="text-zinc-500 text-[9px] uppercase tracking-widest block mb-2">Eliminations</span>
                  <span className="text-4xl font-black text-red-600">{getStat('kill_player').toLocaleString()}</span>
                </div>
                <div className="border border-white/5 p-6 bg-white/[0.01]">
                  <span className="text-zinc-500 text-[9px] uppercase tracking-widest block mb-2">Total Deaths</span>
                  <span className="text-4xl font-black text-zinc-300">{getStat('deaths').toLocaleString()}</span>
                </div>
              </div>
              
              <div className="border border-white/5 p-8 bg-white/[0.02] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 text-zinc-900 font-black text-6xl -rotate-12 group-hover:text-red-900/20 transition-colors">RUST</div>
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest block mb-2">Efficiency Rating</span>
                <div className="flex items-baseline gap-4 relative z-10">
                  <span className="text-7xl font-black italic">
                    {getStat('deaths') > 0 ? (getStat('kill_player') / getStat('deaths')).toFixed(2) : getStat('kill_player')}
                  </span>
                  <span className="text-zinc-600 text-xl uppercase font-bold">K/D Ratio</span>
                </div>
              </div>

              <div className="border border-white/5 p-4 bg-white/[0.01]">
                <span className="text-zinc-500 text-[9px] uppercase tracking-widest block">Playtime: {playTime} Hours</span>
              </div>
            </div>

            {/* Chart Column */}
            <div className="border border-white/5 bg-white/[0.01] p-6 h-[350px]">
              <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] mb-8">Visual_Metrics // Performance_Graph</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#27272a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{backgroundColor: '#050505', border: '1px solid #222', fontSize: '10px'}} 
                  />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App