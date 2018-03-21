screenApp.filter("asDate", function () {
    return function (input) {
        if (input)
            return new Date(input);
        else
            return '';
    }
});
