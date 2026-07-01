import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const RestaurantSales = () => {
    const [sales, setSales] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // Form states
    const [selectedItemId, setSelectedItemId] = useState('');
    const [customFoodName, setCustomFoodName] = useState('');
    const [price, setPrice] = useState('');
    const [salePortion, setSalePortion] = useState('1');
    const [stockPortion, setStockPortion] = useState('100');
    const [amount, setAmount] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchSales();
        fetchMenuItems();
    }, []);

    // Auto calculate amount when price or salePortion changes
    useEffect(() => {
        const p = parseFloat(price) || 0;
        const q = parseFloat(salePortion) || 0;
        setAmount((p * q).toString());
    }, [price, salePortion]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/restaurant/sales`);
            const data = await res.json();
            if (data.success) {
                setSales(data.data || []);
            } else {
                showFeedback(data.message || "Failed to fetch sales records", true);
            }
        } catch (err) {
            console.error("Error fetching sales:", err);
            showFeedback("Failed to connect to server.", true);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const res = await fetch(`${API_URL}/restaurant/menu`);
            const data = await res.json();
            if (data.success) {
                setMenuItems(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching menu items:", err);
        }
    };

    const showFeedback = (message, error = false) => {
        setMsg(message);
        setIsError(error);
        setTimeout(() => {
            setMsg('');
        }, 5000);
    };

    const handleItemSelect = (e) => {
        const itemId = e.target.value;
        setSelectedItemId(itemId);

        if (itemId === 'custom') {
            setPrice('');
            setCustomFoodName('');
        } else {
            const item = menuItems.find(m => m.id.toString() === itemId);
            if (item) {
                setPrice(item.price.toString());
                setCustomFoodName(item.name);
                setStockPortion(item.stock.toString());
            } else {
                setPrice('');
                setCustomFoodName('');
            }
        }
    };

    const handleCreateSale = async (e) => {
        e.preventDefault();

        const foodName = selectedItemId === 'custom' ? customFoodName.trim() : customFoodName;
        if (!foodName) {
            showFeedback("Please select a food item or enter a custom name", true);
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            showFeedback("Please enter a valid price", true);
            return;
        }
        if (!salePortion || parseFloat(salePortion) <= 0) {
            showFeedback("Please enter a valid sale portion", true);
            return;
        }
        if (!stockPortion || parseFloat(stockPortion) < 0) {
            showFeedback("Please enter a valid stock portion", true);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/restaurant/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    food_name: foodName,
                    amount: parseInt(amount) || 0,
                    sale_portion: parseInt(salePortion) || 0,
                    stock_portion: parseInt(stockPortion) || 0
                })
            });

            const data = await res.json();
            if (data.success) {
                showFeedback("Sale record created successfully!");
                // Reset form
                setSelectedItemId('');
                setCustomFoodName('');
                setPrice('');
                setSalePortion('1');
                setStockPortion('100');
                setAmount('');
                // Refresh sales
                fetchSales();
            } else {
                showFeedback(data.message || "Failed to save sale", true);
            }
        } catch (err) {
            console.error("Error creating sale:", err);
            showFeedback("Failed to save sale. Server error.", true);
        }
    };

    const handleDeleteSale = async (id) => {
        try {
            const res = await fetch(`${API_URL}/restaurant/sales/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Sale record deleted successfully!");
                fetchSales();
            } else {
                showFeedback(data.message || "Failed to delete sale", true);
            }
        } catch (err) {
            console.error("Error deleting sale:", err);
            showFeedback("Failed to delete sale. Server error.", true);
        }
    };

    const formatDateTime = (isoString) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });
        } catch (e) {
            return isoString;
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
                    <Button onClick={() => navigate("/restaurant")} variant="glass" icon="🏪">
                        <span className="hidden sm:inline">Restaurant</span>
                    </Button>
                    <Button onClick={() => navigate("/")} variant="glass" icon="🏠">
                        <span className="hidden sm:inline">Home</span>
                    </Button>
                </div>
            </nav>

            {/* Main container */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
                {/* Header Title */}
                <div className="text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-wider">
                        Daily Restaurant Sales
                    </h2>
                    <p className="text-gray-400 text-xs md:text-sm mt-1 uppercase tracking-widest font-semibold">
                        Log and track dine-in portions, billing, and stocks
                    </p>
                </div>

                {/* Feedback Message */}
                {msg && (
                    <div className={`p-4 rounded-xl text-center font-bold text-sm border transition-all ${
                        isError 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                        {msg}
                    </div>
                )}

                {/* Form + Lists Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Log Sale Form Card */}
                    <div className="lg:col-span-1 glass p-6 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col gap-5">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-wide">Record A Sale</h3>
                            <p className="text-gray-400 text-xs mt-1">Create a new sale card for the tracker dashboard.</p>
                        </div>

                        <form onSubmit={handleCreateSale} className="flex flex-col gap-4">
                            {/* Food Item Selector */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Food Item</label>
                                <select
                                    value={selectedItemId}
                                    onChange={handleItemSelect}
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full"
                                >
                                    <option value="">-- Choose Menu Item --</option>
                                    {menuItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} (₹{item.price})
                                        </option>
                                    ))}
                                    <option value="custom">-- Custom Food Item --</option>
                                </select>
                            </div>

                            {/* Custom Name (conditional) */}
                            {selectedItemId === 'custom' && (
                                <div className="flex flex-col gap-1.5 animate-fadeIn">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Custom Food Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter food name"
                                        value={customFoodName}
                                        onChange={(e) => setCustomFoodName(e.target.value)}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full"
                                        required
                                    />
                                </div>
                            )}

                            {/* Price / Rate Field */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Rate Per Portion (₹)</label>
                                <input
                                    type="number"
                                    placeholder="Enter rate"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full"
                                    required
                                    min="1"
                                />
                            </div>

                            {/* Portions inputs side-by-side */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Sale Portion</label>
                                    <input
                                        type="number"
                                        value={salePortion}
                                        onChange={(e) => setSalePortion(e.target.value)}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Stock Portion</label>
                                    <input
                                        type="number"
                                        value={stockPortion}
                                        onChange={(e) => setStockPortion(e.target.value)}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Amount calculation (read-only style but editable) */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Total Amount (₹)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/30 text-orange-400 font-bold outline-none focus:border-orange-500 w-full"
                                    required
                                    min="1"
                                />
                            </div>

                            {/* Submit Button */}
                            <Button type="submit" variant="primary" icon="➕" className="py-3 shadow-lg mt-2">
                                Create Sale Card
                            </Button>
                        </form>
                    </div>

                    {/* Sales Cards Tracker Grid */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold tracking-wide text-orange-400">Sales Dashboard Cards</h3>
                            <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                                {sales.length} Cards
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col justify-center items-center py-16 gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500"></div>
                                <span className="text-sm text-gray-400">Loading cards...</span>
                            </div>
                        ) : sales.length === 0 ? (
                            <div className="glass rounded-3xl border border-white/5 p-12 text-center flex flex-col items-center gap-4 bg-slate-950/20">
                                <div className="text-4xl">🍲</div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">No Sales Cards Yet</h4>
                                    <p className="text-xs text-gray-400 mt-1 max-w-sm">Use the form on the left to record a dine-in sale and generate a sales tracking card.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sales.map((sale) => (
                                    <div 
                                        key={sale.id} 
                                        className="glass p-5 rounded-2xl border border-white/10 bg-slate-950/30 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden"
                                    >
                                        {/* Subtle corner highlight */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

                                        {/* Row 1: Food Name & Delete */}
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <span className="text-xs text-orange-500 font-bold uppercase tracking-widest">Dine-In Card</span>
                                                <h4 className="text-lg font-bold text-white mt-0.5 truncate max-w-[160px] md:max-w-[200px]" title={sale.food_name}>
                                                    🍲 {sale.food_name}
                                                </h4>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteSale(sale.id)}
                                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors focus:outline-none"
                                                title="Delete Card"
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        {/* Row 2: Grid of values */}
                                        <div className="grid grid-cols-3 gap-2 bg-black/35 p-3.5 rounded-xl border border-white/5">
                                            {/* Sale Portion */}
                                            <div className="flex flex-col text-center">
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Sale Port.</span>
                                                <span className="text-base font-bold text-orange-400 mt-0.5">{sale.sale_portion}</span>
                                            </div>

                                            {/* Stock Portion */}
                                            <div className="flex flex-col text-center border-x border-white/5">
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Stock Port.</span>
                                                <span className="text-base font-bold text-emerald-400 mt-0.5">{sale.stock_portion}</span>
                                            </div>

                                            {/* Amount */}
                                            <div className="flex flex-col text-center">
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Amount</span>
                                                <span className="text-base font-bold text-white mt-0.5">₹{sale.amount}</span>
                                            </div>
                                        </div>

                                        {/* Row 3: Footer details */}
                                        <div className="flex justify-between items-center text-[10px] text-gray-400">
                                            <span>Date: {formatDateTime(sale.created_at)}</span>
                                            <span className="text-orange-500/70 font-semibold uppercase">Active</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantSales;
