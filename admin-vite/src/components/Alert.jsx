import React from "react";

export default function Alert({ type = "error", children }) {
  return (
    <div className={`alert alert-${type} mb-4`}>
      {children}
    </div>
  );
}