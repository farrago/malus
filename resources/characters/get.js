//
// Turn the get of a character into a larger get of everything
// NOTE: this defaults to just being 2 deep (i.e. this + 1 more).
//       for deeper stuff we need set $limitRecursion: 10
//       See armoursets and ranged for examples
//
var char = this;

var tryBuildTempStats = function() {
    if (
        char.hasOwnProperty('stats') &&
        char.hasOwnProperty('wounds') &&
        char.hasOwnProperty('effects')
        ) {
        //
        // Build an array of all the current values
        //
        var stats = ['iq', 'aw', 'mt', 'ps', 'a', 'e', 's', 'r', 'as', 'ai', 'dx', 'sp'];
        tmpStats = {};
        var suffix = 'Up';
    
        //
        // Get the "upgraded" values for all stats
        //
        for(var i = 0, l = stats.length; i < l; ++i) {
            var value = stats[i];
            var tmpName = value + suffix;
            tmpStats[value] = char.stats[tmpName];
        }
    
        //
        // Iterate through the effects, applying them if possible
        //
        for(var i = 0, l = char.effects.length; i < l; ++i) {
            var value = char.effects[i];
            var statLowercase = value.stat.toLowerCase();
            var effectNumber = Number(value.effect);
            if (tmpStats.hasOwnProperty(statLowercase) && !isNaN(effectNumber)) {
                tmpStats[statLowercase] += effectNumber;
            }
        }
    
        //
        // Now handle wounds, applying them to Endurance
        //
        for(var i = 0, l = char.wounds.length; i < l; ++i) {
            if ( !isNaN(char.wounds[i].damage) ) {
                tmpStats['e'] -= char.wounds[i].damage
            }
        }
    
        //
        // Finally, iterate through all the temp values, and if they
        // haven't changed then set then back to ""
        //
        for(var i = 0, l = stats.length; i < l; ++i) {
            var value = stats[i];
            var tmpName = value + suffix;
            if (tmpStats[value] == char.stats[tmpName]) {
                tmpStats[value] = "";
            }
        }
        char.tmpStats = tmpStats;
    }
};

dpd.stats.get({characterId: char.id}, 
  function(stats){
    char.stats = stats[0];
    tryBuildTempStats();
});

dpd.wounds.get({characterId: char.id}, 
  function(wounds){
    char.wounds = wounds;
    tryBuildTempStats();
});

dpd.skills.get({characterId: char.id}, 
  function(skills){
    char.skills = skills;
});

dpd.effects.get({characterId: char.id}, 
  function(effects){
    char.effects = effects;
    tryBuildTempStats();
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

