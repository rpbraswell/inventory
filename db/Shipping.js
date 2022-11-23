import pool from "./db.js";

class Shipping {

   constructor(shipped) {
      this.id         = shipped.id     ? Number(shipped.id)     : undefined;
      this.itemId     = shipped.itemId ? Number(shipped.itemId) : undefined;
      this.qty        = shipped.qty    ? Number(shipped.qty)    : undefined;
      this.shippedAt  = shipped.shippedAt;
   }

   async insert(connection) {
        let conn = connection;
        if( !connection ) {
            conn = await pool.getConnection();
        }
        let result =  await conn.query("insert into shipping (itemId, qty) values (?,?)", [this.itemId, this.qty]).finally( () => connection || conn.end());
        this.id = result.insertId;
        return Promise.resolve("success: 1 shipping inserted");
   }

}

export default Shipping;