import { setUnit, useUnit } from "../lib/units";

/** km/mi segmented toggle. Preference persists on-device only. */
export function UnitToggle() {
  const unit = useUnit();
  return (
    <span className="unit-toggle" role="group" aria-label="Distance units">
      {(["km", "mi"] as const).map((u) => (
        <button
          key={u}
          className={unit === u ? "active" : ""}
          aria-pressed={unit === u}
          onClick={() => setUnit(u)}
        >
          {u}
        </button>
      ))}
    </span>
  );
}
