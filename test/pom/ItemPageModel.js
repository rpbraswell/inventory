import Item from '../../db/Item.js'

class ItemPageModel {
    constructor(page, config) {
        this.page = page;
        this.config = config;
    }
    async go() {
        return await this.page.goto(this.config.baseURL+ 'reports/items')
    }
    async title() {
        return await this.page.title();
    }

    async addItemForm(item) {
        // click on the add button -- wait for the anchor with value '/items/add'
        const link = await this.page.$('[href="/items/add"')

        const itemNavigationPromise = this.page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
        await link.click();
        await itemNavigationPromise;

        // wait for the nagivation
        const form = await this.page.$('[data-test-id="itemForm')
        const nameField = await form.$("#name");
        const itemClass = await form.$("#itemClass");
        const itemType = await form.$("#itemType");
        const category = await form.$("#category");
        const unit = await form.$("#unit");
        const pkgQty = await form.$("#pkgQty");
        const qty = await form.$("#qty");
        const submit = await form.$("[type='submit']");



        await nameField.type(item.name)
        await itemClass.type(item.itemClass);
        await itemType.type(item.itemType)
        await category.type(item.category);
        await unit.type(item.unit);

        await pkgQty.click({ clickCount: 3});
        await pkgQty.type(item.pkgQty + "");

        await qty.click({clickCount: 3})
        await qty.type(item.qty + "");

        await new Promise( (resolve) => setTimeout( () => resolve("timedout"), 5000))

        await submit.click();


        // fill in the form
        // hit the add button

    }
}


export default ItemPageModel;