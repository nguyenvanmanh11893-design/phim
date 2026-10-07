// The database is the durable queue: paid confirmed bookings without tickets.
// Multiple Railway instances may run this worker; booking locks prevent duplicate tickets.
export function startTicketRecovery(ticketRepository, issueTicketHandler, intervalMs = 30000) {
  let running = false;
  let afterId = 0;
  const recover = async () => {
    if (running) return;
    running = true;
    try {
      const pending = await ticketRepository.findMissingPaidTickets(afterId);
      for (const booking of pending) {
        try {
          await issueTicketHandler.execute({ bookingId: Number(booking.id), userId: Number(booking.user_id) });
        } catch (error) { console.error("[Ticket recovery]", error.message); }
      }
      // Advance past repeatedly failing records so they cannot starve later bookings.
      afterId = pending.length === 25 ? Number(pending[pending.length - 1].id) : 0;
    } catch (error) { console.error("[Ticket recovery]", error.message); }
    finally { running = false; }
  };
  void recover();
  const timer = setInterval(() => void recover(), intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

