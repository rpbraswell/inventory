import Unit from '../db/Unit.js'
import pool from '../db/db.js'

let connectionsAcquired = 0;
let connectionsReleased = 0;



beforeAll( async () => {
  pool.on('acquire', (_) => {
    connectionsAcquired += 1;
  })
  pool.on('release', (_) => {
    connectionsReleased += 1;
  })
})

afterAll(() => {
   return pool.end();
});


test('getUnits', async () => {
    expect.assertions(3);
    let data = await Unit.getUnits();
    let units = data.reduce( (arr,element) => { return arr.concat(element[1]) }, []);
    await expect(data.length).toBeGreaterThan(0);
    await expect(units).toContain("can");
    await expect(units).toContain("box");
})

test('insert unit with promise api', async () => {
  expect.assertions(5);
  await pool.query("delete from units where unit = 'bucket'");
  let unit = new Unit({unit: "bucket"});
  await expect(unit.insert()).resolves.toEqual('success: 1 unit inserted');
  await expect(unit.id).toBeGreaterThan(0);
  await expect(unit.insert()).rejects.toEqual('error: cannot insert a unit with an id');
  delete unit.id;
  try {
     await unit.insert();
  } catch(err) {
    await expect(err).toBeInstanceOf(Error);
    await expect(err.code).toMatch('ER_DUP_ENTRY');
  }
})


test('database connections are released', async() => {
  // console.log(`acquired connections ${connectionsAcquired} released connections ${connectionsReleased}`)
  await expect(connectionsReleased).toBe(connectionsAcquired);
})
