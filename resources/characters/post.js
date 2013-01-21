// Example On Post: Prevent unauthorized users from posting
if (!me) {
  cancel("You must be logged in", 401);
}

var dateObj = new Date();
this.createdDate = dateObj.getTime();
this.modifiedDate = this.createdDate;
this.creatorId = me.id;

var logdata = "New character < " + this.name + " > added by: " + me.username;
dpd.log.post({text:logdata});

