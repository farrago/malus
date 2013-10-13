if (query.id) {
    var party = this;
    dpd.characters.get({id: {$in: party.pcs}, $limitRecursion: 10}, 
      function(chars){
        party.pc_chars = chars;
    });
    dpd.characters.get({id: {$in: party.npcs}, $limitRecursion: 10}, 
      function(chars){
        party.npc_chars = chars;
    });
}
