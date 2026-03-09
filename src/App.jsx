import React, { useState } from 'react'

function App() {
  const [playerData, setPlayerData] = useState(null)
  const [gameStats, setGameStats] = useState(null)
  const [playTime, setPlayTime] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchSteamData = async () => {
    setLoading(true)
    const key = import.meta.env.VITE_STEAM_API_KEY
    const customUrl = "DivineBPD" // Твой ник из ссылки
    const rustAppId = "252490"
    const proxy = "https://corsproxy.io/?"
    const ts = new Date().getTime()

    try {
      // 1. ПЕРВОЕ: Превращаем ник в числовой ID (Vanity URL resolution)
      const idRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${key}&vanityurl=${customUrl}`)}`)
      const idData = await idRes.json()
      
      if (idData.response.success !== 1) {
        throw new Error("Steam ID not found")
      }
      
      const realSteamId = idData.response.steamid

      // 2. ВТОРОЕ: Качаем профиль по полученному реальному ID
      const pRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${realSteamId}&t=${ts}`)}`)
      const pData = await pRes.json()
      setPlayerData(pData.response.players[0])

      // 3. ТРЕТЬЕ: Статистика Rust
      const sRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/ISteamUser/GetUserStatsForGame/v0002/?appid=${rustAppId}&key=${key}&steamid=${realSteamId}&t=${ts}`)}`)
      const sData = await sRes.json()
      if (sData.playerstats) {
        setGameStats(sData.playerstats.stats)
      }

      // 4. ЧЕТВЕРТОЕ: Время в игре
      const tRes = await fetch(`${proxy}${encodeURIComponent(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${realSteamId}&format=json&appids_filter[0]=${rustAppId}`)}`)
      const tData = await tRes.json()
      if (tData.response.games) {
        setPlayTime(Math.floor(tData.response.games[0].playtime_forever / 60))
      }

    } catch (e) {
      console.error("Critical Sync Error:", e)
    } finally {
      setLoading(false)
    }
  }

  const getStat = (name) => {
    if (!gameStats) return "0"
    const stat = gameStats.find(s => s.name === name)
    return stat ? stat.value.toLocaleString() : "0"
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl border border-white/10 bg-black/40 backdrop-blur-3xl p-6 md:p-12 relative shadow-2xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none break-all">
              {playerData ? playerData.personaname : "Rust Vortex"}
            </h1>
            <p className="text-zinc-600 text-[10px] tracking-[0.4em] uppercase">
              {playerData ? `Auth_ID: ${playerData.steamid}` : "System_Status: Waiting"}
            </p>
          </div>

          {playerData && (
            <div className="relative group self-center md:self-start">
              <img 
                src={playerData.avatarfull} 
                alt="Avatar" 
                className="w-32 h-32 md:w-40 md:h-40 border border-white/20 grayscale group-hover:grayscale-0 transition-all duration-700 object-cover"
              />
            </div>
          )}
        </div>

        {!gameStats ? (
          <button 
            onClick={fetchSteamData}
            disabled={loading}
            className="w-full border border-white/20 py-12 text-2xl font-black uppercase tracking-[0.6em] transition-all duration-500 hover:bg-white hover:text-black"
          >
            {loading ? "Resolving Identity..." : "Initialize Sync"}
          </button>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700">
            <div className="border border-white/5 bg-white/[0.01] p-6">
              <p className="text-zinc-500 text-[9px] uppercase tracking-widest mb-4">Combat_Module</p>
              <div className="space-y-4">
                <div>
                  <span className="block text-zinc-400 text-xs mb-1">KILLS</span>
                  <span className="text-4xl font-black italic text-red-600">{getStat('kill_player')}</span>
                </div>
                <div>
                  <span className="block text-zinc-400 text-xs mb-1">HEADSHOTS</span>
                  <span className="text-2xl font-bold">{getStat('headshot')}</span>
                </div>
              </div>
            </div>

            <div className="border border-white/5 bg-white/[0.01] p-6">
              <p className="text-zinc-500 text-[9px] uppercase tracking-widest mb-4">Survival_Log</p>
              <div className="space-y-4">
                <div>
                  <span className="block text-zinc-400 text-xs mb-1">DEATHS</span>
                  <span className="text-4xl font-black italic text-zinc-200">{getStat('deaths')}</span>
                </div>
              </div>
            </div>

            <div className="border border-white/5 bg-white/[0.01] p-6">
              <p className="text-zinc-500 text-[9px] uppercase tracking-widest mb-4">Time_Record</p>
              <span className="block text-zinc-400 text-xs mb-1">TOTAL HOURS</span>
              <span className="text-5xl font-light italic">{playTime}H</span>
              <div className="mt-8 pt-4 border-t border-white/5 italic text-[10px] text-zinc-600">
                "Schwarz ist der Tod"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App