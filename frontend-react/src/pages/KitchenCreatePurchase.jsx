import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const KitchenCreatePurchase = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // Form states
    const [selectedAddText, setSelectedAddText] = useState('');
    const [portionsToAdd, setPortionsToAdd] = useState('');
    const [purchaseCost, setPurchaseCost] = useState('');
    const [addTomorrowNeed, setAddTomorrowNeed] = useState('');

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
                const mappedItems = (data.data || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    stock: parseFloat(item.current_stock) || 0,
                    required_quantity: parseFloat(item.required_quantity) || 0,
                    minimum_stock: parseFloat(item.minimum_stock) || 10,
                    unit: item.unit || 'Kg',
                }));
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

    const handleAddStockSubmit = async (e) => {
        e.preventDefault();

        if (!selectedAddText || selectedAddText.trim() === '') {
            showFeedback("Please enter or select an item", true);
            return;
        }
        if (!portionsToAdd || parseFloat(portionsToAdd) <= 0) {
            showFeedback("Please enter a valid stock quantity", true);
            return;
        }

        let cost = parseFloat(purchaseCost) || 0;
        const nameToUse = selectedAddText.trim();
        let existingItem = menuItems.find(m => m.name.toLowerCase() === nameToUse.toLowerCase());

        try {
            let itemId;
            let currentStockVal = 0;

            if (existingItem) {
                itemId = existingItem.id;
                currentStockVal = existingItem.stock || 0;
            } else {
                // Create a new requirement item in the inventory first
                const reqRes = await fetch(`${API_URL}/restaurant/kitchen-requirements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: nameToUse,
                        category: 'Others',
                        current_stock: 0,
                        required_quantity: parseFloat(addTomorrowNeed) || 0,
                        unit: 'Kg',
                        status: 'Pending',
                        minimum_stock: 10
                    })
                });

                const reqData = await reqRes.json();
                if (reqData.success && reqData.data) {
                    itemId = reqData.data.id;
                    currentStockVal = 0;
                } else {
                    showFeedback("Failed to initialize new kitchen ingredient", true);
                    return;
                }
            }

            // Log restock and add stock
            const res = await fetch(`${API_URL}/kitchen/stock/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    menu_item_id: itemId,
                    portions_added: parseFloat(portionsToAdd),
                    amount: cost
                })
            });

            const data = await res.json();
            if (data.success) {
                const newStock = currentStockVal + parseFloat(portionsToAdd);
                if (addTomorrowNeed !== '') {
                    await fetch(`${API_URL}/kitchen/stock`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: itemId,
                            stock: newStock,
                            required_quantity: parseFloat(addTomorrowNeed)
                        })
                    });
                } else if (!existingItem) {
                    await fetch(`${API_URL}/kitchen/stock`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: itemId,
                            stock: newStock,
                            required_quantity: 0
                        })
                    });
                }

                showFeedback("Kitchen stock quantity added & purchase logged!");
                setSelectedAddText('');
                setPortionsToAdd('');
                setPurchaseCost('');
                setAddTomorrowNeed('');
                
                // Navigate back to the kitchen purchase page
                setTimeout(() => {
                    navigate('/kitchen/purchases');
                }, 1500);
            } else {
                showFeedback(data.message || "Failed to add kitchen stock", true);
            }
        } catch (err) {
            console.error("Error adding kitchen stock:", err);
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
                    <Button onClick={() => navigate("/kitchen/purchases")} variant="glass" icon="📋">
                        Stock Overview
                    </Button>
                    <Button onClick={() => navigate("/")} variant="glass" icon="🏠">
                        Home
                    </Button>
                </div>
            </nav>

            {/* Main Form Container */}
            <div className="flex-1 w-full max-w-xl mx-auto px-4 py-12 flex flex-col gap-6 justify-center">
                
                {/* Back button */}
                <button 
                    onClick={() => navigate('/kitchen/purchases')}
                    className="text-left text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 text-sm mr-auto"
                >
                    ⬅️ Back to Stock List
                </button>

                {/* Form Card */}
                <div className="glass p-8 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col gap-6 animate-fadeIn">
                    <div>
                        <h2 className="text-2xl font-extrabold text-orange-500 tracking-wider">
                            🛒 Create New Purchase
                        </h2>
                        <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-semibold">
                            Restock quantities and log expenses in purchase history
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
                        <form onSubmit={handleAddStockSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Enter Item</label>
                                <input
                                    list="add-items-list"
                                    value={selectedAddText}
                                    onChange={(e) => setSelectedAddText(e.target.value)}
                                    placeholder="-- Enter or Choose Item --"
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    required
                                    autoFocus
                                />
                                <datalist id="add-items-list">
                                    {menuItems.map(item => (
                                        <option key={item.id} value={item.name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Quantity to Add</label>
                                <input
                                    type="number"
                                    placeholder="Enter stock count/quantity (e.g. 5)"
                                    value={portionsToAdd}
                                    onChange={(e) => setPortionsToAdd(e.target.value)}
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    required
                                    min="0.1"
                                    step="any"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Tomorrow's Need (Optional)</label>
                                <input
                                    type="number"
                                    placeholder="Enter tomorrow's need target level"
                                    value={addTomorrowNeed}
                                    onChange={(e) => setAddTomorrowNeed(e.target.value)}
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    min="0"
                                    step="any"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Total Purchase Cost (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter cost amount in ₹"
                                    value={purchaseCost}
                                    onChange={(e) => setPurchaseCost(e.target.value)}
                                    className="bg-black/40 p-3.5 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-xs font-bold"
                                    min="0"
                                />
                            </div>

                            <div className="flex gap-3 justify-end mt-4">
                                <Button 
                                    type="button" 
                                    onClick={() => navigate('/kitchen/purchases')}
                                    variant="glass" 
                                    className="py-3 px-6 text-xs uppercase tracking-wider"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    icon="➕" 
                                    className="py-3 px-6 shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider font-bold"
                                >
                                    Log Restock & Purchase
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KitchenCreatePurchase;
