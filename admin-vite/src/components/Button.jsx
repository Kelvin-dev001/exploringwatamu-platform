import React from "react";

export default function Button({ children, color = "primary", ...props }) {
  return (
    <button
      className={`btn btn-${color} font-semibold`}
      {...props}
    >
      {children}
    </button>
  );
}