import { addTicketComment } from "../zendesk/client";
import { getContactById, trackEvent, type BirdEvent } from "../bird/client";

// Every "customer did X" beat in docs/user-stories.md runs through here:
// track it as a Bird contact event (the source of truth -- see
// docs/architecture.md) and mirror it to the customer's active ticket as a
// comment (what the agent actually reads).
export async function logInteraction(customerId: string, type: string, detail: string): Promise<BirdEvent> {
  const event = await trackEvent({ contactId: customerId, eventName: type, properties: { detail } });

  const customer = await getContactById(customerId);
  if (customer?.activeTicketId) {
    await addTicketComment(customer.activeTicketId, detail);
  }

  return (
    event ?? {
      id: crypto.randomUUID(),
      contactId: customerId,
      eventName: type,
      properties: { detail },
      createdAt: new Date().toISOString(),
    }
  );
}
