"use client";

import { useTransition, useState, useEffect } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { updateOrderStatus, completeOrderWithReview } from "@/app/dashboard/services/actions";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface OrderRowProps {
  order: Order & {
    services?: { title: string; category: string } | null;
    buyer?: { full_name: string; username: string } | null;
    seller?: { full_name: string; username: string } | null;
  };
  role: "seller" | "buyer";
}

export default function OrderRow({ order, role }: OrderRowProps) {
  const [isPending, startTransition] = useTransition();
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Lock body scroll when review modal is open
  useEffect(() => {
    if (showReviewModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showReviewModal]);
  const [communication, setCommunication] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const [technicalSkill, setTechnicalSkill] = useState(5);
  const [professionalism, setProfessionalism] = useState(5);
  const [comment, setComment] = useState("");

  const handleReviewSubmit = () => {
    startTransition(async () => {
      try {
        await completeOrderWithReview(order.id, {
          communication,
          delivery,
          technicalSkill,
          professionalism,
          comment,
        });
        toast.success("Review submitted! Order completed successfully.");
        setShowReviewModal(false);
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "Failed to submit review.");
      }
    });
  };

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    if (newStatus === "cancelled" && !confirm("Are you sure you want to cancel this order?")) {
      return;
    }
    startTransition(async () => {
      try {
        await updateOrderStatus(order.id, newStatus);
        
        const statusLabels: Record<OrderStatus, string> = {
          requested: "Order requested",
          accepted: "Order accepted successfully!",
          in_progress: "Order marked as in progress.",
          delivered: "Work delivered successfully! Waiting for review.",
          completed: "Order completed successfully!",
          cancelled: "Order cancelled successfully.",
          disputed: "Order dispute filed.",
        };
        toast.success(statusLabels[newStatus] || "Order updated successfully.");
      } catch (err: unknown) {
        const error = err as Error;
        toast.error(error.message || "Failed to update order status.");
      }
    });
  };

  const statusColors: Record<OrderStatus, string> = {
    requested: "bg-surface-sunken text-muted",
    accepted: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    delivered: "bg-accent-green text-white",
    completed: "bg-success/15 text-success font-semibold",
    cancelled: "bg-red-100 text-red-800",
    disputed: "bg-orange-100 text-orange-800",
  };

  const getStatusLabel = (status: OrderStatus) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format date
  const dateStr = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  const partnerName = role === "seller" ? order.buyer?.full_name : order.seller?.full_name;
  const partnerUsername = role === "seller" ? order.buyer?.username : order.seller?.username;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 bg-surface-container-lowest rounded-xl border border-border/40 hover:shadow-sm transition-all duration-200 gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-green to-accent-gold/40 shrink-0 opacity-80 flex items-center justify-center text-white font-bold text-sm">
          {order.services?.category?.substring(0, 2).toUpperCase() || "FL"}
        </div>
        <div>
          <h5 className="font-heading text-base font-bold text-ink hover:underline">
            <Link href={role === "seller" ? `/dashboard/services` : `/services/${order.service_id}`}>
              {order.services?.title || "Freelance Service"}
            </Link>
          </h5>
          <p className="font-sans text-xs text-muted mt-0.5">
            {role === "seller" ? "Buyer: " : "Seller: "}
            <Link href={`/u/${partnerUsername}`} className="font-medium text-ink hover:underline">
              {partnerName || "User"}
            </Link>
            {" • "}
            Ordered on {dateStr}
            {" • "}
            <span className="font-bold text-ink">₹{order.price_inr.toLocaleString()}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Badge */}
        <span className={`font-label-sm text-xs px-3 py-1 rounded-full whitespace-nowrap ${statusColors[order.status] || "bg-surface-sunken text-muted"}`}>
          {getStatusLabel(order.status)}
        </span>

        {/* Action Buttons based on status and role */}
        <div className="flex items-center gap-2">
          {role === "seller" && order.status === "requested" && (
            <>
              <button
                disabled={isPending}
                onClick={() => handleStatusUpdate("accepted")}
                className="bg-accent-green text-white hover:opacity-90 transition-opacity font-semibold text-xs px-4 py-2 rounded-full disabled:opacity-50 cursor-pointer"
              >
                Accept
              </button>
              <button
                disabled={isPending}
                onClick={() => handleStatusUpdate("cancelled")}
                className="bg-surface border border-border text-danger hover:bg-red-50 transition-colors font-semibold text-xs px-4 py-2 rounded-full disabled:opacity-50 cursor-pointer"
              >
                Decline
              </button>
            </>
          )}

          {role === "seller" && order.status === "accepted" && (
            <button
              disabled={isPending}
              onClick={() => handleStatusUpdate("in_progress")}
              className="bg-ink text-white hover:opacity-90 transition-opacity font-semibold text-xs px-4 py-2 rounded-full flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              Start Work <ArrowRight size={12} />
            </button>
          )}

          {role === "seller" && order.status === "in_progress" && (
            <button
              disabled={isPending}
              onClick={() => handleStatusUpdate("delivered")}
              className="bg-accent-gold text-accent-gold-foreground hover:opacity-90 transition-opacity font-bold text-xs px-4 py-2 rounded-full disabled:opacity-50 cursor-pointer"
            >
              Deliver Work
            </button>
          )}

          {role === "buyer" && order.status === "requested" && (
            <button
              disabled={isPending}
              onClick={() => handleStatusUpdate("cancelled")}
              className="bg-surface border border-border text-danger hover:bg-red-50 transition-colors font-semibold text-xs px-4 py-2 rounded-full disabled:opacity-50 cursor-pointer"
            >
              Cancel Request
            </button>
          )}

          {role === "buyer" && order.status === "delivered" && (
            <>
              <button
                disabled={isPending}
                onClick={() => setShowReviewModal(true)}
                className="bg-success text-white hover:opacity-90 transition-opacity font-semibold text-xs px-4 py-2 rounded-full flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                Accept & Complete <CheckCircle size={12} />
              </button>
              <button
                disabled={isPending}
                onClick={() => handleStatusUpdate("disputed")}
                className="bg-surface border border-border text-danger hover:bg-red-50 transition-colors font-semibold text-xs px-4 py-2 rounded-full disabled:opacity-50 cursor-pointer"
              >
                Dispute
              </button>
            </>
          )}

          {order.status === "completed" && (
            <div className="flex items-center gap-1 text-success font-semibold text-xs px-3 py-1">
              <CheckCircle size={14} className="text-success" />
              <span>Closed</span>
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="flex items-center gap-1 text-muted text-xs px-3 py-1">
              <XCircle size={14} className="text-muted" />
              <span>Cancelled</span>
            </div>
          )}

          {order.status === "disputed" && (
            <div className="flex items-center gap-1 text-danger text-xs px-3 py-1 font-semibold">
              <AlertTriangle size={14} className="text-danger" />
              <span>Disputed</span>
            </div>
          )}
        </div>
      </div>

      {/* Review & Rating Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-[28px] border border-border/40 p-6 md:p-8 shadow-card flex flex-col gap-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-heading text-xl font-bold text-ink">Rate Freelancer</h3>
              <p className="text-xs text-muted mt-1">
                Please rate your experience with {partnerName || "the seller"} before completing the order.
              </p>
            </div>

            <div className="space-y-4">
              {/* Star Rating Inputs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink uppercase tracking-wider">Communication</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCommunication(star)}
                      className="focus:outline-none transition-transform active:scale-95"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= communication
                            ? "text-accent-gold fill-accent-gold"
                            : "text-border fill-transparent hover:text-accent-gold/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink uppercase tracking-wider">Delivery Time</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDelivery(star)}
                      className="focus:outline-none transition-transform active:scale-95"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= delivery
                            ? "text-accent-gold fill-accent-gold"
                            : "text-border fill-transparent hover:text-accent-gold/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink uppercase tracking-wider">Technical Skill</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setTechnicalSkill(star)}
                      className="focus:outline-none transition-transform active:scale-95"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= technicalSkill
                            ? "text-accent-gold fill-accent-gold"
                            : "text-border fill-transparent hover:text-accent-gold/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink uppercase tracking-wider">Professionalism</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setProfessionalism(star)}
                      className="focus:outline-none transition-transform active:scale-95"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= professionalism
                            ? "text-accent-gold fill-accent-gold"
                            : "text-border fill-transparent hover:text-accent-gold/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Comment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-ink uppercase tracking-wider">Comment (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this student..."
                  className="w-full min-h-[70px] rounded-xl border border-border/50 p-3 text-xs font-sans focus:outline-none focus:border-accent-green bg-surface-sunken"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-border text-xs font-semibold rounded-full hover:bg-surface-sunken transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleReviewSubmit}
                className="px-5 py-2 bg-success text-white text-xs font-semibold rounded-full hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Submitting..." : "Submit Review & Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
