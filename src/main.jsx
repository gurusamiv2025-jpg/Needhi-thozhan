import React from "react";
import { createRoot } from "react-dom/client";
import NeedhiThozhan from "./NeedhiThozhan.jsx";
import AdminView from "./AdminView.jsx";

const isAdmin = new URLSearchParams(window.location.search).has("admin");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? <AdminView /> : <NeedhiThozhan />}
  </React.StrictMode>
);
