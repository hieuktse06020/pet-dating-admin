const db = require('../config/db')
module.exports.getAccount = (req, res) => {
    let sql = ' SELECT * FROM account WHERE accountName = :accountName AND PASSWORD = :PASSWORD';
    db.query(sql, {replacements: { accountName: req.accountName, PASSWORD: req.PASSWORD }, type: db.QueryTypes.SELECT })
    .then(account => res.json(account))
    .catch(error => res.json({error: error}));
}