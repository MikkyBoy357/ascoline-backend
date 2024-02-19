const crypto = require("crypto");
module.exports.validPermissionNames = ['user', 'permission', 'employee', 'client', 'commande', 'country', 'measureUnit', 'packageType', 'pricing', 'product', 'transportType', 'transaction'];

module.exports.makeid = (length) => {
    var result = "";
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

module.exports.generateReference = (data, length = 10) => {
    const hash = crypto.createHash("sha256");
    hash.update(data);
    return hash.digest("hex").toUpperCase().substring(0, length);
};