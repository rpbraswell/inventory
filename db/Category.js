let pool = require("./db.js");

class Category {

    constructor(_category) {
        this.id = _category.id ? Number(_category.id) : undefined;
        this.category = _category.category;
    }

    async insert(connection) {
        if(this.id) {
            return Promise.reject('error: cannot insert a category with an id');
        }
        let conn = connection;
        if( !connection ) {
            conn = await pool.getConnection();
        }
        let result = await conn.query("insert into categories (category) values (?)", [this.category]).finally( () => connection || conn.end());
        this.id = result.insertId;
        return Promise.resolve('success: 1 category inserted');
    }

    static async getCategories() {
        let sql = 'select id,category from categories order by category';
        return pool.query( {rowsAsArray: true,  sql: sql } );
    }
}

module.exports = Category;

