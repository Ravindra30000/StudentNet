"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createService(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "Web Development").trim();
  const price_inr = Number(formData.get("price_inr") ?? 0);
  const delivery_days = Number(formData.get("delivery_days") ?? 1);
  const delivery_label = String(formData.get("delivery_label") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "offered").trim() as 'offered' | 'sought';

  if (!title) {
    redirect("/dashboard/services/new?error=Title is required");
  }
  if (price_inr <= 0) {
    redirect("/dashboard/services/new?error=Price must be greater than 0");
  }
  if (delivery_days <= 0) {
    redirect("/dashboard/services/new?error=Delivery days must be greater than 0");
  }
  if (type !== "offered" && type !== "sought") {
    redirect("/dashboard/services/new?error=Invalid service type");
  }

  const { error } = await supabase.from("services").insert({
    owner_id: user.id,
    title,
    description,
    category,
    price_inr,
    delivery_days,
    delivery_label,
    is_active: true,
    type,
  });

  if (error) {
    redirect(`/dashboard/services/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=Service created successfully!");
}

export async function updateService(formData: FormData) {
  const { supabase, user } = await requireUser();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "Web Development").trim();
  const price_inr = Number(formData.get("price_inr") ?? 0);
  const delivery_days = Number(formData.get("delivery_days") ?? 1);
  const delivery_label = String(formData.get("delivery_label") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "offered").trim() as 'offered' | 'sought';

  if (!id) {
    redirect("/dashboard/services?error=Service ID is missing");
  }
  if (!title) {
    redirect(`/dashboard/services/${id}/edit?error=Title is required`);
  }
  if (price_inr <= 0) {
    redirect(`/dashboard/services/${id}/edit?error=Price must be greater than 0`);
  }
  if (delivery_days <= 0) {
    redirect(`/dashboard/services/${id}/edit?error=Delivery days must be greater than 0`);
  }
  if (type !== "offered" && type !== "sought") {
    redirect(`/dashboard/services/${id}/edit?error=Invalid service type`);
  }

  const { error } = await supabase
    .from("services")
    .update({
      title,
      description,
      category,
      price_inr,
      delivery_days,
      delivery_label,
      type,
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/dashboard/services/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?success=Service updated successfully!");
}

export async function toggleServiceActive(serviceId: string, currentActive: boolean) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("services")
    .update({ is_active: !currentActive })
    .eq("id", serviceId)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Error toggling service active:", error);
    throw new Error("Failed to update service status");
  }

  revalidatePath("/dashboard/services");
}

export async function deleteService(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    console.error("Error deleting service:", error);
    throw new Error("Failed to delete service");
  }

  revalidatePath("/dashboard/services");
}

// ✅ SECURITY FIX: fetch authoritative price and seller from DB — never trust caller-supplied values
export async function createOrder(serviceId: string) {
  const { supabase, user } = await requireUser();

  // Fetch the service's authoritative price and owner from the database
  const { data: service, error: fetchError } = await supabase
    .from("services")
    .select("price_inr, owner_id, is_active, type")
    .eq("id", serviceId)
    .single();

  if (fetchError || !service) throw new Error("Service not found");
  if (!service.is_active) throw new Error("This service is not currently available");
  if (service.owner_id === user.id) throw new Error("You cannot order or apply to your own service.");

  const isSought = (service as { type?: string | null }).type === "sought";
  const buyer_id = isSought ? service.owner_id : user.id;
  const seller_id = isSought ? user.id : service.owner_id;

  const { error } = await supabase.from("orders").insert({
    service_id: serviceId,
    buyer_id,
    seller_id,
    status: "requested",
    price_inr: service.price_inr,  // from DB, not caller
  });

  if (error) {
    console.error("Error creating order:", error);
    throw new Error("Failed to place order: " + error.message);
  }

  revalidatePath("/dashboard/services");
  revalidatePath(`/services/${serviceId}`);
  redirect("/dashboard/services?tab=buyer&success=Order placed successfully!");
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const { supabase, user } = await requireUser();

  // Fetch order to verify participation
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("buyer_id, seller_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error("Order not found");
  }

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;

  if (!isBuyer && !isSeller) {
    throw new Error("Unauthorized to update this order");
  }

  // Validate state transitions
  if (newStatus === "accepted" && !isSeller) {
    throw new Error("Only the seller can accept the order");
  }
  if (newStatus === "in_progress" && !isSeller) {
    throw new Error("Only the seller can mark order in progress");
  }
  if (newStatus === "delivered" && !isSeller) {
    throw new Error("Only the seller can deliver the order");
  }
  if (newStatus === "completed" && !isBuyer) {
    throw new Error("Only the buyer can complete the order");
  }
  if (newStatus === "disputed" && !isBuyer) {
    throw new Error("Only the buyer can dispute the order");
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating order status:", updateError);
    throw new Error("Failed to update order status");
  }

  revalidatePath("/dashboard/services");
}

export async function completeOrderWithReview(
  orderId: string,
  review: {
    communication: number;
    delivery: number;
    technicalSkill: number;
    professionalism: number;
    comment: string;
  }
) {
  const { supabase, user } = await requireUser();

  // 1. Fetch order details to verify caller is the buyer
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("buyer_id, seller_id, service_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw new Error("Order not found");
  }

  if (order.buyer_id !== user.id) {
    throw new Error("Only the buyer can complete the order and leave a review");
  }

  // Calculate overall rating as the average of the 4 dimensions
  const overall = (review.communication + review.delivery + review.technicalSkill + review.professionalism) / 4;

  // 2. Insert the review
  const { error: reviewError } = await supabase.from("reviews").insert({
    order_id: orderId,
    reviewer_id: user.id,
    reviewee_id: order.seller_id,
    communication: review.communication,
    delivery: review.delivery,
    technical_skill: review.technicalSkill,
    professionalism: review.professionalism,
    overall,
    comment: review.comment.trim() || null,
  });

  if (reviewError) {
    console.error("Error creating review:", reviewError);
    throw new Error("Failed to submit review");
  }

  // 3. Update order status to completed
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating order status:", updateError);
    throw new Error("Failed to complete order");
  }

  // 4. Create in-app notification for the seller
  try {
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const buyerName = buyerProfile?.full_name || "A buyer";

    const { createNotification } = await import("@/lib/notifications");
    await createNotification(
      supabase,
      order.seller_id,
      "application", // fallback notification type
      {
        title: "New Review Received",
        message: `${buyerName} completed your order and left a ${overall.toFixed(1)}-star review!`,
        link: `/dashboard/services?tab=seller`,
      }
    );
  } catch (notifErr) {
    console.error("Error creating review notification:", notifErr);
  }

  revalidatePath("/dashboard/services");
  revalidatePath(`/services/${order.service_id}`);
}

