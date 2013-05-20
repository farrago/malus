// Example On Post: Prevent unauthorized users from posting
if (!me) {
  cancel("You must be logged in", 401);
}

var dateObj = new Date();
this.createdDate = dateObj.getTime();
this.modifiedDate = this.createdDate;
this.creatorId = me.id;

var defaultValues = {
    name: "New Character",
    race: "Race",
    gender: "Gender",
    career: "Career",
    age: "Age",
    weight: "Weight",
    height: "Height",
    experience: "0",
    caste: "Caste",
    deleted: false,
    notes: "Notes"
};

var member;
for (member in defaultValues) {
    if ( defaultValues.hasOwnProperty(member)) {
        if (!this.member){
            this[member] = defaultValues[member];
        }
    }
};