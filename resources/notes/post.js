if (!me) {
  cancel("You must be logged in", 401);
}

this.userId = me.id;
this.userName = me.username;
this.date = new Date().getTime();

emit('party:new-note', this);
