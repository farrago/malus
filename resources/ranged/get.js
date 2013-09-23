var weapon = this;
dpd.extports.get({rangedId: weapon.id}, 
  function(ports) {
      if(ports && ports.length) {
          weapon.extports = ports;
      }
});

dpd.ammos.get({rangedId: weapon.id}, 
  function(ammos) {
      if(ammos && ammos.length){
            weapon.ammos = ammos;
      }
});

