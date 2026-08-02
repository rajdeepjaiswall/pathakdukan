import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ShoppingCart, PartyPopper, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCharges } from "@/hooks/use-charges";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";

export function AddToCartPopup() {
  const { summary, lastAddedItem, clearLastAddedItem } = useCart();
  const { charges } = useCharges();
  const [show, setShow] = useState(false);
  const [prevSubtotal, setPrevSubtotal] = useState(0);

  const currentTotal = Number(summary.total);
  // The free-delivery progress is driven ONLY by the delivery free-threshold and the
  // cart SUBTOTAL — handling charges never affect it.
  const showFreeDeliveryBar =
    !!charges?.deliveryEnabled &&
    !!charges?.deliveryFreeThresholdEnabled &&
    (charges?.deliveryFreeThreshold ?? 0) > 0;
  const threshold = charges?.deliveryFreeThreshold ?? 0;
  const subtotal = Number(summary.subtotal);
  const diff = threshold - subtotal;
  const isFreeDelivery = subtotal >= threshold;

  useEffect(() => {
    if (lastAddedItem) {
      setShow(true);

      // Party popper when the subtotal crosses the free-delivery threshold
      if (showFreeDeliveryBar && subtotal >= threshold && prevSubtotal < threshold) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#eab308", "#ef4444"],
        });

        // Haptic feedback if supported
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }

      setPrevSubtotal(subtotal);
    }
  }, [lastAddedItem, subtotal, prevSubtotal, showFreeDeliveryBar, threshold]);

  const handleClose = () => {
    setShow(false);
    clearLastAddedItem?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-8 md:w-96"
          data-cart-popup-active="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-almond p-4 flex flex-col gap-3 relative">
            <button 
              onClick={handleClose}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors z-[60]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              {lastAddedItem?.image && (
                <img
                  src={lastAddedItem.image}
                  alt={lastAddedItem.name}
                  className="w-12 h-12 rounded-lg object-cover border border-almond"
                />
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold text-navy/60 uppercase tracking-tighter">Added to Cart</p>
                <p className="text-sm font-bold text-navy truncate">{lastAddedItem?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-navy/60 uppercase">Cart Total</p>
                <p className="text-sm font-black text-navy">₹{currentTotal.toFixed(2)}</p>
              </div>
            </div>

            {showFreeDeliveryBar && (
              <div className="h-1 w-full bg-almond/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((subtotal / threshold) * 100, 100)}%` }}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium text-navy/80">
                {showFreeDeliveryBar ? (
                  isFreeDelivery ? (
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      <PartyPopper className="w-3 h-3" /> Free Delivery Unlocked!
                    </span>
                  ) : (
                    <span>Add <span className="font-bold text-amber-600">₹{diff.toFixed(0)}</span> more for Free Delivery</span>
                  )
                ) : null}
              </div>
              <Link href="/cart">
                <Button
                  size="sm"
                  className={`font-bold h-8 px-4 rounded-full transition-colors ${
                    showFreeDeliveryBar && isFreeDelivery ? "bg-green-600 hover:bg-green-700" : "bg-navy hover:bg-navy/90"
                  }`}
                >
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
