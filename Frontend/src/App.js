import React from "react";
import ReactDOM from "react-dom/client";
import "../style.css";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ActivitySection from "./components/ActivitySection";

const AppLayout = () => {
    return (
        <div className="app">
            <Header />

            <div className="page-container">
                <HeroSection />
            </div>

            <div className="page-container">
                <ActivitySection />
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppLayout />);