import { Server } from "socket.io";
import { Filter } from 'bad-words';
import { createRequire } from "module";
import express from 'express';
import http from 'http';
import fetch from 'node-fetch';
import 'dotenv/config';

const require = createRequire(import.meta.url);
const indonesianBadWords = require('indonesian-badwords');
//const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const LARAVEL_API_URL = process.env.LARAVEL_API_URL;

const apiEndpoints = {
  'livescore_soccer': process.env.SOCCER_API_URL,
  'livescore_basket': process.env.BASKET_API_URL
  // Add more rooms and URLs here as needed
};
const SCRAPE_INTERVAL = 60000;
const activePolls = new Map();

const cleanImageUrl = (url) => {
  if (!url) return url;
  return url.split('!')[0];
};

const scrapeLiveScores = async (room) => {
  const apiUrl = apiEndpoints[room];
  if (!apiUrl) return;

  try {
    const now = new Date();
    const datesToFetch = [0, -1].map(offset => {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(d);
    });
    // const date = new Date().toISOString().split('T')[0];

    let combinedList = [];
    let isArrayData = false;

    for (const date of datesToFetch) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_time: date, filter: 1 })
        });
        const result = await response.json();

        if (result && result.data.list) {
          const list = result.data.list;

          if (Array.isArray(list)) {
            isArrayData = true;
            combinedList = [...combinedList, ...list];
          } else {
            isArrayData = false;
            if (Array.isArray(combinedList)) combinedList = {}; // Reset if switching types (unlikely)

            for (const [leagueName, matches] of Object.entries(list)) {
              if (!combinedList[leagueName]) {
                combinedList[leagueName] = [];
              }
              // Avoid duplicates based on match ID
              const existingIds = new Set(combinedList[leagueName].map(m => m.id));
              const newMatches = matches.filter(m => !existingIds.has(m.id));

              combinedList[leagueName] = [...combinedList[leagueName], ...newMatches];
            }
          }
        }
      } catch (fetchErr) {
        console.warn(`Failed to fetch for date ${date}:`, fetchErr.message);
      }
    }

    let matchesList = {};
    let externalIds = [];

    if (isArrayData) {
      const uniqueMatches = Array.from(new Map(combinedList.map(item => [item.id, item])).values());
      for (const match of uniqueMatches) {
        externalIds.push(match.id);

        const leagueName = match.competition_name || 'Unknown League';
        if (!matchesList[leagueName]) {
          matchesList[leagueName] = {
            league_name: leagueName,
            matches: []
          };
        }

        // Clean Image URLs
        // match.home_team_logo = cleanImageUrl(match.home_team_logo);
        // match.away_team_logo = cleanImageUrl(match.away_team_logo);
        // match.competition_logo = cleanImageUrl(match.competition_logo);
        // match.country_logo = cleanImageUrl(match.country_logo);

        matchesList[leagueName].matches.push(match);
      }
    } else {
      matchesList = combinedList;

      for (const leagueName in matchesList) {
        // Ensure structure: { league_name, competition_logo, matches: [] }
        const matches = matchesList[leagueName];

        // If it's just a raw array (from the merge step), wrap it
        if (Array.isArray(matches)) {
          matchesList[leagueName] = {
            league_name: leagueName,
            //competition_logo: cleanImageUrl(matches[0]?.competition_logo),
            matches: matches
          };
        }

        // Process each match in the league
        matchesList[leagueName].matches.forEach(match => {
          externalIds.push(match.id);
          // match.home_team_logo = cleanImageUrl(match.home_team_logo);
          // match.away_team_logo = cleanImageUrl(match.away_team_logo);
          // match.competition_logo = cleanImageUrl(match.competition_logo);
          // match.country_logo = cleanImageUrl(match.country_logo);
        });
      }
    }

    let streamMap = {};
    if (externalIds.length > 0) {
      try {
        console.log(`Asking for ${externalIds.length} IDs...`);

        const matchResponse = await fetch(`${LARAVEL_API_URL}/streams/find-by-source-ids`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: externalIds })
        });
        if (matchResponse.ok) {
          streamMap = await matchResponse.json(); // Expects: { "external_id": "internal_id", ... }
          console.log("Response map:", JSON.stringify(streamMap));
        }else {
          // Add logging for failure
          console.error("Result:", matchResponse.status, matchResponse.statusText);
          const errorText = await matchResponse.text();
          console.error("Error body:", errorText);
        }
      } catch (e) {
        console.error("Failed to fetch matching streams:", e.message);
      }
    }

    for (const leagueName in matchesList) {
      matchesList[leagueName].matches = matchesList[leagueName].matches.map(match => {
        // Add our internal ID if it exists in the map
        match.stream_link = streamMap[match.id] || null;
        return match;
      });
    }

    io.in(room).emit('livescore_update', matchesList);
    console.log(`Sent livescore update to room ${room}`);

  } catch (err) {
    console.error(`Scrape failed for ${room}:`, err.message);
  }

};
// ---

