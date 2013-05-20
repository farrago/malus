var stats = [
    "iq", "mt", "aw", "ps", "a", "e", "s", "r", "as", "ai", "dx", "sp"
    ];

for ( var i = 0; i < stats.length; ++i ) {
    var base = stats[i] + "Base";
    if (!this.hasOwnProperty(base)){
        this[base] = 0;
    }
    var up = stats[i] + "Up";
    if (!this.hasOwnProperty(up)){
        this[up] = 0;
    }
}