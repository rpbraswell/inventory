
const pool = require("./db");

class Receiving {

   constructor(received) {
      this.id         = received.id ? Number(received.id) : undefined;
      this.itemId     = received.itemId ? Number(received.itemId) : undefined;
      this.qty        = received.qty ? Number(received.qty) : undefined;
      this.receivedAt = received.receivedAt;
   }

   async insert(connection) {
        let conn = connection;
        if( !connection ) {
            conn = await pool.getConnection();
        }
        let result =  await conn.query("insert into receiving (itemId, qty) values (?,?)", [this.itemId, this.qty]).finally( () => connection || conn.end());
        this.id = result.insertId;
        return Promise.resolve("success: 1 receving inserted");
    }

}

module.exports = Receiving;

