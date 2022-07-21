let rows = [ [1, 2, 3, 4, 5], [2,4,6,8,10] ];

console.log(rows);

let nrows = rows.map( (r) => {
    console.log(r);
    r.push( r[2] % 2 == 0 ? 2 : 1);
    return r;
})

console.log(nrows);