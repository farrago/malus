var weapon = this;
dpd.extports.get({rangedId: weapon.id}, 
  function(ports) {
    weapon.extports = ports;
});

dpd.ammos.get({rangedId: weapon.id}, 
  function(ammos) {
    weapon.ammos = ammos;
});

