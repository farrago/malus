// Example On Put: Protect readonly/automatic properties
if ( !me ) {
    cancel("You must log in first", 401);
} else if (me.id !== this.creatorId) {
    var response = "Not your char: <" + me.id +"> v <" + this.creatorId +">";
  cancel(response, 403);
}

protect('createdDate');
protect('creatorId');

dateObj = new Date();
this.modifiedDate = dateObj.getTime();