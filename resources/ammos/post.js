var ammo = this;
dpd.ranged.get({id: ammo.rangedId}, 
  function(ranged) {
    if(ranged){
        emit("char:changed", ranged.characterId);
    }
});