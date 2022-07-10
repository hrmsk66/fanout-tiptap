import "./MenuItem.scss";
const remixiconUrl = "/remixicon-reduced.symbol.svg";

export const MenuItem = ({ icon, title, action, isActive = null }) => (
  <button
    className={`menu-item${isActive && isActive() ? " is-active" : ""}`}
    onClick={action}
    title={title}
  >
    <svg className="remix">
      <use xlinkHref={`${remixiconUrl}#ri-${icon}`} />
    </svg>
  </button>
);
