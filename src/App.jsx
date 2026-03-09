import React, { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function App() {
  const [playerData, setPlayerData] = useState(null)
  const [gameStats, setGameStats] = useState(null)
  const [playTime, setPlayTime] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchSteamData = async () => {
    setLoading(true)
    const key = import.meta.env.VITE_STEAM_API_KEY
    const customUrl = "DivineBPD"
    const rustAppId = "252490"
    const proxy = "https://corsproxy.io/?"
    const ts = new Date().getTime()

    try {
      const idRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${customUrl}`)}`)
      const idData = await idRes.json()
      const steamId = idData.response.steamid

      const pRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamId}&t=${ts}`)}`)
      const pData = await pRes.json()
      setPlayerData(pData.response.players[0])

      const sRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/ISteamUser/GetUserStatsForGame/v0002/?appid=${rustAppId}&key=${key}&steamid=${steamId}&t=${ts}`)}`)
      const sData = await sRes.json()
      if (sData.playerstats) setGameStats(sData.playerstats.stats)

      const tRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${steamId}&format=json&appids_filter[0]=${rustAppId}`)}`)
      const tData = await tRes.json()
      if (tData.response.games) setPlayTime(Math.floor(tData.response.games[0].playtime_forever / 60))
    } catch (e) {
      console.error("Sync Error:", e)
    } finally {
      setLoading(false)
    }
  }

  const getStat = (name) => {
    if (!gameStats) return 0
    const stat = gameStats.find(s => s.name === name)
    return stat ? stat.value : 0
  }

  // Подготовка данных для графика
  const chartData = useMemo(() => {
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
              {playerData ? `Session // ${playerData.steamid}` : "System // Offline"}
            </p>
          </div>
          {playerData && (
            <img src={playerData.avatarfull} className="w-32 h-32 border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" alt="Avatar" />
          )}
        </div>

        {!gameStats ? (
          <button onClick={fetchSteamData} disabled={loading} className="w-full border border-white/20 py-16 text-2xl font-black uppercase tracking-[0.8em] hover:bg-white hover:text-black transition-all">
            {loading ? "DATA HARVESTING..." : "INITIALIZE SYNC"}
          </button>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-1000">
            
            {/* Левая колонка: Цифры */}
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
              <div className="border border-white/5 p-8 bg-white/[0.02]">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest block mb-2">Efficiency Rating</span>
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl font-black italic italic">{(getStat('kill_player') / getStat('deaths')).toFixed(2)}</span>
                  <span className="text-zinc-600 text-xl uppercase font-bold">K/D Ratio</span>
                </div>
              </div>
            </div>

            {/* Правая колонка: График */}
            <div className="border border-white/5 bg-white/[0.01] p-6 h-[300px]">
              <p className="text-zinc-500 text-[9px] uppercase tracking-[0.3em] mb-8">Visual_Metrics</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#27272a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000', border: '1px solid #333', fontSize: '10px'}} />
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