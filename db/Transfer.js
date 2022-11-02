const pool = require("./db");

class Transfer {

   constructor(transfer) {
      this.id            = transfer.id;
      this.itemId        = transfer.itemId;
      this.toClass       = transfer.toClass;
      this.qty           = transfer.qty ? Number(transfer.qty) : transfer.qty;
      this.split         = transfer.split ? true : false;
      this.transferredAt = transfer.transferredAt;
   }

   async insert(connection) {
        if(this.id) {
            return Promise.reject('error: cannot insert a transfer with an id');
        }
        let conn = connection;
        if( !connection ) {
            conn = await pool.getConnection();
        }
        let result = await conn.query("insert into transfers (itemId, qty, toClass, split) values (?,?,?,?)", [this.itemId, this.qty, this.toClass, this.split])
            .finally( () => connection || conn.end());
        this.id = result.insertId;
        return Promise.resolve('success: 1 transfer inserted');
    }    
}

module.exports = Transfer;
