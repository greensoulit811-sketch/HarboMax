
-- Add new order statuses
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'processing' AFTER 'confirmed';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'shipped' AFTER 'processing';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'returned' AFTER 'delivered';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'refunded' AFTER 'returned';

-- Allow admins to delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
