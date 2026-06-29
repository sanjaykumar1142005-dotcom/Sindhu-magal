import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import API_URL from '../config';

const RestaurantAdmin = () => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ 
        name: '', 
        price: '', 
        category: 'breakfast'
    });
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRestaurantMenu();
    }, []);

    const fetchRestaurantMenu = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/restaurant/menu`);
            const data = await res.json();
            if (data.success) {
                setItems(data.data || []);
            } else {
                showFeedback(data.message || "Failed to fetch restaurant menu", true);
            }
        } catch (err) {
            console.error("Failed to fetch menu:", err);
            showFeedback("Failed to connect to backend server.", true);
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

    const handleAdd = async () => {
        if (!newItem.name || !newItem.price) {
            showFeedback("Please enter both item name and price", true);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/restaurant/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ 
                    name: newItem.name,
                    price: parseInt(newItem.price) || 0,
                    category: newItem.category
                })
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Restaurant item added successfully!");
                setNewItem({ 
                    name: '', 
                    price: '', 
                    category: 'breakfast'
                });
                fetchRestaurantMenu();
            } else {
                showFeedback(data.message || "Failed to add item", true);
            }
        } catch (err) {
            console.error(err);
            showFeedback("Server connection error.", true);
        }
    };

    const handleUpdate = async () => {
        if (!editingItem.name || !editingItem.price) {
            showFeedback("Item name and price cannot be empty", true);
            return;
        }

        try {
            const res = await fetch(`${API_URL}/admin/restaurant/menu`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    id: editingItem.id,
                    name: editingItem.name,
                    price: parseInt(editingItem.price) || 0,
                    category: editingItem.category
                })
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Restaurant item updated successfully!");
                setEditingItem(null);
                fetchRestaurantMenu();
            } else {
                showFeedback(data.message || "Failed to update item", true);
            }
        } catch (err) {
            console.error(err);
            showFeedback("Server connection error.", true);
        }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/admin/restaurant/menu/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': localStorage.getItem('token')
                }
            });
            const data = await res.json();
            if (data.success) {
                showFeedback("Item deleted 🗑️");
                fetchRestaurantMenu();
            } else {
                showFeedback(data.message || "Failed to delete item", true);
            }
        } catch (err) {
            console.error(err);
            showFeedback("Server connection error.", true);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 home-bg">
            <div className="max-w-4xl mx-auto animate-fadeIn">
                {/* Header Banner info */}
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <span className="text-2xl">🏪</span>
                    <p className="text-sm text-orange-200">
                        <strong>Restaurant Admin Dashboard:</strong> Managing items displayed in the Restaurant Sales menu options.
                    </p>
                </div>
                
                {/* Navigation and Title */}
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/frontend/images/IMG_5225.PNG" 
                            alt="logo" 
                            className="w-12 h-12 rounded-full object-cover border border-orange-500/50"
                            onError={(e) => {e.target.style.display='none'}}
                        />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-orange-500">Sindhu Restaurant Admin</h1>
                            <p className="text-xs text-gray-400">Manage restaurant dine-in menu, pricing and categories</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate('/')} variant="glass" icon="🏠">Home</Button>
                        <Button onClick={() => navigate('/restaurant')} variant="glass" icon="🏪">Restaurant</Button>
                        <Button onClick={() => navigate('/restaurant/sales')} variant="glass" icon="📈">Sales Tracker</Button>
                    </div>
                </div>

                {/* Feedback message banner */}
                {msg && (
                    <p className={`p-3 rounded mb-6 text-center font-bold text-sm border ${
                        isError 
                            ? 'bg-red-500/20 border-red-500/30 text-red-400' 
                            : 'bg-green-600/20 border-green-600/30 text-green-400'
                    }`}>
                        {msg}
                    </p>
                )}

                {/* Add/Edit item form section */}
                <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold mb-4 text-orange-400">
                        {editingItem ? "Edit Restaurant Item" : "Add New Restaurant Item"}
                    </h2>
                    
                    {editingItem ? (
                        /* Edit mode form */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Item Name"
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500"
                                    value={editingItem.name}
                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500"
                                    value={editingItem.price}
                                    onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                                />
                                <select
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500"
                                    value={editingItem.category}
                                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleUpdate} variant="success" icon="💾" fullWidth>
                                    Save Changes
                                </Button>
                                <Button onClick={() => setEditingItem(null)} variant="glass" fullWidth>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Add mode form */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Restaurant Item Name"
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Price (₹)"
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white placeholder-gray-500 outline-none focus:border-orange-500"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                />
                                <select
                                    className="bg-black/40 p-3 rounded-xl border border-white/10 text-white outline-none focus:border-orange-500"
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                </select>
                            </div>
                            <Button onClick={handleAdd} variant="primary" icon="➕" fullWidth>
                                Add Restaurant Item
                            </Button>
                        </div>
                    )}
                </div>

                {/* List Items section */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
                        </div>
                    ) : (
                        ['breakfast', 'lunch', 'dinner'].map(cat => {
                            const catItems = items.filter(i => i.category === cat);
                            return (
                                <div key={cat} className="mb-6 bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-xl">
                                    <h2 className="text-xl font-bold mb-4 capitalize text-orange-400 border-b border-orange-400/20 pb-2 flex justify-between items-center">
                                        <span>{cat} Menu</span>
                                        <span className="text-sm font-normal text-gray-400">
                                            ({catItems.length} items)
                                        </span>
                                    </h2>
                                    
                                    {catItems.length === 0 ? (
                                        <p className="text-gray-500 text-xs py-4 text-center">No items listed in {cat} yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {catItems.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    className="bg-black/35 p-4 rounded-xl border border-white/5 hover:border-orange-500/20 transition-all flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-white text-base">{item.name}</h4>
                                                        <span className="text-xs text-orange-400 font-semibold">Rate: ₹{item.price}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setEditingItem(item)}
                                                            className="px-3 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-bold transition-all"
                                                        >
                                                            Edit ✏️
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="px-3 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all"
                                                        >
                                                            Delete 🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default RestaurantAdmin;
