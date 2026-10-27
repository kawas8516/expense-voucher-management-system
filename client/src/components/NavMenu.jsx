import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";

// dropdown menu for the navbar
// items: [{ to, label }] or [{ label, onClick }]; a { divider: true } item draws a line
// an item can also have icon: "name" or dot: "approved" (coloured status dot)
// trigger = what the button shows (defaults to icon + label + arrow)
// header = optional block at the top of the list (eg. user name + email)
// keyboard: Enter/Space/ArrowDown opens, ArrowUp/Down/Home/End move, Escape closes
function NavMenu({ label, icon, trigger, header, items, active, align = "left", buttonLabel }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const focusFirst = useRef(false);

  const menuItems = () => (listRef.current ? [...listRef.current.querySelectorAll('[role="menuitem"]')] : []);

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
    // opened with the keyboard -> put focus on the first item
    if (focusFirst.current) {
      focusFirst.current = false;
      const first = menuItems()[0];
      if (first) first.focus();
    }
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onButtonKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusFirst.current = true;
      if (open) menuItems()[0]?.focus();
      else setOpen(true);
    }
  }

  // arrow keys move between items, Tab leaves the menu
  function onListKey(e) {
    const list = menuItems();
    const i = list.indexOf(document.activeElement);
    let next = null;
    if (e.key === "ArrowDown") next = list[(i + 1) % list.length];
    if (e.key === "ArrowUp") next = list[(i - 1 + list.length) % list.length];
    if (e.key === "Home") next = list[0];
    if (e.key === "End") next = list[list.length - 1];
    if (next) {
      e.preventDefault();
      next.focus();
    }
    if (e.key === "Tab") setOpen(false);
  }

  return (
    <div className="nav-menu" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className={"nav-menu-button" + (active ? " active" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={buttonLabel}
        onClick={() => setOpen(!open)}
        onKeyDown={onButtonKey}
      >
        {trigger || (
          <>
            {icon && <Icon name={icon} />}
            {label}
          </>
        )}
        <Icon name="chevron" size={14} />
      </button>
      {open && (
        <div
          className={"nav-menu-list" + (align === "right" ? " right" : "")}
          role="menu"
          aria-label={buttonLabel || label}
          ref={listRef}
          onKeyDown={onListKey}
        >
          {header && <div className="nav-menu-header">{header}</div>}
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="nav-menu-divider" role="separator" />
            ) : item.to ? (
              <Link key={i} to={item.to} role="menuitem" onClick={() => setOpen(false)}>
                <ItemMark item={item} />
                {item.label}
              </Link>
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={item.danger ? "danger" : undefined}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                <ItemMark item={item} />
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// icon or coloured dot in front of a menu item
function ItemMark({ item }) {
  if (item.icon) return <Icon name={item.icon} size={16} />;
  if (item.dot) return <span className={"dot dot-" + item.dot} aria-hidden="true" />;
  return null;
}

export default NavMenu;
