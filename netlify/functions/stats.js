export const handler = async (event) => {
  // Получаем steamid из параметров запроса
  const steamid = event.queryStringParameters.steamid;
  const STEAM_API_KEY = process.env.VITE_STEAM_API_KEY;
  const rustAppId = "252490";

  if (!steamid) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'SteamID is required' }),
    };
  }

  try {
    // 1. Получаем инфо о игроке
    const pRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamid}`);
    const pData = await pRes.json();

    // 2. Получаем статистику игры
    const sRes = await fetch(`https://api.steampowered.com/ISteamUser/GetUserStatsForGame/v0002/?appid=${rustAppId}&key=${STEAM_API_KEY}&steamid=${steamid}`);
    const sData = await sRes.json();

    // 3. Получаем время в игре
    const tRes = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamid}&format=json&appids_filter[0]=${rustAppId}`);
    const tData = await tRes.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        player: pData.response.players[0] || null,
        stats: sData.playerstats ? sData.playerstats.stats : null,
        playtime: tData.response.games ? Math.floor(tData.response.games[0].playtime_forever / 60) : 0
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch Steam data', details: error.message }),
    };
  }
};