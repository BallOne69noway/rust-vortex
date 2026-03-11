export default async function handler(req, res) {
  const { steamid } = req.query;
  const key = process.env.VITE_STEAM_API_KEY; // Ключ будет в настройках Vercel
  const rustAppId = "252490";

  if (!steamid) return res.status(400).json({ error: 'SteamID is required' });

  try {
    // 1. Получаем инфо о игроке
    const pRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamid}`);
    const pData = await pRes.json();

    // 2. Получаем статистику игры
    const sRes = await fetch(`https://api.steampowered.com/ISteamUser/GetUserStatsForGame/v0002/?appid=${rustAppId}&key=${key}&steamid=${steamid}`);
    const sData = await sRes.json();

    // 3. Получаем время в игре
    const tRes = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${key}&steamid=${steamid}&format=json&appids_filter[0]=${rustAppId}`);
    const tData = await tRes.json();

    // Отправляем всё одним объектом
    res.status(200).json({
      player: pData.response.players[0],
      stats: sData.playerstats ? sData.playerstats.stats : null,
      playtime: tData.response.games ? Math.floor(tData.response.games[0].playtime_forever / 60) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Steam data' });
  }
}