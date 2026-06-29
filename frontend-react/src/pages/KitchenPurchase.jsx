import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const KitchenPurchase = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [purchaseLogs, setPurchaseLogs] = useState([]);
    const [usageLogs, setUsageLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI Feedback
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // Active tab state: 'overview' | 'usage' | 'purchases'
    const [activeTab, setActiveTab] = useState('overview');


    // Tab 2: Usage Form State
    const [selectedUsageFoodName, setSelectedUsageFoodName] = useState('');
    const [usageQuantity, setUsageQuantity] = useState('');
    const [usageReason, setUsageReason] = useState('Dinner service');

    // Inline quick edit states
    const [inlineEditingId, setInlineEditingId] = useState(null);
    const [inlineStockValue, setInlineStockValue] = useState('');
    const [inlineTomorrowNeedValue, setInlineTomorrowNeedValue] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMenuItems(),
                fetchPurchaseLogs(),
                fetchUsageLogs()
            ]);
        } catch (err) {
            console.error("Error fetching kitchen inventory data:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements`);
            const data = await res.json();
            if (data.success) {
                const mappedItems = (data.data || []).map(item => {
                    const lowerName = (item.name || '').toLowerCase();
                    const isLeaf = lowerName.includes('leaf') || lowerName.includes('leafe');
                    return {
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        stock: parseFloat(item.current_stock) || 0,
                        required_quantity: parseFloat(item.required_quantity) || 0,
                        minimum_stock: parseFloat(item.minimum_stock) || 10,
                        unit: isLeaf ? 'Pcs' : (item.unit || 'Kg'),
                        price: 0
                    };
                });
                setMenuItems(mappedItems);
            }
        } catch (err) {
            console.error("Error fetching kitchen requirements:", err);
        }
    };

    const fetchPurchaseLogs = async () => {
        try {
            const res = await fetch(`${API_URL}/kitchen/stock/purchases`);
            const data = await res.json();
            if (data.success) {
                setPurchaseLogs(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching kitchen purchase logs:", err);
        }
    };

    const fetchUsageLogs = async () => {
        try {
            const res = await fetch(`${API_URL}/kitchen/stock/usage`);
            const data = await res.json();
            if (data.success) {
                setUsageLogs(data.data || []);
            }
        } catch (err) {
            console.error("Error fetching kitchen usage logs:", err);
        }
    };

    const showFeedback = (message, error = false) => {
        setMsg(message);
        setIsError(error);
        setTimeout(() => {
            setMsg('');
        }, 5000);
    };


    // Tab 2: Submit Usage Entry
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
                        unit: 'Kg',
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
                showFeedback("Daily kitchen usage logged successfully!");
                setSelectedUsageFoodName('');
                setUsageQuantity('');
                setUsageReason('Dinner service');
                fetchAllData();
            } else {
                showFeedback(data.message || "Failed to log kitchen usage", true);
            }
        } catch (err) {
            console.error("Error logging kitchen usage:", err);
            showFeedback("Server error.", true);
        }
    };

    // Tab 1: Inline Stock Update (direct override)
    const handleInlineStockUpdate = async (id, stockVal, tomorrowVal) => {
        if (stockVal === '' || parseFloat(stockVal) < 0) {
            showFeedback("Please enter a valid stock level", true);
            return;
        }
        if (tomorrowVal === '' || parseFloat(tomorrowVal) < 0) {
            showFeedback("Please enter a valid tomorrow need level", true);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/kitchen/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    stock: parseFloat(stockVal),
                    required_quantity: parseFloat(tomorrowVal)
                })
            });

            const data = await res.json();
            if (data.success) {
                showFeedback("Kitchen stock and tomorrow need updated!");
                setInlineEditingId(null);
                setInlineStockValue('');
                setInlineTomorrowNeedValue('');
                fetchMenuItems();
            } else {
                showFeedback(data.message || "Failed to update kitchen stock", true);
            }
        } catch (err) {
            console.error("Error updating kitchen stock inline:", err);
            showFeedback("Server error.", true);
        }
    };

    const startInlineEdit = (item) => {
        setInlineEditingId(item.id);
        setInlineStockValue(item.stock.toString());
        setInlineTomorrowNeedValue(item.required_quantity.toString());
    };

    const handleReqDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Ingredient deleted immediately!");
                fetchMenuItems();
            } else {
                showFeedback(data.message || "Failed to delete item", true);
            }
        } catch (err) {
            console.error("Error deleting ingredient:", err);
            showFeedback("Server error.", true);
        }
    };

    const getStockStatus = (item) => {
        const stock = item.stock || 0;
        const minStock = item.minimum_stock || 10;
        if (stock === 0) return { label: 'Out of Stock', color: 'text-red-400 border-red-500/30 bg-red-500/10' };
        if (stock < minStock) return { label: 'Low Stock Alert', color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' };
        return { label: 'In Stock', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
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

    // Day-by-day History & Printing States
    const [selectedHistoryDate, setSelectedHistoryDate] = useState('ALL');
    const [selectedUsageDate, setSelectedUsageDate] = useState('ALL');
    const [printReportType, setPrintReportType] = useState('all');

    // Inline edit states for Purchase Log entries
    const [editingPurchaseId, setEditingPurchaseId] = useState(null);
    const [editingPurchaseFoodName, setEditingPurchaseFoodName] = useState('');
    const [editingPurchasePortions, setEditingPurchasePortions] = useState('');
    const [editingPurchaseAmount, setEditingPurchaseAmount] = useState('');

    const handlePrintReport = (type = 'all') => {
        setPrintReportType(type);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    // Grouping Purchase Logs by Date (Day by Day)
    const getLogDateString = (isoString) => {
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return 'Other';
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            return 'Other';
        }
    };

    const groupLogsByDate = (logs) => {
        const map = new Map();
        logs.forEach(log => {
            const dateStr = getLogDateString(log.created_at);
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr).push(log);
        });

        return Array.from(map.entries()).map(([dateStr, items]) => {
            const dayTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            return {
                dateStr,
                items,
                dayTotal
            };
        });
    };

    const dailyPurchaseGroups = groupLogsByDate(purchaseLogs);
    const uniqueHistoryDates = dailyPurchaseGroups.map(g => g.dateStr);

    const displayedPurchaseGroups = selectedHistoryDate === 'ALL'
        ? dailyPurchaseGroups
        : dailyPurchaseGroups.filter(g => g.dateStr === selectedHistoryDate);

    const totalSelectedPurchaseCost = displayedPurchaseGroups.reduce((sum, g) => sum + g.dayTotal, 0);

    // Grouping Usage Logs by Date (Day by Day)
    const groupUsageLogsByDate = (logs) => {
        const map = new Map();
        logs.forEach(log => {
            const dateStr = getLogDateString(log.created_at);
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr).push(log);
        });

        return Array.from(map.entries()).map(([dateStr, items]) => ({
            dateStr,
            items
        }));
    };

    const dailyUsageGroups = groupUsageLogsByDate(usageLogs);
    const uniqueUsageDates = dailyUsageGroups.map(g => g.dateStr);

    const displayedUsageGroups = selectedUsageDate === 'ALL'
        ? dailyUsageGroups
        : dailyUsageGroups.filter(g => g.dateStr === selectedUsageDate);

    const exportPurchaseCSV = (dateFilter = 'ALL') => {
        let logsToExport = purchaseLogs;
        if (dateFilter !== 'ALL') {
            logsToExport = purchaseLogs.filter(log => getLogDateString(log.created_at) === dateFilter);
        }

        if (logsToExport.length === 0) {
            showFeedback("No purchase logs found to export for selected date", true);
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,ID,Ingredient Name,Quantity Added,Unit,Cost Amount (INR),Receipt Date\n";
        logsToExport.forEach(log => {
            const item = menuItems.find(m => m.name === log.food_name);
            const unit = item ? item.unit : 'units';
            const formattedDate = formatDateTime(log.created_at).replace(/,/g, ' ');
            csvContent += `${log.id},"${log.food_name}",${log.portions_added},"${unit}",${log.amount},"${formattedDate}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Purchase_History_${dateFilter.replace(/ /g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Purchase Log Edit & Delete Handlers
    const startEditingPurchase = (log) => {
        setEditingPurchaseId(log.id);
        setEditingPurchaseFoodName(log.food_name);
        setEditingPurchasePortions(log.portions_added.toString());
        setEditingPurchaseAmount(log.amount.toString());
    };

    const cancelEditingPurchase = () => {
        setEditingPurchaseId(null);
        setEditingPurchaseFoodName('');
        setEditingPurchasePortions('');
        setEditingPurchaseAmount('');
    };

    const handleSavePurchaseEdit = async (id) => {
        if (!editingPurchaseFoodName || editingPurchaseFoodName.trim() === '') {
            showFeedback("Please enter ingredient name", true);
            return;
        }
        if (!editingPurchasePortions || parseFloat(editingPurchasePortions) <= 0) {
            showFeedback("Please enter a valid quantity added", true);
            return;
        }
        if (!editingPurchaseAmount || parseFloat(editingPurchaseAmount) < 0) {
            showFeedback("Please enter a valid cost amount", true);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/kitchen/stock/purchases/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    food_name: editingPurchaseFoodName.trim(),
                    portions_added: parseFloat(editingPurchasePortions),
                    amount: parseFloat(editingPurchaseAmount)
                })
            });

            const data = await res.json();
            if (data.success) {
                showFeedback("Purchase log entry updated successfully! ✅");
                cancelEditingPurchase();
                fetchAllData();
            } else {
                showFeedback(data.message || "Failed to update purchase entry", true);
            }
        } catch (err) {
            console.error("Error updating purchase log entry:", err);
            showFeedback("Server error while updating purchase entry", true);
        }
    };

    const handleDeletePurchaseLog = async (id, foodName) => {
        try {
            const res = await fetch(`${API_URL}/kitchen/stock/purchases/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Purchase log entry deleted successfully! 🗑️");
                fetchAllData();
            } else {
                showFeedback(data.message || "Failed to delete purchase entry", true);
            }
        } catch (err) {
            console.error("Error deleting purchase log entry:", err);
            showFeedback("Server error while deleting purchase entry", true);
        }
    };

    const handleDeleteDayGroup = async (group) => {
        try {
            await Promise.all(group.items.map(log => 
                fetch(`${API_URL}/kitchen/stock/purchases/${log.id}`, { method: 'DELETE' })
            ));
            showFeedback(`All purchase records for ${group.dateStr} deleted successfully! 🗑️`);
            fetchAllData();
        } catch (err) {
            console.error("Error deleting day group purchases:", err);
            showFeedback("Failed to delete some purchase entries", true);
        }
    };

    // Calculations
    const lowStockAlertItems = menuItems.filter(item => item.stock < item.minimum_stock);
    const totalIngredients = menuItems.length;
    const lowStockCount = lowStockAlertItems.length;
    const outOfStockCount = menuItems.filter(item => item.stock === 0).length;

    // Helper for icons
    const getIngredientIcon = (name) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('leaf') || lower.includes('leafe')) return '🍃';
        if (lower.includes('chicken')) return '🍗';
        if (lower.includes('mutton')) return '🥩';
        if (lower.includes('prawn')) return '🍤';
        if (lower.includes('milk')) return '🥛';
        if (lower.includes('oil')) return '🛢️';
        if (lower.includes('vegetable') || lower.includes('produce')) return '🥦';
        if (lower.includes('rice')) return '🌾';
        if (lower.includes('egg')) return '🥚';
        if (lower.includes('drink') || lower.includes('beverage')) return '🥤';
        return '📦';
    };

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
                        Restaurant
                    </Button>
                    <Button onClick={() => navigate("/")} variant="glass" icon="🏠">
                        Home
                    </Button>
                </div>
            </nav>

            {/* Main Container */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
                
                {/* Titles */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-wider">
                            Kitchen Purchase & Stock Console
                        </h2>
                        <p className="text-gray-400 text-xs md:text-sm mt-1 uppercase tracking-widest font-semibold">
                            Kitchen raw ingredients inventory, tomorrow's needs, and purchases
                        </p>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center">
                        <span className="text-xl">🧺</span>
                        <span className="text-xl font-black text-white mt-0.5">{totalIngredients}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Raw Ingredients</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center">
                        <span className="text-xl">⚠️</span>
                        <span className="text-xl font-black text-yellow-400 mt-0.5">{lowStockCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Low Stock Alerts</span>
                    </div>
                    <div className="glass p-4 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center">
                        <span className="text-xl">🚨</span>
                        <span className="text-xl font-black text-red-400 mt-0.5">{outOfStockCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold mt-1">Out of Stock</span>
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

                {/* Critical Low Stock Alert Banner */}
                {lowStockCount > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                            <span>⚠️</span>
                            <span>CRITICAL LOW STOCK ALERT</span>
                        </div>
                        <p className="text-xs text-yellow-200">
                            The following raw ingredients are running below their minimum reorder levels:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {lowStockAlertItems.map(item => (
                                <span key={item.id} className="text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded-full">
                                    {getIngredientIcon(item.name)} {item.name}: {item.stock} {item.unit} left
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Chooser navigation */}
                <div className="flex border-b border-white/10 gap-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all ${
                            activeTab === 'overview'
                                ? 'border-orange-500 text-orange-500'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        📋 Current Stock View
                    </button>
                    <button
                        onClick={() => setActiveTab('usage')}
                        className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all ${
                            activeTab === 'usage'
                                ? 'border-orange-500 text-orange-500'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        🥣 Daily Usage Entry
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`px-6 py-3 font-bold text-sm tracking-wider uppercase border-b-2 transition-all ${
                            activeTab === 'purchases'
                                ? 'border-orange-500 text-orange-500'
                                : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        📈 Reorder Math & Purchases
                    </button>
                </div>

                {/* Tab content loader */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                        <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Loading Inventory Panel...</span>
                    </div>
                ) : (
                    <div>
                        {/* Tab 1: Current Stock View */}
                        {activeTab === 'overview' && (
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                {/* Kitchen Ingredient Inventory Table */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex flex-col">
                                            <h3 className="text-lg font-bold text-orange-400 uppercase tracking-wider">Kitchen Ingredient Inventory</h3>
                                            <span className="text-xs text-gray-400 font-semibold hidden md:inline">Manage stock & tomorrow's needs inline</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                onClick={() => handlePrintReport('stock')}
                                                variant="glass" 
                                                icon="🖨️" 
                                                className="py-2 px-4 shadow-lg text-xs font-bold uppercase tracking-wider border border-white/5"
                                            >
                                                Print Report
                                            </Button>
                                            <Button 
                                                onClick={() => navigate('/kitchen/purchases/new')}
                                                variant="primary"
                                                icon="🛒"
                                                className="py-2 px-4 shadow-lg text-xs font-bold uppercase tracking-wider border border-white/5"
                                            >
                                                Create Purchase
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {menuItems.length === 0 ? (
                                        <div className="glass rounded-3xl p-12 text-center bg-slate-950/20 border border-white/5 text-gray-400">
                                            No kitchen raw ingredients found.
                                        </div>
                                    ) : (
                                        <div className="glass rounded-2xl border border-white/10 bg-slate-950/20 overflow-hidden shadow-xl">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-white/5 text-xs text-orange-400 font-bold border-b border-white/10 uppercase tracking-wider">
                                                            <th className="p-4 text-center w-20">ID</th>
                                                            <th className="p-4">Ingredient Name</th>
                                                            <th className="p-4">Category</th>
                                                            <th className="p-4 text-center">Status</th>
                                                            <th className="p-4 text-center">Current Stock</th>
                                                            <th className="p-4 text-center">Tomorrow Need</th>
                                                            <th className="p-4 text-center w-48">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-xs divide-y divide-white/5">
                                                        {menuItems.map((item) => {
                                                            const status = getStockStatus(item);
                                                            const isInlineEditing = inlineEditingId === item.id;
                                                            return (
                                                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                                    <td className="p-4 text-center text-gray-500 font-mono">#{item.id}</td>
                                                                    <td className="p-4 font-bold text-white">
                                                                        {getIngredientIcon(item.name)} {item.name}
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <span className="text-[10px] text-orange-500/80 font-bold uppercase tracking-widest">{item.category}</span>
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${status.color}`}>
                                                                            {status.label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        {isInlineEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                value={inlineStockValue}
                                                                                onChange={(e) => setInlineStockValue(e.target.value)}
                                                                                className="bg-black/60 w-24 p-1 text-xs rounded border border-white/20 text-white outline-none focus:border-orange-500 text-center font-bold"
                                                                                min="0"
                                                                                step="any"
                                                                                required
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm font-black text-orange-400">
                                                                                {item.stock} <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        {isInlineEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                value={inlineTomorrowNeedValue}
                                                                                onChange={(e) => setInlineTomorrowNeedValue(e.target.value)}
                                                                                className="bg-black/60 w-24 p-1 text-xs rounded border border-white/20 text-white outline-none focus:border-orange-500 text-center font-bold"
                                                                                min="0"
                                                                                step="any"
                                                                                required
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm font-black text-blue-400">
                                                                                {item.required_quantity} <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4 text-center">
                                                                        {isInlineEditing ? (
                                                                            <div className="flex items-center justify-center gap-1.5">
                                                                                <button
                                                                                    onClick={() => handleInlineStockUpdate(item.id, inlineStockValue, inlineTomorrowNeedValue)}
                                                                                    className="px-2.5 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold transition-all focus:outline-none flex items-center gap-1"
                                                                                >
                                                                                    ✔️ Save
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setInlineEditingId(null)}
                                                                                    className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all focus:outline-none flex items-center gap-1"
                                                                                >
                                                                                    ❌
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center justify-center gap-1.5">
                                                                                <button 
                                                                                    onClick={() => startInlineEdit(item)}
                                                                                    className="px-2.5 py-1 rounded bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 hover:text-orange-300 text-xs font-bold transition-all focus:outline-none"
                                                                                    title="Quick Edit Stock & Tomorrow Need"
                                                                                >
                                                                                    ✏️ Quick Edit
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleReqDelete(item.id)}
                                                                                    className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-xs font-bold transition-all focus:outline-none"
                                                                                    title="Delete Ingredient"
                                                                                >
                                                                                    🗑️ Delete
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 2: Daily Usage Entry */}
                        {activeTab === 'usage' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fadeIn">
                                <div className="lg:col-span-1 glass p-6 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex flex-col gap-5">
                                    <div>
                                        <h3 className="text-xl font-bold text-white tracking-wide">Usage Entry</h3>
                                        <p className="text-gray-400 text-xs mt-1">Deduct raw ingredient quantities from kitchen inventory.</p>
                                    </div>

                                    <form onSubmit={handleUsageSubmit} className="flex flex-col gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-orange-400">Enter Item</label>
                                            <input
                                                list="usage-items-list"
                                                value={selectedUsageFoodName}
                                                onChange={(e) => setSelectedUsageFoodName(e.target.value)}
                                                placeholder="-- Enter or Choose Item --"
                                                className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-xs"
                                                required
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
                                                className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-xs"
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
                                                className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 w-full text-xs"
                                                required
                                            >
                                                <option value="Dinner service">Dinner service usage</option>
                                                <option value="Catering event">Catering event</option>
                                                <option value="Staff food">Staff meals</option>
                                                <option value="Kitchen waste / Spill">Kitchen waste / Spill</option>
                                                <option value="Spoiled / Expired">Spoiled / Expired</option>
                                            </select>
                                        </div>

                                        <Button type="submit" variant="primary" icon="➖" className="py-3 shadow-lg mt-2 font-bold uppercase tracking-wider">
                                            Record Usage
                                        </Button>
                                    </form>
                                </div>

                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/10">
                                        <div>
                                            <h3 className="text-lg font-bold text-orange-400 uppercase tracking-wider">Usage History Log</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Kitchen raw ingredient usage logs grouped day by day.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">📅 Select Day:</span>
                                            <select
                                                value={selectedUsageDate}
                                                onChange={(e) => setSelectedUsageDate(e.target.value)}
                                                className="bg-black/60 px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs outline-none focus:border-orange-500 font-semibold"
                                            >
                                                <option value="ALL">All Days (Grouped View)</option>
                                                {uniqueUsageDates.map(dateStr => (
                                                    <option key={dateStr} value={dateStr}>{dateStr}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    {usageLogs.length === 0 ? (
                                        <div className="glass rounded-3xl p-12 text-center bg-slate-950/20 border border-white/5 text-gray-400 text-xs">
                                            No daily usage entries logged yet.
                                        </div>
                                    ) : displayedUsageGroups.length === 0 ? (
                                        <div className="glass rounded-3xl p-12 text-center bg-slate-950/20 border border-white/5 text-gray-400 text-xs">
                                            No usage records found for selected date: {selectedUsageDate}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-6">
                                            {displayedUsageGroups.map((group) => (
                                                <div key={group.dateStr} className="glass rounded-2xl border border-white/10 bg-slate-950/30 overflow-hidden shadow-xl">
                                                    <div className="bg-white/5 px-5 py-3.5 border-b border-white/10 flex justify-between items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">📅</span>
                                                            <span className="font-extrabold text-white text-sm tracking-wide">{group.dateStr}</span>
                                                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold uppercase">
                                                                {group.items.length} {group.items.length === 1 ? 'Entry' : 'Entries'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-black/20 text-[11px] text-orange-400 font-bold border-b border-white/5 uppercase tracking-wider">
                                                                    <th className="p-3.5">Ingredient Name</th>
                                                                    <th className="p-3.5 text-center">Quantity Deducted</th>
                                                                    <th className="p-3.5">Reason</th>
                                                                    <th className="p-3.5 text-center">Date & Time</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-xs divide-y divide-white/5">
                                                                {group.items.map((log) => {
                                                                    const item = menuItems.find(m => m.name === log.food_name);
                                                                    const isLeaf = (log.food_name || '').toLowerCase().includes('leaf') || (log.food_name || '').toLowerCase().includes('leafe');
                                                                    const unit = isLeaf ? 'Pcs' : (item ? item.unit : 'units');
                                                                    return (
                                                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                                            <td className="p-3.5 font-bold text-white">
                                                                                {getIngredientIcon(log.food_name)} {log.food_name}
                                                                            </td>
                                                                            <td className="p-3.5 text-center text-orange-400 font-black">{log.quantity} {unit}</td>
                                                                            <td className="p-3.5 text-gray-300">
                                                                                <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] border border-white/10">
                                                                                    {log.reason}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-3.5 text-center text-gray-400">{formatDateTime(log.created_at)}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Reorder Math & Purchases */}
                        {activeTab === 'purchases' && (
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-400 uppercase tracking-wider">Purchase Requirement Calculator</h3>
                                        <p className="text-gray-400 text-xs mt-0.5">Automated calculations comparing current stocks against tomorrow's needs.</p>
                                    </div>

                                    <div className="glass rounded-2xl border border-white/10 bg-slate-950/20 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white/5 text-xs text-orange-400 font-bold border-b border-white/10 uppercase tracking-wider">
                                                        <th className="p-4">Ingredient Name</th>
                                                        <th className="p-4 text-center">Current Stock</th>
                                                        <th className="p-4 text-center">Min. Alert Level</th>
                                                        <th className="p-4 text-center">Tomorrow's Need</th>
                                                        <th className="p-4 text-right">Purchase Required</th>
                                                        <th className="p-4 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs divide-y divide-white/5">
                                                    {menuItems.map((item) => {
                                                        const isLow = item.stock < item.minimum_stock;
                                                        const reqPurchases = Math.max(0, item.required_quantity - item.stock);
                                                        return (
                                                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                                <td className="p-4 font-bold text-white">
                                                                    {getIngredientIcon(item.name)} {item.name}
                                                                </td>
                                                                <td className="p-4 text-center font-bold text-gray-300">{item.stock} {item.unit}</td>
                                                                <td className="p-4 text-center text-gray-400">{item.minimum_stock} {item.unit}</td>
                                                                <td className="p-4 text-center text-gray-400">{item.required_quantity} {item.unit}</td>
                                                                <td className="p-4 text-right font-black">
                                                                    {reqPurchases > 0 ? (
                                                                        <span className="text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20 font-black">
                                                                            +{reqPurchases} {item.unit}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-emerald-400">—</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    {isLow ? (
                                                                        <span className="text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase">REORDER</span>
                                                                    ) : (
                                                                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">SUFFICIENT</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 animate-fadeIn">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-white/10">
                                        <div>
                                            <h3 className="text-lg font-bold text-orange-400 uppercase tracking-wider">Purchase History Log</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">View and print raw ingredient purchase history grouped day by day.</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">📅 Select Day:</span>
                                                <select
                                                    value={selectedHistoryDate}
                                                    onChange={(e) => setSelectedHistoryDate(e.target.value)}
                                                    className="bg-black/60 px-3 py-1.5 rounded-xl border border-white/20 text-white text-xs outline-none focus:border-orange-500 font-semibold"
                                                >
                                                    <option value="ALL">All Days (Grouped View)</option>
                                                    {uniqueHistoryDates.map(dateStr => (
                                                        <option key={dateStr} value={dateStr}>{dateStr}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <Button
                                                onClick={() => exportPurchaseCSV(selectedHistoryDate)}
                                                variant="glass"
                                                icon="📥"
                                                className="py-1.5 px-3 shadow-md text-xs font-bold uppercase tracking-wider border border-white/10"
                                            >
                                                Save / Export CSV
                                            </Button>
                                            <Button
                                                onClick={() => handlePrintReport('purchase')}
                                                variant="primary"
                                                icon="🖨️"
                                                className="py-1.5 px-4 shadow-lg text-xs font-bold uppercase tracking-wider border border-white/10"
                                            >
                                                Print History
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {purchaseLogs.length === 0 ? (
                                        <div className="glass rounded-3xl p-12 text-center bg-slate-950/20 border border-white/5 text-gray-400 text-xs">
                                            No purchase logs recorded yet.
                                        </div>
                                    ) : displayedPurchaseGroups.length === 0 ? (
                                        <div className="glass rounded-3xl p-12 text-center bg-slate-950/20 border border-white/5 text-gray-400 text-xs">
                                            No purchase records found for selected date: {selectedHistoryDate}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-6">
                                            {displayedPurchaseGroups.map((group) => (
                                                <div key={group.dateStr} className="glass rounded-2xl border border-white/10 bg-slate-950/30 overflow-hidden shadow-xl">
                                                    <div className="bg-white/5 px-5 py-3.5 border-b border-white/10 flex flex-wrap justify-between items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base">📅</span>
                                                            <span className="font-extrabold text-white text-sm tracking-wide">{group.dateStr}</span>
                                                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30 font-bold uppercase">
                                                                {group.items.length} {group.items.length === 1 ? 'Entry' : 'Entries'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-gray-300">Daily Total: <strong className="text-emerald-400 text-sm font-black">₹{group.dayTotal}</strong></span>
                                                            <button
                                                                onClick={() => handleDeleteDayGroup(group)}
                                                                className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center gap-1 border border-red-500/20 ml-2"
                                                                title="Delete all purchase entries for this day"
                                                            >
                                                                🗑️ Delete Day
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left border-collapse">
                                                            <thead>
                                                                <tr className="bg-black/20 text-[11px] text-orange-400 font-bold border-b border-white/5 uppercase tracking-wider">
                                                                    <th className="p-3.5">Ingredient Name</th>
                                                                    <th className="p-3.5 text-center">Quantity Added</th>
                                                                    <th className="p-3.5 text-right">Cost amount</th>
                                                                    <th className="p-3.5 text-center">Receipt Date</th>
                                                                    <th className="p-3.5 text-center w-36">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="text-xs divide-y divide-white/5">
                                                                {group.items.map((log) => {
                                                                    const item = menuItems.find(m => m.name === log.food_name);
                                                                    const unit = item ? item.unit : 'units';
                                                                    const isEditing = editingPurchaseId === log.id;
                                                                    return (
                                                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                                            <td className="p-3.5 font-bold text-white">
                                                                                {isEditing ? (
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingPurchaseFoodName}
                                                                                        onChange={(e) => setEditingPurchaseFoodName(e.target.value)}
                                                                                        className="bg-black/60 p-1.5 text-xs rounded border border-white/20 text-white outline-none focus:border-orange-500 font-bold w-full"
                                                                                        required
                                                                                    />
                                                                                ) : (
                                                                                    <>{getIngredientIcon(log.food_name)} {log.food_name}</>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-3.5 text-center text-emerald-400 font-bold">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <span className="text-emerald-400 font-bold">+</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            value={editingPurchasePortions}
                                                                                            onChange={(e) => setEditingPurchasePortions(e.target.value)}
                                                                                            className="bg-black/60 p-1.5 text-xs rounded border border-white/20 text-white outline-none focus:border-orange-500 font-bold w-20 text-center"
                                                                                            min="0.1"
                                                                                            step="any"
                                                                                            required
                                                                                        />
                                                                                        <span className="text-gray-400 text-[10px] font-normal">{unit}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>+{log.portions_added} {unit}</>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-3.5 text-right font-black text-white">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <span className="text-gray-400">₹</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            value={editingPurchaseAmount}
                                                                                            onChange={(e) => setEditingPurchaseAmount(e.target.value)}
                                                                                            className="bg-black/60 p-1.5 text-xs rounded border border-white/20 text-white outline-none focus:border-orange-500 font-bold w-24 text-right"
                                                                                            min="0"
                                                                                            step="any"
                                                                                            required
                                                                                        />
                                                                                    </div>
                                                                                ) : (
                                                                                    <>₹{log.amount}</>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-3.5 text-center text-gray-400">{formatDateTime(log.created_at)}</td>
                                                                            <td className="p-3.5 text-center">
                                                                                {isEditing ? (
                                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                                        <button
                                                                                            onClick={() => handleSavePurchaseEdit(log.id)}
                                                                                            className="px-2.5 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-bold transition-all"
                                                                                            title="Save Changes"
                                                                                        >
                                                                                            ✔️ Save
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={cancelEditingPurchase}
                                                                                            className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold transition-all"
                                                                                            title="Cancel"
                                                                                        >
                                                                                            ❌
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                                        <button
                                                                                            onClick={() => startEditingPurchase(log)}
                                                                                            className="px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-500/25 text-orange-400 text-xs font-bold transition-all"
                                                                                            title="Edit Entry"
                                                                                        >
                                                                                            ✏️ Edit
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleDeletePurchaseLog(log.id, log.food_name)}
                                                                                            className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 text-xs font-bold transition-all"
                                                                                            title="Delete Entry"
                                                                                        >
                                                                                            🗑️ Delete
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Printable Report Container */}
            <div className="print-only">
                {/* Stock & Requirements Section */}
                {(printReportType === 'all' || printReportType === 'stock') && (
                    <div style={{ pageBreakAfter: printReportType === 'all' ? 'always' : 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#000' }}>Sindhu Mahal</h1>
                                <p style={{ fontSize: '14px', margin: '4px 0 0 0', color: '#666' }}>Kitchen Stock & Requirements Report</p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                                <p style={{ margin: '0' }}>Date: {new Date().toLocaleDateString('en-IN')}</p>
                                <p style={{ margin: '4px 0 0 0' }}>Time: {new Date().toLocaleTimeString('en-IN')}</p>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Ingredient Name</th>
                                    <th>Category</th>
                                    <th style={{ textAlign: 'center' }}>Current Stock</th>
                                    <th style={{ textAlign: 'center' }}>Tomorrow Need</th>
                                    <th style={{ textAlign: 'right' }}>Purchase Required</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menuItems.map((item) => {
                                    const reqPurchases = Math.max(0, item.required_quantity - item.stock);
                                    const status = getStockStatus(item);
                                    return (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                                            <td>{item.category}</td>
                                            <td style={{ textAlign: 'center' }}>{item.stock} {item.unit}</td>
                                            <td style={{ textAlign: 'center' }}>{item.required_quantity} {item.unit}</td>
                                            <td style={{ textAlign: 'right' }} className={reqPurchases > 0 ? 'deficit-highlight' : ''}>
                                                {reqPurchases > 0 ? `+${reqPurchases} ${item.unit}` : '—'}
                                            </td>
                                            <td>{status.label}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Purchase History Section */}
                {(printReportType === 'all' || printReportType === 'purchase') && (
                    <div style={{ marginTop: printReportType === 'all' ? '20px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#000' }}>Sindhu Mahal</h1>
                                <p style={{ fontSize: '14px', margin: '4px 0 0 0', color: '#666' }}>Kitchen Purchase History Log Report</p>
                                <p style={{ fontSize: '12px', margin: '2px 0 0 0', color: '#333', fontWeight: 'bold' }}>
                                    Selected View: {selectedHistoryDate === 'ALL' ? 'All Historic Dates (Grouped Day by Day)' : `Date: ${selectedHistoryDate}`}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
                                <p style={{ margin: '0' }}>Generated: {new Date().toLocaleDateString('en-IN')}</p>
                                <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#000' }}>Total Cost: ₹{totalSelectedPurchaseCost}</p>
                            </div>
                        </div>

                        {displayedPurchaseGroups.map((group) => (
                            <div key={group.dateStr} style={{ marginTop: '20px' }}>
                                <div style={{ background: '#f5f5f5', padding: '6px 12px', fontWeight: 'bold', border: '1px solid #ccc', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>📅 Date: {group.dateStr}</span>
                                    <span>Daily Spend: ₹{group.dayTotal} ({group.items.length} purchases)</span>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Ingredient Name</th>
                                            <th style={{ textAlign: 'center' }}>Quantity Added</th>
                                            <th style={{ textAlign: 'right' }}>Cost Amount</th>
                                            <th style={{ textAlign: 'center' }}>Receipt Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map((log) => {
                                            const item = menuItems.find(m => m.name === log.food_name);
                                            const unit = item ? item.unit : 'units';
                                            return (
                                                <tr key={log.id}>
                                                    <td style={{ fontWeight: 'bold' }}>{log.food_name}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#047857' }}>+{log.portions_added} {unit}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{log.amount}</td>
                                                    <td style={{ textAlign: 'center' }}>{formatDateTime(log.created_at)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                )}

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

export default KitchenPurchase;
