// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { BoothProvider } from "./store";
import Landing from "./Landing";
import Select from "./pages/Select";
import Booth from "./pages/Booth";
import Upload from "./pages/Upload";
import Result from "./pages/Result";

export default function App() {
  return (
    <BoothProvider>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/select" element={<Select/>} />
        <Route path="/booth/:templateId" element={<Booth/>} />
        <Route path="/upload/:templateId" element={<Upload/>} />
        <Route path="/result/:templateId" element={<Result/>} />
      </Routes>
    </BoothProvider>
  );
}