// --- Chatroom ---
const filter = new Filter();
//filter.addWords(...indonesianBadWords);
const RATE_LIMIT_MS = 2000;
const kickedUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL,
    methods: ["GET", "POST"]
  }
});

// --- Authentication Middleware ---
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (token) {
    try {
      const response = await fetch(`${LARAVEL_API_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        socket.user = await response.json();
        const kickExpiry = kickedUsers.get(socket.user.id);

        if (kickExpiry && Date.now() < kickExpiry) {
          console.log(`Rejected kicked user: ${socket.user.name}`);
          return next(new Error('You are temporarily kicked from chat.'));
        }
        console.log(`Authenticated user: ${socket.user.name}`);
      } else {
        // Token was invalid
        socket.user = null;
      }
    } catch (error) {
      console.error("Auth fetch error:", error.message);
      socket.user = null;
    }
  } else {
    // No token, treat as guest
    socket.user = null;
  }

  next();
});
// ---

// --- Main Connection Handler ---
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);
  let lastMessageTime = Date.now() - RATE_LIMIT_MS;

  // --- CHAT EVENT LISTENERS ---
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
    const count = io.sockets.adapter.rooms.get(room)?.size || 0;
    socket.emit('viewer_count_update', count);
  });

  socket.on('send_message', (data) => { // When a user sends a message
    const user = socket.user || data;
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_MS) {
      console.log(`User ${socket.id} send too fast.`);
      socket.emit('chat_error', 'You are sending messages too fast.');
      //kickedUsers.set(socket.id, Date.now() + 5000);
      return;
    }
    lastMessageTime = now; // Update the last message time

    const cleanedMessage = filter.clean(indonesianBadWords.censor(data.message));
    const moderatedData = {
      ...data,
      message: cleanedMessage,
      username: user.name || data.username || 'Guest',
      userId: user.id || data.userId,
      is_admin: user ? user.is_admin : false,
    };

    //socket.to(data.room).emit('receive_message', moderatedData);
    io.in(data.room).emit('receive_message', moderatedData);
  });

  socket.on('delete_message', (messageData) => {
    if (socket.user && socket.user.is_admin) {
      io.in(messageData.room).emit('message_deleted', messageData.id);
      //socket.to(data.room).emit('message_deleted', messageData.id);
      console.log(`Admin ${socket.user.name} deleted message ${messageData.id}`);
    }
  });

  socket.on('kick_user', (data) => {
    // Check if the person sending the command is an admin
    if (socket.user && socket.user.is_admin) {
      const { userIdToKick, durationSeconds } = data;

      if (socket.user.id === userIdToKick) {
        console.log(`Admin ${socket.user.name} tried to kick themselves.`);
        // Optionally send an error back, but for now just ignore the request
        return;
      }

      const expiryTime = Date.now() + durationSeconds * 1000;
      // Add the user to the kicked list
      kickedUsers.set(userIdToKick, expiryTime);
      console.log(`Admin ${socket.user.name} kicked user ${userIdToKick} for ${durationSeconds}s`);

      // Find all sockets associated with that user ID and disconnect them
      io.sockets.sockets.forEach((s) => {
        if (s.user && s.user.id === userIdToKick) {
          s.emit('you_are_kicked', {
            message: `You are banned for ${durationSeconds} seconds.`,
            duration: durationSeconds
          });
          s.disconnect(true);
        }
      });
    }
  });

  // --- LIVESCORE EVENT LISTENERS ---
  socket.on('join_livescore_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
    if (roomSize === 1 && !activePolls.has(room)) {
      console.log(`Starting poll for ${room}`);
      scrapeLiveScores(room); // Scrape immediately
      const intervalId = setInterval(() => scrapeLiveScores(room), SCRAPE_INTERVAL);
      activePolls.set(room, intervalId);
    }
  });

  // --- DISCONNECT HANDLER ---
  socket.on('disconnecting', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Check all rooms the user was in
    socket.rooms.forEach((room) => {
      if (room.startsWith('chatroom_')) {
        const count = (io.sockets.adapter.rooms.get(room)?.size || 1);
        socket.to(room).emit('viewer_count_update', count);
      }

      // Check if it's a livescore room and if they are the last user
      const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
      if (room.startsWith('livescore_') && roomSize === 1 && activePolls.has(room)) {
        console.log(`Stopping poll for ${room}`);
        clearInterval(activePolls.get(room));
        activePolls.delete(room);
      }
    });
  });
});
// ---


// Every 10 seconds, send an updated count to chatroom
setInterval(() => {
  const rooms = io.sockets.adapter.rooms;
  rooms.forEach((clients, roomName) => {
    const isRealRoom = !io.sockets.sockets.has(roomName);
    const isChatRoom = roomName.startsWith('chatroom_');

    if (clients.size > 0 && isRealRoom && isChatRoom) {
      const count = clients.size;
      io.in(roomName).emit('viewer_count_update', count);
    }
  });
}, 10000);

const PORT = 4000;
const HOST = '127.0.0.1';
server.listen(PORT, () => {
  console.log(`Chat server is running on http://${HOST}:${PORT}`);
});