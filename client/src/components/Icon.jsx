// small line icons (24x24, drawn with currentColor) so no icon library is needed
const PATHS = {
  home: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  pencil: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  check: "M5 12l5 5 9-10",
  x: "M6 6l12 12M18 6L6 18",
  rupee: "M7 4h10M7 9h10M7 4c6 0 6 9 0 9h-0l7 7",
  list: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  activity: "M3 12h4l3 8 4-16 3 8h4",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  moon: "M20 14a8 8 0 1 1-10-10 7 7 0 0 0 10 10z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  plus: "M12 5v14M5 12h14",
  chevron: "M6 9l6 6 6-6",
  wallet: "M3 7h15a3 3 0 0 1 3 3v8H3zM3 7l12-3v3M17 13h.01",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  menu: "M4 6h16M4 12h16M4 18h16",
  signature: "M3 17c3-1 4-9 7-9s0 9 3 9 3-4 5-4 2 2 3 2M3 21h18",
};

function Icon({ name, size = 18 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] || PATHS.file} />
    </svg>
  );
}

export default Icon;
