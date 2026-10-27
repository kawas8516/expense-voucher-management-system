import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// dropdown menu for the navbar
// items: [{ to, label }] or [{ label, onClick }]; a { divider: true } item draws a line
// active = highlight the button (current page is in this menu)
// align="right" opens the list to the left, for the menu at the right edge
function NavMenu({ label, items, active, align = "left" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  // close on outside click and on Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        if (buttonRef.current) buttonRef.current.focus();
      }
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="nav-menu" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className={"nav-menu-button" + (active ? " active" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className={"nav-menu-list" + (align === "right" ? " right" : "")} role="menu">
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="nav-menu-divider" role="separator" />
            ) : item.to ? (
              <Link key={i} to={item.to} role="menuitem" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default NavMenu;
