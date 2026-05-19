import { setIO } from "./socketIO.js";

/**
 * Configure and register default listeners on the Socket.io server instance
 */
const socketHandler = (io) => {
  setIO(io);

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join virtual clinic room (for real-time dashboard events separation)
    socket.on("join", (clinicId) => {
      if (clinicId) {
        socket.join(clinicId.toString());
        console.log(`[Socket.io] Socket ${socket.id} joined clinic room: ${clinicId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
  
  console.log("[Socket.io] Real-time messaging handler successfully initialized.");
};

export default socketHandler;
