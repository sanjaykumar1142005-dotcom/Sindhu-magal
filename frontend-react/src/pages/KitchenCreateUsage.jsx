import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const KitchenCreateUsage = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // Form states
    const [selectedUsageFoodName, setSelectedUsageFoodName] = useState('');
    const [usageQuantity, setUsageQuantity] = useState('');
    const [usageReason, setUsageReason] = useState('Dinner service');

    const navigate = useNavigate();

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements`);
            const data = await res.json();
            if (data.success) {
                const mappedItems = (data.data || []).map(item => {
                    const lowerName = (item.name || '').toLowerCase();
                    const isLeaf = lowerName.includes('leaf') || lowerName.includes('leafe');
                    const isLiquid = lowerName.includes('milk') || lowerName.includes('oil') || lowerName.includes('water') || lowerName.includes('juice') || lowerName.includes('ghee') || lowerName.includes('vinegar') || lowerName.includes('sauce') || lowerName.includes('honey') || lowerName.includes('syrup') || lowerName.includes('liquid') || lowerName.includes('litter') || lowerName.includes('liter') || lowerName.includes('ltr');
                    
                    let resolvedUnit = item.unit || 'Kg';
                    if (isLeaf) {
                        resolvedUnit = 'Pcs';
                    } else if (isLiquid && resolvedUnit === 'Kg') {
                        resolvedUnit = 'Liter';
                    }

                    return {
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        stock: parseFloat(item.current_stock) || 0,
                        required_quantity: parseFloat(item.required_quantity) || 0,
                        minimum_stock: parseFloat(item.minimum_stock) || 10,
                        unit: resolvedUnit,
                    };
                });
                setMenuItems(mappedItems);
            }
        } catch (err) {
            console.error("Error fetching kitchen requirements:", err);
        } finally {
            setLoading(false);
        }
    };

    const showFeedback = (message, error = false) => {
        setMsg(message);
        setIsError(error);
        setTimeout(() => {
            setMsg('');
        }, 5000);
    };

    const handleUsageSubmit = async (e) => {
        e.preventDefault();

        if (!selectedUsageFoodName || selectedUsageFoodName.trim() === '') {
            showFeedback("Please enter or select an item", true);
            return;
        }
        if (!usageQuantity || parseFloat(usageQuantity) <= 0) {
            showFeedback("Please enter a valid quantity", true);
            return;
        }
        if (!usageReason) {
            showFeedback("Please specify a reason", true);
            return;
        }

        const nameToUse = selectedUsageFoodName.trim();
        const selectedItem = menuItems.find(m => m.name.toLowerCase() === nameToUse.toLowerCase());

        if (selectedItem && selectedItem.stock < parseFloat(usageQuantity)) {
            if (!window.confirm(`Warning: Selected usage (${usageQuantity} ${selectedItem.unit}) exceeds current stock (${selectedItem.stock} ${selectedItem.unit}). Proceed anyway?`)) {
                return;
            }
        }

        try {
            let finalFoodName = nameToUse;

            if (!selectedItem) {
                // Create a new requirement item in the database first
                const reqRes = await fetch(`${API_URL}/restaurant/kitchen-requirements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: nameToUse,
                        category: 'Others',
                        current_stock: 0,
                        required_quantity: 0,
                        unit: (function() {
                            const lowerName = nameToUse.toLowerCase();
                            const isLeaf = lowerName.includes('leaf') || lowerName.includes('leafe');
                            const isLiquid = lowerName.includes('milk') || lowerName.includes('oil') || lowerName.includes('water') || lowerName.includes('juice') || lowerName.includes('ghee') || lowerName.includes('vinegar') || lowerName.includes('sauce') || lowerName.includes('honey') || lowerName.includes('syrup') || lowerName.includes('liquid') || lowerName.includes('litter') || lowerName.includes('liter') || lowerName.includes('ltr');
                            if (isLeaf) return 'Pcs';
                            if (isLiquid) return 'Liter';
                            return 'Kg';
                        })(),
                        status: 'Pending',
                        minimum_stock: 10
                    })
                });
                const reqData = await reqRes.json();
                if (reqData.success && reqData.data) {
                    finalFoodName = reqData.data.name;
                } else {
                    showFeedback("Failed to initialize new kitchen ingredient for usage", true);
                    return;
                }
            }

            const res = await fetch(`${API_URL}/kitchen/stock/usage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    food_name: finalFoodName,
                    quantity: parseFloat(usageQuantity),
                    reason: usageReason
                })
            });

            const data = await res.json();
            if (data.success) {
                showFeedback("Daily kitchen usage logged successfully! ✅");
                setSelectedUsageFoodName('');
                setUsageQuantity('');
                setUsageReason('Dinner service');
                
                // Redirect back to usage tab
                localStorage.setItem('kitchen_active_tab', 'usage');
                setTimeout(() => {
                    navigate('/kitchen/purchases');
                }, 1500);
            } else {
                showFeedback(data.message || "Failed to log kitchen usage", true);
            }
        } catch (err) {
            console.error("Error logging kitchen usage:", err);
            showFeedback("Server error.", true);
        }
    };

    return (
        <div className="home-bg min-h-screen text-white flex flex-col">
            {/* Nav Header */}
            <nav className="glass border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="brand-wrap">
                    <img
                        src="/frontend/images/IMG_5225.PNG"
                        alt="logo"
                        className="brand-logo"
                    />
                    <h1>Sindhu Mahal</h1>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => {
                        localStorage.setItem('kitchen_active_tab', 'usage');
                        navigate("/kitchen/purchases");
                    }} variant="glass" icon="📋">
                        <span className="hidden sm:inline">Stock Overview</span>
                    </Button>
                    <Button onClick={() => navigate("/")} variant="glass" icon="🏠">
                        <span className="hidden sm:inline">Home</span>
                    </Button>
                </div>
            </nav>

            {/* Main Form Container */}
            <div className="flex-1 w-full max-w-xl mx-auto px-4 py-12 flex flex-col gap-6 justify-center">
                
                {/* Back button */}
                <button 
                    onClick={() => {
                        localStorage.setItem('kitchen_active_tab', 'usage');
                        navigate('/kitchen/purchases');
                    }}
                    className="text-left text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-sm mr-auto"
                >
                    ⬅️ Back to Usage Log
                </button>

                {/* Form Card */}
                <div className="glass p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col gap-6 animate-fadeIn">
                    <div>
                        <h2 className="text-2xl font-extrabold text-orange-500 tracking-wider">
                            🥣 Record Daily Usage
                        </h2>
                        <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-semibold">
                            Deduct raw ingredient quantities from kitchen inventory
                        </p>
                    </div>

                    {msg && (
                        <div className={`p-4 rounded-xl text-center font-bold text-sm border transition-all ${
                            isError 
                                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                : 'bg-green-500/10 border-green-500/20 text-green-400'
                        }`}>
                            {msg}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col justify-center items-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Loading data...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleUsageSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Enter Item</label>
                                <input
                                    list="usage-items-list"
                                    value={selectedUsageFoodName}
                                    onChange={(e) => setSelectedUsageFoodName(e.target.value)}
                                    placeholder="-- Enter or Choose Item --"
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    required
                                    autoFocus
                                />
                                <datalist id="usage-items-list">
                                    {menuItems.map(item => (
                                        <option key={item.id} value={item.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Quantity Deducted</label>
                                <input
                                    type="number"
                                    placeholder="Enter quantity"
                                    value={usageQuantity}
                                    onChange={(e) => setUsageQuantity(e.target.value)}
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    required
                                    min="0.1"
                                    step="any"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Reason / Description</label>
                                <select
                                    value={usageReason}
                                    onChange={(e) => setUsageReason(e.target.value)}
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    required
                                >
                                    <option value="Dinner service">Dinner service usage</option>
                                    <option value="Catering event">Catering event</option>
                                    <option value="Staff food">Staff meals</option>
                                    <option value="Kitchen waste / Spill">Kitchen waste / Spill</option>
                                    <option value="Spoiled / Expired">Spoiled / Expired</option>
                                </select>
                            </div>

                            <Button type="submit" variant="primary" icon="🥣" className="py-3.5 shadow-lg mt-2 font-bold uppercase tracking-wider">
                                Record Usage
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KitchenCreateUsage;
