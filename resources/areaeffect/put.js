var data = {
    id: this.id,
    loadout: this.loadout
};
emit('aoe:updated', data);