var extport = this;
dpd.ranged.get({id: extport.rangedId}, 
  function(ranged) {
    if(ranged){
        emit("char:changed", ranged.characterId);
    }
});
