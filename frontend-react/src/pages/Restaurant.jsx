import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const Restaurant = () => {
    const navigate = useNavigate();

    return (
        <div className="home-bg min-h-screen text-white flex flex-col">
            {/* Header / Nav - Full Width */}
            <nav className="glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="brand-wrap">
                    <img
                        src="/frontend/images/IMG_5225.PNG"
                        alt="logo"
                        className="brand-logo"
                    />
                    <h1>Sindhu Mahal</h1>
                </div>

                <Button onClick={() => navigate("/")} variant="glass" icon="🏠">
                    Home
                </Button>
            </nav>

            {/* Main Content Area */}
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-12 flex flex-col justify-center">
                {/* Title Section */}
                <section className="text-center mb-12 fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-orange-500 tracking-wider">
                        Restaurant 
                    </h2>
                    <p className="text-gray-400 text-sm md:text-base mt-3 uppercase tracking-widest font-semibold">
                        Manage Daily Operations
                    </p>
                </section>

                {/* Cards Panel */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto fade-in-up-delayed">
                    
                    {/* Purchase Card */}
                    <div className="glass p-8 rounded-3xl border border-white/10 hover:border-orange-500/30 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col justify-between items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-500/10 group w-full">
                        <div className="mb-6 flex flex-col items-center w-full">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-3xl mb-4 border border-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                                🛒
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-wide mb-3">Kitchen Purchase</h3>
                            <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                                Manage raw materials, ingredient stock levels, and daily purchase logs.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => navigate("/kitchen/purchases")} 
                            variant="primary" 
                            fullWidth 
                            icon="🛒"
                            className="py-3.5 shadow-lg shadow-orange-500/20 font-bold uppercase tracking-wider"
                        >
                            Kitchen Purchase
                        </Button>
                    </div>

                    {/* Inventory Card */}
                    <div className="glass p-8 rounded-3xl border border-white/10 hover:border-orange-500/30 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col justify-between items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-500/10 group w-full">
                        <div className="mb-6 flex flex-col items-center w-full">
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-3xl mb-4 border border-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                                📋
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-wide mb-3">Inventory</h3>
                            <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                                Monitor real-time stock levels, minimum reorder limits, and supply statuses.
                            </p>
                        </div>
                        <Button 
                            onClick={() => navigate("/restaurant/inventory")} 
                            variant="primary" 
                            fullWidth 
                            icon="🔍"
                            className="py-3.5 shadow-lg shadow-orange-500/20 font-bold uppercase tracking-wider"
                        >
                            Inventory Overview
                        </Button>
                    </div>

                </section>
            </div>
        </div>
    );
};

export default Restaurant;
