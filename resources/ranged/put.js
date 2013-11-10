emit('char:changed', this.characterId);
if (changed('characterId')) {
    emit('char:changed', previous.characterId);
}