//
// Turn the get of a character into a larger get of everything
// NOTE: this defaults to just being 2 deep (i.e. this + 1 more).
//       for deeper stuff we need set $limitRecursion: 10
//       See armoursets and ranged for examples
//
var char = this;
dpd.stats.get({characterId: char.id}, 
  function(stats){
    char.stats = stats;
});

dpd.wounds.get({characterId: char.id}, 
  function(wounds){
    char.wounds = wounds;
});

dpd.skills.get({characterId: char.id}, 
  function(skills){
    char.skills = skills;
});

dpd.effects.get({characterId: char.id}, 
  function(effects){
    char.effects = effects;
});

dpd.ranged.get({characterId: char.id, $limitRecursion: 10}, 
  function(ranged){
    char.ranged = ranged;
});

dpd.melee.get({characterId: char.id}, 
  function(melees){
    char.melees = melees;
});

dpd.areaeffect.get({characterId: char.id}, 
  function(aoes){
    char.aoes = aoes;
});

dpd.equipment.get({characterId: char.id}, 
  function(equipments){
    char.equipments = equipments;
});

dpd.armourset.get({characterId: char.id, $limitRecursion: 10}, 
  function(armoursets){
    char.armoursets = armoursets;
});

dpd.magicitems.get({characterId: char.id}, 
  function(magicitems){
    char.magicitems = magicitems;
});

dpd.accounts.get({characterId: char.id}, 
  function(accounts){
    char.accounts = accounts;
});
