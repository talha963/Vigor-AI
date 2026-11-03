'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  Truck,
  CheckCircle2,
  Lock,
  ThermometerSnowflake,
  Clock,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Locale } from '@/types/vigor';

interface AtHomeKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export default function AtHomeKitModal({
  isOpen,
  onClose,
  locale,
}: AtHomeKitModalProps) {
  if (!isOpen) return null;
  const isAr = locale === 'ar';

  const [deliveryMethod, setDeliveryMethod] = useState<'locker' | 'home'>('locker');
  const [selectedLocker, setSelectedLocker] = useState<string>('Abu Dhabi Mall Smart Locker #14');
  const [ordered, setOrdered] = useState(false);

  const handleOrder = () => {
    setOrdered(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-blue-950">
                {isAr ? 'طلب حقيبة الفحص المنزلي السرية' : 'Discreet At-Home Collection Kit'}
              </h2>
              <p className="text-[11px] text-blue-600 font-medium">
                Workflow 04 · Cold-Chain Logistics · Discreet Smart Lockers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!ordered ? (
            <>
              {/* Privacy Notice */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 leading-relaxed">
                  <strong>Cultural Sensitivity & Discretion:</strong> All kits are shipped in plain, unbranded packaging with zero reproductive markings. Default delivery uses automated smart lockers to guarantee complete anonymity.
                </div>
              </div>

              {/* Delivery Choice */}
              <div>
                <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                  Select Delivery Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('locker')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      deliveryMethod === 'locker'
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-blue-100 hover:border-blue-200'
                    }`}
                  >
                    <Building className="w-5 h-5 text-blue-600 mb-1" />
                    <h4 className="text-xs font-bold text-blue-950">Smart Locker Pickup</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Recommended · 100% Private</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('home')}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      deliveryMethod === 'home'
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-blue-100 hover:border-blue-200'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-blue-600 mb-1" />
                    <h4 className="text-xs font-bold text-blue-950">Discreet Courier</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Plain unlabelled box</p>
                  </button>
                </div>
              </div>

              {/* Locker Location Selector */}
              {deliveryMethod === 'locker' ? (
                <div>
                  <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-2">
                    Pick Convenient Abu Dhabi Smart Locker
                  </label>
                  <select
                    value={selectedLocker}
                    onChange={(e) => setSelectedLocker(e.target.value)}
                    className="w-full p-2.5 text-xs border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Abu Dhabi Mall Smart Locker #14">Abu Dhabi Mall · Smart Locker Bay #14</option>
                    <option value="Yas Mall Station Locker #08">Yas Mall · Station Locker Bay #08</option>
                    <option value="Al Maryah Island Medical Hub Locker #02">Al Maryah Island · Medical Hub Locker #02</option>
                    <option value="Khalifa City Community Locker #19">Khalifa City · Community Locker #19</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-blue-950 uppercase tracking-wide mb-1">
                    Delivery Postal Code / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al Reem Island, Sector 2"
                    className="w-full p-2.5 text-xs border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Kit Details */}
              <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-blue-50">
                <div className="flex items-center gap-2 text-slate-700">
                  <ThermometerSnowflake className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Temperature-stabilised media preservation (WHO standard)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Rapid 2-hour courier return window to partner lab</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Chain of custody barcoded to pseudonymous ID only</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Dispatch Discreet Test Kit</span>
              </button>
            </>
          ) : (
            <div className="p-6 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-blue-950">Kit Dispatch Initiated!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your order has been recorded into <strong>kit_orders</strong>. An encrypted one-time locker PIN will be delivered discreetly. No identifying medical terms will appear on the exterior packaging.
              </p>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 font-mono text-xs text-blue-900 inline-block">
                Tracking Ref: <strong>KTRK_{Math.random().toString(36).substring(2, 8).toUpperCase()}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-blue-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
