// Strips everything but digits and keeps the last 10, so phone numbers entered
// with different formatting (+91, spaces, dashes) still match for cross-record lookup.
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  return digits.slice(-10);
}

module.exports = normalizePhone;
