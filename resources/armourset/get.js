var armourset = this;
dpd.armourpiece.get({armoursetId: armourset.id}, 
  function(pieces) {
    armourset.pieces = pieces;
});
