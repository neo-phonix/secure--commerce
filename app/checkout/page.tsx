'use client';

import { useState } from 'react';
import { useCart } from '@/context/cart-context';
import { ShieldCheck, Lock, CreditCard, Truck, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Script from 'next/script';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';

export default function CheckoutPage() {
  const { items: cart, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'India'
  });

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      // 1. Create order on server
      const res = await fetch('/api/checkout/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ id: item.productId, quantity: item.quantity })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const { orderId, amount, currency } = await res.json();

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'SecureCommerce',
        description: 'Premium Hardware Purchase',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment and create final order
            const verifyRes = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: cart.map(item => ({ id: item.productId, quantity: item.quantity })),
                shippingAddress: {
                  fullName: `${formData.firstName} ${formData.lastName}`,
                  address: formData.address,
                  city: formData.city,
                  postalCode: formData.zipCode,
                  country: formData.country,
                },
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const error = await verifyRes.json();
              throw new Error(error.error || 'Payment verification failed');
            }

            setStep(3);
            clearCart();
            toast.success('Order placed successfully!');
          } catch (err: any) {
            toast.error(err.message || 'Something went wrong');
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
        },
        theme: {
          color: '#6366F1',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to initiate checkout');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <h1 className="text-4xl font-display font-bold mb-4 dark:text-white">Your cart is empty</h1>
          <Link href="/products" className="text-primary font-bold uppercase tracking-widest text-sm">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white">Checkout</span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${step >= 1 ? 'border-primary bg-primary/10' : 'border-slate-200'}`}>1</div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Shipping</span>
          </div>
          <div className="w-12 h-px bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${step >= 2 ? 'border-primary bg-primary/10' : 'border-slate-200'}`}>2</div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Payment</span>
          </div>
          <div className="w-12 h-px bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${step >= 3 ? 'border-primary bg-primary/10' : 'border-slate-200'}`}>3</div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Success</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2">
                <div className="glass p-8 rounded-[40px] shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800">
                  <h2 className="text-2xl font-display font-bold mb-8 dark:text-white">Shipping Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Street Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">City</label>
                      <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Zip Code</label>
                      <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full mt-12 py-5 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30"
                  >
                    Continue to Payment
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-1">
                <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} cart={cart} />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2">
                <div className="glass p-8 rounded-[40px] shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800">
                  <h2 className="text-2xl font-display font-bold mb-8 dark:text-white">Payment Method</h2>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-primary/5 border-2 border-primary rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold dark:text-white">Credit / Debit Card</p>
                          <p className="text-xs text-slate-500">Securely processed by Razorpay</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-4 border-primary bg-white" />
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl flex items-center justify-between opacity-50 cursor-not-allowed">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                          <Image src="https://picsum.photos/seed/paypal/100/100" alt="PayPal" width={24} height={24} className="grayscale" />
                        </div>
                        <div>
                          <p className="font-bold dark:text-white">PayPal</p>
                          <p className="text-xs text-slate-500">Coming soon</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-4 text-accent">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">Secure Transaction</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Your payment information is encrypted with military-grade AES-256 protocols. We never store your card details on our servers.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-12">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="flex-[2] py-5 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Spinner size={16} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Complete Purchase
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} cart={cart} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center py-12"
            >
              <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-accent" />
              </div>
              <h2 className="text-4xl font-display font-bold mb-4 dark:text-white">Order Confirmed!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-12">
                Thank you for your purchase. Your order #SEC-82910 has been placed and is being processed. We&apos;ve sent a confirmation email to {formData.email}.
              </p>
              
              <div className="glass p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 mb-12 text-left">
                <h3 className="text-lg font-bold mb-6 dark:text-white">Order Details</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Shipping to</span>
                    <span className="font-bold dark:text-white">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Address</span>
                    <span className="font-bold dark:text-white">{formData.address}, {formData.city}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Total Paid</span>
                    <span className="text-xl font-display font-bold text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <Link 
                href="/products"
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
              >
                Continue Shopping
                <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrderSummary({ subtotal, shipping, tax, total, cart }: any) {
  return (
    <div className="glass p-8 rounded-[40px] shadow-2xl shadow-black/5 border border-slate-100 dark:border-slate-800">
      <h2 className="text-xl font-display font-bold mb-8 dark:text-white">Order Summary</h2>
      
      <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {cart.map((item: any) => (
          <div key={item.id} className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={item.image_url} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-grow">
              <p className="text-xs font-bold dark:text-white line-clamp-1">{item.name}</p>
              <p className="text-[10px] text-slate-500">Qty: {item.quantity}</p>
            </div>
            <p className="text-xs font-bold text-primary">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-bold dark:text-white">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Shipping</span>
          <span className="font-bold text-accent">{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Tax (GST 18%)</span>
          <span className="font-bold dark:text-white">{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-display font-bold text-primary pt-2">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
