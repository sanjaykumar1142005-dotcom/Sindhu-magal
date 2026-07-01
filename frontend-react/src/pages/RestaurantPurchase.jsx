import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const RestaurantPurchase = () => {
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // Kitchen Requirements states
    const [kitchenReqs, setKitchenReqs] = useState([]);
    const [reqSearch, setReqSearch] = useState('');
    const [reqCategoryFilter, setReqCategoryFilter] = useState('');
    const [reqStatusFilter, setReqStatusFilter] = useState('');
    
    // Add/Edit requirement modal state
    const [showReqModal, setShowReqModal] = useState(false);
    const [reqModalData, setReqModalData] = useState({
        id: null,
        name: '',
        category: 'Groceries',
        current_stock: '',
        required_quantity: '',
        unit: 'Kg',
        status: 'Pending',
        minimum_stock: '10'
    });
    const [showDetailsItem, setShowDetailsItem] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchKitchenRequirements();
    }, [reqSearch, reqCategoryFilter, reqStatusFilter]);

    const fetchKitchenRequirements = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                search: reqSearch,
                category: reqCategoryFilter,
                status: reqStatusFilter
            });
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements?${queryParams}`);
            const data = await res.json();
            if (data.success) {
                setKitchenReqs(data.data || []);
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

    const handleApproveRequirement = async (id) => {
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'Approved' })
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Purchase requirement approved! 📂");
                fetchKitchenRequirements();
            } else {
                showFeedback(data.message || "Failed to approve requirement", true);
            }
        } catch (err) {
            console.error("Error approving requirement:", err);
            showFeedback("Server error.", true);
        }
    };

    const handleMarkPurchased = async (id) => {
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'Purchased' })
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Item marked as Purchased! 🛒");
                fetchKitchenRequirements();
            } else {
                showFeedback(data.message || "Failed to mark as purchased", true);
            }
        } catch (err) {
            console.error("Error marking purchased:", err);
            showFeedback("Server error.", true);
        }
    };

    const handleReqSubmit = async (e) => {
        e.preventDefault();
        if (!reqModalData.name || !reqModalData.category || !reqModalData.unit) {
            showFeedback("Please fill name, category, and unit", true);
            return;
        }
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: reqModalData.id,
                    name: reqModalData.name,
                    category: reqModalData.category,
                    current_stock: parseFloat(reqModalData.current_stock) || 0,
                    required_quantity: parseFloat(reqModalData.required_quantity) || 0,
                    unit: reqModalData.unit,
                    status: reqModalData.status || 'Pending',
                    minimum_stock: parseFloat(reqModalData.minimum_stock) || 10
                })
            });
            const data = await res.json();
            if (data.success) {
                showFeedback(reqModalData.id ? "Requirement updated successfully!" : "Requirement added successfully!");
                setShowReqModal(false);
                setReqModalData({ id: null, name: '', category: 'Groceries', current_stock: '', required_quantity: '', unit: 'Kg', status: 'Pending', minimum_stock: '10' });
                fetchKitchenRequirements();
            } else {
                showFeedback(data.message || "Failed to save requirement", true);
            }
        } catch (err) {
            console.error("Error saving requirement:", err);
            showFeedback("Server error.", true);
        }
    };

    const handleReqDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Requirement deleted immediately!");
                fetchKitchenRequirements();
            } else {
                showFeedback(data.message || "Failed to delete item", true);
            }
        } catch (err) {
            console.error(err);
            showFeedback("Server error.", true);
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

    // Stats calculations from dynamic raw requirements
    const totalItems = kitchenReqs.length;
    const lowStockCount = kitchenReqs.filter(r => (parseFloat(r.current_stock) < (parseFloat(r.minimum_stock) || 10)) && r.status !== 'Purchased').length;
    const pendingCount = kitchenReqs.filter(r => r.status === 'Pending').length;

    return (
        <div className="home-bg min-h-screen text-white flex flex-col">
            <style dangerouslySetInnerHTML={{__html: `
                @media screen {
                    .print-only {
                        display: none !important;
                    }
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-only, .print-only * {
                        visibility: visible;
                    }
                    .print-only {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        color: #000 !important;
                        background: #fff !important;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px 12px;
                        text-align: left;
                        color: #000 !important;
                    }
                    th {
                        background-color: #f5f5f5 !important;
                        font-weight: bold;
                    }
                    .deficit-highlight {
                        font-weight: bold;
                        color: #c2410c !important;
                    }
                }
            `}} />
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

            {/* Main Container */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
                
                {/* Titles */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-wider">
                            Kitchen Purchase Requirements
                        </h2>
                        <p className="text-gray-400 text-xs md:text-sm mt-1 uppercase tracking-widest font-semibold">
                            Manage raw ingredient requirements, stock levels, and purchasing workflows
                        </p>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center">
                        <span className="text-xl">🧺</span>
                        <span className="text-xl font-black text-white mt-0.5">{totalItems}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Inventory Items</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center">
                        <span className="text-xl">⚠️</span>
                        <span className="text-xl font-black text-red-400 mt-0.5">{lowStockCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Low Stock Alerts</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center">
                        <span className="text-xl">⏳</span>
                        <span className="text-xl font-black text-yellow-400 mt-0.5">{pendingCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Pending orders</span>
                    </div>
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

                {/* Search and Filter Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20 p-5 rounded-3xl border border-white/5">
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        {/* Search */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search raw items (e.g. Oil, Milk...)..."
                                value={reqSearch}
                                onChange={(e) => setReqSearch(e.target.value)}
                                className="bg-black/40 pl-10 pr-4 py-2.5 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-sm"
                            />
                            <span className="absolute left-3.5 top-3 text-gray-500 text-sm">🔍</span>
                        </div>

                        {/* Category filter */}
                        <select
                            value={reqCategoryFilter}
                            onChange={(e) => setReqCategoryFilter(e.target.value)}
                            className="bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 text-sm"
                        >
                            <option value="">All Categories</option>
                            <option value="Groceries">Groceries</option>
                            <option value="Dairy">Dairy</option>
                            <option value="Produce">Produce / Vegetables</option>
                            <option value="Meat">Meat / Poultry</option>
                            <option value="Seafood">Seafood</option>
                            <option value="Spices">Spices / Seasoning</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Bakery">Bakery</option>
                            <option value="Others">Others</option>
                        </select>

                        {/* Status filter */}
                        <select
                            value={reqStatusFilter}
                            onChange={(e) => setReqStatusFilter(e.target.value)}
                            className="bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Purchased">Purchased</option>
                        </select>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <Button 
                            onClick={() => window.print()}
                            variant="glass" 
                            icon="🖨️" 
                            className="py-2.5 px-5 border border-white/10 hover:border-orange-500/30 text-sm font-bold uppercase tracking-wider w-full md:w-auto"
                        >
                            Print Report
                        </Button>
                        <Button 
                            onClick={() => {
                                setReqModalData({
                                    id: null,
                                    name: '',
                                    category: 'Groceries',
                                    current_stock: '',
                                    required_quantity: '',
                                    unit: 'Kg',
                                    status: 'Pending',
                                    minimum_stock: '10'
                                });
                                setShowReqModal(true);
                            }}
                            variant="primary" 
                            icon="➕" 
                            className="py-2.5 px-5 shadow-lg shadow-orange-500/20 text-sm font-bold uppercase tracking-wider w-full md:w-auto"
                        >
                            Create New Request
                        </Button>
                    </div>
                </div>

                {/* Tab content loader */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                        <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Loading Requirements Dashboard...</span>
                    </div>
                ) : (
                    <div>
                        {/* Requirements Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Create New Request Card */}
                            <div 
                                onClick={() => {
                                    setReqModalData({
                                        id: null,
                                        name: '',
                                        category: 'Groceries',
                                        current_stock: '',
                                        required_quantity: '',
                                        unit: 'Kg',
                                        status: 'Pending',
                                        minimum_stock: '10'
                                    });
                                    setShowReqModal(true);
                                }}
                                className="glass p-6 rounded-3xl border border-dashed border-white/20 hover:border-orange-500/50 bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 flex flex-col justify-center items-center gap-3 cursor-pointer group hover:scale-[1.02] min-h-[250px]"
                            >
                                <div className="w-14 h-14 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                                    ➕
                                </div>
                                <span className="text-lg font-bold text-white group-hover:text-orange-500 transition-colors">
                                    Create New Request
                                </span>
                                <span className="text-gray-400 text-xs text-center px-4">
                                    Manually request new raw ingredients for kitchen inventory
                                </span>
                            </div>

                            {kitchenReqs.map((req) => {
                                    const current = parseFloat(req.current_stock) || 0;
                                    const required = parseFloat(req.required_quantity) || 0;
                                    const purchaseQty = Math.max(0, required - current);
                                    const isLowStock = current < (parseFloat(req.minimum_stock) || 10);
                                    
                                    // Category Icon mapping
                                    const getCategoryIcon = (cat) => {
                                        switch(cat) {
                                            case 'Groceries': return '🌾';
                                            case 'Dairy': return '🥛';
                                            case 'Produce': return '🥦';
                                            case 'Meat': return '🍗';
                                            case 'Seafood': return '🐟';
                                            case 'Spices': return '🌶️';
                                            case 'Beverages': return '🥤';
                                            case 'Bakery': return '🍞';
                                            default: return '📦';
                                        }
                                    };

                                    // Status styles mapping
                                    const getStatusStyles = (stat) => {
                                        switch(stat) {
                                            case 'Approved': return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
                                            case 'Purchased': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                                            default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'; // Pending
                                        }
                                    };

                                    return (
                                        <div 
                                            key={req.id} 
                                            className="glass p-6 rounded-3xl border border-white/10 bg-slate-950/30 hover:border-orange-500/30 transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group hover:scale-[1.02] hover:shadow-orange-500/5"
                                        >
                                            {/* Top corner gradient glow */}
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />

                                            {/* Card Header */}
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300">
                                                        {getCategoryIcon(req.category)}
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest">{req.category}</span>
                                                        <h4 className="text-lg font-bold text-white leading-snug mt-0.5 truncate max-w-[140px]" title={req.name}>
                                                            {req.name}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`text-[10px] px-3 py-0.5 rounded-full font-bold uppercase border ${getStatusStyles(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                    {isLowStock && req.status !== 'Purchased' && (
                                                        <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase animate-pulse">
                                                            ⚠️ Critically Low
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stock comparison meters */}
                                            <div className="bg-black/35 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                                                <div className="grid grid-cols-3 gap-1.5 text-center border-b border-white/5 pb-2.5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Current</span>
                                                        <span className="text-sm font-bold text-white mt-0.5">
                                                            {current} <span className="text-[10px] text-gray-500 font-normal">{req.unit}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/5">
                                                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Required</span>
                                                        <span className="text-sm font-bold text-orange-400 mt-0.5">
                                                            {required} <span className="text-[10px] text-gray-500 font-normal">{req.unit}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/5">
                                                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Min Stock</span>
                                                        <span className="text-sm font-bold text-yellow-500 mt-0.5">
                                                            {req.minimum_stock || 10} <span className="text-[10px] text-gray-500 font-normal">{req.unit}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Purchase Required Calculation output */}
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Required Purchases</span>
                                                    <span className={`text-sm font-black ${purchaseQty > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                        {purchaseQty > 0 ? `+${purchaseQty} ${req.unit}` : 'Sufficient Stock'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Footer date & actions */}
                                            <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-white/5">
                                                <span>Updated: {formatDateTime(req.updated_at)}</span>
                                                <button 
                                                    onClick={() => setShowDetailsItem(req)}
                                                    className="text-orange-400 hover:text-orange-300 font-bold underline transition-colors"
                                                >
                                                    View Details
                                                </button>
                                            </div>

                                            {/* Action Controls */}
                                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5">
                                                <button
                                                    onClick={() => {
                                                        setReqModalData({
                                                            id: req.id,
                                                            name: req.name,
                                                            category: req.category,
                                                            current_stock: req.current_stock.toString(),
                                                            required_quantity: req.required_quantity.toString(),
                                                            unit: req.unit,
                                                            status: req.status,
                                                            minimum_stock: req.minimum_stock ? req.minimum_stock.toString() : '10'
                                                        });
                                                        setShowReqModal(true);
                                                    }}
                                                    className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 border border-white/5"
                                                    title="Edit Requirement"
                                                >
                                                    ✏️ Edit
                                                </button>

                                                {req.status === 'Pending' ? (
                                                    <button
                                                        onClick={() => handleApproveRequirement(req.id)}
                                                        className="px-2 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 text-xs font-bold transition-all flex items-center justify-center gap-1 border border-sky-500/20 col-span-2"
                                                        title="Approve purchase order"
                                                    >
                                                        ✔️ Approve
                                                    </button>
                                                ) : req.status === 'Approved' ? (
                                                    <button
                                                        onClick={() => handleMarkPurchased(req.id)}
                                                        className="px-2 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-all flex items-center justify-center gap-1 border border-emerald-500/20 col-span-2"
                                                        title="Mark as purchased"
                                                    >
                                                        🛒 Purchased
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-wide col-span-2 flex items-center justify-center gap-1.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 py-1.5">
                                                        ✅ Finished
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                    </div>
                )}
            </div>

            {/* Requirement Modal (Add / Edit) */}
            {showReqModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass p-6 rounded-3xl border border-white/10 bg-slate-900/95 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-fadeIn">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-wide">
                                {reqModalData.id ? "✏️ Edit Purchase Requirement" : "➕ Add Purchase Requirement"}
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">Specify current levels and target capacities for raw inventory.</p>
                        </div>

                        <form onSubmit={handleReqSubmit} className="flex flex-col gap-4">
                            {/* Item Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Item Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Sunflower Oil, Whole Milk, Spiced Masala"
                                    value={reqModalData.name}
                                    onChange={(e) => setReqModalData({ ...reqModalData, name: e.target.value })}
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Category</label>
                                    <select
                                        value={reqModalData.category}
                                        onChange={(e) => setReqModalData({ ...reqModalData, category: e.target.value })}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-sm"
                                        required
                                    >
                                        <option value="Groceries">Groceries</option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Produce">Produce</option>
                                        <option value="Meat">Meat</option>
                                        <option value="Seafood">Seafood</option>
                                        <option value="Spices">Spices</option>
                                        <option value="Beverages">Beverages</option>
                                        <option value="Bakery">Bakery</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>

                                {/* Unit */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Measure Unit</label>
                                    <select
                                        value={reqModalData.unit}
                                        onChange={(e) => setReqModalData({ ...reqModalData, unit: e.target.value })}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-sm"
                                        required
                                    >
                                        <option value="Kg">Kg (kilogram)</option>
                                        <option value="Liter">Liter (litre)</option>
                                        <option value="Piece">Piece (units)</option>
                                        <option value="Packet">Packet (pack)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {/* Current Stock */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">Current Stock</label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.01"
                                        value={reqModalData.current_stock}
                                        onChange={(e) => setReqModalData({ ...reqModalData, current_stock: e.target.value })}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-sm"
                                        required
                                        min="0"
                                    />
                                </div>

                                {/* Required Stock */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">Required Stock</label>
                                    <input
                                        type="number"
                                        placeholder="0.0"
                                        step="0.01"
                                        value={reqModalData.required_quantity}
                                        onChange={(e) => setReqModalData({ ...reqModalData, required_quantity: e.target.value })}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-sm"
                                        required
                                        min="0"
                                    />
                                </div>

                                {/* Minimum Stock Level */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">Minimum Stock Level</label>
                                    <input
                                        type="number"
                                        placeholder="10"
                                        step="0.01"
                                        value={reqModalData.minimum_stock}
                                        onChange={(e) => setReqModalData({ ...reqModalData, minimum_stock: e.target.value })}
                                        className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-sm"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Status</label>
                                <select
                                    value={reqModalData.status}
                                    onChange={(e) => setReqModalData({ ...reqModalData, status: e.target.value })}
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-sm"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Purchased">Purchased</option>
                                </select>
                            </div>

                            <div className="flex gap-3 justify-end mt-4">
                                {reqModalData.id && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm("Delete this purchase requirement?")) {
                                                handleReqDelete(reqModalData.id);
                                                setShowReqModal(false);
                                            }
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/10 mr-auto"
                                    >
                                        🗑️ Delete
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowReqModal(false)}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="glass p-6 rounded-3xl border border-white/10 bg-slate-900/95 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-fadeIn">
                        <div>
                            <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{showDetailsItem.category}</span>
                            <h3 className="text-2xl font-bold text-white tracking-wide mt-0.5">🍲 {showDetailsItem.name} Details</h3>
                        </div>

                        <div className="flex flex-col gap-3 bg-black/40 p-5 rounded-2xl border border-white/5 text-sm">
                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Stock Status</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-xs border ${
                                    showDetailsItem.status === 'Approved' ? 'text-sky-400 border-sky-500/20 bg-sky-500/10' :
                                    showDetailsItem.status === 'Purchased' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                    'text-yellow-400 border-yellow-500/20 bg-yellow-500/10'
                                }`}>
                                    {showDetailsItem.status}
                                </span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Current Stock</span>
                                <span className="font-bold text-white">{showDetailsItem.current_stock} {showDetailsItem.unit}</span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Required Quantity</span>
                                <span className="font-bold text-orange-400">{showDetailsItem.required_quantity} {showDetailsItem.unit}</span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Minimum Stock Threshold</span>
                                <span className="font-bold text-yellow-500">{showDetailsItem.minimum_stock || 10} {showDetailsItem.unit}</span>
                            </div>

                            <div className="flex justify-between py-2 border-b border-white/5">
                                <span className="text-gray-400">Calculated Deficit</span>
                                <span className="font-extrabold text-yellow-400">
                                    {Math.max(0, parseFloat(showDetailsItem.required_quantity) - parseFloat(showDetailsItem.current_stock))} {showDetailsItem.unit}
                                </span>
                            </div>

                            <div className="flex justify-between py-2">
                                <span className="text-gray-400">Last Modified</span>
                                <span className="text-gray-300 font-mono text-xs">{formatDateTime(showDetailsItem.updated_at)}</span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => setShowDetailsItem(null)}
                                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Printable Report Container */}
            <div className="print-only">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#000' }}>Sindhu Mahal</h1>
                        <p style={{ fontSize: '14px', margin: '4px 0 0 0', color: '#666' }}>Kitchen Purchase Requirements Report</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                        <p style={{ margin: '0' }}>Date: {new Date().toLocaleDateString('en-IN')}</p>
                        <p style={{ margin: '4px 0 0 0' }}>Time: {new Date().toLocaleTimeString('en-IN')}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'center' }}>Current Stock</th>
                            <th style={{ textAlign: 'center' }}>Required Qty</th>
                            <th style={{ textAlign: 'right' }}>Deficit (To Purchase)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {kitchenReqs.map((req) => {
                            const current = parseFloat(req.current_stock) || 0;
                            const required = parseFloat(req.required_quantity) || 0;
                            const purchaseQty = Math.max(0, required - current);
                            return (
                                <tr key={req.id}>
                                    <td style={{ fontWeight: 'bold' }}>{req.name}</td>
                                    <td>{req.category}</td>
                                    <td style={{ textAlign: 'center' }}>{current} {req.unit}</td>
                                    <td style={{ textAlign: 'center' }}>{required} {req.unit}</td>
                                    <td style={{ textAlign: 'right' }} className={purchaseQty > 0 ? 'deficit-highlight' : ''}>
                                        {purchaseQty > 0 ? `+${purchaseQty} ${req.unit}` : 'Sufficient'}
                                    </td>
                                    <td>{req.status}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>
                        <p>Prepared by: ____________________</p>
                    </div>
                    <div>
                        <p>Verified by: ____________________</p>
                    </div>
                    <div>
                        <p>Approved by: ____________________</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantPurchase;
