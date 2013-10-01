if(me.id !== this.id && !me.admin) {
    cancel("You don't have permission to do that", 404);
}