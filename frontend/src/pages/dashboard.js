import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    WalletIcon,
    BoltIcon,
    CubeIcon,
    UserIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import NavigationBar from "../components/navbar.jsx";
import LineChart from "../components/LineChart.jsx";

export default function Dashboard() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // Fetch user data
    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const res = await fetch("http://localhost:5001/api/auth/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    setUserData(data.data);
                } else {
                    // Invalid token - redirect to login
                    localStorage.removeItem("token");
                    localStorage.removeItem("user_id");
                    navigate("/login");
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    // Generate realistic chart data with logical trends
    const generateChartData = (type, days = 30) => {
        const data = [];
        const today = new Date();

        // Base values and trends
        const baseValue = type === 'sold' ? 45 : 30;
        const trendDirection = type === 'sold' ? 1.02 : 0.98; // Sold increasing, bought stable

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Create realistic pattern with:
            // - Weekly cycles (higher on weekdays)
            // - Gradual trend
            // - Small random variation
            const dayOfWeek = date.getDay();
            const weekdayMultiplier = (dayOfWeek >= 1 && dayOfWeek <= 5) ? 1.2 : 0.8;
            const trendMultiplier = Math.pow(trendDirection, days - i);
            const randomVariation = 0.85 + Math.random() * 0.3; // ±15%

            const value = baseValue * weekdayMultiplier * trendMultiplier * randomVariation;

            // Format label
            let label;
            if (i === 0) {
                label = 'Today';
            } else if (i === 1) {
                label = 'Yesterday';
            } else if (i <= 7) {
                label = `${i}d ago`;
            } else if (i === days - 1) {
                label = `${days}d ago`;
            } else if (i % 5 === 0) {
                label = `${i}d`;
            } else {
                label = '';
            }

            data.push({
                label,
                value: Math.max(0, value)
            });
        }

        return data;
    };

    const energySoldData = generateChartData('sold', 30);
    const energyBoughtData = generateChartData('bought', 30);

    // Calculate totals
    const totalSold = energySoldData.reduce((sum, d) => sum + d.value, 0);
    const totalBought = energyBoughtData.reduce((sum, d) => sum + d.value, 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="skeleton w-16 h-16 rounded-full mx-auto mb-4"></div>
                    <p className="text-xl font-semibold text-gray-300">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="energy-card max-w-md text-center">
                    <p className="text-red-400 text-lg">Unable to load dashboard. Please try again.</p>
                </div>
            </div>
        );
    }

    // Shorten wallet address
    const shortenAddress = (address) => {
        if (!address) return "N/A";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div className="min-h-screen p-6 pb-24 max-w-7xl mx-auto">
            {/* Welcome Message - ONLY IN DASHBOARD */}
            <div className="mb-6 animate-fade-in-up">
                <h2 className="text-xl font-semibold text-gray-300">
                    Welcome, <span className="text-solar">{userData.name || "User"}</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Here's your energy trading overview
                </p>
            </div>

            {/* Header */}
            <div className="mb-8 animate-fade-in-up delay-100">
                <h1 className="text-3xl font-bold mb-2">
                    <span className="text-solar">Dash</span>
                    <span className="text-energy">board</span>
                </h1>
            </div>

            {/* User Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Wallet Address */}
                <div className="energy-card energy-card-blockchain animate-fade-in-up delay-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <WalletIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="data-label text-xs">Wallet Address</p>
                            <p className="text-sm font-mono text-blue-400">
                                {shortenAddress(userData.user_id)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Role */}
                <div className="energy-card energy-card-solar animate-fade-in-up delay-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="data-label text-xs">Role</p>
                            <p className="text-sm font-semibold text-solar">
                                Seller / Buyer
                            </p>
                        </div>
                    </div>
                </div>

                {/* Token Balance */}
                <div className="energy-card animate-fade-in-up delay-300">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <CubeIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="data-label text-xs">Token Balance</p>
                            <p className="data-value text-lg data-value-energy">
                                {userData.token_balance}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Energy Balance */}
                <div className="energy-card animate-fade-in-up delay-400 animate-pulse-subtle">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                            <BoltIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="data-label text-xs">Energy Balance</p>
                            <p className="data-value text-lg data-value-solar">
                                {userData.energy_balance} kWh
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Sold */}
                <div className="energy-card energy-card-solar animate-fade-in-up delay-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="data-label">Total Energy Sold (30d)</p>
                            <p className="data-value data-value-solar">{totalSold.toFixed(1)} kWh</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">
                        Avg: {(totalSold / 30).toFixed(1)} kWh/day
                    </p>
                </div>

                {/* Total Bought */}
                <div className="energy-card energy-card-blockchain animate-fade-in-up delay-600">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="data-label">Total Energy Bought (30d)</p>
                            <p className="data-value text-blue-400">{totalBought.toFixed(1)} kWh</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <ArrowTrendingDownIcon className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">
                        Avg: {(totalBought / 30).toFixed(1)} kWh/day
                    </p>
                </div>

                {/* Net Balance */}
                <div className="energy-card animate-fade-in-up delay-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="data-label">Net Energy (30d)</p>
                            <p className={`data-value ${totalSold > totalBought ? 'text-energy' : 'text-blue-400'}`}>
                                {(totalSold - totalBought).toFixed(1)} kWh
                            </p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${totalSold > totalBought ? 'bg-green-500/20' : 'bg-blue-500/20'
                            }`}>
                            <BoltIcon className={`w-6 h-6 ${totalSold > totalBought ? 'text-green-500' : 'text-blue-500'}`} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-400">
                        {totalSold > totalBought ? 'Net Seller' : 'Net Buyer'}
                    </p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Energy Sold Chart */}
                <div className="energy-card energy-card-solar animate-fade-in-up delay-800">
                    <h3 className="chart-title flex items-center gap-2">
                        <ArrowTrendingUpIcon className="w-5 h-5 text-solar" />
                        Energy Sold (Last 30 Days)
                    </h3>
                    <div className="chart-container">
                        <LineChart
                            data={energySoldData}
                            color="#10b981"
                            label="kWh Sold"
                            height={250}
                        />
                    </div>
                </div>

                {/* Energy Bought Chart */}
                <div className="energy-card energy-card-blockchain animate-fade-in-up delay-900">
                    <h3 className="chart-title flex items-center gap-2">
                        <ArrowTrendingDownIcon className="w-5 h-5 text-blue-400" />
                        Energy Bought (Last 30 Days)
                    </h3>
                    <div className="chart-container">
                        <LineChart
                            data={energyBoughtData}
                            color="#3b82f6"
                            label="kWh Bought"
                            height={250}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="energy-card animate-fade-in-up delay-1000">
                <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {[
                        { type: 'sell', amount: '45 kWh', tokens: '135', time: '2 hours ago', status: 'completed' },
                        { type: 'buy', amount: '30 kWh', tokens: '90', time: '5 hours ago', status: 'completed' },
                        { type: 'sell', amount: '60 kWh', tokens: '180', time: '1 day ago', status: 'completed' },
                    ].map((activity, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-4 bg-energy-subtle rounded-lg border border-energy"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.type === 'sell' ? 'bg-green-500/20' : 'bg-blue-500/20'
                                    }`}>
                                    {activity.type === 'sell' ? (
                                        <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <ArrowTrendingDownIcon className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {activity.type === 'sell' ? 'Sold' : 'Bought'} {activity.amount}
                                    </p>
                                    <p className="text-sm text-gray-400">{activity.time}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-solar">{activity.tokens} Tokens</p>
                                <span className="status-badge status-completed text-xs">
                                    {activity.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <NavigationBar active="Dashboard" />
        </div>
    );
}
