var armourset = this;
dpd.armourpiece.del({armoursetId: armourset.id}, 
  function(result, error) {
    // Don't care
});
emit('char:changed', this.characterId);
