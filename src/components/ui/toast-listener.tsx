"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

function ToastListenerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const info = searchParams.get("info");

    if (success) {
      toast.success(decodeURIComponent(success));
    } else if (error) {
      toast.error(decodeURIComponent(error));
    } else if (info) {
      toast.info(decodeURIComponent(info));
    }

    if (success || error || info) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("success");
      params.delete("error");
      params.delete("info");
      const cleanSearch = params.toString();
      const newUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : "");
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}

export default function ToastListener() {
  return (
    <Suspense fallback={null}>
      <ToastListenerContent />
    </Suspense>
  );
}
