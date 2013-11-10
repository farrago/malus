var piece = this;
dpd.armourset.get({id: piece.armoursetId}, 
  function(armourset) {
    if(armourset){
        emit("char:changed", armourset.characterId);
    }
});