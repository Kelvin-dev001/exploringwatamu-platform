import React from "react";
import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar />
      <div className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  );
}