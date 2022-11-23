import Category from '../db/Category.js'
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

test('Category.getCategories()', async () => {
    expect.assertions(1)
    let data = await Category.getCategories();
    let categories = data.reduce( (total, element) => {
              return total.concat(element[1]);
          },[]);
    await expect(categories).toContain("vegetable");
})

test('Category.insert()', async () => {
  expect.assertions(5);
  await pool.query("delete from categories where category = 'nonsense'");
  let category = new Category({category: "nonsense"});
  await expect(category.insert()).resolves.toEqual('success: 1 category inserted');
  await expect(category.id).toBeDefined();
  await expect(category.insert()).rejects.toEqual('error: cannot insert a category with an id');
  delete category.id;
  try {
      await category.insert();  // expect duplicate entry error
  } catch(err) {
      await expect(err).toBeInstanceOf(Error);
      await expect(err.code).toMatch('ER_DUP_ENTRY');
  }

})

test('database connections are released', async() => {
  // console.log(`acquired connections ${connectionsAcquired} released connections ${connectionsReleased}`)
  await expect(connectionsReleased).toBe(connectionsAcquired);
})
