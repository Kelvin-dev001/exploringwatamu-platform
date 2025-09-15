import React from "react";

export default function Card({ children, color = "base-100", className = "", ...props }) {
  return (
    <div className={`card bg-${color} shadow-xl ${className}`} {...props}>
      <div className="card-body">{children}</div>
    </div>
  );
}