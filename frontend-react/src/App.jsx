import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Catering from './pages/Catering';
import CateringAdmin from './pages/CateringAdmin';
import AdminDashboard from './pages/AdminDashboard';
import Restaurant from './pages/Restaurant';
import RestaurantSales from './pages/RestaurantSales';
import RestaurantAdmin from './pages/RestaurantAdmin';
import RestaurantPurchase from './pages/RestaurantPurchase';
import KitchenPurchase from './pages/KitchenPurchase';
import KitchenCreatePurchase from './pages/KitchenCreatePurchase';
import RestaurantInventory from './pages/RestaurantInventory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/catering" element={<Catering />} />
        <Route path="/restaurant" element={<Restaurant />} />
        <Route path="/restaurant/sales" element={<RestaurantSales />} />
        <Route path="/restaurant/purchases" element={<RestaurantPurchase />} />
        <Route path="/restaurant/inventory" element={<RestaurantInventory />} />
        <Route path="/kitchen/purchases" element={<KitchenPurchase />} />
        <Route path="/kitchen/purchases/new" element={<KitchenCreatePurchase />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/catering" element={<CateringAdmin />} />
        <Route path="/restaurant/menu-admin" element={<RestaurantAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;
