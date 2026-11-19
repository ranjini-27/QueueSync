import { MdArrowBack, MdErrorOutline } from "react-icons/md";
import { getServiceIcon } from "./serviceIcons.jsx";
import "./KioskServiceGrid.css";

/**
 * Large-tile service picker. `services` comes from GET /api/queue/services
 * (active services only — kept in sync with whatever the admin currently
 * has enabled in Service Management, Module 4).
 */
export default function KioskServiceGrid({ services, loading, error, disabled, onSelect, onBack }) {
  return (
    <div className="kiosk-services">
      <div className="kiosk-services__header">
        <button className="kiosk-services__back" onClick={onBack} type="button">
          <MdArrowBack size={22} />
          <span>Back</span>
        </button>
        <h2>What can we help you with today?</h2>
        <p>Select a service to get your token</p>
      </div>

      {loading && <div className="kiosk-services__status">Loading services…</div>}

      {!loading && error && (
        <div className="kiosk-services__status kiosk-services__status--error">
          <MdErrorOutline size={28} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="kiosk-services__status">
          No services are available right now. Please see a staff member for assistance.
        </div>
      )}

      {!loading && !error && services.length > 0 && (
        <div className="kiosk-services__grid">
          {services.map((service) => {
            const Icon = getServiceIcon(service.name);
            return (
              <button
                key={service._id}
                className="kiosk-service-tile"
                onClick={() => onSelect(service.name)}
                disabled={disabled}
                type="button"
              >
                <span className="kiosk-service-tile__icon">
                  <Icon size={34} />
                </span>
                <span className="kiosk-service-tile__label">{service.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
