import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "buyer",
        walletAddress: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Generate mock wallet address
    const generateWalletAddress = () => {
        const chars = "0123456789abcdef";
        let address = "0x";
        for (let i = 0; i < 40; i++) {
            address += chars[Math.floor(Math.random() * chars.length)];
        }
        setFormData({ ...formData, walletAddress: address });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill all required fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5001/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    wallet_address: formData.walletAddress,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Registration successful - redirect to login
                navigate("/login");
            } else {
                setError(data.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError("Cannot reach server. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold mb-3">
                        <span className="text-solar">Gridchain</span>{" "}
                        <span className="text-energy">P2P</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Join the Energy Trading Network
                    </p>
                </div>

                {/* Registration Card */}
                <div className="energy-card energy-card-solar space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                        <p className="text-gray-400">Register to start trading energy</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="data-label">Full Name *</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                className="input-energy"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="data-label">Email Address *</label>
                            <input
                                type="email"
                                placeholder="your.email@example.com"
                                className="input-energy"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="data-label">Password *</label>
                            <input
                                type="password"
                                placeholder="Minimum 6 characters"
                                className="input-energy"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="data-label">Confirm Password *</label>
                            <input
                                type="password"
                                placeholder="Re-enter password"
                                className="input-energy"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                disabled={loading}
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <label className="data-label">Role *</label>
                            <select
                                className="input-energy"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                disabled={loading}
                            >
                                <option value="buyer">Buyer (Purchase Energy)</option>
                                <option value="seller">Seller (Sell Energy)</option>
                                <option value="both">Both (Buy & Sell)</option>
                            </select>
                        </div>

                        {/* Wallet Address */}
                        <div className="space-y-2">
                            <label className="data-label">Wallet Address (Optional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="0x..."
                                    className="input-energy flex-1 font-mono text-sm"
                                    value={formData.walletAddress}
                                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={generateWalletAddress}
                                    className="btn-solar px-4"
                                    disabled={loading}
                                >
                                    Generate
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">
                                Leave empty to generate automatically
                            </p>
                        </div>

                        {/* Register Button */}
                        <button
                            type="submit"
                            className={`btn-energy w-full ${loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#1e293b] text-gray-500">Already have an account?</span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <a
                            href="/login"
                            className="inline-block text-energy hover:text-solar transition-colors font-semibold"
                        >
                            Sign In →
                        </a>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        Secured by blockchain technology
                    </p>
                </div>
            </div>
        </div>
    );
}
