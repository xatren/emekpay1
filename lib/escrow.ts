import { supabase } from "./supabase"

export interface EscrowTransaction {
  id: string
  booking_id: string
  payer_id: string
  payee_id: string
  amount: number
  commission: number
  status: "held" | "released" | "refunded"
  created_at: string
  released_at?: string
}

export class EscrowService {
  // Create escrow hold when booking is confirmed
  static async createEscrowHold(bookingId: string, payerId: string, payeeId: string, amount: number) {
    try {
      const commission = Math.round(amount * 0.05) // 5% commission
      const netAmount = amount - commission

      // Start transaction
      const { data: escrow, error: escrowError } = await supabase
        .from("escrow_transactions")
        .insert({
          booking_id: bookingId,
          payer_id: payerId,
          payee_id: payeeId,
          amount: netAmount,
          commission: commission,
          status: "held",
        })
        .select()
        .single()

      if (escrowError) throw escrowError

      // Deduct points from payer
      const { error: deductError } = await supabase.rpc("deduct_points", {
        user_id: payerId,
        amount: amount,
      })

      if (deductError) throw deductError

      // Create transaction records
      await Promise.all([
        // Payer debit transaction
        supabase
          .from("transactions")
          .insert({
            user_id: payerId,
            type: "escrow_hold",
            amount: amount,
            description: `Payment held in escrow for booking`,
            booking_id: bookingId,
          }),

        // Update booking status
        supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "held_in_escrow",
          })
          .eq("id", bookingId),
      ])

      return escrow
    } catch (error) {
      console.error("Error creating escrow hold:", error)
      throw error
    }
  }

  // Release escrow when service is completed
  static async releaseEscrow(bookingId: string) {
    try {
      // Get escrow transaction
      const { data: escrow, error: escrowError } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "held")
        .single()

      if (escrowError || !escrow) throw new Error("Escrow transaction not found")

      // Release points to payee
      const { error: creditError } = await supabase.rpc("add_points", {
        user_id: escrow.payee_id,
        amount: escrow.amount,
      })

      if (creditError) throw creditError

      // Add commission to platform (could be tracked separately)
      // For now, we'll just record it in transactions

      // Update escrow status
      const { error: updateError } = await supabase
        .from("escrow_transactions")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
        })
        .eq("id", escrow.id)

      if (updateError) throw updateError

      // Create transaction records
      await Promise.all([
        // Payee credit transaction
        supabase
          .from("transactions")
          .insert({
            user_id: escrow.payee_id,
            type: "escrow_release",
            amount: escrow.amount,
            description: `Payment received for completed service`,
            booking_id: bookingId,
          }),

        // Platform commission transaction
        supabase
          .from("transactions")
          .insert({
            user_id: escrow.payee_id,
            type: "debit",
            amount: escrow.commission,
            description: `Platform commission (5%)`,
            booking_id: bookingId,
          }),

        // Update booking status
        supabase
          .from("bookings")
          .update({
            status: "completed",
            payment_status: "paid",
          })
          .eq("id", bookingId),
      ])

      return true
    } catch (error) {
      console.error("Error releasing escrow:", error)
      throw error
    }
  }

  // Refund escrow if booking is cancelled
  static async refundEscrow(bookingId: string) {
    try {
      // Get escrow transaction
      const { data: escrow, error: escrowError } = await supabase
        .from("escrow_transactions")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "held")
        .single()

      if (escrowError || !escrow) throw new Error("Escrow transaction not found")

      // Refund points to payer (including commission)
      const totalRefund = escrow.amount + escrow.commission
      const { error: refundError } = await supabase.rpc("add_points", {
        user_id: escrow.payer_id,
        amount: totalRefund,
      })

      if (refundError) throw refundError

      // Update escrow status
      const { error: updateError } = await supabase
        .from("escrow_transactions")
        .update({
          status: "refunded",
          released_at: new Date().toISOString(),
        })
        .eq("id", escrow.id)

      if (updateError) throw updateError

      // Create transaction records
      await Promise.all([
        // Payer refund transaction
        supabase
          .from("transactions")
          .insert({
            user_id: escrow.payer_id,
            type: "credit",
            amount: totalRefund,
            description: `Refund for cancelled booking`,
            booking_id: bookingId,
          }),

        // Update booking status
        supabase
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "refunded",
          })
          .eq("id", bookingId),
      ])

      return true
    } catch (error) {
      console.error("Error refunding escrow:", error)
      throw error
    }
  }
}
