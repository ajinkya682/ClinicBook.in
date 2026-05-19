/**
 * Generates a unique booking ID.
 * Format: CB-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
 * Example: CB-20260519-4521
 * @returns {string} The generated booking ID.
 */
export const generateBookingId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  const yyyymmdd = `${year}${month}${day}`;
  const random4Digits = String(Math.floor(1000 + Math.random() * 9000));
  
  return `CB-${yyyymmdd}-${random4Digits}`;
};
