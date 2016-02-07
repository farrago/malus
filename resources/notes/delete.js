if (!me) {
  cancel("You must be logged in", 401);
}

emit('party:changed', this.partyId);