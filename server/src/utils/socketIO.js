let ioInstance = null;

/**
 * Set the global Socket.io instance
 * @param {object} io - Socket.io server instance
 */
export const setIO = (io) => {
  ioInstance = io;
};

/**
 * Retrieve the active Socket.io instance
 * @returns {object|null}
 */
export const getIO = () => {
  return ioInstance;
};
