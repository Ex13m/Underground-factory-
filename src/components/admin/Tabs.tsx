/** Таб-бар админки в стиле цеховых табличек. */

export interface AdminTab {
  id: string;
  label: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: AdminTab[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="adm-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          className={`adm-tab ${active === tab.id ? 'on' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
