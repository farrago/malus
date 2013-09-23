var armourset = this;
dpd.armourpiece.get({armoursetId: armourset.id}, 
  function(pieces) {
      if (pieces && pieces.length) {
        armourset.pieces = pieces;
      }
});
