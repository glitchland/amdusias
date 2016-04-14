var _validModelNames = [
    "spock",
    "kakula",
    "mozter"
];

// true if name exists in model names array
exports.isModelValid = function(name) {
    return !!~_validModelNames.indexOf(name);
};
