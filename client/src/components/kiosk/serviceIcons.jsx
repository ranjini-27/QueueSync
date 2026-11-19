import {
  MdOutlineSavings,
  MdOutlinePayments,
  MdOutlineRequestQuote,
  MdOutlineAccountBalance,
  MdOutlineDescription,
  MdOutlineLock,
} from "react-icons/md";

/**
 * Maps a service name to an icon for the Kiosk's service-selection grid.
 * Services are managed dynamically by the admin (Module 4 Service
 * Management) rather than pinned to a fixed enum, so this is a best-effort
 * keyword match instead of an exact-name lookup — any new service name the
 * admin adds later still renders with a sensible icon instead of breaking
 * the grid or falling back to a blank tile.
 */
const KEYWORD_ICONS = [
  [/deposit|withdraw|cash|payment/i, MdOutlinePayments],
  [/loan|credit|quote/i, MdOutlineRequestQuote],
  [/passbook|cheque|check|draft|statement/i, MdOutlineDescription],
  [/account|opening/i, MdOutlineAccountBalance],
  [/locker|safe/i, MdOutlineLock],
];

export function getServiceIcon(serviceName = "") {
  const match = KEYWORD_ICONS.find(([pattern]) => pattern.test(serviceName));
  return match ? match[1] : MdOutlineSavings;
}
