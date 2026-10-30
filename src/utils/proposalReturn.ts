/**
 * Hands a listing created from the propose-trade sheet back to the item screen that opened it,
 * so the proposal reopens with the new listing selected (the website does this inside its dialog).
 */
let createdId: string | null = null;

export const proposalReturn = {
  set(id: string) {
    createdId = id;
  },
  take() {
    const id = createdId;
    createdId = null;
    return id;
  },
};
