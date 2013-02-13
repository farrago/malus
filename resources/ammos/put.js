var data = {
    id: this.id,
    loadout: this.loadout
};
emit('ammo:updated', data);