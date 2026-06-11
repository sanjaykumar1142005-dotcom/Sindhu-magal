import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const AdminDashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem("role");
        const token = localStorage.getItem("token");
        if (role !== "admin" || !token) {
            navigate("/login");
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        alert("Logged out");
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden" 
             style={{ background: "radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)" }}>
            
            {/* Header / Brand */}
            <div className="text-center mb-10 flex flex-col items-center animate-fadeIn">
                <img 
                    src="/frontend/images/IMG_5225.PNG" 
                    alt="logo" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-xl mb-4 hover:scale-105 transition-transform"
                    onError={(e) => {e.target.style.display='none'}}
                />
                <h1 className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-wider">Sindhu Mahal</h1>
                <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-semibold">Central Administrative Console</p>
            </div>

            {/* Dashboard Chooser Options */}
            <div className="flex justify-center w-full max-w-xl px-4 animate-fadeIn">
                
                {/* Option 1: Catering Management */}
                <div className="glass p-8 rounded-3xl border border-white/10 hover:border-orange-500/30 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col justify-between items-center text-center transition-all duration-300 hover:scale-[1.03] w-full">
                    <div className="mb-6">
                        <span className="text-5xl block mb-4 filter drop-shadow-md">🍽️</span>
                        <h2 className="text-2xl font-bold text-white tracking-wide mb-3">Catering Management</h2>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                            Manage wedding hall menus, guest pricing multipliers, default catering seeding lists, and generate official catering quotations.
                        </p>
                    </div>
                    <Button 
                        onClick={() => navigate('/admin/catering')} 
                        variant="primary" 
                        fullWidth 
                        icon="⚙️"
                        className="py-3.5 shadow-lg shadow-orange-500/20 font-bold uppercase tracking-wider"
                    >
                        Manage Catering
                    </Button>
                </div>

            </div>

            {/* Bottom Controls */}
            <div className="flex gap-4 mt-12 animate-fadeIn">
                <Button onClick={() => navigate('/')} variant="glass" icon="🏠">Go to Website</Button>
                <Button onClick={handleLogout} variant="danger" icon="🚪">Log Out Console</Button>
            </div>

            {/* Fine print */}
            <p className="text-[10px] text-gray-600 mt-16 font-mono">Sindhu Mahal Console v2.0 • Secured Session</p>
        </div>
    );
};

export default AdminDashboard;
