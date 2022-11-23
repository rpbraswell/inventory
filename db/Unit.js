import pool from "./db.js";

class Unit {

   constructor(_unit) {
      this.id = _unit.id ? Number(_unit.id) : undefined;
      this.unit = _unit.unit;
   }

   async insert(connection) {
      if(this.id) {
          return Promise.reject('error: cannot insert a unit with an id');
      }
      let conn = connection;
      if( !connection ) {
          conn = await pool.getConnection();
      }
      let result = await conn.query("insert into units (unit) values (?)", [this.unit])
          .finally( () => connection || conn.end());
      this.id = result.insertId;
      return Promise.resolve('success: 1 unit inserted');
   }

   static getUnits() {
      let sql = 'select id,unit from units order by unit';
      return pool.query( {rowsAsArray: true,  sql: sql } );
   }

}

export default Unit;