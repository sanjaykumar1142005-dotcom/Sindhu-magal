import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const RestaurantInventory = () => {
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    
    // Inventory items list
    const [inventoryItems, setInventoryItems] = useState([]);
    
    // UI controls
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Layout view: 'table' | 'cards'
    const [viewMode, setViewMode] = useState('table');
    
    // Sorting state
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const navigate = useNavigate();

    // Fetch data
    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Fetch all items from kitchen-requirements endpoint which serves raw items
            const res = await fetch(`${API_URL}/restaurant/kitchen-requirements`);
            const data = await res.json();
            if (data.success) {
                setInventoryItems(data.data || []);
            } else {
                showFeedback(data.message || "Failed to fetch inventory", true);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
            showFeedback("Server connection error.", true);
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

    // Stock status resolver
    const getStockStatus = (item) => {
        const stock = parseFloat(item.current_stock) || 0;
        const minStock = parseFloat(item.minimum_stock) || 10;
        
        if (stock === 0) {
            return { label: 'Out of Stock', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
        }
        if (stock < minStock) {
            return { label: 'Low Stock', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
        }
        return { label: 'In Stock', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    };

    // Calculate Summary Stats
    const totalItems = inventoryItems.length;
    
    const inStockCount = inventoryItems.filter(item => {
        const stock = parseFloat(item.current_stock) || 0;
        const minStock = parseFloat(item.minimum_stock) || 10;
        return stock >= minStock && stock > 0;
    }).length;
    
    const lowStockCount = inventoryItems.filter(item => {
        const stock = parseFloat(item.current_stock) || 0;
        const minStock = parseFloat(item.minimum_stock) || 10;
        return stock < minStock && stock > 0;
    }).length;
    
    const outOfStockCount = inventoryItems.filter(item => {
        const stock = parseFloat(item.current_stock) || 0;
        return stock === 0;
    }).length;

    // Sorting trigger
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Process items (Search, Filter, Sort, Paginate)
    const processedItems = inventoryItems
        .filter(item => {
            // 1. Search filter
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                                  item.category.toLowerCase().includes(search.toLowerCase());
            
            // 2. Category filter
            const matchesCategory = categoryFilter === '' || item.category === categoryFilter;
            
            // 3. Status filter
            const status = getStockStatus(item).label;
            const matchesStatus = statusFilter === '' || status === statusFilter;
            
            return matchesSearch && matchesCategory && matchesStatus;
        })
        .sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            
            // Handle numeric parsing if needed
            if (sortField === 'current_stock' || sortField === 'minimum_stock') {
                valA = parseFloat(valA) || 0;
                valB = parseFloat(valB) || 0;
            } else if (sortField === 'updated_at') {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }
            
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

    // Pagination slice
    const totalProcessed = processedItems.length;
    const totalPages = Math.ceil(totalProcessed / itemsPerPage);
    const paginatedItems = processedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Format Date Helper
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

            {/* Main Container */}
            <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
                
                {/* Header Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-500 tracking-wider">
                            Inventory Overview
                        </h2>
                        <p className="text-gray-400 text-xs md:text-sm mt-1 uppercase tracking-widest font-semibold">
                            Central stock management console for store and kitchen ingredients
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Button 
                            onClick={fetchInventory} 
                            variant="glass" 
                            icon="🔄" 
                            className="py-2.5 px-4 border border-white/5 hover:border-orange-500/30 text-xs uppercase tracking-wider"
                        >
                            Refresh Data
                        </Button>
                    </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50" />
                        <span className="text-2xl mb-1">📦</span>
                        <span className="text-2xl font-black text-white">{totalItems}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Total Items</span>
                    </div>
                    <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" />
                        <span className="text-2xl mb-1">✅</span>
                        <span className="text-2xl font-black text-emerald-400">{inStockCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">In Stock</span>
                    </div>
                    <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50" />
                        <span className="text-2xl mb-1">⚠️</span>
                        <span className="text-2xl font-black text-yellow-400">{lowStockCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Low Stock</span>
                    </div>
                    <div className="glass p-5 rounded-2xl border border-white/5 bg-slate-950/20 text-center flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                        <span className="text-2xl mb-1">🚨</span>
                        <span className="text-2xl font-black text-red-400">{outOfStockCount}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Out of Stock</span>
                    </div>
                </div>

                {/* Feedback Dialog */}
                {msg && (
                    <div className={`p-4 rounded-xl text-center font-bold text-sm border transition-all ${
                        isError 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                            : 'bg-green-500/10 border-green-500/20 text-green-400'
                    }`}>
                        {msg}
                    </div>
                )}

                {/* Search, Filter & Layout mode Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/20 p-5 rounded-3xl border border-white/5">
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search ingredients (Oil, Chicken, Rice...)..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="bg-black/40 pl-10 pr-4 py-2.5 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500 w-full text-sm"
                            />
                            <span className="absolute left-3.5 top-3 text-gray-500 text-sm">🔍</span>
                        </div>

                        {/* Category filter dropdown */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
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

                        {/* Status filter dropdown */}
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="bg-black/40 px-4 py-2.5 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="In Stock">In Stock</option>
                            <option value="Low Stock">Low Stock</option>
                            <option value="Out of Stock">Out of Stock</option>
                        </select>
                    </div>

                    {/* View mode toggle tabs */}
                    <div className="hidden sm:flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start lg:self-auto">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'table' 
                                    ? 'bg-orange-500 text-white shadow' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            📊 Table View
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'cards' 
                                    ? 'bg-orange-500 text-white shadow' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            🗂️ Card View
                        </button>
                    </div>
                </div>

                {/* Dashboard Main View */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-24 gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
                        <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">Fetching Inventory...</span>
                    </div>
                ) : totalProcessed === 0 ? (
                    <div className="glass rounded-3xl p-16 text-center bg-slate-950/20 border border-white/5 text-gray-400 text-sm">
                        No inventory items match the current search or filter criteria.
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* 1. TABLE VIEW MODE */}
                        {viewMode === 'table' && (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden sm:block glass rounded-2xl border border-white/10 bg-slate-950/20 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5 text-xs text-orange-400 font-bold border-b border-white/10 uppercase tracking-wider">
                                                    <th onClick={() => handleSort('name')} className="p-4 cursor-pointer hover:text-orange-300 transition-colors">
                                                        Item Name {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                                    </th>
                                                    <th onClick={() => handleSort('category')} className="p-4 cursor-pointer hover:text-orange-300 transition-colors">
                                                        Category {sortField === 'category' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                                    </th>
                                                    <th onClick={() => handleSort('current_stock')} className="p-4 text-center cursor-pointer hover:text-orange-300 transition-colors">
                                                        Current Stock {sortField === 'current_stock' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                                    </th>
                                                    <th onClick={() => handleSort('minimum_stock')} className="p-4 text-center cursor-pointer hover:text-orange-300 transition-colors">
                                                        Min. Level {sortField === 'minimum_stock' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                                    </th>
                                                    <th className="p-4 text-center">Stock Status</th>
                                                    <th onClick={() => handleSort('updated_at')} className="p-4 text-right cursor-pointer hover:text-orange-300 transition-colors">
                                                        Last Updated {sortField === 'updated_at' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs divide-y divide-white/5">
                                                {paginatedItems.map((item) => {
                                                    const status = getStockStatus(item);
                                                    return (
                                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-4 font-bold text-white flex items-center gap-2">
                                                                <span>🍲</span> {item.name}
                                                            </td>
                                                            <td className="p-4 text-gray-300">{item.category}</td>
                                                            <td className="p-4 text-center font-bold text-white">
                                                                {item.current_stock} <span className="text-[10px] text-gray-500 font-normal">{item.unit}</span>
                                                            </td>
                                                            <td className="p-4 text-center text-gray-400">
                                                                {item.minimum_stock || 10} <span className="text-[10px] text-gray-500 font-normal">{item.unit}</span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${status.color}`}>
                                                                    {status.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right text-gray-400 font-mono">
                                                                {formatDateTime(item.updated_at)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Cards Fallback */}
                                <div className="block sm:hidden flex flex-col gap-3">
                                    {paginatedItems.map((item) => {
                                        const status = getStockStatus(item);
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
                                        return (
                                            <div 
                                                key={item.id} 
                                                className="glass p-4 rounded-2xl border border-white/10 bg-slate-950/20 flex flex-col gap-3"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500 font-mono text-[10px]">#{item.id}</span>
                                                        <h4 className="font-bold text-white text-sm">
                                                            {getCategoryIcon(item.category)} {item.name}
                                                        </h4>
                                                    </div>
                                                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 bg-black/20 p-2.5 rounded-xl border border-white/5 text-center">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Stock</span>
                                                        <span className="text-xs font-black text-orange-400">
                                                            {item.current_stock} <span className="text-[9px] text-gray-400 font-normal">{item.unit}</span>
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 border-l border-white/5">
                                                        <span className="text-[9px] text-gray-400 uppercase font-semibold">Min Level</span>
                                                        <span className="text-xs font-black text-blue-400">
                                                            {item.minimum_stock || 10} <span className="text-[9px] text-gray-400 font-normal">{item.unit}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1 px-1">
                                                    <span>Last Updated:</span>
                                                    <span className="font-mono">{formatDateTime(item.updated_at)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* 2. CARD VIEW MODE */}
                        {viewMode === 'cards' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {paginatedItems.map((item) => {
                                    const status = getStockStatus(item);
                                    
                                    // Icon Resolver mapping
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

                                    return (
                                        <div 
                                            key={item.id} 
                                            className="glass p-5 rounded-2xl border border-white/10 bg-slate-950/30 hover:border-orange-500/20 transition-all flex flex-col gap-3 relative overflow-hidden group hover:scale-[1.01]"
                                        >
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />

                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center text-xl">
                                                        {getCategoryIcon(item.category)}
                                                    </div>
                                                    <div>
                                                        <span className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">{item.category}</span>
                                                        <h4 className="text-sm font-bold text-white truncate max-w-[120px]" title={item.name}>
                                                            {item.name}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase border ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Current Stock</span>
                                                    <span className="font-extrabold text-white">
                                                        {item.current_stock} <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
                                                    <span className="text-gray-400 text-[10px] uppercase font-semibold">Minimum Level</span>
                                                    <span className="font-bold text-gray-300">
                                                        {item.minimum_stock || 10} <span className="text-[10px] text-gray-400 font-normal">{item.unit}</span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-[9px] text-gray-500 flex justify-between items-center mt-1 border-t border-white/5 pt-2 font-mono">
                                                <span>ID: #{item.id}</span>
                                                <span>{formatDateTime(item.updated_at)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center bg-slate-950/20 px-6 py-4 rounded-2xl border border-white/5">
                                <span className="text-xs text-gray-400">
                                    Showing <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                    <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, totalProcessed)}</span> of{' '}
                                    <span className="text-white font-bold">{totalProcessed}</span> entries
                                </span>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 disabled:opacity-50 disabled:pointer-events-none transition-all"
                                    >
                                        ◀ Previous
                                    </button>
                                    
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                currentPage === i + 1 
                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 disabled:opacity-50 disabled:pointer-events-none transition-all"
                                    >
                                        Next ▶
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantInventory;
