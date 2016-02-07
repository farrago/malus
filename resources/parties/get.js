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
    dpd.characters.get({id: {$in: party.contacts}, $fields: {name:1,career:1,notes:1}}, 
      function(chars){
        party.contact_chars = chars;
    });
    dpd.notes.get({partyId: party.id},
      function(notes){
      party.notes = notes;
    });
}
