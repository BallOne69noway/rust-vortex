export const handler = async (event) => {
  let steamid = event.queryStringParameters.steamid;
  const STEAM_API_KEY = process.env.VITE_STEAM_API_KEY;
  const rustAppId = "252490";

  console.log("Searching for:", steamid); // Увидим в логах, что пришло

  if (!steamid) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Input is required' }) };
  }

  try {
    // 1. Очистка ссылки
    steamid = steamid.replace(/https?:\/\/steamcommunity\.com\/(profiles|id)\//, '').replace(/\/$/, '');

    // 2. Превращаем ник (DivineBPD) в ID, если это не цифры
    if (!/^\d{17}$/.test(steamid)) {
      console.log("Resolving vanity URL for:", steamid);
      const resolveRes = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${steamid}`);
      const resolveData = await resolveRes.json();
      
      if (resolveData.response && resolveData.response.success === 1) {
        steamid = resolveData.response.steamid;
        console.log("Found SteamID:", steamid);
      } else {
        console.log("Failed to resolve vanity URL");
        return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
      }
    }

    // 3. Запросы к Steam (теперь везде строго STEAM_API_KEY)
    const pRes = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamid}`);
    const pData = await pRes.json();

    const sRes = await fetch(`https://api.steampowered.com/ISteamUser/GetUserStatsForGame/v0002/?appid=${rustAppId}&key=${STEAM_API_KEY}&steamid=${steamid}`);
    const sData = await sRes.json();

    const tRes = await fetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamid}&format=json&appids_filter[0]=${rustAppId}`);
    const tData = await tRes.json();

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify({
        player: pData.response.players[0] || null,
        stats: sData.playerstats ? sData.playerstats.stats : null,
        playtime: tData.response.games ? Math.floor(tData.response.games[0].playtime_forever / 60) : 0
      }),
    };
  } catch (error) {
    console.error("Error in function:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server Error', details: error.message }),
    };
  }
};