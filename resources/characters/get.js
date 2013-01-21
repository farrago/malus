dpd.log.post({text:"Characters query"});
if (!(me && me.id === this.creatorId)) {
  cancel("This is not your character", 401);
}